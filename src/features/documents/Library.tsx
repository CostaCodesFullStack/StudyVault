import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { UploadForm } from "./UploadForm";
import { CURSOR_SUBCATEGORIES, DEV_SUBCATEGORIES } from "@/lib/validation/upload";

export async function Library({ category, title }: { category: "DEVELOPMENT" | "CURSOR"; title: string }) {
  const userId = await requireUserId();
  const subs = category === "CURSOR" ? CURSOR_SUBCATEGORIES : DEV_SUBCATEGORIES;
  const docs = await db.document.findMany({ where: { userId, category }, orderBy: { createdAt: "desc" } });
  const grouped = subs.map((subcategory) => ({ subcategory, documents: docs.filter((document) => (document.subcategory ?? "Outros") === subcategory) })).filter((group) => group.documents.length > 0);
  const uncategorized = docs.filter((document) => !subs.includes((document.subcategory ?? "Outros") as (typeof subs)[number]));

  return (
    <main className="page-shell">
      <div className="page-header">
        <div><p className="eyebrow">Biblioteca</p><h1>{title}</h1><p className="muted mt-2">Organize seus materiais de {title.toLowerCase()} em um só lugar.</p></div>
        <Link href="/busca" className="btn btn-secondary no-underline">Buscar documentos</Link>
      </div>

      <UploadForm category={category} subcategories={subs} />

      {docs.length === 0 ? (
        <div className="empty-state mt-6"><span className="text-3xl" aria-hidden="true">▤</span><h2 className="mt-3">Sua biblioteca está vazia</h2><p className="muted mt-2 max-w-md">Faça upload do primeiro PDF para começar a organizar seu material.</p></div>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map((group) => (
            <section key={group.subcategory}>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div><p className="eyebrow">Categoria</p><h2>{group.subcategory}</h2></div>
                <span className="tag">{group.documents.length} {group.documents.length === 1 ? "PDF" : "PDFs"}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.documents.map((document) => (
                  <Link key={document.id} href={`/reader/${document.id}`} className="card card-hover block p-5 no-underline">
                    <div className="flex items-start justify-between gap-4"><span className="tag">PDF</span><span className="max-w-[60%] truncate text-xs text-zinc-400" title={document.fileName}>{document.fileName}</span></div>
                    <h2 className="mt-4 line-clamp-2">{document.title}</h2>
                    <p className="mt-5 text-sm font-medium text-indigo-600 dark:text-indigo-400">Abrir documento →</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {uncategorized.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between gap-4"><div><p className="eyebrow">Categoria</p><h2>Outros</h2></div><span className="tag">{uncategorized.length} {uncategorized.length === 1 ? "PDF" : "PDFs"}</span></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {uncategorized.map((document) => <Link key={document.id} href={`/reader/${document.id}`} className="card card-hover block p-5 no-underline"><span className="tag">PDF</span><h2 className="mt-4 line-clamp-2">{document.title}</h2><p className="mt-5 text-sm font-medium text-indigo-600 dark:text-indigo-400">Abrir documento →</p></Link>)}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
