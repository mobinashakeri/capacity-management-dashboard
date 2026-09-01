/**
 * Types mirroring the `/api/v1/capacity-overview` response exactly as the API
 * returns it. Nothing derived lives here - see `~/types/domain` for the view
 * models the UI actually renders.
 */

/** Calendar date, `YYYY-MM-DD`. Compared lexicographically, never parsed. */
export type IsoDate = string
/** Reporting month, `YYYY-MM`. */
export type IsoMonth = string

export type AgeGroupId = 'infant' | 'baby' | 'toddler' | 'preschool' | 'kindergarten' | 'school'

export type AttendanceTypeId = 'full_time' | 'three_days_per_week' | 'two_days_per_week'

export interface Meta {
  month: IsoMonth
  /** The snapshot date capacity is evaluated on - observed to be month-end. */
  effective_on: IsoDate
  /** Display only. Dates are plain calendar strings, so no conversion is needed. */
  timezone: string
  available_months: IsoMonth[]
}

export interface AgeGroup {
  id: AgeGroupId
  label: string
}

export interface AttendanceType {
  id: AttendanceTypeId
  label: string
  abbreviation: string
}

export interface Centre {
  id: string
  name: string
  abbreviation: string
}

export interface Classroom {
  id: string
  centre_id: string
  name: string
  /** Physical places, not headcount - a shared 3-day/2-day pair occupies one. */
  capacity: number
  accepted_age_group_ids: AgeGroupId[]
}

export interface Child {
  id: string
  first_name: string
  last_name: string
  date_of_birth: IsoDate
}

export interface Assignment {
  id: string
  classroom_id: string
  starts_on: IsoDate
  /** `null` means open-ended. */
  ends_on: IsoDate | null
}

export interface Enrolment {
  id: string
  centre_id: string
  starts_on: IsoDate
  ends_on: IsoDate | null
  attendance_type: AttendanceTypeId
  /** Server-derived from the child's date of birth for this reporting month. */
  age_group: AgeGroupId
  child: Child
  /** `null` when the child is enrolled but not placed in a classroom. */
  assignment: Assignment | null
}

export interface CapacityOverviewResponse {
  meta: Meta
  age_groups: AgeGroup[]
  attendance_types: AttendanceType[]
  centres: Centre[]
  classrooms: Classroom[]
  enrolments: Enrolment[]
}

/** Body returned with HTTP 422 for a month the API rejects. */
export interface ValidationErrorResponse {
  message: string
  errors: { month: string[] }
}

/** The minimum shape the date helpers need: anything with a start and an end. */
export interface DateBounded {
  starts_on: IsoDate
  ends_on: IsoDate | null
}
