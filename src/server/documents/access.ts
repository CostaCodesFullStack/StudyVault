import { db } from "@/lib/db";
/** Retorna o documento somente se pertencer ao usuário (ownership sempre checado aqui). */
export const getOwnedDocument = (id: string, userId: string) => db.document.findFirst({ where: { id, userId } });
