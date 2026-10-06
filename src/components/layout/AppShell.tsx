"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";

const groups = [
  { label: "Visão geral", items: [{ href: "/dashboard", text: "Dashboard", icon: "⌂" }, { href: "/busca", text: "Buscar", icon: "⌕" }] },
  { label: "Biblioteca", items: [{ href: "/faculdade", text: "Faculdade", icon: "▤" }, { href: "/desenvolvimento", text: "Desenvolvimento", icon: "⌘" }, { href: "/desenvolvimento/cursor", text: "Cursor", icon: ">" }] },
  { label: "Organização", items: [{ href: "/favoritos", text: "Favoritos", icon: "♡" }, { href: "/recentes", text: "Recentes", icon: "◷" }] },
];

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try { localStorage.setItem("sv-theme", dark ? "dark" : "light"); } catch {}
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) => href === "/desenvolvimento" ? path === href : path === href || path.startsWith(href + "/");
  return <nav aria-label="Principal" className="flex h-full flex-col">
    <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2 no-underline" onClick={onNavigate}>
      <span className="brand-mark">S</span><span><span className="block text-sm font-bold tracking-[0.18em] text-zinc-950 dark:text-white">STUDYVAULT</span><span className="block text-[10px] text-zinc-500">Sua biblioteca pessoal</span></span>
    </Link>
    <div className="space-y-7">{groups.map(g => <div key={g.label}><p className="nav-label">{g.label}</p><div className="space-y-1">{g.items.map(i => <Link key={i.href} href={i.href} onClick={onNavigate} aria-current={active(i.href) ? "page" : undefined} className={`nav-item ${active(i.href) ? "nav-item-active" : ""}`}><span className="nav-icon" aria-hidden="true">{i.icon}</span>{i.text}</Link>)}</div></div>)}</div>
    <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <button type="button" onClick={toggleTheme} className="nav-item w-full"><span className="nav-icon">◐</span>Alternar tema</button>
      <form action={logoutAction}><button className="nav-item w-full"><span className="nav-icon">↪</span>Sair</button></form>
    </div>
  </nav>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:flex">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-200 bg-white/80 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:block"><Nav /></aside>
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 no-underline"><span className="brand-mark brand-mark-sm">S</span><span className="text-sm font-bold tracking-[0.16em] text-zinc-950 dark:text-white">STUDYVAULT</span></Link>
      <button type="button" className="btn btn-secondary btn-sm" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(o => !o)}>{open ? "Fechar" : "Menu"}</button>
    </header>
    {open && <div id="mobile-nav" className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 md:hidden"><Nav onNavigate={() => setOpen(false)} /></div>}
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}
