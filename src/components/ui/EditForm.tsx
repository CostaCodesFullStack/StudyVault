"use client";
import { useActionState } from "react";
type Field = { name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean };
export function EditForm({ action, fields }: { action: (fd: FormData) => Promise<string>; fields: Field[] }) {
  const [msg, run, pending] = useActionState(async (_: string | undefined, fd: FormData) => action(fd), undefined);
  return (
    <details className="inline-block align-top">
      <summary className="cursor-pointer text-xs text-indigo-600 dark:text-indigo-400">Editar</summary>
      <form action={run} className="mt-2 space-y-1">
        {fields.map(f => <label key={f.name} className="block">{f.label} <input name={f.name} type={f.type ?? "text"} defaultValue={f.defaultValue ?? ""} required={f.required} /></label>)}
        <button disabled={pending}>Salvar</button>{msg && <span role="status"> {msg}</span>}
      </form>
    </details>
  );
}
