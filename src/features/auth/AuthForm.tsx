"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";

export function AuthForm({ action, register }: { action: (s: FormState, f: FormData) => Promise<FormState>; register?: boolean }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-indigo-600 p-10 text-white md:flex md:flex-col md:justify-between">
          <div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-indigo-600">S</span><span className="font-bold tracking-[0.18em]">STUDYVAULT</span></div><div className="mt-20"><p className="text-sm font-medium text-indigo-200">Sua biblioteca pessoal</p><h2 className="mt-3 text-4xl font-semibold tracking-tight">Estude com tudo no lugar certo.</h2><p className="mt-5 leading-7 text-indigo-100">Organize PDFs, acompanhe seu progresso e mantenha suas anotações junto do conteúdo.</p></div></div>
          <p className="text-xs text-indigo-200">Uma biblioteca simples para sua rotina de estudos.</p>
        </section>
        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold no-underline md:hidden"><span className="brand-mark brand-mark-sm">S</span> STUDYVAULT</Link>
            <p className="eyebrow">{register ? "Comece agora" : "Bem-vindo de volta"}</p>
            <h1>{register ? "Criar sua conta" : "Entrar na sua biblioteca"}</h1>
            <p className="muted mt-2">{register ? "Crie seu espaço pessoal para organizar seus estudos." : "Acesse seus documentos e continue de onde parou."}</p>
            <form action={run} className="mt-8 space-y-4">
              {register && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome<input className="mt-2" name="name" autoComplete="name" required /></label>}
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail<input className="mt-2" name="email" type="email" autoComplete="email" required /></label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha<input className="mt-2" name="password" type="password" minLength={8} autoComplete={register ? "new-password" : "current-password"} required /></label>
              {state?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{state.error}</p>}
              <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</button>
            </form>
            <p className="muted mt-6 text-center">{register ? "Já possui uma conta?" : "Ainda não possui uma conta?"} <Link href={register ? "/login" : "/register"} className="font-medium no-underline">{register ? "Entrar" : "Criar conta"}</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
