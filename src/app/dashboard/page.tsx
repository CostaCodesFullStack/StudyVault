import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
export default async function Dashboard() {
  const userId = await requireUserId();
  const [user, counts, recent] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.document.groupBy({ by: ["category"], where: { userId }, _count: true }),
    db.readingProgress.findMany({ where: { userId }, orderBy: { lastOpenedAt: "desc" }, take: 5, include: { document: true } }),
  ]);
  return (
    <main>
      <h1>Olá, {user.name}</h1>
      <h2>Biblioteca</h2>
      {counts.length === 0 ? <p>Nenhum documento encontrado. Faça upload do seu primeiro PDF.</p> :
        <ul>{counts.map(c => <li key={c.category}>{c.category}: {c._count}</li>)}</ul>}
      <h2>Continue estudando</h2>
      <ul>{recent.map(r => <li key={r.id}><Link href={`/reader/${r.documentId}`}>{r.document.title}</Link> — {Math.round(r.percentage)}%</li>)}</ul>
    </main>
  );
}
