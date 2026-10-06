import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { getOwnedDocument } from "@/server/documents/access";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const doc = await getOwnedDocument((await params).id, userId);
  if (!doc) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  const p = z.object({ page: z.number().int().min(1), content: z.string().trim().min(1).max(2000) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const note = await db.note.create({ data: { userId, documentId: doc.id, ...p.data } });
  return NextResponse.json({ id: note.id, page: note.page, content: note.content }, { status: 201 });
}
