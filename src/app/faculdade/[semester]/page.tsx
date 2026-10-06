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
  async function createSubject(fd: FormData) {
    "use server";
    const uid = await requireUserId();
    const p = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(300).optional() }).safeParse(Object.fromEntries(fd));
    if (!p.success) return;
    const own = await db.semester.findFirst({ where: { id: semester!.id, userId: uid } });
    if (!own) return;
    await db.subject.upsert({ where: { semesterId_slug: { semesterId: own.id, slug: slugify(p.data.name) } }, update: {}, create: { semesterId: own.id, slug: slugify(p.data.name), ...p.data } });
    revalidatePath(`/faculdade/${slug}`);
  }
  return (
    <main>
      <a href="/faculdade">← Faculdade</a><h1>{semester.name}</h1>
      <form action={createSubject}><input name="name" placeholder="Lógica Orientada a Objetos" required /><input name="description" placeholder="Descrição" /><button>Criar disciplina</button></form>
      {semester.subjects.length === 0 ? <p>Nenhuma disciplina criada.</p> : <ul>{semester.subjects.map(s => <li key={s.id}><a href={`/faculdade/${slug}/${s.slug}`}>{s.name}</a> <ConfirmDelete action={deleteSubjectAction.bind(null, s.id)} message={`Excluir a disciplina "${s.name}"?`} /> <EditForm action={updateSubjectAction.bind(null, s.id)} fields={[{ name: "name", label: "Nome", defaultValue: s.name, required: true }, { name: "description", label: "Descrição", defaultValue: s.description }]} /></li>)}</ul>}
    </main>
  );
}
