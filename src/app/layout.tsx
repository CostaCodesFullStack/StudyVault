import type { ReactNode } from "react";
import "./globals.css";
import { getUserId } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = { title: "StudyVault", description: "Biblioteca pessoal de estudos" };
const themeScript = `try{var t=localStorage.getItem("sv-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function Root({ children }: { children: ReactNode }) {
  const signedIn = !!(await getUserId());
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{signedIn ? <AppShell>{children}</AppShell> : children}</body>
    </html>
  );
}
