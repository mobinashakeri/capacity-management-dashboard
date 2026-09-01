/**
 * Derived view models. The API returns raw records only - everything in this
 * file is computed by `~/utils/capacity`, and the components render these
 * without doing arithmetic of their own.
 */
import type {
  AgeGroupId,
  AttendanceTypeId,
  Centre,
  Child,
  Classroom,
  Enrolment,
  IsoDate,
  Meta,
} from './api'

/** How a classroom's active enrolments translate into physical places. */
export interface PlaceUsage {
  fullTime: number
  threeDay: number
  twoDay: number
  /** Shared places: one 3-day plus one 2-day child occupy a single place. */
  pairedPlaces: number
  /** Part-timers with no counterpart, each occupying a whole place. */
  unpairedPartTime: number
  /** `fullTime + max(threeDay, twoDay)` - see `countPlaces`. */
  placesUsed: number
  /** Children present. Deliberately differs from `placesUsed` when pairs exist. */
  headcount: number
}

/** One child as shown in a classroom drilldown or an unassigned list. */
export interface Occupant {
  enrolmentId: string
  child: Child
  ageGroup: AgeGroupId
  attendanceType: AttendanceTypeId
  /** False when the child's age group is not accepted by their classroom. */
  ageGroupMatches: boolean
  assignedFrom: IsoDate | null
}

export type ClassroomStatus = 'over' | 'full' | 'healthy' | 'empty'

/**
 * Recruiting `count` children of `needs` type would consume no additional
 * physical places, because each would pair with an existing unpaired part-timer.
 */
export interface PairingOpportunity {
  count: number
  needs: AttendanceTypeId
}

export interface ClassroomSummary {
  classroom: Classroom
  centre: Centre
  usage: PlaceUsage
  capacity: number
  /** Floors at 0; the overflow is carried by `overBy` instead. */
  placesAvailable: number
  overBy: number
  /** `null` when capacity is 0 - rendered as "n/a" rather than a division by zero. */
  utilizationPct: number | null
  status: ClassroomStatus
  occupants: Occupant[]
  ageMismatchCount: number
  pairingOpportunity: PairingOpportunity | null
}

/** Totals shared by the centre and portfolio levels. */
export interface CapacityTotals {
  capacity: number
  placesUsed: number
  placesAvailable: number
  overBy: number
  utilizationPct: number | null
  headcount: number
  roomsOverCapacity: number
  ageMismatchCount: number
}

export interface CentreSummary extends CapacityTotals {
  centre: Centre
  classrooms: ClassroomSummary[]
  /** Enrolled at this centre but not in any classroom on the snapshot date. */
  unassigned: Occupant[]
}

export interface PortfolioSummary extends CapacityTotals {
  centreCount: number
  classroomCount: number
  unassignedCount: number
  /** Places saved by 3-day/2-day pairing across every classroom. */
  placesSavedByPairing: number
}

/** Why an enrolled child isn't occupying a place in any classroom. */
export type UnassignedReason = 'no_assignment' | 'assignment_ended' | 'unknown_classroom'

export interface UnassignedEntry {
  enrolment: Enrolment
  occupant: Occupant
  reason: UnassignedReason
}

/** A record the API returned that could not be placed - surfaced, never dropped. */
export interface DataIssue {
  id: string
  detail: string
}

export interface PlacementResult {
  /** Active enrolments grouped by the classroom they occupy. */
  byClassroom: Map<string, Enrolment[]>
  unassigned: UnassignedEntry[]
  issues: DataIssue[]
}

export type ExceptionSeverity = 'critical' | 'warning' | 'info'

export type CapacityException =
  | {
      kind: 'over_capacity'
      severity: 'critical'
      id: string
      centre: Centre
      classroom: Classroom
      placesUsed: number
      capacity: number
      overBy: number
    }
  | {
      kind: 'age_group_mismatch'
      severity: 'warning'
      id: string
      centre: Centre
      classroom: Classroom
      occupant: Occupant
      acceptedAgeGroupIds: AgeGroupId[]
    }
  | {
      kind: 'unassigned_child'
      severity: 'warning'
      id: string
      centre: Centre
      occupant: Occupant
      reason: UnassignedReason
    }
  | {
      kind: 'data_integrity'
      severity: 'warning'
      id: string
      detail: string
    }
  | {
      kind: 'near_capacity'
      severity: 'info'
      id: string
      centre: Centre
      classroom: Classroom
      utilizationPct: number
      placesAvailable: number
    }
  | {
      kind: 'pairing_opportunity'
      severity: 'info'
      id: string
      centre: Centre
      classroom: Classroom
      opportunity: PairingOpportunity
    }

export interface DashboardModel {
  meta: Meta
  portfolio: PortfolioSummary
  centres: CentreSummary[]
  classrooms: ClassroomSummary[]
  exceptions: CapacityException[]
}
