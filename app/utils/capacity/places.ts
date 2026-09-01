import type { AttendanceTypeId, Enrolment } from '~/types/api'
import type { PairingOpportunity, PlaceUsage } from '~/types/domain'

/**
 * Counts the physical places a set of enrolments consumes.
 *
 * The rules:
 *  - a full-time enrolment consumes one place;
 *  - one three-day and one two-day enrolment may share a place;
 *  - an unpaired part-time enrolment still consumes a whole place.
 *
 * Pairing as many part-timers as possible gives:
 *
 *     paired   = min(T3, T2)
 *     unpaired = (T3 - paired) + (T2 - paired) = |T3 - T2|
 *     used     = F + paired + unpaired = F + max(T3, T2)
 *
 * This greedy pairing is not a heuristic - it is exactly optimal. Every pair
 * removes exactly one place from the total and at most `min(T3, T2)` pairs can
 * be formed, so no other arrangement can do better than `F + max(T3, T2)`.
 *
 * Worked edge case: 3 three-day + 1 two-day forms one pair and leaves two
 * unpaired three-day children, so 1 + 2 = 3 places - which is `max(3, 1)`.
 *
 * An unrecognised attendance type is counted as a full place. That is the
 * conservative direction: it can overstate pressure on a room, never hide it.
 */
export function countPlaces(enrolments: readonly Enrolment[]): PlaceUsage {
  let fullTime = 0
  let threeDay = 0
  let twoDay = 0

  for (const enrolment of enrolments) {
    switch (enrolment.attendance_type) {
      case 'three_days_per_week':
        threeDay++
        break
      case 'two_days_per_week':
        twoDay++
        break
      default:
        fullTime++
    }
  }

  const pairedPlaces = Math.min(threeDay, twoDay)
  const unpairedPartTime = Math.abs(threeDay - twoDay)

  return {
    fullTime,
    threeDay,
    twoDay,
    pairedPlaces,
    unpairedPartTime,
    placesUsed: fullTime + pairedPlaces + unpairedPartTime,
    headcount: enrolments.length,
  }
}

/**
 * The actionable read on unpaired part-timers: how many children of which type
 * could be enrolled without consuming a single additional physical place.
 *
 * Two unpaired three-day children means two two-day children fit for free.
 */
export function findPairingOpportunity(usage: PlaceUsage): PairingOpportunity | null {
  if (usage.unpairedPartTime === 0) return null

  const needs: AttendanceTypeId =
    usage.threeDay > usage.twoDay ? 'two_days_per_week' : 'three_days_per_week'

  return { count: usage.unpairedPartTime, needs }
}
