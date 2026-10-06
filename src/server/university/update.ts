import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { semesterSchema, subjectSchema, unitSchema, lessonSchema } from "@/lib/validation/university";

export type UpdateResult = "ok" | "not_found" | "conflict" | "invalid";
const isConflict = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
async function guard(fn: () => Promise<boolean>): Promise<UpdateResult> {
  try { return (await fn()) ? "ok" : "not_found"; } catch (e) { if (isConflict(e)) return "conflict"; throw e; }
}

export async function updateSemester(id: string, userId: string, input: unknown): Promise<UpdateResult> {
  const p = semesterSchema.safeParse(input);
  if (!p.success) return "invalid";
  return guard(async () => (await db.semester.updateMany({ where: { id, userId }, data: { name: p.data.name, number: p.data.number, slug: slugify(p.data.name) } })).count > 0);
}
export async function updateSubject(id: string, userId: string, input: unknown): Promise<UpdateResult> {
  const p = subjectSchema.safeParse(input);
  if (!p.success) return "invalid";
  return guard(async () => (await db.subject.updateMany({ where: { id, semester: { userId } }, data: { name: p.data.name, description: p.data.description, slug: slugify(p.data.name) } })).count > 0);
}
/** Alterar o número da unidade recalcula o código (U#A#) das aulas, atomicamente. */
export async function updateUnit(id: string, userId: string, input: unknown): Promise<UpdateResult> {
  const p = unitSchema.safeParse(input);
  if (!p.success) return "invalid";
  const unit = await db.unit.findFirst({ where: { id, subject: { semester: { userId } } }, include: { lessons: true } });
  if (!unit) return "not_found";
  return guard(async () => {
    await db.$transaction([
      db.unit.update({ where: { id }, data: { number: p.data.number, title: p.data.title, description: p.data.description } }),
      ...unit.lessons.map(l => db.lesson.update({ where: { id: l.id }, data: { code: `U${p.data.number}A${l.number}` } })),
    ]);
    return true;
  });
}
export async function updateLesson(id: string, userId: string, input: unknown): Promise<UpdateResult> {
  const p = lessonSchema.safeParse(input);
  if (!p.success) return "invalid";
  const lesson = await db.lesson.findFirst({ where: { id, unit: { subject: { semester: { userId } } } }, include: { unit: true } });
  if (!lesson) return "not_found";
  return guard(async () => {
    await db.lesson.update({ where: { id }, data: { number: p.data.number, title: p.data.title, description: p.data.description, code: `U${lesson.unit.number}A${p.data.number}` } });
    return true;
  });
}
