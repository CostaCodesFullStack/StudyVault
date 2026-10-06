"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { name: string; status: "Aguardando" | "Enviando" | "Concluído" | string };
type Props = { category: "UNIVERSITY" | "DEVELOPMENT" | "CURSOR" | "OTHER"; subjectId?: string; units?: { id: string; label: string }[]; lessons?: { id: string; label: string }[]; subcategories?: readonly string[] };

export function UploadForm({ category, subjectId, units = [], lessons = [], subcategories }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [targetType, setTargetType] = useState<"unit" | "lesson">(units.length > 0 ? "unit" : "lesson");
  const [targetId, setTargetId] = useState(units[0]?.id ?? lessons[0]?.id ?? "");
  const [sub, setSub] = useState(subcategories?.[0] ?? "");
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const targets = targetType === "unit" ? units : lessons;

  function changeTargetType(value: "unit" | "lesson") {
    setTargetType(value);
    setTargetId((value === "unit" ? units[0]?.id : lessons[0]?.id) ?? "");
  }

  async function upload(files: File[]) {
    if (!files.length || uploading) return;
    setUploading(true);
    setRows(files.map((file) => ({ name: file.name, status: "Aguardando" })));
    const update = (i: number, status: string) => setRows((current) => current.map((row, j) => j === i ? { ...row, status } : row));

    for (let i = 0; i < files.length; i++) {
      update(i, "Enviando");
      const fd = new FormData();
      fd.set("file", files[i]); fd.set("category", category);
      if (subjectId) fd.set("subjectId", subjectId);
      if (targetId) fd.set(targetType === "unit" ? "unitId" : "lessonId", targetId);
      if (sub) fd.set("subcategory", sub);
      if (title && files.length === 1) fd.set("title", title);
      try {
        const response = await fetch("/api/upload", { method: "POST", body: fd });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error ?? "Falha no envio");
        }
        update(i, "Concluído");
      } catch (error) {
        update(i, `Erro: ${error instanceof Error ? error.message : "falha no envio"}`);
      }
    }
    setUploading(false);
    router.refresh();
  }

  function pick(files: FileList | null) {
    void upload(Array.from(files ?? []).filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));
  }

  return (
    <section className="card p-5">
      <div className="mb-5 flex flex-col gap-1">
        <p className="eyebrow">Biblioteca</p>
        <h2>Adicionar PDFs</h2>
        <p className="muted">Escolha se o PDF é o material completo de uma unidade ou de uma aula.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {units.length > 0 && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de material<select className="mt-2" value={targetType} onChange={(e) => changeTargetType(e.target.value as "unit" | "lesson")}><option value="unit">PDF completo da unidade</option>{lessons.length > 0 && <option value="lesson">PDF de uma aula</option>}</select></label>}
        {targets.length > 0 && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{targetType === "unit" ? "Unidade" : "Aula"}<select className="mt-2" value={targetId} onChange={(e) => setTargetId(e.target.value)}>{targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}</select></label>}
        {subcategories && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria<select className="mt-2" value={sub} onChange={(e) => setSub(e.target.value)}>{subcategories.map((value) => <option key={value}>{value}</option>)}</select></label>}
        {lessons.length > 0 && <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Aula opcional<select className="mt-2" value={lessonId} onChange={(e) => setLessonId(e.target.value)}><option value="">Nenhuma</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.label}</option>)}</select></label>}
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Título {<span className="font-normal text-zinc-400">(usado quando houver apenas um arquivo)</span>}<input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder={targetType === "unit" ? "Ex.: Material completo da Unidade 1" : "Ex.: U1A1 - Introdução"} /></label>

      <button type="button" className={`mt-4 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${dragging ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30" : "border-zinc-200 bg-zinc-50 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-indigo-800"}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }} disabled={uploading}>
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">↑</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Clique para selecionar ou arraste os PDFs aqui</span>
        <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Somente arquivos PDF</span>
      </button>
      <input ref={inputRef} className="sr-only" type="file" accept="application/pdf,.pdf" multiple onChange={(e) => { pick(e.target.files); e.currentTarget.value = ""; }} />

      {rows.length > 0 && <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"><div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-950">Arquivos selecionados</div><ul aria-live="polite" className="divide-y divide-zinc-100 dark:divide-zinc-800">{rows.map((row, index) => <li key={`${row.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">{row.name}</span><span className={row.status === "Concluído" ? "shrink-0 font-medium text-emerald-600 dark:text-emerald-400" : row.status.startsWith("Erro") ? "shrink-0 text-red-600 dark:text-red-400" : "shrink-0 text-zinc-500 dark:text-zinc-400"}>{row.status}</span></li>)}</ul></div>}
    </section>
  );
}
