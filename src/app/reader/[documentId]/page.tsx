import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { getOwnedDocument } from "@/server/documents/access";
import { ReaderClient } from "./ReaderClient";
export default async function Reader({ params }: { params: Promise<{ documentId: string }> }) {
  const userId = await requireUserId();
  const doc = await getOwnedDocument((await params).documentId, userId);
  if (!doc) notFound();
  const [progress, bookmark, notes] = await Promise.all([
    db.readingProgress.upsert({ where: { userId_documentId: { userId, documentId: doc.id } }, update: { lastOpenedAt: new Date() }, create: { userId, documentId: doc.id, currentPage: 1, totalPages: doc.pageCount ?? 0, percentage: 0 } }),
    db.bookmark.findUnique({ where: { userId_documentId: { userId, documentId: doc.id } } }),
    db.note.findMany({ where: { userId, documentId: doc.id }, orderBy: [{ page: "asc" }, { createdAt: "asc" }], select: { id: true, page: true, content: true } }),
  ]);
  return (
    <main>
      <a href="/dashboard">← Voltar</a><h1>{doc.title}</h1>
      {progress.currentPage > 1 && <p>Continuando da página {progress.currentPage}</p>}
      <ReaderClient id={doc.id} title={doc.title} total={doc.pageCount ?? 0} initialPage={progress.currentPage} bookmarked={!!bookmark} notes={notes} />
    </main>
  );
}
