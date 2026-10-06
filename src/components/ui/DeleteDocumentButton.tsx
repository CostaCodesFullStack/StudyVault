"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteDocumentButtonProps = {
  documentId: string;
  title: string;
  className?: string;
  onDeleted?: () => void;
};

export function DeleteDocumentButton({
  documentId,
  title,
  className,
  onDeleted,
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (pending) return;

    if (
      !window.confirm(
        `Excluir "${title}"?\n\nO PDF, favoritos, progresso e anotações relacionados serão removidos.`
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}`,
        { method: "DELETE" }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Não foi possível excluir o documento."
        );
      }

      onDeleted?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o documento."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={className ?? "btn btn-danger btn-sm"}
        aria-label={`Excluir ${title}`}
      >
        {pending ? "Excluindo..." : "Excluir"}
      </button>

      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}
