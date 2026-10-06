import { NextResponse } from "next/server";
import { toggleBookmark } from "@/server/bookmarks/toggle";
import { getUserId } from "@/lib/auth/session";
import { getOwnedDocument } from "@/server/documents/access";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const doc = await getOwnedDocument((await params).id, userId);
  if (!doc) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ bookmarked: await toggleBookmark(userId, doc.id) });
}
