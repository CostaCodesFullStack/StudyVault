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
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  await db.semester.upsert({ where: { userId_slug: { userId, slug: slugify(p.data.name) } }, update: {}, create: { userId, ...p.data, slug: slugify(p.data.name) } });
  revalidatePath("/faculdade");
}
export default async function Faculdade() {
  const userId = await requireUserId();
  const semesters = await db.semester.findMany({ where: { userId }, orderBy: { number: "asc" }, include: { _count: { select: { subjects: true } } } });
  return (
    <main>
      <h1>Faculdade</h1>
      <form action={createSemester}><input name="name" placeholder="2º Semestre" required /><input name="number" type="number" placeholder="2" required /><button>Criar semestre</button></form>
      {semesters.length === 0 ? <p>Nenhum semestre criado.</p> : <ul>{semesters.map(s => <li key={s.id}><a href={`/faculdade/${s.slug}`}>{s.name}</a> ({s._count.subjects} disciplinas) <ConfirmDelete action={deleteSemesterAction.bind(null, s.id)} message={`Excluir o semestre "${s.name}"?`} /> <EditForm action={updateSemesterAction.bind(null, s.id)} fields={[{ name: "name", label: "Nome", defaultValue: s.name, required: true }, { name: "number", label: "Número", type: "number", defaultValue: s.number, required: true }]} /></li>)}</ul>}
    </main>
  );
}
