import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeProgress } from "../src/server/progress/compute";

const mockDb = vi.hoisted(() => ({
  document: { findFirst: vi.fn() },
  bookmark: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: mockDb }));
import { getOwnedDocument } from "../src/server/documents/access";
import { toggleBookmark } from "../src/server/bookmarks/toggle";

beforeEach(() => vi.clearAllMocks());

describe("computeProgress", () => {
  it("calcula percentual", () => expect(computeProgress(12, 35).percentage).toBeCloseTo(34.28, 1));
  it("limita ao total de páginas", () => expect(computeProgress(99, 10).currentPage).toBe(10));
  it("mínimo é a página 1", () => expect(computeProgress(0, 10).currentPage).toBe(1));
  it("sem total conhecido usa a página atual", () => expect(computeProgress(4, null).percentage).toBe(100));
});

describe("autorização de documentos", () => {
  it("sempre filtra por userId", async () => {
    mockDb.document.findFirst.mockResolvedValue(null);
    expect(await getOwnedDocument("doc1", "userB")).toBeNull();
    expect(mockDb.document.findFirst).toHaveBeenCalledWith({ where: { id: "doc1", userId: "userB" } });
  });
});

describe("toggleBookmark", () => {
  it("cria quando não existe", async () => {
    mockDb.bookmark.findUnique.mockResolvedValue(null);
    expect(await toggleBookmark("u", "d")).toBe(true);
    expect(mockDb.bookmark.create).toHaveBeenCalled();
  });
  it("remove quando já existe", async () => {
    mockDb.bookmark.findUnique.mockResolvedValue({ id: "b" });
    expect(await toggleBookmark("u", "d")).toBe(false);
    expect(mockDb.bookmark.delete).toHaveBeenCalled();
  });
});
