import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { DeleteDocumentButton } from "@/components/ui/DeleteDocumentButton";
import { EditForm } from "@/components/ui/EditForm";
import {
  updateUnitAction,
  updateLessonAction,
  deleteUnitAction,
  deleteLessonAction,
} from "@/features/university/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { UploadForm } from "@/features/documents/UploadForm";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ semester: string; subject: string }>;
}) {
  const userId = await requireUserId();
  const { semester, subject: slug } = await params;

  const subject = await db.subject.findFirst({
    where: {
      slug,
      semester: { slug: semester, userId },
    },
    include: {
      units: {
        orderBy: { number: "asc" },
        include: {
          documents: {
            where: { userId },
          },
          lessons: {
            orderBy: { number: "asc" },
            include: {
              documents: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (!subject) notFound();

  const subjectId = subject.id;
  const path = `/faculdade/${semester}/${slug}`;

  async function createUnit(fd: FormData) {
    "use server";

    const uid = await requireUserId();

    const p = z
      .object({
        number: z.coerce.number().int().min(1).max(50),
        title: z.string().trim().min(1).max(100),
      })
      .safeParse(Object.fromEntries(fd));

    if (
      !p.success ||
      !(await db.subject.findFirst({
        where: { id: subjectId, semester: { userId: uid } },
      }))
    ) {
      return;
    }

    await db.unit.upsert({
      where: {
        subjectId_number: {
          subjectId,
          number: p.data.number,
        },
      },
      update: { title: p.data.title },
      create: {
        subjectId,
        ...p.data,
      },
    });

    revalidatePath(path);
  }

  async function createLesson(fd: FormData) {
    "use server";

    const uid = await requireUserId();

    const p = z
      .object({
        unitId: z.string().cuid(),
        number: z.coerce.number().int().min(1).max(100),
        title: z.string().trim().min(1).max(100),
      })
      .safeParse(Object.fromEntries(fd));

    if (!p.success) return;

    const unit = await db.unit.findFirst({
      where: {
        id: p.data.unitId,
        subject: { semester: { userId: uid } },
      },
    });

    if (!unit) return;

    const code = `U${unit.number}A${p.data.number}`;

    await db.lesson.upsert({
      where: {
        unitId_number: {
          unitId: unit.id,
          number: p.data.number,
        },
      },
      update: {
        title: p.data.title,
      },
      create: {
        unitId: unit.id,
        number: p.data.number,
        code,
        title: p.data.title,
      },
    });

    revalidatePath(path);
  }

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <a
            href={`/faculdade/${semester}`}
            className="mb-3 inline-flex text-sm font-medium no-underline"
          >
            ← Voltar para o semestre
          </a>

          <p className="eyebrow">Disciplina</p>
          <h1>{subject.name}</h1>

          {subject.description && (
            <p className="muted mt-2 max-w-2xl">{subject.description}</p>
          )}
        </div>
      </div>

      <section className="card mb-6 p-5">
        <div className="mb-4">
          <h2>Nova unidade</h2>
          <p className="muted mt-1">
            Organize o conteúdo da disciplina por unidades.
          </p>
        </div>

        <form action={createUnit} className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
          <input
            name="number"
            type="number"
            min={1}
            placeholder="Nº"
            aria-label="Número da unidade"
            required
          />

          <input
            name="title"
            placeholder="Título da unidade"
            aria-label="Título da unidade"
            required
          />

          <button type="submit" className="btn btn-primary">
            Criar unidade
          </button>
        </form>
      </section>

      {subject.units.length > 0 && (
        <section className="card mb-6 p-5">
          <div className="mb-4">
            <h2>Nova aula</h2>
            <p className="muted mt-1">
              As aulas são apenas a estrutura. O PDF completo da unidade é enviado separadamente.
            </p>
          </div>

          <form action={createLesson} className="grid gap-3 sm:grid-cols-[1fr_120px_1fr_auto]">
            <select name="unitId" aria-label="Unidade" required>
              {subject.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>

            <input
              name="number"
              type="number"
              min={1}
              placeholder="Aula nº"
              aria-label="Número da aula"
              required
            />

            <input
              name="title"
              placeholder="Título da aula"
              aria-label="Título da aula"
              required
            />

            <button type="submit" className="btn btn-secondary">
              Criar aula
            </button>
          </form>
        </section>
      )}



      <div className="mt-8 space-y-5">
        {subject.units.length === 0 ? (
          <div className="empty-state">
            <h2>Nenhuma unidade criada</h2>
            <p className="muted mt-2 max-w-md">
              Crie a primeira unidade para começar a organizar suas aulas e
              PDFs.
            </p>
          </div>
        ) : (
          subject.units.map((unit) => (
            <section key={unit.id} className="card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Unidade {unit.number}
                  </p>
                  <h2 className="mt-1">{unit.title}</h2>

                  {unit.description && (
                    <p className="muted mt-1">{unit.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ConfirmDelete
                    action={deleteUnitAction.bind(null, unit.id)}
                    message={`Excluir "${unit.title}"?`}
                  />

                  <EditForm
                    action={updateUnitAction.bind(null, unit.id)}
                    fields={[
                      {
                        name: "number",
                        label: "Número",
                        type: "number",
                        defaultValue: unit.number,
                        required: true,
                      },
                      {
                        name: "title",
                        label: "Título",
                        defaultValue: unit.title,
                        required: true,
                      },
                      {
                        name: "description",
                        label: "Descrição",
                        defaultValue: unit.description,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                <UploadForm
                  category="UNIVERSITY"
                  subjectId={subject.id}
                  targetType="unit"
                  targetId={unit.id}
                  label="PDF completo da unidade"
                  description="Adicione o material completo desta unidade."
                />
              </div>

              <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Material completo da unidade</p>
                    <p className="muted mt-1">O PDF principal desta unidade fica separado das aulas.</p>
                  </div>
                  {unit.documents.length === 0 ? (
                    <span className="tag">Nenhum PDF</span>
                  ) : (
                    unit.documents.map((document) => (
                      <div key={document.id} className="flex min-w-0 items-center gap-2">
                        <a href={`/reader/${document.id}`} className="max-w-xs truncate font-medium no-underline">{document.title}</a>
                        <DeleteDocumentButton documentId={document.id} title={document.title} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aulas</p>
                <p className="muted mt-1">Os PDFs específicos de cada aula aparecem dentro da respectiva aula.</p>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {unit.lessons.map((lesson) => (
                  <article key={lesson.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="tag">{lesson.code}</span>
                        <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
                          {lesson.title}
                        </h3>

                        {lesson.description && (
                          <p className="muted mt-1">{lesson.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ConfirmDelete
                          action={deleteLessonAction.bind(null, lesson.id)}
                          message={`Excluir a aula ${lesson.code}?`}
                        />

                        <EditForm
                          action={updateLessonAction.bind(null, lesson.id)}
                          fields={[
                            {
                              name: "number",
                              label: "Número",
                              type: "number",
                              defaultValue: lesson.number,
                              required: true,
                            },
                            {
                              name: "title",
                              label: "Título",
                              defaultValue: lesson.title,
                              required: true,
                            },
                            {
                              name: "description",
                              label: "Descrição",
                              defaultValue: lesson.description,
                            },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <UploadForm
                        category="UNIVERSITY"
                        subjectId={subject.id}
                        targetType="lesson"
                        targetId={lesson.id}
                        label="PDF da aula"
                        description="Adicione o PDF específico desta aula."
                      />
                      <div className="space-y-2">
                      {lesson.documents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center dark:border-zinc-700">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Nenhum PDF nesta aula.
                          </p>
                        </div>
                      ) : (
                        lesson.documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <a
                                href={`/reader/${document.id}`}
                                className="block truncate font-medium no-underline"
                              >
                                {document.title}
                              </a>
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                PDF · Abrir no leitor
                              </p>
                            </div>

                            <DeleteDocumentButton
                              documentId={document.id}
                              title={document.title}
                            />
                          </div>
                        ))
                      )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
