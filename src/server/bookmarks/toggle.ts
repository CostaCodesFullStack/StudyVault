import { db } from "@/lib/db";
/** Alterna favorito; retorna o novo estado. */
export async function toggleBookmark(userId: string, documentId: string): Promise<boolean> {
  const key = { userId_documentId: { userId, documentId } };
  const existing = await db.bookmark.findUnique({ where: key });
  if (existing) { await db.bookmark.delete({ where: key }); return false; }
  await db.bookmark.create({ data: { userId, documentId } });
  return true;
}
