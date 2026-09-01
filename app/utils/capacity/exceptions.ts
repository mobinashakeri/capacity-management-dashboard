import type { Centre } from '~/types/api'
import type {
  CapacityException,
  ClassroomSummary,
  DataIssue,
  ExceptionSeverity,
  UnassignedEntry,
} from '~/types/domain'

const SEVERITY_RANK: Record<ExceptionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

/** Within a severity, the bigger problem sorts first. */
function magnitudeOf(exception: CapacityException): number {
  switch (exception.kind) {
    case 'over_capacity':
      return exception.overBy
    case 'near_capacity':
      return exception.utilizationPct
    case 'pairing_opportunity':
      return exception.opportunity.count
    default:
      return 0
  }
}

export interface DeriveExceptionsInput {
  classrooms: ClassroomSummary[]
  unassigned: UnassignedEntry[]
  centresById: Map<string, Centre>
  issues: DataIssue[]
}

/**
 * Turns the summarised model into the ranked list of things an operator should
 * act on.
 *
 * The ordering matters more than it looks. On the live data the portfolio sits
 * around a third utilized while two rooms are over capacity, so anyone reading
 * the headline number alone would conclude there is plenty of space. Sorting
 * strictly by severity puts those two rooms at the top of the panel, where the
 * average cannot hide them.
 */
export function deriveExceptions({
  classrooms,
  unassigned,
  centresById,
  issues,
}: DeriveExceptionsInput): CapacityException[] {
  const exceptions: CapacityException[] = []

  for (const room of classrooms) {
    if (room.status === 'over') {
      exceptions.push({
        kind: 'over_capacity',
        severity: 'critical',
        id: `over-${room.classroom.id}`,
        centre: room.centre,
        classroom: room.classroom,
        placesUsed: room.usage.placesUsed,
        capacity: room.capacity,
        overBy: room.overBy,
      })
    }

    // A child in the wrong age band still occupies their place - this is a
    // signal to plan a move, not a reason to stop counting them.
    for (const occupant of room.occupants) {
      if (occupant.ageGroupMatches) continue
      exceptions.push({
        kind: 'age_group_mismatch',
        severity: 'warning',
        id: `mismatch-${occupant.enrolmentId}`,
        centre: room.centre,
        classroom: room.classroom,
        occupant,
        acceptedAgeGroupIds: room.classroom.accepted_age_group_ids,
      })
    }

    if (room.status === 'full' && room.utilizationPct !== null) {
      exceptions.push({
        kind: 'near_capacity',
        severity: 'info',
        id: `near-${room.classroom.id}`,
        centre: room.centre,
        classroom: room.classroom,
        utilizationPct: room.utilizationPct,
        placesAvailable: room.placesAvailable,
      })
    }

    if (room.pairingOpportunity) {
      exceptions.push({
        kind: 'pairing_opportunity',
        severity: 'info',
        id: `pairing-${room.classroom.id}`,
        centre: room.centre,
        classroom: room.classroom,
        opportunity: room.pairingOpportunity,
      })
    }
  }

  for (const entry of unassigned) {
    const centre = centresById.get(entry.enrolment.centre_id)
    if (!centre) continue // Already reported as a data issue by the caller.
    exceptions.push({
      kind: 'unassigned_child',
      severity: 'warning',
      id: `unassigned-${entry.enrolment.id}`,
      centre,
      occupant: entry.occupant,
      reason: entry.reason,
    })
  }

  for (const issue of issues) {
    exceptions.push({
      kind: 'data_integrity',
      severity: 'warning',
      id: issue.id,
      detail: issue.detail,
    })
  }

  return exceptions.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      magnitudeOf(b) - magnitudeOf(a) ||
      // Ties break on id so the panel never reorders between renders.
      a.id.localeCompare(b.id),
  )
}

/** Counts by severity, for the summary line above the attention panel. */
export function countBySeverity(
  exceptions: CapacityException[],
): Record<ExceptionSeverity, number> {
  return exceptions.reduce(
    (counts, exception) => {
      counts[exception.severity]++
      return counts
    },
    { critical: 0, warning: 0, info: 0 } as Record<ExceptionSeverity, number>,
  )
}
