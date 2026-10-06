const LESSON_RE = /^U(\d+)A(\d+)$/i;

export interface ParsedLessonName { unit: number; lesson: number; code: string }

/** "U2A3.pdf" -> { unit: 2, lesson: 3, code: "U2A3" }; null if name doesn't match. */
export function parseLessonFileName(fileName: string): ParsedLessonName | null {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  const m = LESSON_RE.exec(base);
  if (!m) return null;
  const unit = Number(m[1]);
  const lesson = Number(m[2]);
  if (unit < 1 || lesson < 1) return null;
  return { unit, lesson, code: `U${unit}A${lesson}` };
}
