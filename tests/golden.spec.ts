/**
 * Regression net over the whole derivation pipeline, using a real API response
 * captured from `GET /api/v1/capacity-overview?month=2026-08`.
 *
 * The expected numbers were derived independently of this implementation, so
 * this catches the class of mistake synthetic fixtures cannot: a rule that is
 * self-consistently wrong.
 */
import { describe, expect, it } from 'vitest'
import type { CapacityOverviewResponse } from '~/types/api'
import { buildDashboardModel } from '~/utils/capacity/summarise'
import august from './fixtures/august-2026.json' with { type: 'json' }

const response = august as CapacityOverviewResponse
const model = buildDashboardModel(response)

const room = (abbreviation: string, name: string) =>
  model.classrooms.find(
    (summary) => summary.centre.abbreviation === abbreviation && summary.classroom.name === name,
  )!

describe('August 2026, real API response', () => {
  it('reads the reporting month from meta', () => {
    expect(model.meta.month).toBe('2026-08')
    expect(model.meta.effective_on).toBe('2026-08-31')
  })

  it('summarises the portfolio', () => {
    expect(model.portfolio).toMatchObject({
      centreCount: 4,
      classroomCount: 16,
      capacity: 282,
      placesUsed: 92,
      placesAvailable: 192,
      overBy: 2,
      roomsOverCapacity: 2,
      ageMismatchCount: 6,
      unassignedCount: 3,
    })
  })

  // The finding that drove the layout: a comfortable-looking headline number
  // sitting on top of two rooms that are actually over capacity.
  it('shows a low overall utilization alongside genuinely over-subscribed rooms', () => {
    expect(model.portfolio.utilizationPct).toBeCloseTo(32.62, 1)
    expect(model.portfolio.roomsOverCapacity).toBe(2)
    expect(model.portfolio.placesAvailable).toBe(192)
  })

  /**
   * Availability is summed per room, never computed as `capacity - placesUsed`.
   *
   * The naive subtraction gives 190 because it lets the two over-capacity rooms
   * cancel out free space elsewhere. But you cannot seat a child in the negative
   * space of a full room: 192 places are genuinely free, and 2 children are over
   * their room's limit. Both facts are true at once, and collapsing them into a
   * single number is exactly how an operator ends up missing the problem.
   */
  it('sums availability per room instead of netting it against overflow', () => {
    const naive = model.portfolio.capacity - model.portfolio.placesUsed

    expect(naive).toBe(190)
    expect(model.portfolio.placesAvailable).toBe(192)
    expect(model.portfolio.placesAvailable - model.portfolio.overBy).toBe(naive)
  })

  it('counts 104 active children into 92 places, saving 9 by pairing', () => {
    // 105 enrolments in the payload, one of which ended before the snapshot.
    expect(response.enrolments).toHaveLength(105)
    expect(model.portfolio.headcount + model.portfolio.unassignedCount).toBe(104)
    expect(model.portfolio.placesSavedByPairing).toBe(9)
    expect(model.portfolio.headcount - model.portfolio.placesUsed).toBe(9)
  })

  it('identifies the two over-capacity rooms', () => {
    const over = model.exceptions.filter((e) => e.kind === 'over_capacity')
    expect(over.map((e) => `${e.centre.abbreviation}-${e.classroom.name}`).sort()).toEqual([
      'NC-103',
      'WC-301',
    ])
  })

  it('derives NC-103 exactly, including its part-time pairing', () => {
    const summary = room('NC', '103')

    expect(summary.capacity).toBe(10)
    expect(summary.usage).toMatchObject({
      fullTime: 9,
      threeDay: 2,
      twoDay: 1,
      pairedPlaces: 1,
      unpairedPartTime: 1,
      // 9 full-time + max(2, 1) part-time places.
      placesUsed: 11,
      headcount: 12,
    })
    expect(summary.overBy).toBe(1)
    expect(summary.status).toBe('over')
  })

  it('derives WC-301, where two two-day children cannot pair with each other', () => {
    const summary = room('WC', '301')

    expect(summary.usage).toMatchObject({ fullTime: 9, threeDay: 0, twoDay: 2, placesUsed: 11 })
    expect(summary.overBy).toBe(1)
    expect(summary.pairingOpportunity).toEqual({ count: 2, needs: 'three_days_per_week' })
  })

  it('keeps a full room distinct from an over-capacity one', () => {
    const summary = room('NC', '106')

    expect(summary.usage.placesUsed).toBe(30)
    expect(summary.capacity).toBe(30)
    expect(summary.utilizationPct).toBe(100)
    expect(summary.status).toBe('full')
    expect(summary.overBy).toBe(0)
  })

  it('keeps empty rooms visible rather than dropping them', () => {
    const empty = model.classrooms.filter((summary) => summary.status === 'empty')

    expect(empty.map((summary) => summary.classroom.name).sort()).toEqual(['104', '404'])
    expect(empty.every((summary) => summary.utilizationPct === 0)).toBe(true)
  })

  it('finds no data-integrity problems in a real response', () => {
    expect(model.exceptions.filter((e) => e.kind === 'data_integrity')).toEqual([])
  })

  it('ranks the two over-capacity rooms above every other exception', () => {
    expect(model.exceptions.slice(0, 2).every((e) => e.severity === 'critical')).toBe(true)
  })

  it('gives every centre totals that match the sum of its classrooms', () => {
    for (const centre of model.centres) {
      const capacity = centre.classrooms.reduce((sum, r) => sum + r.capacity, 0)
      const used = centre.classrooms.reduce((sum, r) => sum + r.usage.placesUsed, 0)
      expect(centre.capacity).toBe(capacity)
      expect(centre.placesUsed).toBe(used)
    }

    expect(model.centres.reduce((sum, c) => sum + c.capacity, 0)).toBe(model.portfolio.capacity)
    expect(model.centres.reduce((sum, c) => sum + c.placesUsed, 0)).toBe(model.portfolio.placesUsed)
  })

  it('never reports a room as both over capacity and having places available', () => {
    for (const summary of model.classrooms) {
      expect(summary.overBy > 0 && summary.placesAvailable > 0).toBe(false)
    }
  })
})

