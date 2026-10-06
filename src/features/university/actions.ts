"use server";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { deleteSemester, deleteSubject, deleteUnit, deleteLesson } from "@/server/university/delete";
import { updateSemester, updateSubject, updateUnit, updateLesson, type UpdateResult } from "@/server/university/update";
import { deleteDocument } from "@/server/documents/delete";

export type DeleteState = string | undefined;
const MSG = { has_documents: "Há documentos nesta estrutura. Exclua-os antes.", not_found: "Item não encontrado." } as const;
async function run(fn: (id: string, uid: string) => Promise<"ok" | "not_found" | "has_documents">, id: string): Promise<DeleteState> {
  const uid = await requireUserId();
  try {
    const r = await fn(id, uid);
    if (r !== "ok") return MSG[r];
  } catch (e) { console.error("delete failed", e); return "Não foi possível excluir. Tente novamente."; }
  revalidatePath("/faculdade", "layout");
}
export const deleteSemesterAction = async (id: string) => run(deleteSemester, id);
export const deleteSubjectAction = async (id: string) => run(deleteSubject, id);
export const deleteUnitAction = async (id: string) => run(deleteUnit, id);
export const deleteLessonAction = async (id: string) => run(deleteLesson, id);
export const deleteDocumentAction = async (id: string) => run(async (i, u) => deleteDocument(i, u), id);

const UMSG = { invalid: "Dados inválidos.", not_found: "Item não encontrado.", conflict: "Já existe um item com esse nome/número." } as const;
async function runUpdate(fn: (uid: string) => Promise<UpdateResult>): Promise<string> {
  const uid = await requireUserId();
  try {
    const r = await fn(uid);
    if (r !== "ok") return UMSG[r];
  } catch (e) { console.error("update failed", e); return "Não foi possível salvar. Tente novamente."; }
  revalidatePath("/faculdade", "layout");
  return "Salvo.";
}
const raw = (fd: FormData) => Object.fromEntries(fd);
export const updateSemesterAction = async (id: string, fd: FormData) => runUpdate(u => updateSemester(id, u, raw(fd)));
export const updateSubjectAction = async (id: string, fd: FormData) => runUpdate(u => updateSubject(id, u, raw(fd)));
export const updateUnitAction = async (id: string, fd: FormData) => runUpdate(u => updateUnit(id, u, raw(fd)));
export const updateLessonAction = async (id: string, fd: FormData) => runUpdate(u => updateLesson(id, u, raw(fd)));
