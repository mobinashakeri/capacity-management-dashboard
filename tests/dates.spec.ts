import { describe, expect, it } from 'vitest'
import { formatDate, formatMonth, isActiveOn } from '~/utils/capacity/dates'

const EFFECTIVE_ON = '2026-08-31'

describe('isActiveOn', () => {
  it('treats a record spanning the snapshot date as active', () => {
    expect(isActiveOn({ starts_on: '2025-09-01', ends_on: '2027-01-01' }, EFFECTIVE_ON)).toBe(true)
  })

  it('treats a null end date as open-ended', () => {
    expect(isActiveOn({ starts_on: '2025-09-01', ends_on: null }, EFFECTIVE_ON)).toBe(true)
  })

  // The inclusivity decision: a child whose last day *is* the snapshot date
  // still occupies their place on that date.
  it('counts a record ending exactly on the snapshot date as active', () => {
    expect(isActiveOn({ starts_on: '2025-09-01', ends_on: EFFECTIVE_ON }, EFFECTIVE_ON)).toBe(true)
  })

  it('excludes a record that ended the day before', () => {
    expect(isActiveOn({ starts_on: '2025-09-01', ends_on: '2026-08-30' }, EFFECTIVE_ON)).toBe(false)
  })

  it('counts a record starting exactly on the snapshot date as active', () => {
    expect(isActiveOn({ starts_on: EFFECTIVE_ON, ends_on: null }, EFFECTIVE_ON)).toBe(true)
  })

  it('excludes a record that starts the day after', () => {
    expect(isActiveOn({ starts_on: '2026-09-01', ends_on: null }, EFFECTIVE_ON)).toBe(false)
  })

  it('excludes a record whose whole span precedes the snapshot date', () => {
    expect(isActiveOn({ starts_on: '2024-01-01', ends_on: '2024-06-30' }, EFFECTIVE_ON)).toBe(false)
  })

  // Guards the choice to compare strings rather than Date objects: this pair
  // would be ambiguous under any timezone-sensitive parsing.
  it('compares dates lexicographically across a year boundary', () => {
    expect(isActiveOn({ starts_on: '2025-12-31', ends_on: '2026-01-01' }, '2026-01-01')).toBe(true)
    expect(isActiveOn({ starts_on: '2025-12-31', ends_on: '2025-12-31' }, '2026-01-01')).toBe(false)
  })
})

describe('formatMonth', () => {
  it('renders a reporting month for humans', () => {
    expect(formatMonth('2026-08')).toBe('August 2026')
  })

  it('returns the raw value when the month is malformed', () => {
    expect(formatMonth('not-a-month')).toBe('not-a-month')
  })
})

describe('formatDate', () => {
  it('renders a snapshot date for humans', () => {
    expect(formatDate('2026-08-31')).toBe('31 Aug 2026')
  })

  it('returns the raw value when the date is malformed', () => {
    expect(formatDate('31/08/2026')).toBe('31/08/2026')
  })
})
