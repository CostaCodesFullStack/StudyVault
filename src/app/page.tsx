import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth/session";
import Link from "next/link";

export default async function Home() {
  if (await getUserId()) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-3 no-underline"><span className="brand-mark">S</span><span className="font-bold tracking-[0.18em] text-zinc-950 dark:text-white">STUDYVAULT</span></Link><div className="flex gap-2"><Link href="/login" className="btn btn-secondary no-underline">Entrar</Link><Link href="/register" className="btn btn-primary no-underline">Criar conta</Link></div></nav>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl self-center"><span className="tag">Sua biblioteca de estudos</span><h1 className="mt-6 text-5xl sm:text-6xl">Tudo que você estuda, <span className="text-indigo-600 dark:text-indigo-400">em um só lugar.</span></h1><p className="muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">Organize seus PDFs por disciplina, acompanhe sua leitura, marque favoritos e registre anotações sem perder o contexto.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="btn btn-primary px-5 py-3 no-underline">Começar gratuitamente</Link><Link href="/login" className="btn btn-secondary px-5 py-3 no-underline">Já tenho uma conta</Link></div></div>
        <div className="card relative overflow-hidden p-6 shadow-xl"><div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-100 dark:bg-indigo-950/60"/><p className="eyebrow">StudyVault</p><h2 className="text-2xl">Uma rotina de estudos mais organizada.</h2><div className="mt-6 space-y-3"><div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><p className="text-sm font-medium">Lógica Orientada a Objetos</p><div className="mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-2 w-3/4 rounded-full bg-indigo-600"/></div><p className="mt-2 text-xs text-zinc-500">75% concluído</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950"><p className="text-xs text-zinc-500">Documentos</p><p className="mt-1 text-2xl font-semibold">24</p></div><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950"><p className="text-xs text-zinc-500">Favoritos</p><p className="mt-1 text-2xl font-semibold">8</p></div></div></div></div>
      </section>
      <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8"><div><p className="font-semibold">Organização</p><p className="muted mt-1">Semestres, disciplinas, unidades e aulas.</p></div><div><p className="font-semibold">Leitura</p><p className="muted mt-1">Continue exatamente de onde parou.</p></div><div><p className="font-semibold">Anotações</p><p className="muted mt-1">Registre ideias diretamente no contexto do PDF.</p></div></div></section>
    </main>
  );
}
