"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Row = { name: string; status: string };
type Props = { category: "UNIVERSITY" | "DEVELOPMENT" | "CURSOR" | "OTHER"; subjectId?: string; lessons?: { id: string; label: string }[]; subcategories?: readonly string[] };
export function UploadForm({ category, subjectId, lessons = [], subcategories }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [sub, setSub] = useState(subcategories?.[0] ?? "");
  const [title, setTitle] = useState("");
  const router = useRouter();
  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setRows(list.map(f => ({ name: f.name, status: "Aguardando..." })));
    const set = (i: number, status: string) => setRows(r => r.map((x, j) => (j === i ? { ...x, status } : x)));
    for (let i = 0; i < list.length; i++) {
      set(i, "Enviando...");
      const fd = new FormData();
      fd.set("file", list[i]); fd.set("category", category);
      if (subjectId) fd.set("subjectId", subjectId);
      if (lessonId) fd.set("lessonId", lessonId);
      if (sub) fd.set("subcategory", sub);
      if (title && list.length === 1) fd.set("title", title);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        set(i, res.ok ? "✓" : "Erro: " + ((await res.json().catch(() => ({}))).error ?? "falha no envio"));
      } catch { set(i, "Erro: falha de rede"); }
    }
    router.refresh();
  }
  return (
    <div>
      {subcategories && <label>Categoria <select value={sub} onChange={e => setSub(e.target.value)}>{subcategories.map(s => <option key={s}>{s}</option>)}</select></label>}
      {lessons.length > 0 && <label> Aula (para nomes fora do padrão U#A#) <select value={lessonId} onChange={e => setLessonId(e.target.value)}><option value="">— nenhuma —</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label>}
      <label> Título (envio único) <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} /></label>
      <label> Enviar PDFs <input type="file" accept="application/pdf,.pdf" multiple onChange={e => onPick(e.target.files)} /></label>
      <ul aria-live="polite">{rows.map(r => <li key={r.name}>{r.name} — {r.status}</li>)}</ul>
    </div>
  );
}
