"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main><h1>Algo deu errado</h1><p>Não foi possível carregar esta página. Tente novamente.</p><button onClick={reset}>Tentar novamente</button></main>;
}
