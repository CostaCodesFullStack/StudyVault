import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return new Response("Não autenticado", { status: 401 });
  const doc = await db.document.findFirst({ where: { id: (await params).id, userId } });
  if (!doc) return new Response("Não encontrado", { status: 404 });
  const data = await getStorage().read(doc.storageKey);
  return new Response(new Uint8Array(data), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
