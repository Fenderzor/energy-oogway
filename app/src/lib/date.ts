// Local date helpers using YYYY-MM-DD strings (timezone-stable for due dates).

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + Math.round(days))
  return todayStr(d)
}

export function isDue(dueDate: string, ref: string = todayStr()): boolean {
  return dueDate <= ref
}
