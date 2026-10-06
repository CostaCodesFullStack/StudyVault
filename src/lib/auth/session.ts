import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET ausente ou curto demais (mín. 32 caracteres).");
  return new TextEncoder().encode(s);
};
export async function createSession(userId: string) {
  const t = await new SignJWT({}).setSubject(userId).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
  (await cookies()).set("sv", t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
}
export async function getUserId(): Promise<string | null> {
  const t = (await cookies()).get("sv")?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.sub ?? null; } catch { return null; }
}
export async function requireUserId() {
  const id = await getUserId();
  if (!id) redirect("/login");
  return id;
}
