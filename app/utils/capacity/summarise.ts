import type { CapacityOverviewResponse, Centre, Classroom, Enrolment, IsoDate } from '~/types/api'
import type {
  CapacityTotals,
  CentreSummary,
  ClassroomStatus,
  ClassroomSummary,
  DashboardModel,
  DataIssue,
  Occupant,
  PlacementResult,
  PortfolioSummary,
  UnassignedEntry,
} from '~/types/domain'
import { NEAR_CAPACITY_THRESHOLD } from './constants'
import { isActiveOn } from './dates'
import { countPlaces, findPairingOpportunity } from './places'
import { deriveExceptions } from './exceptions'

function toOccupant(enrolment: Enrolment, classroom: Classroom | null): Occupant {
  return {
    enrolmentId: enrolment.id,
    child: enrolment.child,
    ageGroup: enrolment.age_group,
    attendanceType: enrolment.attendance_type,
    // An unplaced child has no room to mismatch against.
    ageGroupMatches: classroom
      ? classroom.accepted_age_group_ids.includes(enrolment.age_group)
      : true,
    assignedFrom: enrolment.assignment?.starts_on ?? null,
  }
}

/**
 * Decides, for every enrolment active on the snapshot date, whether it occupies
 * a classroom place or counts as unassigned.
 *
 * Enrolment activity and assignment activity are evaluated independently: a
 * child whose enrolment continues but whose assignment has ended is unassigned,
 * not an occupant. Assignments pointing at an unknown classroom are treated the
 * same way and additionally raised as a data issue - the brief is explicit that
 * unassigned children must be visible but must not count against any room.
 */
export function placeEnrolments(
  response: CapacityOverviewResponse,
  effectiveOn: IsoDate,
): PlacementResult {
  const classroomsById = new Map(response.classrooms.map((room) => [room.id, room]))
  const byClassroom = new Map<string, Enrolment[]>()
  const unassigned: UnassignedEntry[] = []
  const issues: DataIssue[] = []

  for (const enrolment of response.enrolments) {
    if (!isActiveOn(enrolment, effectiveOn)) continue

    const { assignment } = enrolment

    if (!assignment) {
      unassigned.push({
        enrolment,
        occupant: toOccupant(enrolment, null),
        reason: 'no_assignment',
      })
      continue
    }

    if (!isActiveOn(assignment, effectiveOn)) {
      unassigned.push({
        enrolment,
        occupant: toOccupant(enrolment, null),
        reason: 'assignment_ended',
      })
      continue
    }

    const classroom = classroomsById.get(assignment.classroom_id)

    if (!classroom) {
      unassigned.push({
        enrolment,
        occupant: toOccupant(enrolment, null),
        reason: 'unknown_classroom',
      })
      issues.push({
        id: `unknown-classroom-${enrolment.id}`,
        detail: `${enrolment.child.first_name} ${enrolment.child.last_name} is assigned to classroom ${assignment.classroom_id}, which is not in this month's data.`,
      })
      continue
    }

    // The place is physically in the classroom's centre, so that is where it is
    // counted even when the enrolment names a different centre.
    if (classroom.centre_id !== enrolment.centre_id) {
      issues.push({
        id: `cross-centre-${enrolment.id}`,
        detail: `${enrolment.child.first_name} ${enrolment.child.last_name} is enrolled at one centre but placed in ${classroom.name}, which belongs to another. Counted against ${classroom.name}.`,
      })
    }

    const existing = byClassroom.get(classroom.id)
    if (existing) existing.push(enrolment)
    else byClassroom.set(classroom.id, [enrolment])
  }

  return { byClassroom, unassigned, issues }
}

/**
 * Utilization as a percentage, or `null` when there is no capacity to divide by
 * - rendered as "n/a" rather than `Infinity` or `NaN`.
 *
 * Rounded to two decimals because binary floating point turns 11/10 into
 * 110.00000000000001, which would otherwise reach the screen. Two decimals is
 * far finer than the display needs while still ordering rooms unambiguously
 * when the table is sorted by utilization.
 */
function utilization(placesUsed: number, capacity: number): number | null {
  if (capacity <= 0) return null
  return Math.round((placesUsed / capacity) * 10000) / 100
}

function classroomStatus(placesUsed: number, capacity: number): ClassroomStatus {
  if (placesUsed > capacity) return 'over'
  if (placesUsed === 0) return 'empty'
  const pct = utilization(placesUsed, capacity)
  if (pct !== null && pct >= NEAR_CAPACITY_THRESHOLD) return 'full'
  return 'healthy'
}

