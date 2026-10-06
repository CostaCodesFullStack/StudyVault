import { db } from "@/lib/db";
import { getStorage, type StorageService } from "@/lib/storage";
import { purgeKey } from "@/server/documents/pending";

type R = "ok" | "not_found" | "has_documents";

/**
 * Exclui um semestre e toda a estrutura acadêmica pertencente a ele.
 * Os documentos são removidos explicitamente porque Document.lesson usa
 * onDelete: SetNull. Os arquivos físicos são apagados após o commit;
 * em caso de falha, PendingFileDeletion permite retry via storage:cleanup.
 */
export async function deleteSemester(id: string, userId: string, storage?: StorageService): Promise<R> {
  const result = await db.$transaction(async (tx) => {
    const semester = await tx.semester.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!semester) return { status: "not_found" as const, storageKeys: [] as string[] };

    const documents = await tx.document.findMany({
      where: {
        userId,
        OR: [
          { unit: { subject: { semesterId: id } } },
          { lesson: { unit: { subject: { semesterId: id } } } },
        ],
      },
      select: { id: true, storageKey: true },
    });

    if (documents.length > 0) {
      await tx.document.deleteMany({
        where: { id: { in: documents.map((document) => document.id) }, userId },
      });

      await tx.pendingFileDeletion.createMany({
        data: documents.map((document) => ({ storageKey: document.storageKey })),
      });
    }

    await tx.semester.delete({
      where: { id },
    });

    return {
      status: "ok" as const,
      storageKeys: documents.map((document) => document.storageKey),
    };
  });

  if (result.status !== "ok") return result.status;

  const storageService = storage ?? getStorage();
  for (const storageKey of result.storageKeys) {
    await purgeKey(storageKey, storageService);
  }

  return "ok";
}

export async function deleteSubject(id: string, userId: string): Promise<R> {
  if (
    await db.document.count({
      where: {
        userId,
        OR: [
          { unit: { subjectId: id } },
          { lesson: { unit: { subjectId: id } } },
        ],
      },
    })
  ) return "has_documents";
  return (await db.subject.deleteMany({ where: { id, semester: { userId } } })).count ? "ok" : "not_found";
}

export async function deleteUnit(id: string, userId: string, storage?: StorageService): Promise<R> {
  const result = await db.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: { id, subject: { semester: { userId } } },
      select: { id: true },
    });

    if (!unit) return { status: "not_found" as const, storageKeys: [] as string[] };

    const documents = await tx.document.findMany({
      where: { userId, OR: [{ unitId: id }, { lesson: { unitId: id } }] },
      select: { id: true, storageKey: true },
    });

    if (documents.length > 0) {
      await tx.document.deleteMany({
        where: { id: { in: documents.map((document) => document.id) }, userId },
      });
      await tx.pendingFileDeletion.createMany({
        data: documents.map((document) => ({ storageKey: document.storageKey })),
      });
    }

    await tx.unit.delete({ where: { id } });

    return {
      status: "ok" as const,
      storageKeys: documents.map((document) => document.storageKey),
    };
  });

  if (result.status !== "ok") return result.status;

  const storageService = storage ?? getStorage();
  for (const storageKey of result.storageKeys) {
    await purgeKey(storageKey, storageService);
  }

  return "ok";
}

export async function deleteLesson(id: string, userId: string): Promise<R> {
  if (await db.document.count({ where: { userId, lessonId: id } })) return "has_documents";
  return (await db.lesson.deleteMany({ where: { id, unit: { subject: { semester: { userId } } } } })).count ? "ok" : "not_found";
}
