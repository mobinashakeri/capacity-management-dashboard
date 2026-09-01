/**
 * Fixture builders. Specs describe the situation under test and let these fill
 * in every field the API returns but the assertion doesn't care about.
 */
import type {
  AgeGroupId,
  Assignment,
  AttendanceTypeId,
  CapacityOverviewResponse,
  Centre,
  Classroom,
  Enrolment,
  IsoDate,
} from '~/types/api'

export const EFFECTIVE_ON: IsoDate = '2026-08-31'

let sequence = 0
const nextId = (prefix: string) => `${prefix}-${++sequence}`

export function makeCentre(overrides: Partial<Centre> = {}): Centre {
  const id = overrides.id ?? nextId('centre')
  return { id, name: 'North Centre', abbreviation: 'NC', ...overrides }
}

export function makeClassroom(overrides: Partial<Classroom> = {}): Classroom {
  return {
    id: nextId('classroom'),
    centre_id: 'centre-1',
    name: '101',
    capacity: 10,
    accepted_age_group_ids: ['toddler'],
    ...overrides,
  }
}

interface EnrolmentOptions extends Partial<Omit<Enrolment, 'assignment'>> {
  /** Shorthand: the classroom this child sits in, with an open-ended assignment. */
  classroomId?: string | null
  assignment?: Assignment | null
  attendanceType?: AttendanceTypeId
  ageGroup?: AgeGroupId
}

export function makeEnrolment(options: EnrolmentOptions = {}): Enrolment {
  const {
    classroomId,
    assignment,
    attendanceType = 'full_time',
    ageGroup = 'toddler',
    ...rest
  } = options

  const resolvedAssignment: Assignment | null =
    assignment !== undefined
      ? assignment
      : classroomId === null || classroomId === undefined
        ? null
        : {
            id: nextId('assignment'),
            classroom_id: classroomId,
            starts_on: '2025-09-01',
            ends_on: null,
          }

  const id = rest.id ?? nextId('enrolment')

  return {
    id,
    centre_id: 'centre-1',
    starts_on: '2025-09-01',
    ends_on: null,
    attendance_type: attendanceType,
    age_group: ageGroup,
    child: {
      id: nextId('child'),
      first_name: 'Ada',
      last_name: 'Lovelace',
      date_of_birth: '2024-01-01',
    },
    assignment: resolvedAssignment,
    ...rest,
  }
}

/** `makeEnrolments(3, { attendanceType: 'full_time', classroomId })`. */
export function makeEnrolments(count: number, options: EnrolmentOptions = {}): Enrolment[] {
  return Array.from({ length: count }, () => makeEnrolment(options))
}

export function makeResponse(
  overrides: Partial<CapacityOverviewResponse> = {},
): CapacityOverviewResponse {
  return {
    meta: {
      month: '2026-08',
      effective_on: EFFECTIVE_ON,
      timezone: 'America/Edmonton',
      available_months: ['2026-07', '2026-08', '2026-09'],
    },
    age_groups: [
      { id: 'infant', label: 'Infant' },
      { id: 'baby', label: 'Baby' },
      { id: 'toddler', label: 'Toddler' },
      { id: 'preschool', label: 'Preschool' },
      { id: 'kindergarten', label: 'Kindergarten' },
      { id: 'school', label: 'School' },
    ],
    attendance_types: [
      { id: 'full_time', label: 'Full time', abbreviation: 'FT' },
      { id: 'three_days_per_week', label: 'Three days per week', abbreviation: '3D' },
      { id: 'two_days_per_week', label: 'Two days per week', abbreviation: '2D' },
    ],
    centres: [],
    classrooms: [],
    enrolments: [],
    ...overrides,
  }
}
