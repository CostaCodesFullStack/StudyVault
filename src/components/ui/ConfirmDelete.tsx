"use client";

import { useActionState } from "react";
import type { DeleteState } from "@/features/university/actions";

export function ConfirmDelete({ action, message }: { action: () => Promise<DeleteState>; message: string }) {
  const [error, run, pending] = useActionState(async () => action(), undefined as DeleteState);
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <form action={run} onSubmit={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>
        <button type="submit" disabled={pending} className="btn btn-danger btn-sm">{pending ? "Excluindo..." : "Excluir"}</button>
      </form>
      {error && <span role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
