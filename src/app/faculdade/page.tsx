import Link from "next/link";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { EditForm } from "@/components/ui/EditForm";
import { updateSemesterAction, deleteSemesterAction } from "@/features/university/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const schema = z.object({ name: z.string().trim().min(1).max(60), number: z.coerce.number().int().min(1).max(20) });

async function createSemester(fd: FormData) {
  "use server";
  const userId = await requireUserId();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  await db.semester.upsert({ where: { userId_slug: { userId, slug: slugify(parsed.data.name) } }, update: {}, create: { userId, ...parsed.data, slug: slugify(parsed.data.name) } });
  revalidatePath("/faculdade");
}

export default async function Faculdade() {
  const userId = await requireUserId();
  const semesters = await db.semester.findMany({ where: { userId }, orderBy: { number: "asc" }, include: { _count: { select: { subjects: true } } } });
  return (
    <main className="page-shell">
      <header className="page-header"><div><p className="eyebrow">Biblioteca acadêmica</p><h1>Faculdade</h1><p className="muted mt-2 max-w-2xl">Organize seus materiais por semestre, disciplina, unidade e aula.</p></div><span className="tag">{semesters.length} semestre{semesters.length === 1 ? "" : "s"}</span></header>
      <section className="card mb-8 p-5"><div className="mb-4"><h2>Novo semestre</h2><p className="muted mt-1">Adicione uma nova etapa da sua graduação.</p></div><form action={createSemester} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"><input name="name" placeholder="Ex.: 2º Semestre" aria-label="Nome do semestre" required /><input name="number" type="number" min={1} max={20} placeholder="Número" aria-label="Número do semestre" required /><button type="submit" className="btn btn-primary">Criar semestre</button></form></section>
      {semesters.length === 0 ? <div className="empty-state"><div className="brand-mark mb-4">S</div><h2>Comece sua organização</h2><p className="muted mt-2 max-w-md">Crie seu primeiro semestre para começar a cadastrar disciplinas e PDFs.</p></div> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{semesters.map((semester) => <article key={semester.id} className="card card-hover p-5"><div className="flex items-start justify-between gap-4"><span className="tag">Semestre {semester.number}</span><span className="text-xs text-zinc-400">{semester._count.subjects} disciplina{semester._count.subjects === 1 ? "" : "s"}</span></div><h2 className="mt-4 text-xl">{semester.name}</h2><p className="muted mt-1">Acesse as disciplinas e materiais deste semestre.</p><div className="mt-5 flex flex-wrap items-center gap-2"><Link href={`/faculdade/${semester.slug}`} className="btn btn-primary no-underline">Abrir semestre</Link><EditForm action={updateSemesterAction.bind(null, semester.id)} fields={[{ name: "name", label: "Nome", defaultValue: semester.name, required: true }, { name: "number", label: "Número", type: "number", defaultValue: semester.number, required: true }]} /><ConfirmDelete action={deleteSemesterAction.bind(null, semester.id)} message={`Excluir o semestre "${semester.name}"?`} /></div></article>)}</section>}
    </main>
  );
}
