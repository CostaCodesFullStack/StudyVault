import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
import { parseLessonFileName } from "@/lib/upload/parse-filename";
import { PDFDocument } from "pdf-lib";
import { uploadMetadataSchema, validatePdf } from "@/lib/validation/upload";

/** multipart: file, category, title?, subjectId? (se o nome for U#A#, cria Unidade/Aula sob subjectId do usuário) */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const check = validatePdf(file, buf.subarray(0, 5));
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

    let pageCount: number | null = null;
    try { pageCount = (await PDFDocument.load(buf, { ignoreEncryption: true })).getPageCount(); } catch { return NextResponse.json({ error: "PDF corrompido ou ilegível." }, { status: 400 }); }
    const parsed = parseLessonFileName(file.name);
    const subjectId = fd.get("subjectId")?.toString();
    let lessonId: string | null = null;
    if (parsed && subjectId) {
      const subject = await db.subject.findFirst({ where: { id: subjectId, semester: { userId } } });
      if (!subject) return NextResponse.json({ error: "Disciplina não encontrada." }, { status: 404 });
      const unit = await db.unit.upsert({ where: { subjectId_number: { subjectId, number: parsed.unit } }, update: {}, create: { subjectId, number: parsed.unit, title: `Unidade ${parsed.unit}` } });
      const lesson = await db.lesson.upsert({ where: { unitId_number: { unitId: unit.id, number: parsed.lesson } }, update: {}, create: { unitId: unit.id, number: parsed.lesson, code: parsed.code, title: parsed.code } });
      lessonId = lesson.id;
    }
    const lessonInput = fd.get("lessonId")?.toString();
    if (!lessonId && lessonInput) {
      const l = await db.lesson.findFirst({ where: { id: lessonInput, unit: { subject: { semester: { userId } } } } });
      if (!l) return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
      lessonId = l.id;
    }
    const meta = uploadMetadataSchema.safeParse({ category: fd.get("category") ?? (lessonId ? "UNIVERSITY" : "OTHER"), subcategory: fd.get("subcategory") || null, title: fd.get("title") || parsed?.code || file.name.replace(/\.pdf$/i, "") });
    if (!meta.success) return NextResponse.json({ error: "Metadados inválidos." }, { status: 400 });

    const { key } = await getStorage().upload({ userId, data: buf, contentType: "application/pdf" });
    const doc = await db.document.create({ data: { userId, lessonId, category: meta.data.category, title: meta.data.title, subcategory: meta.data.subcategory ?? null, fileName: file.name, storageKey: key, mimeType: "application/pdf", fileSize: file.size, pageCount } }).catch(async (e: unknown) => { await getStorage().delete(key).catch(() => undefined); throw e; });
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Não foi possível salvar o documento. Tente novamente." }, { status: 500 });
  }
}
