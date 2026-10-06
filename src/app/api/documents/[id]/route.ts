import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/session";
import { deleteDocument } from "@/server/documents/delete";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const r = await deleteDocument((await params).id, userId);
    return r === "ok" ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  } catch (e) {
    console.error("delete document failed", e);
    return NextResponse.json({ error: "Não foi possível excluir o documento." }, { status: 500 });
  }
}
