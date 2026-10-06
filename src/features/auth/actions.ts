"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { createSession } from "@/lib/auth/session";
import { isLimited, clearLimit } from "@/lib/auth/rate-limit";

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(100) });
const loginSchema = registerSchema.pick({ email: true, password: true });
export type FormState = { error?: string } | undefined;

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = registerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Verifique os dados (senha com ao menos 8 caracteres)." };
  if (await db.user.findUnique({ where: { email: p.data.email } })) return { error: "Não foi possível criar a conta." };
  const u = await db.user.create({ data: { name: p.data.name, email: p.data.email, passwordHash: await bcrypt.hash(p.data.password, 12) } });
  await createSession(u.id);
  redirect("/dashboard");
}
export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = loginSchema.safeParse(Object.fromEntries(fd));
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rlKey = `${ip}:${p.success ? p.data.email : "invalid"}`;
  if (isLimited(rlKey)) return { error: "Muitas tentativas. Aguarde alguns minutos." };
  const u = p.success ? await db.user.findUnique({ where: { email: p.data.email } }) : null;
  if (!p.success || !u || !(await bcrypt.compare(p.data.password, u.passwordHash))) return { error: "E-mail ou senha inválidos." };
  clearLimit(rlKey);
  await createSession(u.id);
  redirect("/dashboard");
}
export async function logoutAction() { (await cookies()).delete("sv"); redirect("/login"); }
