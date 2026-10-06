import { describe, it, expect, vi, beforeEach } from "vitest";
const m = vi.hoisted(() => {
  const o: Record<string, unknown> = {
    semester: { updateMany: vi.fn() }, subject: { updateMany: vi.fn() },
    unit: { findFirst: vi.fn(), update: vi.fn((a: unknown) => a) },
    lesson: { findFirst: vi.fn(), update: vi.fn((a: unknown) => a) },
    pendingFileDeletion: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  o.$transaction = async (x: unknown) => (Array.isArray(x) ? Promise.all(x) : (x as (t: unknown) => unknown)(o));
  return o as never as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
});
vi.mock("@/lib/db", () => ({ db: m }));
import { updateSemester, updateSubject, updateUnit, updateLesson } from "../src/server/university/update";
import { purgeKey } from "../src/server/documents/pending";
beforeEach(() => vi.clearAllMocks());

describe("edição: ownership e validação", () => {
  it("semestre: escopa por userId e regenera o slug", async () => {
    m.semester.updateMany.mockResolvedValue({ count: 1 });
    expect(await updateSemester("s", "A", { name: "3º Semestre", number: "3" })).toBe("ok");
    expect(m.semester.updateMany).toHaveBeenCalledWith({ where: { id: "s", userId: "A" }, data: { name: "3º Semestre", number: 3, slug: "3o-semestre" } });
  });
  it("semestre de outro usuário → not_found", async () => {
    m.semester.updateMany.mockResolvedValue({ count: 0 });
    expect(await updateSemester("s", "B", { name: "X", number: 1 })).toBe("not_found");
  });
  it("entrada inválida não toca no banco", async () => {
    expect(await updateSemester("s", "A", { name: "!!!", number: 1 })).toBe("invalid");
    expect(await updateSubject("s", "A", { name: "" })).toBe("invalid");
    expect(m.semester.updateMany).not.toHaveBeenCalled();
  });
  it("violação de unicidade (P2002) → conflict", async () => {
    m.subject.updateMany.mockRejectedValue({ code: "P2002" });
    expect(await updateSubject("s", "A", { name: "Lógica" })).toBe("conflict");
  });
  it("disciplina escopada pela cadeia semester.userId", async () => {
    m.subject.updateMany.mockResolvedValue({ count: 1 });
    await updateSubject("s", "A", { name: "Lógica", description: "" });
    expect(m.subject.updateMany.mock.calls[0][0].where).toEqual({ id: "s", semester: { userId: "A" } });
  });
  it("unidade: renumerar recalcula os códigos das aulas", async () => {
    m.unit.findFirst.mockResolvedValue({ id: "u", number: 1, lessons: [{ id: "l1", number: 1 }, { id: "l2", number: 2 }] });
    expect(await updateUnit("u", "A", { number: 3, title: "U3" })).toBe("ok");
    expect(m.lesson.update).toHaveBeenCalledWith({ where: { id: "l2" }, data: { code: "U3A2" } });
  });
  it("unidade de outro usuário → not_found sem escrever", async () => {
    m.unit.findFirst.mockResolvedValue(null);
    expect(await updateUnit("u", "B", { number: 1, title: "x" })).toBe("not_found");
    expect(m.unit.update).not.toHaveBeenCalled();
  });
  it("aula: código usa o número da unidade", async () => {
    m.lesson.findFirst.mockResolvedValue({ id: "l", unit: { number: 2 } });
    await updateLesson("l", "A", { number: 5, title: "Aula" });
    expect(m.lesson.update.mock.calls[0][0].data.code).toBe("U2A5");
  });
});

describe("limpeza de arquivos pendentes", () => {
  const storage = { upload: vi.fn(), read: vi.fn(), delete: vi.fn(), exists: vi.fn() };
  it("sucesso remove a pendência", async () => {
    storage.delete.mockResolvedValue(undefined);
    expect(await purgeKey("k", storage)).toBe(true);
    expect(m.pendingFileDeletion.deleteMany).toHaveBeenCalledWith({ where: { storageKey: "k" } });
  });
  it("falha mantém a pendência e conta a tentativa", async () => {
    storage.delete.mockRejectedValue(new Error("disk"));
    expect(await purgeKey("k", storage)).toBe(false);
    expect(m.pendingFileDeletion.deleteMany).not.toHaveBeenCalled();
    expect(m.pendingFileDeletion.updateMany).toHaveBeenCalled();
  });
});
