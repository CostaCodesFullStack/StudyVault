import { describe, it, expect, vi, beforeEach } from "vitest";
import { isLimited } from "../src/lib/auth/rate-limit";
import { documentFileUrl } from "../src/lib/storage/urls";

const mockDb = vi.hoisted(() => {
  const m: Record<string, unknown> = {
    document: { findFirst: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
    note: { deleteMany: vi.fn() },
    semester: { findFirst: vi.fn(), deleteMany: vi.fn(), delete: vi.fn() },
    unit: { findFirst: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    pendingFileDeletion: {
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn(),
    },
  };
  m.$transaction = (fn: (tx: unknown) => unknown) => fn(m);
  return m as never as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
});
vi.mock("@/lib/db", () => ({ db: mockDb }));
import { deleteDocument } from "../src/server/documents/delete";
import { deleteNote } from "../src/server/notes/delete";
import { deleteSemester, deleteUnit } from "../src/server/university/delete";

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
  it("remove os documentos do semestre e seus arquivos antes de concluir a exclusão", async () => {
    mockDb.semester.findFirst.mockResolvedValue({ id: "s" });
    mockDb.document.findMany.mockResolvedValue([
      { id: "d1", storageKey: "A/one.pdf" },
      { id: "d2", storageKey: "A/two.pdf" },
    ]);
    mockDb.document.deleteMany.mockResolvedValue({ count: 2 });
    mockDb.semester.delete.mockResolvedValue({ id: "s" });

    expect(await deleteSemester("s", "A", storage)).toBe("ok");

    expect(mockDb.document.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["d1", "d2"] }, userId: "A" },
    });
    expect(mockDb.pendingFileDeletion.createMany).toHaveBeenCalledWith({
      data: [{ storageKey: "A/one.pdf" }, { storageKey: "A/two.pdf" }],
    });
    expect(mockDb.semester.delete).toHaveBeenCalledWith({ where: { id: "s" } });
    expect(storage.delete).toHaveBeenCalledWith("A/one.pdf");
    expect(storage.delete).toHaveBeenCalledWith("A/two.pdf");
  });


  it("remove o PDF completo da unidade ao excluir a unidade", async () => {
    mockDb.unit.findFirst.mockResolvedValue({ id: "u" });
    mockDb.document.findMany.mockResolvedValue([{ id: "d1", storageKey: "A/unit.pdf" }]);
    mockDb.document.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.unit.delete.mockResolvedValue({ id: "u" });

    expect(await deleteUnit("u", "A", storage)).toBe("ok");

    expect(mockDb.document.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["d1"] }, userId: "A" },
    });
    expect(mockDb.pendingFileDeletion.createMany).toHaveBeenCalledWith({
      data: [{ storageKey: "A/unit.pdf" }],
    });
    expect(mockDb.unit.delete).toHaveBeenCalledWith({ where: { id: "u" } });
    expect(storage.delete).toHaveBeenCalledWith("A/unit.pdf");
  });

  it("não exclui nada se o semestre não pertence ao usuário", async () => {
    mockDb.semester.findFirst.mockResolvedValue(null);

    expect(await deleteSemester("s", "B", storage)).toBe("not_found");
    expect(mockDb.document.deleteMany).not.toHaveBeenCalled();
    expect(mockDb.semester.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
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
