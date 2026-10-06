import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { EditForm } from "@/components/ui/EditForm";
import { updateSubjectAction, deleteSubjectAction } from "@/features/university/actions";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

type P = { params: Promise<{ semester: string }> };

export default async function SemesterPage({ params }: P) {
  const userId = await requireUserId();
  const { semester: slug } = await params;
  const semester = await db.semester.findUnique({ where: { userId_slug: { userId, slug } }, include: { subjects: { orderBy: { name: "asc" } } } });
  if (!semester) notFound();
  const semesterId = semester.id;

  async function createSubject(fd: FormData) {
    "use server";
    const uid = await requireUserId();
    const parsed = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(300).optional() }).safeParse(Object.fromEntries(fd));
    if (!parsed.success) return;
    const own = await db.semester.findFirst({ where: { id: semesterId, userId: uid } });
    if (!own) return;
    await db.subject.upsert({ where: { semesterId_slug: { semesterId: own.id, slug: slugify(parsed.data.name) } }, update: {}, create: { semesterId: own.id, slug: slugify(parsed.data.name), ...parsed.data } });
    revalidatePath(`/faculdade/${slug}`);
  }

  return (
    <main className="page-shell">
      <header className="page-header"><div><Link href="/faculdade" className="mb-3 inline-flex text-sm font-medium no-underline">← Voltar para Faculdade</Link><p className="eyebrow">Semestre {semester.number}</p><h1>{semester.name}</h1><p className="muted mt-2 max-w-2xl">Escolha uma disciplina para acessar unidades, aulas e PDFs.</p></div><span className="tag">{semester.subjects.length} disciplina{semester.subjects.length === 1 ? "" : "s"}</span></header>
      <section className="card mb-8 p-5"><div className="mb-4"><h2>Nova disciplina</h2><p className="muted mt-1">Cadastre uma matéria e mantenha seus materiais no mesmo lugar.</p></div><form action={createSubject} className="grid gap-3 lg:grid-cols-[1fr_1.2fr_auto]"><input name="name" placeholder="Ex.: Lógica Orientada a Objetos" aria-label="Nome da disciplina" required /><input name="description" placeholder="Descrição opcional" aria-label="Descrição da disciplina" /><button type="submit" className="btn btn-primary">Criar disciplina</button></form></section>
      {semester.subjects.length === 0 ? <div className="empty-state"><h2>Nenhuma disciplina cadastrada</h2><p className="muted mt-2 max-w-md">Use o formulário acima para criar a primeira disciplina deste semestre.</p></div> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{semester.subjects.map((subject) => <article key={subject.id} className="card card-hover p-5"><div className="flex items-start justify-between gap-3"><span className="brand-mark brand-mark-sm">S</span><span className="text-xs text-zinc-400">Disciplina</span></div><h2 className="mt-4">{subject.name}</h2><p className="muted mt-1 min-h-10">{subject.description || "Organize unidades, aulas e documentos desta disciplina."}</p><div className="mt-5 flex flex-wrap gap-2"><Link href={`/faculdade/${slug}/${subject.slug}`} className="btn btn-primary no-underline">Abrir disciplina</Link><EditForm action={updateSubjectAction.bind(null, subject.id)} fields={[{ name: "name", label: "Nome", defaultValue: subject.name, required: true }, { name: "description", label: "Descrição", defaultValue: subject.description }]} /><ConfirmDelete action={deleteSubjectAction.bind(null, subject.id)} message={`Excluir a disciplina "${subject.name}"?`} /></div></article>)}</section>}
    </main>
  );
}
