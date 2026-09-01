import type { Child } from '~/types/api'
import type { LabelLookup } from '~/types/domain'

/** `three_days_per_week` -> `Three days per week`, for ids the API didn't label. */
function humanise(id: string): string {
  const words = id.replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id
}

export function ageGroupLabel(labels: LabelLookup, id: string): string {
  return labels.ageGroups[id] ?? humanise(id)
}

export function attendanceLabel(labels: LabelLookup, id: string): string {
  return labels.attendanceTypes[id]?.label ?? humanise(id)
}

/** Short form for table chips, e.g. `FT`, `3D`, `2D`. */
export function attendanceAbbreviation(labels: LabelLookup, id: string): string {
  return labels.attendanceTypes[id]?.abbreviation ?? humanise(id)
}

/** Whole numbers where exact, one decimal where not - never a float artefact. */
export function formatPercent(value: number | null): string {
  if (value === null) return 'n/a'
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function childName(child: Child): string {
  return `${child.first_name} ${child.last_name}`.trim()
}

/**
 * The sentence a screen reader hears for a capacity bar. Colour and bar length
 * are never the only carriers of this information.
 */
export function capacityDescription(placesUsed: number, capacity: number): string {
  if (capacity <= 0) return `${pluralise(placesUsed, 'place')} used, no capacity recorded`
  const base = `${placesUsed} of ${pluralise(capacity, 'place')} used`
  if (placesUsed > capacity) return `${base}, over capacity by ${placesUsed - capacity}`
  return base
}
