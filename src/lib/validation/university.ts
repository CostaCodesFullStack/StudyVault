import { z } from "zod";
import { slugify } from "@/lib/utils";
const optionalText = z.string().trim().max(300).optional().transform(v => v || null);
const named = (max: number) => z.string().trim().min(1).max(max).refine(v => slugify(v).length > 0, "Nome inválido");
export const semesterSchema = z.object({ name: named(60), number: z.coerce.number().int().min(1).max(20) });
export const subjectSchema = z.object({ name: named(100), description: optionalText });
export const unitSchema = z.object({ number: z.coerce.number().int().min(1).max(50), title: z.string().trim().min(1).max(100), description: optionalText });
export const lessonSchema = z.object({ number: z.coerce.number().int().min(1).max(100), title: z.string().trim().min(1).max(100), description: optionalText });
