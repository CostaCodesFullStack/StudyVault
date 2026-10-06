import { describe, it, expect } from "vitest";
import { parseLessonFileName } from "../src/lib/upload/parse-filename";
import { validatePdf } from "../src/lib/validation/upload";

describe("parseLessonFileName", () => {
  it("reconhece U2A3.pdf", () => expect(parseLessonFileName("U2A3.pdf")).toEqual({ unit: 2, lesson: 3, code: "U2A3" }));
  it("é case-insensitive", () => expect(parseLessonFileName("u1a10.PDF")?.code).toBe("U1A10"));
  it("rejeita nomes livres", () => expect(parseLessonFileName("aula-final.pdf")).toBeNull());
  it("rejeita zero", () => expect(parseLessonFileName("U0A1.pdf")).toBeNull());
});

describe("validatePdf", () => {
  const head = new TextEncoder().encode("%PDF-1.7");
  it("aceita PDF válido", () => expect(validatePdf({ name: "a.pdf", type: "application/pdf", size: 10 }, head).ok).toBe(true));
  it("rejeita magic bytes errados", () => expect(validatePdf({ name: "a.pdf", type: "application/pdf", size: 10 }, new TextEncoder().encode("hello")).ok).toBe(false));
  it("rejeita extensão errada", () => expect(validatePdf({ name: "a.exe", type: "application/pdf", size: 10 }, head).ok).toBe(false));
});
