import { describe, expect, it } from 'vitest'
import { countPlaces, findPairingOpportunity } from '~/utils/capacity/places'
import { makeEnrolment, makeEnrolments } from './fixtures/overview'

const full = (n: number) => makeEnrolments(n, { attendanceType: 'full_time' })
const threeDay = (n: number) => makeEnrolments(n, { attendanceType: 'three_days_per_week' })
const twoDay = (n: number) => makeEnrolments(n, { attendanceType: 'two_days_per_week' })

describe('countPlaces', () => {
  it('counts nothing for an empty room', () => {
    const usage = countPlaces([])
    expect(usage.placesUsed).toBe(0)
    expect(usage.headcount).toBe(0)
  })

  it('gives every full-time enrolment its own place', () => {
    expect(countPlaces(full(3)).placesUsed).toBe(3)
  })

  // The core rule: a three-day and a two-day child share one physical place.
  it('pairs one three-day with one two-day into a single place', () => {
    const usage = countPlaces([...threeDay(1), ...twoDay(1)])
    expect(usage.placesUsed).toBe(1)
    expect(usage.pairedPlaces).toBe(1)
    expect(usage.unpairedPartTime).toBe(0)
    // Two children, one place - the distinction the dashboard has to show.
    expect(usage.headcount).toBe(2)
  })

  it('pairs part-timers off evenly when the counts match', () => {
    expect(countPlaces([...threeDay(2), ...twoDay(2)]).placesUsed).toBe(2)
  })

  // 1 pair + 2 leftover three-day children, each taking a whole place.
  it('gives leftover three-day children a whole place each', () => {
    const usage = countPlaces([...threeDay(3), ...twoDay(1)])
    expect(usage.placesUsed).toBe(3)
    expect(usage.pairedPlaces).toBe(1)
    expect(usage.unpairedPartTime).toBe(2)
  })

  it('gives leftover two-day children a whole place each', () => {
    const usage = countPlaces([...threeDay(1), ...twoDay(3)])
    expect(usage.placesUsed).toBe(3)
    expect(usage.unpairedPartTime).toBe(2)
  })

  it('never pairs a part-timer with a full-time enrolment', () => {
    expect(countPlaces([...full(2), ...threeDay(1)]).placesUsed).toBe(3)
  })

  it('gives a lone part-timer a whole place', () => {
    expect(countPlaces(threeDay(1)).placesUsed).toBe(1)
    expect(countPlaces(twoDay(1)).placesUsed).toBe(1)
  })

  it('reports headcount separately from places whenever pairs exist', () => {
    const usage = countPlaces([...full(9), ...threeDay(2), ...twoDay(1)])
    expect(usage.headcount).toBe(12)
    expect(usage.placesUsed).toBe(11)
  })

  // Never under-report pressure on a room because of an unexpected value.
  it('counts an unrecognised attendance type as a full place', () => {
    const odd = makeEnrolment({
      attendanceType: 'four_days_per_week' as never,
    })
    expect(countPlaces([odd]).placesUsed).toBe(1)
  })

  it('always yields whole places, never a fraction', () => {
    const usage = countPlaces([...threeDay(5), ...twoDay(2), ...full(1)])
    expect(Number.isInteger(usage.placesUsed)).toBe(true)
    expect(usage.placesUsed).toBe(6)
  })
})

describe('findPairingOpportunity', () => {
  it('reports nothing when part-timers are fully paired', () => {
    expect(findPairingOpportunity(countPlaces([...threeDay(2), ...twoDay(2)]))).toBeNull()
  })

  it('reports nothing for a room of full-time children', () => {
    expect(findPairingOpportunity(countPlaces(full(4)))).toBeNull()
  })

  it('asks for two-day children when three-day children are spare', () => {
    const opportunity = findPairingOpportunity(countPlaces([...threeDay(3), ...twoDay(1)]))
    expect(opportunity).toEqual({ count: 2, needs: 'two_days_per_week' })
  })

  it('asks for three-day children when two-day children are spare', () => {
    const opportunity = findPairingOpportunity(countPlaces([...threeDay(1), ...twoDay(3)]))
    expect(opportunity).toEqual({ count: 2, needs: 'three_days_per_week' })
  })
})
