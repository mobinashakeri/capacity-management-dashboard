import { describe, expect, it } from 'vitest'
import { buildDashboardModel, placeEnrolments } from '~/utils/capacity/summarise'
import {
  EFFECTIVE_ON,
  makeCentre,
  makeClassroom,
  makeEnrolment,
  makeEnrolments,
  makeResponse,
} from './fixtures/overview'

const centre = makeCentre({ id: 'centre-1', name: 'North Centre', abbreviation: 'NC' })

/** Builds a one-centre response whose classrooms all belong to `centre`. */
function scenario(classrooms: ReturnType<typeof makeClassroom>[], enrolments = [] as never[]) {
  return makeResponse({ centres: [centre], classrooms, enrolments })
}

describe('placeEnrolments', () => {
  it('places an active enrolment into its assigned classroom', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: room.id })
    const { byClassroom, unassigned } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.get('room-1')).toHaveLength(1)
    expect(unassigned).toHaveLength(0)
  })

  it('excludes an enrolment that ended before the snapshot date', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: room.id, ends_on: '2026-06-30' })
    const { byClassroom, unassigned } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.size).toBe(0)
    // Not active at all, so not an unassigned child either - simply not here.
    expect(unassigned).toHaveLength(0)
  })

  it('excludes an enrolment that has not started yet', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: room.id, starts_on: '2026-09-01' })
    const { byClassroom } = placeEnrolments(scenario([room], [enrolment] as never), EFFECTIVE_ON)

    expect(byClassroom.size).toBe(0)
  })

  it('treats a child with no assignment as unassigned', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: null })
    const { byClassroom, unassigned } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.size).toBe(0)
    expect(unassigned).toHaveLength(1)
    expect(unassigned[0]!.reason).toBe('no_assignment')
  })

  // Enrolment activity and assignment activity are independent.
  it('treats an active enrolment with a finished assignment as unassigned', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({
      assignment: {
        id: 'assignment-x',
        classroom_id: room.id,
        starts_on: '2025-09-01',
        ends_on: '2026-07-31',
      },
    })
    const { byClassroom, unassigned } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.size).toBe(0)
    expect(unassigned[0]!.reason).toBe('assignment_ended')
  })

  it('treats an assignment to an unknown classroom as unassigned and flags it', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: 'room-that-does-not-exist' })
    const { byClassroom, unassigned, issues } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.size).toBe(0)
    expect(unassigned[0]!.reason).toBe('unknown_classroom')
    expect(issues).toHaveLength(1)
  })

  // The chair physically exists in the classroom's centre, so that is where the
  // place is counted - but the disagreement is still reported.
  it('counts a cross-centre placement against the classroom and flags it', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const enrolment = makeEnrolment({ classroomId: room.id, centre_id: 'a-different-centre' })
    const { byClassroom, issues } = placeEnrolments(
      scenario([room], [enrolment] as never),
      EFFECTIVE_ON,
    )

    expect(byClassroom.get('room-1')).toHaveLength(1)
    expect(issues[0]!.id).toContain('cross-centre')
  })
})

