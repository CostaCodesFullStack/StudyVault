import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

const categoryLabels: Record<string, string> = {
  UNIVERSITY: "Faculdade",
  DEVELOPMENT: "Desenvolvimento",
  CURSOR: "Cursor",
  OTHER: "Outros",
};

export default async function Dashboard() {
  const userId = await requireUserId();

  const [user, totalDocuments, counts, recent, favorites] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    }),
    db.document.count({ where: { userId } }),
    db.document.groupBy({
      by: ["category"],
      where: { userId },
      _count: true,
    }),
    db.readingProgress.findMany({
      where: { userId },
      orderBy: { lastOpenedAt: "desc" },
      take: 6,
      include: { document: true },
    }),
    db.bookmark.count({ where: { userId } }),
  ]);

  const firstName = user.name.trim().split(" ")[0] || "estudante";

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Olá, {firstName}.</h1>
          <p className="muted mt-2 max-w-2xl">
            Continue de onde parou ou explore sua biblioteca de estudos.
          </p>
        </div>

        <Link href="/busca" className="btn btn-primary no-underline">
          Buscar PDF
        </Link>
      </header>

      <section
        aria-label="Resumo da biblioteca"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="stat-card">
          <p className="muted">Documentos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {totalDocuments}
          </p>
          <p className="muted mt-1">PDFs na sua biblioteca</p>
        </div>

        <div className="stat-card">
          <p className="muted">Favoritos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {favorites}
          </p>
          <p className="muted mt-1">Documentos marcados</p>
        </div>

        <div className="stat-card">
          <p className="muted">Categorias</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {counts.length}
          </p>
          <p className="muted mt-1">Áreas com conteúdo</p>
        </div>

        <div className="stat-card">
          <p className="muted">Recentes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {recent.length}
          </p>
          <p className="muted mt-1">Leituras recentes</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div>
              <h2>Continue estudando</h2>
              <p className="muted mt-1">Seus documentos abertos recentemente.</p>
            </div>

            <Link href="/recentes" className="text-sm font-medium no-underline">
              Ver todos
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state rounded-none border-0 shadow-none">
              <h2>Seu histórico está vazio</h2>
              <p className="muted mt-2 max-w-md">
                Abra um PDF para começar a acompanhar seu progresso de leitura.
              </p>
              <Link href="/faculdade" className="btn btn-secondary mt-5 no-underline">
                Ir para Faculdade
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((item) => {
                const percentage = Math.min(
                  100,
                  Math.max(0, Math.round(item.percentage))
                );

                return (
                  <Link
                    key={item.id}
                    href={`/reader/${item.documentId}`}
                    className="block p-5 no-underline transition hover:bg-zinc-50 dark:hover:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {item.document.title}
                        </p>
                        <p className="muted mt-1">
                          Página {item.currentPage}
                          {item.totalPages > 0
                            ? ` de ${item.totalPages}`
                            : ""}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {percentage}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-5">
            <h2>Sua biblioteca</h2>
            <p className="muted mt-1">Conteúdo organizado por categoria.</p>
          </div>

          {counts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-5 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum PDF cadastrado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {counts.map((item) => (
                <Link
                  key={item.category}
                  href={`/busca?category=${item.category}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 no-underline transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  <span className="tag">{item._count}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/faculdade" className="btn btn-secondary no-underline">
              Faculdade
            </Link>
            <Link href="/favoritos" className="btn btn-secondary no-underline">
              Favoritos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
