import Link from "next/link";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

const filters = z.object({
  q: z.string().trim().max(100).optional(),
  category: z
    .enum(["UNIVERSITY", "CURSOR", "DEVELOPMENT", "OTHER"])
    .optional()
    .catch(undefined),
  fav: z.literal("1").optional().catch(undefined),
});

const categoryLabels: Record<string, string> = {
  UNIVERSITY: "Faculdade",
  DEVELOPMENT: "Desenvolvimento",
  CURSOR: "Cursor",
  OTHER: "Outros",
};

export default async function Busca({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();

  const rawParams = await searchParams;

  const f = filters.parse(
    Object.fromEntries(
      Object.entries(rawParams).map(([key, value]) => [key, value || undefined])
    )
  );

  const searchCondition = {
    contains: f.q ?? "",
    mode: "insensitive" as const,
  };

  const where: Prisma.DocumentWhereInput = {
    userId,
    ...(f.category && { category: f.category }),
    ...(f.fav && {
      bookmarks: {
        some: { userId },
      },
    }),
    ...(f.q && {
      OR: [
        { title: searchCondition },
        { fileName: searchCondition },
        { subcategory: searchCondition },
        { lesson: { code: searchCondition } },
        { lesson: { unit: { title: searchCondition } } },
        { lesson: { unit: { subject: { name: searchCondition } } } },
        {
          lesson: {
            unit: {
              subject: {
                semester: { name: searchCondition },
              },
            },
          },
        },
      ],
    }),
  };

  const docs = await db.document.findMany({
    where,
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: {
      lesson: {
        include: {
          unit: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h1>Buscar documentos</h1>
          <p className="muted mt-2">
            Encontre PDFs por título, arquivo, aula, disciplina ou semestre.
          </p>
        </div>
      </div>

      <section className="card p-5">
        <form method="get" role="search">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div>
              <label
                htmlFor="document-search"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Buscar
              </label>
              <input
                id="document-search"
                name="q"
                defaultValue={f.q}
                placeholder="Título, aula, disciplina..."
                autoComplete="off"
              />
            </div>

            <div>
              <label
                htmlFor="document-category"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Categoria
              </label>
              <select
                id="document-category"
                name="category"
                defaultValue={f.category ?? ""}
              >
                <option value="">Todas</option>
                <option value="UNIVERSITY">Faculdade</option>
                <option value="DEVELOPMENT">Desenvolvimento</option>
                <option value="CURSOR">Cursor</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>

            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                Buscar
              </button>
            </div>
          </div>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              name="fav"
              value="1"
              defaultChecked={!!f.fav}
            />
            Mostrar apenas favoritos
          </label>
        </form>
      </section>

      <div className="mb-4 mt-8 flex items-center justify-between gap-4">
        <div>
          <h2>Resultados</h2>
          <p className="muted mt-1">
            {docs.length} {docs.length === 1 ? "documento encontrado" : "documentos encontrados"}
            {docs.length === 50 ? " · mostrando os 50 mais recentes" : ""}
          </p>
        </div>

        {(f.q || f.category || f.fav) && (
          <Link href="/busca" className="text-sm font-medium no-underline">
            Limpar filtros
          </Link>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl" aria-hidden="true">⌕</span>
          <h2 className="mt-3">Nenhum documento encontrado</h2>
          <p className="muted mt-2 max-w-md">
            Tente outro termo de busca ou remova algum filtro.
          </p>

          <Link href="/faculdade" className="btn btn-secondary mt-5 no-underline">
            Ir para Faculdade
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((document) => {
            const lesson = document.lesson;

            return (
              <Link
                key={document.id}
                href={`/reader/${document.id}`}
                className="card card-hover block p-5 no-underline"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="tag">
                    {categoryLabels[document.category] ?? document.category}
                  </span>

                  <span
                    className="text-xs text-zinc-400"
                    aria-hidden="true"
                  >
                    PDF
                  </span>
                </div>

                <h2 className="mt-4 line-clamp-2">
                  {document.title}
                </h2>

                {lesson ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {lesson.unit.subject.name}
                    </p>
                    <p className="muted mt-1">
                      {lesson.unit.title} · {lesson.code}
                    </p>
                  </div>
                ) : (
                  <p className="muted mt-3">
                    {document.fileName}
                  </p>
                )}

                <p className="mt-5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Abrir documento →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
