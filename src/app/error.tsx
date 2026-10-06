"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-lg font-bold text-red-600 dark:bg-red-950/50 dark:text-red-300">!</div>
        <p className="eyebrow mt-6">Erro inesperado</p>
        <h1>Algo deu errado.</h1>
        <p className="muted mx-auto mt-3 max-w-md">Não foi possível carregar esta página. Tente novamente ou volte para sua biblioteca.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Tentar novamente</button>
          <Link href="/dashboard" className="btn btn-secondary no-underline">Voltar ao dashboard</Link>
        </div>
      </section>
    </main>
  );
}
