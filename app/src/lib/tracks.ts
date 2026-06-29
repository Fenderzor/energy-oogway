// Learning "tracks" — top-level subjects that group the chapter/module lists.
// Content stays fully data-driven: a module declares its track via an optional
// `track` field in its index entry. Absent ⇒ the default thermodynamics track,
// so all existing Cengel content keeps working untouched.

export interface TrackMeta {
  id: string
  /** Heading shown above the track's modules. */
  label: string
  /** Short prefix for the per-module chip, e.g. "Ch" → "Ch 3", "⚡" → "⚡ 1". */
  chip: string
  /** Display order of the track among others. */
  order: number
}

export const DEFAULT_TRACK = 'thermo'

const TRACKS: Record<string, TrackMeta> = {
  thermo: {
    id: 'thermo',
    label: 'Thermodynamics · Cengel Ch 1–8',
    chip: 'Ch',
    order: 0,
  },
  'energy-systems': {
    id: 'energy-systems',
    label: 'Energy Systems & Power Markets',
    chip: '⚡',
    order: 1,
  },
  algebra: {
    id: 'algebra',
    label: 'Algebra & Maths Skills',
    chip: '🔢',
    order: 2,
  },
}

export function trackMeta(track?: string): TrackMeta {
  return TRACKS[track ?? DEFAULT_TRACK] ?? TRACKS[DEFAULT_TRACK]
}

/** Group items by their `track`, returned in track display order. */
export function groupByTrack<T extends { track?: string }>(
  items: T[],
): { meta: TrackMeta; items: T[] }[] {
  const groups = new Map<string, T[]>()
  for (const it of items) {
    const key = it.track ?? DEFAULT_TRACK
    const bucket = groups.get(key)
    if (bucket) bucket.push(it)
    else groups.set(key, [it])
  }
  return [...groups.entries()]
    .map(([key, grouped]) => ({ meta: trackMeta(key), items: grouped }))
    .sort((a, b) => a.meta.order - b.meta.order)
}
