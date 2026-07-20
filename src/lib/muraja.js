// Aturan mesin muraja'ah berjenjang — PERSIS seperti SPEC.md / PROMPT-VERSI-INSTAN.md.
// Jangan ubah tabel interval ini tanpa mengubah spesifikasinya juga.
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 120] // hari, indeks = review_stage (0..6)

export function reviewInterval(stage) {
  const clamped = Math.min(Math.max(stage, 0), REVIEW_INTERVALS.length - 1)
  return REVIEW_INTERVALS[clamped]
}
