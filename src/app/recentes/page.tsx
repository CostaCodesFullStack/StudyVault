import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

export default async function Recentes() {
  const userId = await requireUserId();
  const items = await db.readingProgress.findMany({
    where: { userId },
    orderBy: { lastOpenedAt: "desc" },
    take: 30,
    include: { document: { include: { lesson: { include: { unit: { include: { subject: true } } } } } } },
  });

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Organização</p>
          <h1>Recentes</h1>
          <p className="muted mt-2">Continue suas últimas leituras e acompanhe seu progresso.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl" aria-hidden="true">◷</span>
          <h2 className="mt-3">Nenhuma leitura recente</h2>
          <p className="muted mt-2 max-w-md">Os PDFs que você abrir aparecerão aqui automaticamente.</p>
          <Link href="/faculdade" className="btn btn-primary mt-5 no-underline">Explorar biblioteca</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const percentage = Math.min(100, Math.max(0, Math.round(item.percentage)));
            const lesson = item.document.lesson;
            return (
              <Link key={item.id} href={`/reader/${item.documentId}`} className="card card-hover block p-5 no-underline">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300" aria-hidden="true">PDF</span>
                    <div className="min-w-0">
                      <h2 className="truncate">{item.document.title}</h2>
                      <p className="muted mt-1">Página {item.currentPage}{item.totalPages > 0 ? ` de ${item.totalPages}` : ""}{lesson ? ` · ${lesson.code}` : ""}</p>
                    </div>
                  </div>
                  <div className="w-full shrink-0 sm:w-48">
                    <div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-500 dark:text-zinc-400">Progresso</span><span className="font-semibold text-indigo-600 dark:text-indigo-400">{percentage}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percentage}%` }} /></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
