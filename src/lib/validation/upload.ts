import { z } from "zod";

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
const PDF_MAGIC = "%PDF-";

export const DEV_SUBCATEGORIES = ["Programação", "Arquitetura", "Backend", "Frontend", "DevOps", "Banco de Dados", "Documentação", "Outros"] as const;
export const CURSOR_SUBCATEGORIES = ["Prompts", "Documentação", "Regras", "IA", "Outros"] as const;
const ALL_SUB = Array.from(new Set([...DEV_SUBCATEGORIES, ...CURSOR_SUBCATEGORIES])) as [string, ...string[]];

export const uploadMetadataSchema = z.object({
  category: z.enum(["UNIVERSITY", "CURSOR", "DEVELOPMENT", "OTHER"]),
  title: z.string().trim().min(1).max(200),
  lessonId: z.string().cuid().nullable().optional(),
  subcategory: z.enum(ALL_SUB).nullable().optional(),
});

export type PdfCheck = { ok: true } | { ok: false; reason: string };

export function validatePdf(file: { name: string; type: string; size: number }, head: Uint8Array): PdfCheck {
  if (!/\.pdf$/i.test(file.name)) return { ok: false, reason: "Extensão inválida. Envie um arquivo .pdf." };
  if (file.type !== "application/pdf") return { ok: false, reason: "Tipo de arquivo inválido." };
  if (file.size <= 0 || file.size > MAX_PDF_BYTES) return { ok: false, reason: "Tamanho do arquivo fora do limite (máx. 50 MB)." };
  if (new TextDecoder().decode(head.slice(0, 5)) !== PDF_MAGIC) return { ok: false, reason: "O arquivo não parece ser um PDF válido." };
  return { ok: true };
}
