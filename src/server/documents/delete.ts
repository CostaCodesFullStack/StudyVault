import { db } from "@/lib/db";
import { getStorage, type StorageService } from "@/lib/storage";
import { getOwnedDocument } from "./access";
import { purgeKey } from "./pending";
/**
 * 1) Em UMA transação: apaga o documento (cascata: progresso/favoritos/notas) e grava PendingFileDeletion.
 * 2) Tenta apagar o arquivo; em falha a pendência permanece e `npm run storage:cleanup` reprocessa.
 * Nunca fica registro apontando para arquivo inexistente, e nenhum arquivo órfão fica sem registro de limpeza.
 */
export async function deleteDocument(id: string, userId: string, storage: StorageService = getStorage()): Promise<"ok" | "not_found"> {
  const doc = await getOwnedDocument(id, userId);
  if (!doc) return "not_found";
  const removed = await db.$transaction(async tx => {
    const r = await tx.document.deleteMany({ where: { id, userId } });
    if (r.count === 0) return false;
    await tx.pendingFileDeletion.create({ data: { storageKey: doc.storageKey } });
    return true;
  });
  if (!removed) return "not_found";
  await purgeKey(doc.storageKey, storage);
  return "ok";
}
