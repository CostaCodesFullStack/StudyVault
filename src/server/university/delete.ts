import { db } from "@/lib/db";
type R = "ok" | "not_found" | "has_documents";
const DOC_BLOCK: R = "has_documents";
/** Política: bloqueia a exclusão se houver PDFs na hierarquia (evita perda silenciosa e arquivos órfãos). */
export async function deleteSemester(id: string, userId: string): Promise<R> {
  if (await db.document.count({ where: { userId, lesson: { unit: { subject: { semesterId: id } } } } })) return DOC_BLOCK;
  return (await db.semester.deleteMany({ where: { id, userId } })).count ? "ok" : "not_found";
}
export async function deleteSubject(id: string, userId: string): Promise<R> {
  if (await db.document.count({ where: { userId, lesson: { unit: { subjectId: id } } } })) return DOC_BLOCK;
  return (await db.subject.deleteMany({ where: { id, semester: { userId } } })).count ? "ok" : "not_found";
}
export async function deleteUnit(id: string, userId: string): Promise<R> {
  if (await db.document.count({ where: { userId, lesson: { unitId: id } } })) return DOC_BLOCK;
  return (await db.unit.deleteMany({ where: { id, subject: { semester: { userId } } } })).count ? "ok" : "not_found";
}
export async function deleteLesson(id: string, userId: string): Promise<R> {
  if (await db.document.count({ where: { userId, lessonId: id } })) return DOC_BLOCK;
  return (await db.lesson.deleteMany({ where: { id, unit: { subject: { semester: { userId } } } } })).count ? "ok" : "not_found";
}
