import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

export default async function Favoritos() {
  const userId = await requireUserId();

  const items = await db.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      document: {
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
      },
    },
  });

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Organização</p>
          <h1>Favoritos</h1>
          <p className="muted mt-2">
            Acesse rapidamente os PDFs que você marcou para rever depois.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl" aria-hidden="true">♡</span>
          <h2 className="mt-3">Nenhum favorito ainda</h2>
          <p className="muted mt-2 max-w-md">
            Ao encontrar um PDF importante, marque-o como favorito para
            encontrá-lo aqui.
          </p>
          <Link href="/busca" className="btn btn-primary mt-5 no-underline">
            Buscar documentos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const document = item.document;
            const lesson = document.lesson;

            return (
              <Link
                key={item.id}
                href={`/reader/${document.id}`}
                className="card card-hover block p-5 no-underline"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="tag">PDF</span>
                  <span
                    className="text-xl text-indigo-500"
                    aria-label="Favorito"
                    title="Favorito"
                  >
                    ★
                  </span>
                </div>

                <h2 className="mt-4 line-clamp-2">
                  {document.title}
                </h2>

                {lesson && (
                  <p className="muted mt-2">
                    {lesson.unit.subject.name} · {lesson.code}
                  </p>
                )}

                <p className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Abrir leitura →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
