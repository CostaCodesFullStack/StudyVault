import { db } from "@/lib/db";
import { getStorage, type StorageService } from "@/lib/storage";
/** Remove o arquivo físico e a pendência. Em falha, mantém a pendência (com contador/erro) para nova tentativa. */
export async function purgeKey(key: string, storage: StorageService = getStorage()): Promise<boolean> {
  try {
    await storage.delete(key);
    await db.pendingFileDeletion.deleteMany({ where: { storageKey: key } });
    return true;
  } catch (e) {
    console.error("storage purge failed", key, e);
    try { await db.pendingFileDeletion.updateMany({ where: { storageKey: key }, data: { attempts: { increment: 1 }, lastError: String(e).slice(0, 200) } }); } catch { /* mantém pendência */ }
    return false;
  }
}
export async function purgePendingFiles(storage: StorageService = getStorage(), limit = 100) {
  const rows = await db.pendingFileDeletion.findMany({ orderBy: { createdAt: "asc" }, take: limit });
  let deleted = 0;
  for (const r of rows) if (await purgeKey(r.storageKey, storage)) deleted++;
  return { processed: rows.length, deleted };
}