describe('age group demand, real August response', () => {
  const demand = (label: string) => model.ageGroupDemand.find((entry) => entry.label === label)!

  it('follows the order the API lists age groups in', () => {
    expect(model.ageGroupDemand.map((entry) => entry.ageGroupId)).toEqual(
      response.age_groups.map((group) => group.id),
    )
  })

  it('counts every active child into exactly one age band', () => {
    const total = model.ageGroupDemand.reduce((sum, entry) => sum + entry.children, 0)
    expect(total).toBe(model.portfolio.headcount + model.portfolio.unassignedCount)
  })

  it('counts a room accepting several bands under each of them', () => {
    // 402 accepts baby and toddler, so its 20 places are options for both.
    const roomsAcceptingBaby = response.classrooms.filter((room) =>
      room.accepted_age_group_ids.includes('baby'),
    )
    expect(demand('Baby').placesInAcceptingRooms).toBe(
      roomsAcceptingBaby.reduce((sum, room) => sum + room.capacity, 0),
    )
  })

  it('matches the total mismatches reported by the portfolio', () => {
    const misplaced = model.ageGroupDemand.reduce((sum, entry) => sum + entry.misplaced, 0)
    expect(misplaced).toBe(model.portfolio.ageMismatchCount)
  })

  it('reports no places for a band no room accepts', () => {
    const orphanBands = model.ageGroupDemand.filter(
      (entry) => entry.placesInAcceptingRooms === 0 && entry.children > 0,
    )
    // Every band with children should have somewhere it is allowed to sit.
    expect(orphanBands).toEqual([])
  })
})
