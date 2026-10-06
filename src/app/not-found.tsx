import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">404</div>
        <p className="eyebrow mt-6">Página não encontrada</p>
        <h1>Não encontramos o que você procura.</h1>
        <p className="muted mx-auto mt-3 max-w-md">O conteúdo pode ter sido removido, movido ou você pode não ter permissão para acessá-lo.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary no-underline">Voltar ao dashboard</Link>
          <Link href="/faculdade" className="btn btn-secondary no-underline">Abrir faculdade</Link>
        </div>
      </section>
    </main>
  );
}
