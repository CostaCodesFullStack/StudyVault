import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/session";
import { deleteNote } from "@/server/notes/delete";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const ok = await deleteNote((await params).id, userId);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Não encontrado." }, { status: 404 });
}
