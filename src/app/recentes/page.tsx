import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
export default async function Recentes() {
  const userId = await requireUserId();
  const items = await db.readingProgress.findMany({ where: { userId }, orderBy: { lastOpenedAt: "desc" }, take: 30, include: { document: true } });
  return <main><a href="/dashboard">← Dashboard</a><h1>Recentes</h1>{items.length === 0 ? <p>Nenhum documento aberto ainda.</p> : <ul>{items.map(r => <li key={r.id}><Link href={`/reader/${r.documentId}`}>{r.document.title}</Link> — {Math.round(r.percentage)}%</li>)}</ul>}</main>;
}
