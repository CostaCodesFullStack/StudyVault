import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { computeProgress } from "@/server/progress/compute";
import { getOwnedDocument } from "@/server/documents/access";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const doc = await getOwnedDocument((await params).id, userId);
  if (!doc) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  const p = z.object({ page: z.number().int().min(1) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const data = { ...computeProgress(p.data.page, doc.pageCount), lastOpenedAt: new Date() };
  await db.readingProgress.upsert({ where: { userId_documentId: { userId, documentId: doc.id } }, update: data, create: { userId, documentId: doc.id, ...data } });
  return NextResponse.json({ ok: true });
}
