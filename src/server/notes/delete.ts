import { db } from "@/lib/db";
/** Só apaga se a nota E o documento pertencerem ao usuário. */
export async function deleteNote(id: string, userId: string): Promise<boolean> {
  const r = await db.note.deleteMany({ where: { id, userId, document: { userId } } });
  return r.count > 0;
}
