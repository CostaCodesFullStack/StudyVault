import { describe, it, expect, vi, beforeEach } from "vitest";
import { isLimited } from "../src/lib/auth/rate-limit";
import { documentFileUrl } from "../src/lib/storage/urls";

const mockDb = vi.hoisted(() => {
  const m: Record<string, unknown> = {
    document: { findFirst: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
    note: { deleteMany: vi.fn() },
    semester: { deleteMany: vi.fn() },
    pendingFileDeletion: { create: vi.fn(), deleteMany: vi.fn().mockResolvedValue({ count: 1 }), updateMany: vi.fn().mockResolvedValue({ count: 1 }), findMany: vi.fn() },
  };
  m.$transaction = (fn: (tx: unknown) => unknown) => fn(m);
  return m as never as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
});
vi.mock("@/lib/db", () => ({ db: mockDb }));
import { deleteDocument } from "../src/server/documents/delete";
import { deleteNote } from "../src/server/notes/delete";
import { deleteSemester } from "../src/server/university/delete";

const storage = { upload: vi.fn(), read: vi.fn(), delete: vi.fn(), exists: vi.fn() };
beforeEach(() => vi.clearAllMocks());

describe("deleteDocument", () => {
  it("não toca no storage se o documento não é do usuário", async () => {
    mockDb.document.findFirst.mockResolvedValue(null);
    expect(await deleteDocument("d", "B", storage)).toBe("not_found");
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it("remove registro e depois o arquivo", async () => {
    mockDb.document.findFirst.mockResolvedValue({ id: "d", storageKey: "A/x.pdf" });
    mockDb.document.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteDocument("d", "A", storage)).toBe("ok");
    expect(mockDb.document.deleteMany).toHaveBeenCalledWith({ where: { id: "d", userId: "A" } });
    expect(storage.delete).toHaveBeenCalledWith("A/x.pdf");
  });
  it("falha no storage não desfaz a exclusão do registro", async () => {
    mockDb.document.findFirst.mockResolvedValue({ id: "d", storageKey: "k" });
    mockDb.document.deleteMany.mockResolvedValue({ count: 1 });
    storage.delete.mockRejectedValue(new Error("disk"));
    expect(await deleteDocument("d", "A", storage)).toBe("ok");
  });
});

describe("deleteNote", () => {
  it("escopa por usuário da nota e do documento", async () => {
    mockDb.note.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteNote("n", "B")).toBe(false);
    expect(mockDb.note.deleteMany).toHaveBeenCalledWith({ where: { id: "n", userId: "B", document: { userId: "B" } } });
  });
});

describe("deleteSemester", () => {
  it("bloqueia quando há documentos", async () => {
    mockDb.document.count.mockResolvedValue(2);
    expect(await deleteSemester("s", "A")).toBe("has_documents");
    expect(mockDb.semester.deleteMany).not.toHaveBeenCalled();
  });
  it("escopa a exclusão por userId", async () => {
    mockDb.document.count.mockResolvedValue(0);
    mockDb.semester.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteSemester("s", "B")).toBe("not_found");
    expect(mockDb.semester.deleteMany).toHaveBeenCalledWith({ where: { id: "s", userId: "B" } });
  });
});

describe("rate limit e URL", () => {
  it("bloqueia a partir da 6ª tentativa e reseta após a janela", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(isLimited("k", t)).toBe(false);
    expect(isLimited("k", t)).toBe(true);
    expect(isLimited("k", t + 16 * 60 * 1000)).toBe(false);
  });
  it("URL do arquivo usa o ID do documento", () => expect(documentFileUrl("abc")).toBe("/api/files/abc"));
});
