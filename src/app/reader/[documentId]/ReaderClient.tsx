"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { documentFileUrl } from "@/lib/storage/urls";
type Note = { id: string; page: number; content: string };
export function ReaderClient(p: { id: string; title: string; total: number; initialPage: number; bookmarked: boolean; notes: Note[] }) {
  const [page, setPage] = useState(p.initialPage);
  const [zoom, setZoom] = useState(100);
  const [fav, setFav] = useState(p.bookmarked);
  const [notes, setNotes] = useState(p.notes);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const max = p.total || 9999;
  function go(n: number) {
    const v = Math.min(Math.max(1, n || 1), max);
    setPage(v);
    fetch(`/api/documents/${p.id}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page: v }) });
  }
  async function toggleFav() { const r = await fetch(`/api/documents/${p.id}/bookmark`, { method: "POST" }); if (r.ok) setFav((await r.json()).bookmarked); }
  async function addNote() {
    if (!text.trim()) return;
    setError("");
    const r = await fetch(`/api/documents/${p.id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, content: text }) });
    if (!r.ok) return setError("Não foi possível salvar a anotação.");
    const created: Note = await r.json();
    setNotes(n => [...n, { id: created.id, page: created.page, content: created.content }]);
    setText("");
  }
  async function removeNote(id: string) {
    setError("");
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) setNotes(n => n.filter(x => x.id !== id)); else setError("Não foi possível excluir a anotação.");
  }
  async function removeDocument() {
    if (!confirm("Excluir este documento, suas anotações e seu progresso?")) return;
    const r = await fetch(`/api/documents/${p.id}`, { method: "DELETE" });
    if (r.ok) { router.push("/dashboard"); router.refresh(); } else setError("Não foi possível excluir o documento.");
  }
  return (
    <div>
      <div role="toolbar">
        <button onClick={() => go(page - 1)} disabled={page <= 1}>Anterior</button>
        <input aria-label="Ir para página" type="number" value={page} min={1} max={max} onChange={e => go(Number(e.target.value))} style={{ width: 70 }} />
        <span> / {p.total || "?"}</span>
        <button onClick={() => go(page + 1)} disabled={page >= max}>Próxima</button>
        <button onClick={() => setZoom(z => Math.max(50, z - 25))}>−</button><span>{zoom}%</span><button onClick={() => setZoom(z => Math.min(300, z + 25))}>+</button>
        <button onClick={() => document.getElementById("pdf")?.requestFullscreen()}>Tela cheia</button>
        <button onClick={toggleFav} aria-pressed={fav}>{fav ? "Desfavoritar" : "Favoritar"}</button>
        <span> {p.total ? Math.round((page / p.total) * 100) : 0}%</span>
      </div>
      <iframe id="pdf" key={`${page}-${zoom}`} title={p.title} src={`${documentFileUrl(p.id)}#page=${page}&zoom=${zoom}`} style={{ width: "100%", height: "75vh", border: 0 }} />
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={removeDocument}>Excluir documento</button>
      <h2>Anotações</h2>
      <textarea aria-label="Nova anotação" value={text} onChange={e => setText(e.target.value)} maxLength={2000} /><button onClick={addNote}>Salvar na pág. {page}</button>
      <ul>{notes.map(n => <li key={n.id}>p.{n.page}: {n.content} <button type="button" onClick={() => removeNote(n.id)} aria-label={`Excluir anotação da página ${n.page}`}>Excluir</button></li>)}</ul>
    </div>
  );
}