describe('buildDashboardModel', () => {
  it('reports availability and utilization for a partly filled room', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const model = buildDashboardModel(
      scenario([room], makeEnrolments(4, { classroomId: room.id }) as never),
    )
    const summary = model.classrooms[0]!

    expect(summary.usage.placesUsed).toBe(4)
    expect(summary.placesAvailable).toBe(6)
    expect(summary.overBy).toBe(0)
    expect(summary.utilizationPct).toBe(40)
    expect(summary.status).toBe('healthy')
  })

  it('floors availability at zero and carries the overflow in overBy', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const model = buildDashboardModel(
      scenario([room], makeEnrolments(11, { classroomId: room.id }) as never),
    )
    const summary = model.classrooms[0]!

    expect(summary.placesAvailable).toBe(0)
    expect(summary.overBy).toBe(1)
    expect(summary.status).toBe('over')
    expect(summary.utilizationPct).toBe(110)
  })

  it('reports n/a rather than dividing by zero for a room with no capacity', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 0 })
    const model = buildDashboardModel(scenario([room]))

    expect(model.classrooms[0]!.utilizationPct).toBeNull()
    expect(model.portfolio.utilizationPct).toBeNull()
  })

  it('keeps an empty room visible at zero percent instead of omitting it', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 12 })
    const model = buildDashboardModel(scenario([room]))

    expect(model.classrooms).toHaveLength(1)
    expect(model.classrooms[0]!.status).toBe('empty')
    expect(model.classrooms[0]!.utilizationPct).toBe(0)
  })

  it('flags a room at or above the near-capacity threshold', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const model = buildDashboardModel(
      scenario([room], makeEnrolments(9, { classroomId: room.id }) as never),
    )

    expect(model.classrooms[0]!.status).toBe('full')
  })

  it('counts an age-group mismatch without excusing the place it occupies', () => {
    const room = makeClassroom({
      id: 'room-1',
      centre_id: centre.id,
      capacity: 10,
      accepted_age_group_ids: ['toddler'],
    })
    const model = buildDashboardModel(
      scenario([room], [makeEnrolment({ classroomId: room.id, ageGroup: 'school' })] as never),
    )
    const summary = model.classrooms[0]!

    expect(summary.ageMismatchCount).toBe(1)
    expect(summary.usage.placesUsed).toBe(1)
    expect(summary.occupants[0]!.ageGroupMatches).toBe(false)
  })

  it('accepts a child whose age group is one of several the room takes', () => {
    const room = makeClassroom({
      id: 'room-1',
      centre_id: centre.id,
      accepted_age_group_ids: ['baby', 'toddler'],
    })
    const model = buildDashboardModel(
      scenario([room], [makeEnrolment({ classroomId: room.id, ageGroup: 'baby' })] as never),
    )

    expect(model.classrooms[0]!.ageMismatchCount).toBe(0)
  })

  it('sums centre totals from its own classrooms', () => {
    const roomA = makeClassroom({ id: 'room-a', centre_id: centre.id, capacity: 10, name: '101' })
    const roomB = makeClassroom({ id: 'room-b', centre_id: centre.id, capacity: 20, name: '102' })
    const model = buildDashboardModel(
      scenario([roomA, roomB], [
        ...makeEnrolments(3, { classroomId: 'room-a' }),
        ...makeEnrolments(5, { classroomId: 'room-b' }),
      ] as never),
    )

    expect(model.centres[0]!.capacity).toBe(30)
    expect(model.centres[0]!.placesUsed).toBe(8)
    expect(model.portfolio.capacity).toBe(30)
    expect(model.portfolio.classroomCount).toBe(2)
  })

  // Spare space in one room must not cancel an overflow in another - that
  // masking is the exact failure the exceptions panel exists to prevent.
  it('does not let spare space in one room offset another room being over', () => {
    const tight = makeClassroom({ id: 'room-a', centre_id: centre.id, capacity: 2, name: '101' })
    const roomy = makeClassroom({ id: 'room-b', centre_id: centre.id, capacity: 50, name: '102' })
    const model = buildDashboardModel(
      scenario([tight, roomy], makeEnrolments(4, { classroomId: 'room-a' }) as never),
    )

    expect(model.portfolio.overBy).toBe(2)
    expect(model.portfolio.placesAvailable).toBe(50)
    expect(model.portfolio.roomsOverCapacity).toBe(1)
  })

  it('records how many places the pairing rule saved', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id, capacity: 10 })
    const model = buildDashboardModel(
      scenario([room], [
        ...makeEnrolments(2, { classroomId: room.id, attendanceType: 'three_days_per_week' }),
        ...makeEnrolments(2, { classroomId: room.id, attendanceType: 'two_days_per_week' }),
      ] as never),
    )

    expect(model.portfolio.headcount).toBe(4)
    expect(model.portfolio.placesUsed).toBe(2)
    expect(model.portfolio.placesSavedByPairing).toBe(2)
  })

  it('lists unassigned children under their own centre', () => {
    const room = makeClassroom({ id: 'room-1', centre_id: centre.id })
    const model = buildDashboardModel(
      scenario([room], [makeEnrolment({ classroomId: null })] as never),
    )

    expect(model.portfolio.unassignedCount).toBe(1)
    expect(model.centres[0]!.unassigned).toHaveLength(1)
    // Unassigned children are shown, but never counted against a room.
    expect(model.classrooms[0]!.usage.placesUsed).toBe(0)
  })

  it('survives a classroom whose centre is missing from the response', () => {
    const orphan = makeClassroom({ id: 'room-x', centre_id: 'centre-that-vanished' })
    const model = buildDashboardModel(scenario([orphan]))

    expect(model.classrooms).toHaveLength(0)
    expect(model.exceptions.some((e) => e.kind === 'data_integrity')).toBe(true)
  })

  it('produces an empty but valid model when the month has no data', () => {
    const model = buildDashboardModel(makeResponse())

    expect(model.classrooms).toHaveLength(0)
    expect(model.centres).toHaveLength(0)
    expect(model.exceptions).toHaveLength(0)
    expect(model.portfolio.capacity).toBe(0)
    expect(model.portfolio.utilizationPct).toBeNull()
  })

  it('sorts classrooms by centre then room name for a stable table', () => {
    const west = makeCentre({ id: 'centre-w', name: 'West Centre', abbreviation: 'WC' })
    const response = makeResponse({
      centres: [west, centre],
      classrooms: [
        makeClassroom({ id: 'r1', centre_id: west.id, name: '302' }),
        makeClassroom({ id: 'r2', centre_id: centre.id, name: '102' }),
        makeClassroom({ id: 'r3', centre_id: west.id, name: '301' }),
        makeClassroom({ id: 'r4', centre_id: centre.id, name: '101' }),
      ],
    })
    const model = buildDashboardModel(response)

    expect(
      model.classrooms.map((room) => `${room.centre.abbreviation}-${room.classroom.name}`),
    ).toEqual(['NC-101', 'NC-102', 'WC-301', 'WC-302'])
  })
})
