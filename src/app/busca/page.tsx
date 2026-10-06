import Link from "next/link";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

const filters = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(["UNIVERSITY", "CURSOR", "DEVELOPMENT", "OTHER"]).optional().catch(undefined),
  fav: z.literal("1").optional().catch(undefined),
});
export default async function Busca({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const userId = await requireUserId();
  const f = filters.parse(Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, v || undefined])));
  const c = { contains: f.q ?? "", mode: "insensitive" as const };
  const where: Prisma.DocumentWhereInput = {
    userId,
    ...(f.category && { category: f.category }),
    ...(f.fav && { bookmarks: { some: { userId } } }),
    ...(f.q && { OR: [
      { title: c }, { fileName: c }, { subcategory: c },
      { lesson: { code: c } }, { lesson: { unit: { title: c } } },
      { lesson: { unit: { subject: { name: c } } } }, { lesson: { unit: { subject: { semester: { name: c } } } } },
    ] }),
  };
  const docs = await db.document.findMany({ where, take: 50, orderBy: { updatedAt: "desc" }, include: { lesson: { include: { unit: { include: { subject: true } } } } } });
  return (
    <main>
      <a href="/dashboard">← Dashboard</a><h1>Busca</h1>
      <form method="get" role="search">
        <input name="q" defaultValue={f.q} placeholder="título, aula, disciplina..." aria-label="Buscar" />
        <select name="category" defaultValue={f.category ?? ""} aria-label="Categoria"><option value="">Todas</option><option value="UNIVERSITY">Faculdade</option><option value="DEVELOPMENT">Desenvolvimento</option><option value="CURSOR">Cursor</option><option value="OTHER">Outros</option></select>
        <label><input type="checkbox" name="fav" value="1" defaultChecked={!!f.fav} /> Favoritos</label>
        <button>Buscar</button>
      </form>
      {docs.length === 0 ? <p>Nenhum documento encontrado.</p> :
        <ul>{docs.map(d => <li key={d.id}><Link href={`/reader/${d.id}`}>{d.title}</Link>{d.lesson && ` — ${d.lesson.unit.subject.name} / ${d.lesson.code}`}</li>)}</ul>}
    </main>
  );
}
