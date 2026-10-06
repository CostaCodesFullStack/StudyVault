"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";

const groups = [
  { label: "", items: [{ href: "/dashboard", text: "Dashboard" }, { href: "/busca", text: "Busca" }] },
  { label: "Biblioteca", items: [{ href: "/faculdade", text: "Faculdade" }, { href: "/desenvolvimento", text: "Desenvolvimento" }, { href: "/desenvolvimento/cursor", text: "Cursor" }] },
  { label: "Organização", items: [{ href: "/favoritos", text: "Favoritos" }, { href: "/recentes", text: "Recentes" }] },
];

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try { localStorage.setItem("sv-theme", dark ? "dark" : "light"); } catch {}
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = (h: string) => (h === "/desenvolvimento" ? path === h : path === h || path.startsWith(h + "/"));
  return (
    <nav aria-label="Principal" className="flex h-full flex-col gap-4 p-4">
      <span className="text-sm font-bold tracking-widest">STUDYVAULT</span>
      {groups.map(g => (
        <div key={g.label} className="space-y-1">
          {g.label && <p className="px-2 text-xs font-medium uppercase text-zinc-500">{g.label}</p>}
          {g.items.map(i => (
            <Link key={i.href} href={i.href} onClick={onNavigate} aria-current={active(i.href) ? "page" : undefined}
              className={`block rounded-md px-2 py-1.5 text-sm no-underline ${active(i.href) ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>
              {i.text}
            </Link>
          ))}
        </div>
      ))}
      <div className="mt-auto space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button type="button" onClick={toggleTheme} className="block w-full rounded-md bg-transparent px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900">Alternar tema</button>
        <form action={logoutAction}><button className="block w-full rounded-md bg-transparent px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900">Sair</button></form>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 md:block"><Nav /></aside>
      <header className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800 md:hidden">
        <span className="text-sm font-bold tracking-widest">STUDYVAULT</span>
        <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(o => !o)}>{open ? "Fechar" : "Menu"}</button>
      </header>
      {open && <div id="mobile-nav" className="border-b border-zinc-200 dark:border-zinc-800 md:hidden"><Nav onNavigate={() => setOpen(false)} /></div>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
