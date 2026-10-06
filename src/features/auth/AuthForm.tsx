"use client";
import { useActionState } from "react";
import type { FormState } from "./actions";
export function AuthForm({ action, register }: { action: (s: FormState, f: FormData) => Promise<FormState>; register?: boolean }) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} style={{ display: "grid", gap: 12, maxWidth: 320, margin: "10vh auto" }}>
      <h1>{register ? "Criar conta" : "Entrar"}</h1>
      {register && <label>Nome<input name="name" required /></label>}
      <label>E-mail<input name="email" type="email" required /></label>
      <label>Senha<input name="password" type="password" minLength={8} required /></label>
      {state?.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>{pending ? "Aguarde..." : register ? "Cadastrar" : "Entrar"}</button>
      <a href={register ? "/login" : "/register"}>{register ? "Já tenho conta" : "Criar conta"}</a>
    </form>
  );
}
