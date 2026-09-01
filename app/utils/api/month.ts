import type { IsoMonth } from '~/types/api'

const ISO_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/

/** True for a well-formed `YYYY-MM` with a real month number. */
export function isIsoMonth(value: unknown): value is IsoMonth {
  return typeof value === 'string' && ISO_MONTH.test(value)
}

/**
 * Reads the month out of a route query value.
 *
 * Returns `null` for anything malformed so a hand-edited URL falls back to the
 * current reporting month rather than sending junk to the API. Vue Router hands
 * back an array when a param is repeated, so the first usable entry wins.
 */
export function normaliseMonth(value: unknown): IsoMonth | null {
  if (Array.isArray(value)) {
    return value.find(isIsoMonth) ?? null
  }
  return isIsoMonth(value) ? value : null
}
