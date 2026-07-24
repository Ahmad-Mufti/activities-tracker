// Mesin Prioritas & Lantai/Atap — SPEC.md Bagian 6B. Fungsi murni.
import { addDays } from './dates'

export const TIER_LABELS = { wajib: 'Wajib', rutin: 'Rutin', bonus: 'Bonus' }
export const TIER_COLORS = {
  wajib: 'bg-red-100 text-red-700',
  rutin: 'bg-blue-100 text-blue-700',
  bonus: 'bg-gray-100 text-gray-600',
}

const PROMOTION_MIN_AGE_DAYS = 14
const PROMOTION_WINDOW_DAYS = 14
const PROMOTION_MIN_HITS = 12 // toleransi bolong 1-2 hari — "tidak menghukum"

// Sehari dianggap "lantai tercapai" kalau ada log & (floor_amount null cukup ada log;
// kalau diisi, amount_done harus >= floor_amount).
export function metFloor(item, log) {
  if (!log) return false
  if (item.floor_amount == null) return true
  return Number(log.amount_done ?? 0) >= Number(item.floor_amount)
}

// Streak mundur dari hari ini (atau kemarin kalau hari ini belum dicentang) selama lantai tercapai.
export function computeFloorStreak(item, logsByDate, todayISO) {
  let cursor = logsByDate.has(todayISO) && metFloor(item, logsByDate.get(todayISO)) ? todayISO : addDays(todayISO, -1)
  let streak = 0
  while (metFloor(item, logsByDate.get(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

// Aturan kebiasaan aspirasional: sarankan naik dari Bonus ke Rutin setelah ±14 hari lantai
// tercapai (longgar, bukan otomatis — user yang menerapkan).
export function shouldSuggestPromotion(habit, logsByDate, todayISO) {
  if (habit.priority_tier !== 'bonus') return false

  const ageDays = Math.round((Date.now() - new Date(habit.created_at).getTime()) / 86_400_000)
  if (ageDays < PROMOTION_MIN_AGE_DAYS) return false

  let hits = 0
  let cursor = todayISO
  for (let i = 0; i < PROMOTION_WINDOW_DAYS; i++) {
    if (metFloor(habit, logsByDate.get(cursor))) hits++
    cursor = addDays(cursor, -1)
  }
  return hits >= PROMOTION_MIN_HITS
}

// Perilaku tampilan saat hari sibuk (waktu_luang < total_rencana, 6C):
// Bonus disembunyikan; Rutin tetap tampil tapi ditandai "ditunda"; Wajib tampil pada floor_amount.
export function floorModeDisplay(item, floorModeActive) {
  if (!floorModeActive) {
    return { visible: true, deferred: false, amount: item.target_amount }
  }
  if (item.priority_tier === 'bonus') {
    return { visible: false, deferred: false, amount: item.floor_amount ?? item.target_amount }
  }
  if (item.priority_tier === 'rutin') {
    return { visible: true, deferred: true, amount: item.floor_amount ?? item.target_amount }
  }
  return { visible: true, deferred: false, amount: item.floor_amount ?? item.target_amount }
}
