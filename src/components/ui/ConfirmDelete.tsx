"use client";
import { useActionState } from "react";
import type { DeleteState } from "@/features/university/actions";
export function ConfirmDelete({ action, message }: { action: () => Promise<DeleteState>; message: string }) {
  const [error, run, pending] = useActionState(async () => action(), undefined as DeleteState);
  return (
    <form action={run} style={{ display: "inline" }} onSubmit={e => { if (!confirm(message)) e.preventDefault(); }}>
      <button disabled={pending} className="!bg-red-600 !px-2 !py-0.5 text-xs">{pending ? "..." : "Excluir"}</button>
      {error && <span role="alert"> {error}</span>}
    </form>
  );
}
