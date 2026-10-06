import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { EditForm } from "@/components/ui/EditForm";
import { updateUnitAction, updateLessonAction, deleteUnitAction, deleteLessonAction, deleteDocumentAction } from "@/features/university/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { UploadForm } from "@/features/documents/UploadForm";
export default async function SubjectPage({ params }: { params: Promise<{ semester: string; subject: string }> }) {
  const userId = await requireUserId();
  const { semester, subject: slug } = await params;
  const subject = await db.subject.findFirst({
    where: { slug, semester: { slug: semester, userId } },
    include: { units: { orderBy: { number: "asc" }, include: { lessons: { orderBy: { number: "asc" }, include: { documents: { where: { userId } } } } } } },
  });
  if (!subject) notFound();
  const subjectId = subject.id;
  const path = `/faculdade/${semester}/${slug}`;
  async function createUnit(fd: FormData) {
    "use server";
    const uid = await requireUserId();
    const p = z.object({ number: z.coerce.number().int().min(1).max(50), title: z.string().trim().min(1).max(100) }).safeParse(Object.fromEntries(fd));
    if (!p.success || !(await db.subject.findFirst({ where: { id: subjectId, semester: { userId: uid } } }))) return;
    await db.unit.upsert({ where: { subjectId_number: { subjectId, number: p.data.number } }, update: { title: p.data.title }, create: { subjectId, ...p.data } });
    revalidatePath(path);
  }
  async function createLesson(fd: FormData) {
    "use server";
    const uid = await requireUserId();
    const p = z.object({ unitId: z.string().cuid(), number: z.coerce.number().int().min(1).max(100), title: z.string().trim().min(1).max(100) }).safeParse(Object.fromEntries(fd));
    if (!p.success) return;
    const unit = await db.unit.findFirst({ where: { id: p.data.unitId, subject: { semester: { userId: uid } } } });
    if (!unit) return;
    const code = `U${unit.number}A${p.data.number}`;
    await db.lesson.upsert({ where: { unitId_number: { unitId: unit.id, number: p.data.number } }, update: { title: p.data.title }, create: { unitId: unit.id, number: p.data.number, code, title: p.data.title } });
    revalidatePath(path);
  }
  return (
    <main>
      <a href={`/faculdade/${semester}`}>← Voltar</a><h1>{subject.name}</h1>
      <form action={createUnit}><input name="number" type="number" min={1} placeholder="Unidade nº" aria-label="Número da unidade" required /><input name="title" placeholder="Título da unidade" aria-label="Título da unidade" required /><button>Criar unidade</button></form>
      {subject.units.length > 0 && <form action={createLesson}><select name="unitId" aria-label="Unidade">{subject.units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}</select><input name="number" type="number" min={1} placeholder="Aula nº" aria-label="Número da aula" required /><input name="title" placeholder="Título da aula" aria-label="Título da aula" required /><button>Criar aula</button></form>}
      <UploadForm category="UNIVERSITY" subjectId={subject.id} lessons={subject.units.flatMap(u => u.lessons.map(l => ({ id: l.id, label: `${u.title} / ${l.code}` })))} />
      {subject.units.length === 0 ? <p>Nenhum documento ainda. Envie U1A1.pdf, U1A2.pdf...</p> :
        subject.units.map(u => (
          <section key={u.id}><h2>{u.title} <ConfirmDelete action={deleteUnitAction.bind(null, u.id)} message={`Excluir "${u.title}"?`} /> <EditForm action={updateUnitAction.bind(null, u.id)} fields={[{ name: "number", label: "Número", type: "number", defaultValue: u.number, required: true }, { name: "title", label: "Título", defaultValue: u.title, required: true }, { name: "description", label: "Descrição", defaultValue: u.description }]} /></h2>
            <ul>{u.lessons.map(l => <li key={l.id}>{l.code}: {l.documents.map(d => <span key={d.id}><a href={`/reader/${d.id}`}>{d.title}</a> <ConfirmDelete action={deleteDocumentAction.bind(null, d.id)} message={`Excluir o documento "${d.title}"?`} /> </span>)}<ConfirmDelete action={deleteLessonAction.bind(null, l.id)} message={`Excluir a aula ${l.code}?`} /> <EditForm action={updateLessonAction.bind(null, l.id)} fields={[{ name: "number", label: "Número", type: "number", defaultValue: l.number, required: true }, { name: "title", label: "Título", defaultValue: l.title, required: true }, { name: "description", label: "Descrição", defaultValue: l.description }]} /></li>)}</ul>
          </section>))}
    </main>
  );
}
