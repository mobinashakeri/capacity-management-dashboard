import { describe, expect, it } from 'vitest'
import { toAppError } from '~/utils/api/errors'
import { isIsoMonth, normaliseMonth } from '~/utils/api/month'

/** Mimics the `FetchError` shape `$fetch` rejects with. */
function fetchError(statusCode: number, data?: unknown) {
  return Object.assign(new Error(`HTTP ${statusCode}`), { statusCode, data })
}

describe('toAppError', () => {
  // The real 422 body, as returned for ?month=2025-12.
  it('reads the API wording out of a 422', () => {
    const error = toAppError(
      fetchError(422, {
        message: 'The selected month is invalid.',
        errors: { month: ['The selected month is invalid.'] },
      }),
    )

    expect(error).toEqual({
      kind: 'validation',
      status: 422,
      message: 'The selected month is invalid.',
      monthErrors: ['The selected month is invalid.'],
    })
  })

  it('still classifies a 422 with no usable body as a validation failure', () => {
    const error = toAppError(fetchError(422))

    expect(error.kind).toBe('validation')
    expect(error.message).toBeTruthy()
    expect(error).toMatchObject({ monthErrors: [] })
  })

  it('ignores non-string entries in the month errors', () => {
    const error = toAppError(fetchError(422, { errors: { month: ['bad month', 42, null] } }))

    expect(error).toMatchObject({ monthErrors: ['bad month'] })
  })

  it('falls back to the first month error when the body has no message', () => {
    const error = toAppError(fetchError(422, { errors: { month: ['Pick another month.'] } }))

    expect(error.message).toBe('Pick another month.')
  })

  // The live API lists 2026-01 in available_months but returns 500 for it, so
  // this is reachable in two clicks and must not read as the user's mistake.
  it('classifies a 500 on an advertised month as a server failure', () => {
    const error = toAppError(fetchError(500, { message: 'Server Error' }))

    expect(error.kind).toBe('server')
    expect(error).toMatchObject({ status: 500 })
  })

  it('treats any 5xx as a server failure', () => {
    expect(toAppError(fetchError(503)).kind).toBe('server')
  })

  it('classifies other error statuses as plain http failures', () => {
    const error = toAppError(fetchError(404, { message: 'Not Found' }))

    expect(error).toMatchObject({ kind: 'http', status: 404, message: 'Not Found' })
  })

  it('treats a response-less rejection as a network failure', () => {
    expect(toAppError(new TypeError('Failed to fetch')).kind).toBe('network')
  })

  it('reads a status nested under response', () => {
    expect(toAppError({ response: { status: 500 } }).kind).toBe('server')
  })

  it('reads a body nested under response._data', () => {
    const error = toAppError({
      statusCode: 422,
      response: { _data: { errors: { month: ['Nested body.'] } } },
    })

    expect(error).toMatchObject({ monthErrors: ['Nested body.'] })
  })

  // Failing while handling a failure would leave the UI unable to explain itself.
  it.each([null, undefined, 'a string', 0, [], {}])('never throws on %p', (value) => {
    expect(() => toAppError(value)).not.toThrow()
    expect(toAppError(value).message).toBeTruthy()
  })
})

describe('normaliseMonth', () => {
  it('accepts a well-formed month', () => {
    expect(normaliseMonth('2026-08')).toBe('2026-08')
  })

  it('rejects an impossible month number', () => {
    expect(normaliseMonth('2026-13')).toBeNull()
    expect(normaliseMonth('2026-00')).toBeNull()
  })

  it.each(['2026', '2026-8', 'august', '2026-08-31', ''])('rejects %p', (value) => {
    expect(normaliseMonth(value)).toBeNull()
  })

  it('falls back to null for a missing param', () => {
    expect(normaliseMonth(undefined)).toBeNull()
  })

  // Vue Router hands back an array when a query param is repeated.
  it('takes the first usable entry from a repeated param', () => {
    expect(normaliseMonth(['nonsense', '2026-09'])).toBe('2026-09')
  })

  it('returns null when a repeated param has no usable entry', () => {
    expect(normaliseMonth(['nonsense', '2026-99'])).toBeNull()
  })
})

describe('isIsoMonth', () => {
  it('narrows only well-formed months', () => {
    expect(isIsoMonth('2026-01')).toBe(true)
    expect(isIsoMonth('2026-12')).toBe(true)
    expect(isIsoMonth(202608)).toBe(false)
  })
})
