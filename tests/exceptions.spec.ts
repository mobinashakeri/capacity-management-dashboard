import { describe, expect, it } from 'vitest'
import type { CapacityException } from '~/types/domain'
import { countBySeverity } from '~/utils/capacity/exceptions'
import { buildDashboardModel } from '~/utils/capacity/summarise'
import {
  makeCentre,
  makeClassroom,
  makeEnrolment,
  makeEnrolments,
  makeResponse,
} from './fixtures/overview'

const centre = makeCentre({ id: 'centre-1', name: 'North Centre', abbreviation: 'NC' })

function exceptionsFor(
  classrooms: ReturnType<typeof makeClassroom>[],
  enrolments: unknown[] = [],
): CapacityException[] {
  return buildDashboardModel(
    makeResponse({ centres: [centre], classrooms, enrolments: enrolments as never }),
  ).exceptions
}

const kinds = (exceptions: CapacityException[]) => exceptions.map((e) => e.kind)

describe('deriveExceptions', () => {
  it('reports nothing for a healthy dataset', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    expect(exceptionsFor([room], makeEnrolments(4, { classroomId: room.id }))).toEqual([])
  })

  it('raises an over-capacity room as critical with the exact overflow', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const [exception] = exceptionsFor([room], makeEnrolments(13, { classroomId: room.id }))

    expect(exception).toMatchObject({
      kind: 'over_capacity',
      severity: 'critical',
      overBy: 3,
      capacity: 10,
      placesUsed: 13,
    })
  })

  it('raises an age-group mismatch as a warning naming the accepted groups', () => {
    const room = makeClassroom({
      id: 'room-1',
      centre_id: centre.id,
      capacity: 10,
      accepted_age_group_ids: ['infant', 'baby'],
    })
    const exceptions = exceptionsFor(
      [room],
      [makeEnrolment({ classroomId: room.id, ageGroup: 'school' })],
    )
    const mismatch = exceptions.find((e) => e.kind === 'age_group_mismatch')

    expect(mismatch).toMatchObject({
      severity: 'warning',
      acceptedAgeGroupIds: ['infant', 'baby'],
    })
  })

  it('raises an unassigned child with the reason they are unplaced', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const exceptions = exceptionsFor([room], [makeEnrolment({ classroomId: null })])

    expect(exceptions[0]).toMatchObject({
      kind: 'unassigned_child',
      severity: 'warning',
      reason: 'no_assignment',
    })
  })

  it('raises an unknown classroom as both an unassigned child and a data issue', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const exceptions = exceptionsFor([room], [makeEnrolment({ classroomId: 'ghost-room' })])

    expect(kinds(exceptions)).toContain('unassigned_child')
    expect(kinds(exceptions)).toContain('data_integrity')
  })

  it('raises a cross-centre placement as a data issue', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const exceptions = exceptionsFor(
      [room],
      [makeEnrolment({ classroomId: room.id, centre_id: 'elsewhere' })],
    )

    expect(kinds(exceptions)).toContain('data_integrity')
  })

  it('flags a room filling up without calling it over capacity', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const exceptions = exceptionsFor([room], makeEnrolments(9, { classroomId: room.id }))

    expect(kinds(exceptions)).toEqual(['near_capacity'])
    expect(exceptions[0]).toMatchObject({ severity: 'info', placesAvailable: 1 })
  })

  it('surfaces unpaired part-timers as a recruiting opportunity', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const exceptions = exceptionsFor(
      [room],
      makeEnrolments(3, { classroomId: room.id, attendanceType: 'three_days_per_week' }),
    )
    const opportunity = exceptions.find((e) => e.kind === 'pairing_opportunity')

    expect(opportunity).toMatchObject({
      severity: 'info',
      opportunity: { count: 3, needs: 'two_days_per_week' },
    })
  })

  it('orders critical before warning before info', () => {
    const over = makeClassroom({ id: 'room-a', centre_id: centre.id, capacity: 1, name: '101' })
    const near = makeClassroom({ id: 'room-b', centre_id: centre.id, capacity: 10, name: '102' })
    const exceptions = exceptionsFor(
      [over, near],
      [
        ...makeEnrolments(3, { classroomId: 'room-a' }),
        ...makeEnrolments(9, { classroomId: 'room-b' }),
        makeEnrolment({ classroomId: null }),
      ],
    )

    expect(exceptions.map((e) => e.severity)).toEqual(['critical', 'warning', 'info'])
  })

  it('puts the worst over-capacity room first within the critical band', () => {
    const bad = makeClassroom({ id: 'room-a', centre_id: centre.id, capacity: 10, name: '101' })
    const worse = makeClassroom({ id: 'room-b', centre_id: centre.id, capacity: 2, name: '102' })
    const exceptions = exceptionsFor(
      [bad, worse],
      [
        ...makeEnrolments(11, { classroomId: 'room-a' }),
        ...makeEnrolments(9, { classroomId: 'room-b' }),
      ],
    )

    expect(exceptions[0]).toMatchObject({ kind: 'over_capacity', overBy: 7 })
    expect(exceptions[1]).toMatchObject({ kind: 'over_capacity', overBy: 1 })
  })

  it('orders identically across repeated runs', () => {
    const rooms = [
      makeClassroom({ id: 'room-a', centre_id: centre.id, capacity: 5, name: '101' }),
      makeClassroom({ id: 'room-b', centre_id: centre.id, capacity: 5, name: '102' }),
    ]
    const enrolments = [
      ...makeEnrolments(6, { classroomId: 'room-a' }),
      ...makeEnrolments(6, { classroomId: 'room-b' }),
    ]

    expect(exceptionsFor(rooms, enrolments).map((e) => e.id)).toEqual(
      exceptionsFor(rooms, enrolments).map((e) => e.id),
    )
  })
})

describe('countBySeverity', () => {
  it('counts an empty list as all zeroes', () => {
    expect(countBySeverity([])).toEqual({ critical: 0, warning: 0, info: 0 })
  })

  it('tallies each severity band', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 1 })
    const counts = countBySeverity(
      exceptionsFor(
        [room],
        [
          ...makeEnrolments(2, { classroomId: room.id, ageGroup: 'school' }),
          makeEnrolment({ classroomId: null }),
        ],
      ),
    )

    expect(counts.critical).toBe(1)
    expect(counts.warning).toBe(3)
  })
})
