import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { UploadForm } from "./UploadForm";
import { CURSOR_SUBCATEGORIES, DEV_SUBCATEGORIES } from "@/lib/validation/upload";

export async function Library({ category, title }: { category: "DEVELOPMENT" | "CURSOR"; title: string }) {
  const userId = await requireUserId();
  const subs = category === "CURSOR" ? CURSOR_SUBCATEGORIES : DEV_SUBCATEGORIES;
  const docs = await db.document.findMany({ where: { userId, category }, orderBy: { createdAt: "desc" } });
  return (
    <main>
      <a href="/dashboard">← Dashboard</a><h1>{title}</h1>
      <UploadForm category={category} subcategories={subs} />
      {docs.length === 0 ? <p>Nenhum documento encontrado. Faça upload do seu primeiro PDF.</p> :
        subs.map(s => { const g = docs.filter(d => (d.subcategory ?? "Outros") === s); return g.length === 0 ? null : (
          <section key={s}><h2>{s}</h2><ul>{g.map(d => <li key={d.id}><Link href={`/reader/${d.id}`}>{d.title}</Link></li>)}</ul></section>); })}
    </main>
  );
}
