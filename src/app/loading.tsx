export default function Loading() {
  return (
    <main className="page-shell" aria-busy="true">
      <div className="page-header">
        <div>
          <span className="eyebrow">StudyVault</span>
          <h1>Carregando</h1>
          <p className="muted">Preparando sua biblioteca...</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="card animate-pulse">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">Carregando conteúdo...</span>
    </main>
  );
}