function summariseClassroom(
  classroom: Classroom,
  centre: Centre,
  occupantEnrolments: Enrolment[],
): ClassroomSummary {
  const usage = countPlaces(occupantEnrolments)
  const capacity = classroom.capacity
  const overBy = Math.max(0, usage.placesUsed - capacity)
  const occupants = occupantEnrolments.map((enrolment) => toOccupant(enrolment, classroom))

  return {
    classroom,
    centre,
    usage,
    capacity,
    // Availability floors at zero; the overflow is carried by `overBy` so an
    // over-subscribed room never reports negative space.
    placesAvailable: Math.max(0, capacity - usage.placesUsed),
    overBy,
    utilizationPct: utilization(usage.placesUsed, capacity),
    status: classroomStatus(usage.placesUsed, capacity),
    occupants,
    ageMismatchCount: occupants.filter((occupant) => !occupant.ageGroupMatches).length,
    pairingOpportunity: findPairingOpportunity(usage),
  }
}

function totalsOf(classrooms: ClassroomSummary[]): CapacityTotals {
  const capacity = classrooms.reduce((sum, room) => sum + room.capacity, 0)
  const placesUsed = classrooms.reduce((sum, room) => sum + room.usage.placesUsed, 0)

  return {
    capacity,
    placesUsed,
    // Summed per room, so unused space in one room never cancels an overflow in
    // another - that masking is exactly what the exceptions panel exists to stop.
    placesAvailable: classrooms.reduce((sum, room) => sum + room.placesAvailable, 0),
    overBy: classrooms.reduce((sum, room) => sum + room.overBy, 0),
    utilizationPct: utilization(placesUsed, capacity),
    headcount: classrooms.reduce((sum, room) => sum + room.usage.headcount, 0),
    roomsOverCapacity: classrooms.filter((room) => room.status === 'over').length,
    ageMismatchCount: classrooms.reduce((sum, room) => sum + room.ageMismatchCount, 0),
  }
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)

/**
 * Turns one raw API response into everything the dashboard renders.
 *
 * Pure and framework-free by design: it takes plain data and returns plain
 * data, so the whole derivation can be unit-tested without mounting a component
 * or standing up Nuxt.
 */
export function buildDashboardModel(response: CapacityOverviewResponse): DashboardModel {
  const effectiveOn = response.meta.effective_on
  const centresById = new Map(response.centres.map((centre) => [centre.id, centre]))
  const { byClassroom, unassigned, issues } = placeEnrolments(response, effectiveOn)

  const classrooms: ClassroomSummary[] = []
  const orphanedRooms: DataIssue[] = []

  for (const classroom of response.classrooms) {
    const centre = centresById.get(classroom.centre_id)

    if (!centre) {
      orphanedRooms.push({
        id: `unknown-centre-${classroom.id}`,
        detail: `Classroom ${classroom.name} belongs to centre ${classroom.centre_id}, which is not in this month's data.`,
      })
      continue
    }

    classrooms.push(summariseClassroom(classroom, centre, byClassroom.get(classroom.id) ?? []))
  }

  classrooms.sort((a, b) => byName(a.centre, b.centre) || byName(a.classroom, b.classroom))

  const unassignedByCentre = new Map<string, Occupant[]>()
  const orphanedChildren: DataIssue[] = []

  for (const entry of unassigned) {
    const centreId = entry.enrolment.centre_id
    if (!centresById.has(centreId)) {
      orphanedChildren.push({
        id: `unknown-centre-child-${entry.enrolment.id}`,
        detail: `${entry.enrolment.child.first_name} ${entry.enrolment.child.last_name} is enrolled at centre ${centreId}, which is not in this month's data.`,
      })
      continue
    }
    const list = unassignedByCentre.get(centreId)
    if (list) list.push(entry.occupant)
    else unassignedByCentre.set(centreId, [entry.occupant])
  }

  const centres: CentreSummary[] = response.centres
    .map((centre) => {
      const centreClassrooms = classrooms.filter((room) => room.centre.id === centre.id)
      return {
        centre,
        classrooms: centreClassrooms,
        unassigned: unassignedByCentre.get(centre.id) ?? [],
        ...totalsOf(centreClassrooms),
      }
    })
    .sort((a, b) => byName(a.centre, b.centre))

  const portfolioTotals = totalsOf(classrooms)
  const portfolio: PortfolioSummary = {
    ...portfolioTotals,
    centreCount: response.centres.length,
    classroomCount: classrooms.length,
    unassignedCount: unassigned.length,
    // Each shared place is one place the pairing rule saved.
    placesSavedByPairing: classrooms.reduce((sum, room) => sum + room.usage.pairedPlaces, 0),
  }

  return {
    meta: response.meta,
    labels: {
      ageGroups: Object.fromEntries(response.age_groups.map((group) => [group.id, group.label])),
      attendanceTypes: Object.fromEntries(
        response.attendance_types.map((type) => [
          type.id,
          { label: type.label, abbreviation: type.abbreviation },
        ]),
      ),
    },
    portfolio,
    centres,
    classrooms,
    exceptions: deriveExceptions({
      classrooms,
      unassigned,
      centresById,
      issues: [...issues, ...orphanedRooms, ...orphanedChildren],
    }),
  }
}
