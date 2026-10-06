export function computeProgress(page: number, pageCount: number | null) {
  const total = pageCount ?? page;
  const current = Math.min(Math.max(1, page), total);
  return { currentPage: current, totalPages: total, percentage: (current / total) * 100 };
}
