"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { documentFileUrl } from "@/lib/storage/urls";

type Note = { id: string; page: number; content: string };

type Props = { id: string; title: string; total: number; initialPage: number; bookmarked: boolean; notes: Note[] };

export function ReaderClient(p: Props) {
  const [page, setPage] = useState(p.initialPage);
  const [zoom, setZoom] = useState(100);
  const [fav, setFav] = useState(p.bookmarked);
  const [notes, setNotes] = useState(p.notes);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const max = p.total || 9999;
  const percentage = p.total ? Math.round((page / p.total) * 100) : 0;

  function go(n: number) {
    const value = Math.min(Math.max(1, n || 1), max);
    setPage(value);
    void fetch(`/api/documents/${p.id}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: value }) });
  }

  async function toggleFav() {
    const r = await fetch(`/api/documents/${p.id}/bookmark`, { method: "POST" });
    if (r.ok) setFav((await r.json()).bookmarked);
  }

  async function addNote() {
    if (!text.trim() || busy) return;
    setError(""); setBusy(true);
    try {
      const r = await fetch(`/api/documents/${p.id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, content: text }) });
      if (!r.ok) throw new Error("Não foi possível salvar a anotação.");
      const created: Note = await r.json();
      setNotes((current) => [...current, created]); setText("");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar a anotação."); }
    finally { setBusy(false); }
  }

  async function removeNote(id: string) {
    setError("");
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) setNotes((current) => current.filter((note) => note.id !== id)); else setError("Não foi possível excluir a anotação.");
  }

  async function removeDocument() {
    if (!window.confirm("Excluir este documento, suas anotações e seu progresso?")) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/documents/${p.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Não foi possível excluir o documento.");
      router.push("/dashboard"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível excluir o documento."); setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <section className="card p-3 sm:p-4">
        <div role="toolbar" aria-label="Controles do leitor" className="gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => go(page - 1)} disabled={page <= 1 || busy}>Anterior</button>
          <div className="flex items-center gap-2">
            <label htmlFor="reader-page" className="sr-only">Página</label>
            <input id="reader-page" aria-label="Ir para página" type="number" value={page} min={1} max={max} onChange={(e) => go(Number(e.target.value))} className="w-20" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">/ {p.total || "?"}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => go(page + 1)} disabled={p.total > 0 ? page >= p.total || busy : busy}>Próxima</button>
          <span className="mx-1 hidden h-6 border-l border-zinc-200 dark:border-zinc-700 sm:block" />
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.max(50, z - 25))}>−</button>
          <span className="min-w-12 text-center text-sm font-medium">{zoom}%</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.min(300, z + 25))}>+</button>
          <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById("pdf")?.requestFullscreen()}>Tela cheia</button>
          <button className="btn btn-secondary btn-sm" onClick={toggleFav} aria-pressed={fav}>{fav ? "★ Favorito" : "☆ Favoritar"}</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percentage}%` }} /></div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
        </div>
      </section>

      <section className="card overflow-hidden p-1 sm:p-2">
        <iframe id="pdf" title={p.title} src={`${documentFileUrl(p.id)}#page=${page}&zoom=${zoom}`} className="h-[70vh] min-h-[520px] w-full border-0 bg-zinc-100 dark:bg-zinc-950 sm:h-[78vh]" />
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Estudo</p><h2>Anotações</h2><p className="muted mt-1">Registre observações relacionadas à página atual.</p></div>
          <span className="tag">Página {page}</span>
        </div>
        <textarea aria-label="Nova anotação" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Escreva uma anotação..." />
        <div className="mt-3 flex justify-end"><button className="btn btn-primary" onClick={addNote} disabled={!text.trim() || busy}>Salvar anotação</button></div>
        {notes.length > 0 && <div className="mt-5 space-y-3">{notes.map((note) => <article key={note.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex items-start justify-between gap-4"><span className="tag">Página {note.page}</span><button className="btn btn-danger btn-sm" type="button" onClick={() => removeNote(note.id)}>Excluir</button></div><p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{note.content}</p></article>)}</div>}
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-950 dark:bg-red-950/20">
        <h2 className="text-base text-red-800 dark:text-red-300">Zona de perigo</h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">Excluir este PDF remove também o progresso, favoritos e anotações associados.</p>
        <button type="button" onClick={removeDocument} disabled={busy} className="btn btn-danger mt-4">{busy ? "Excluindo..." : "Excluir documento"}</button>
      </section>
    </div>
  );
}
