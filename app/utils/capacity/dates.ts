import type { DateBounded, IsoDate, IsoMonth } from '~/types/api'

/**
 * Capacity is evaluated as a point-in-time snapshot on `meta.effective_on`,
 * not as an overlap with the reporting month.
 *
 * A physical place can only be occupied by one child at a time: a child who
 * leaves on the 3rd and one who starts on the 5th never need the same chair,
 * so counting both would overstate occupancy. `meta.effective_on` exists
 * precisely to name that snapshot date - under overlap semantics it would be
 * redundant.
 *
 * `ends_on` is treated as **inclusive**: a date-only "ends on" means the last
 * day attended.
 *
 * Dates are compared as `YYYY-MM-DD` strings, which sort lexicographically in
 * chronological order. No `Date` objects are constructed anywhere, so there is
 * no timezone or DST drift - `meta.timezone` is for display only.
 */
export function isActiveOn(record: DateBounded, effectiveOn: IsoDate): boolean {
  if (record.starts_on > effectiveOn) return false
  return record.ends_on === null || record.ends_on >= effectiveOn
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `2026-08` -> `August 2026`. Falls back to the raw value if unparseable. */
export function formatMonth(month: IsoMonth): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return month
  return MONTH_LABEL.format(new Date(`${month}-01T00:00:00Z`))
}

const DATE_LABEL = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `2026-08-31` -> `31 Aug 2026`. Falls back to the raw value if unparseable. */
export function formatDate(date: IsoDate): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return DATE_LABEL.format(new Date(`${date}T00:00:00Z`))
}
