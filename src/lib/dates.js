export function todayLocalISO() {
  return toLocalISO(new Date())
}

export function toLocalISO(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return toLocalISO(date)
}

export function fromLocalISO(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// 1=Senin..7=Minggu, sama seperti konvensi courses.day_of_week
export function isoDayOfWeek(date) {
  const day = date.getDay() // bawaan JS: 0=Minggu..6=Sabtu
  return day === 0 ? 7 : day
}
