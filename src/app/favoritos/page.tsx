import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
export default async function Favoritos() {
  const userId = await requireUserId();
  const items = await db.bookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { document: true } });
  return <main><a href="/dashboard">← Dashboard</a><h1>Favoritos</h1>{items.length === 0 ? <p>Nenhum favorito.</p> : <ul>{items.map(b => <li key={b.id}><Link href={`/reader/${b.documentId}`}>{b.document.title}</Link></li>)}</ul>}</main>;
}
