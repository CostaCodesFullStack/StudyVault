"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { name: string; status: "Aguardando" | "Enviando" | "Concluído" | string };

type Props = {
  category: "UNIVERSITY" | "DEVELOPMENT" | "CURSOR" | "OTHER";
  subjectId?: string;
  targetType?: "unit" | "lesson";
  targetId?: string;
  label?: string;
  description?: string;
  subcategories?: readonly string[];
};

export function UploadForm({
  category,
  subjectId,
  targetType,
  targetId,
  label = "Adicionar PDF",
  description = "Envie o arquivo PDF relacionado a este item.",
  subcategories,
}: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sub, setSub] = useState(subcategories?.[0] ?? "");
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(files: File[]) {
    if (!files.length || uploading || !targetId) return;

    const file = files[0];
    setUploading(true);
    setRows([{ name: file.name, status: "Enviando" }]);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", category);
    if (subjectId) fd.set("subjectId", subjectId);
    fd.set(targetType === "unit" ? "unitId" : "lessonId", targetId);
    if (sub) fd.set("subcategory", sub);
    if (title) fd.set("title", title);

    try {
      const response = await fetch("/api/upload", { method: "POST", body: fd });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Falha no envio");
      }
      setRows([{ name: file.name, status: "Concluído" }]);
      setTitle("");
      router.refresh();
    } catch (error) {
      setRows([{ name: file.name, status: `Erro: ${error instanceof Error ? error.message : "falha no envio"}` }]);
    } finally {
      setUploading(false);
    }
  }

  function pick(files: FileList | null) {
    void upload(Array.from(files ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    ));
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="mb-4">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className="muted mt-1">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Título
          <input
            className="mt-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={targetType === "unit" ? "Ex.: Material completo da Unidade 1" : "Ex.: U1A1 - Introdução"}
          />
        </label>

        {subcategories && (
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Categoria
            <select className="mt-2" value={sub} onChange={(e) => setSub(e.target.value)}>
              {subcategories.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        )}
      </div>

      <button
        type="button"
        className={`mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${dragging ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30" : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-indigo-800"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
        disabled={uploading || !targetId}
      >
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">↑</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {uploading ? "Enviando PDF..." : "Clique para selecionar ou arraste o PDF aqui"}
        </span>
        <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">1 PDF por item</span>
      </button>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => { pick(e.target.files); e.currentTarget.value = ""; }}
      />

      {rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <ul aria-live="polite">
            {rows.map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">{row.name}</span>
                <span className={row.status === "Concluído" ? "shrink-0 font-medium text-emerald-600 dark:text-emerald-400" : row.status.startsWith("Erro") ? "shrink-0 text-red-600 dark:text-red-400" : "shrink-0 text-zinc-500 dark:text-zinc-400"}>{row.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
