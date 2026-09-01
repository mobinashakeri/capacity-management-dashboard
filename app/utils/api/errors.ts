import type { AppError } from '~/types/errors'

/**
 * Pulls the HTTP status off whatever the fetch layer threw.
 *
 * `$fetch` rejects with a `FetchError` carrying `statusCode`, but the shape
 * differs between transports, so every plausible location is checked rather
 * than assuming one.
 */
function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const candidate = error as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }

  for (const value of [candidate.statusCode, candidate.status, candidate.response?.status]) {
    if (typeof value === 'number' && value > 0) return value
  }

  return undefined
}

/** The parsed response body, when the failure carried one. */
function readBody(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const candidate = error as { data?: unknown; response?: { _data?: unknown } }
  const body = candidate.data ?? candidate.response?._data

  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : undefined
}

function readMessage(body: Record<string, unknown> | undefined): string | undefined {
  return typeof body?.message === 'string' && body.message.trim() ? body.message : undefined
}

/** The `errors.month` array from a 422 body, if it is actually an array of strings. */
function readMonthErrors(body: Record<string, unknown> | undefined): string[] {
  const errors = body?.errors
  if (typeof errors !== 'object' || errors === null) return []

  const month = (errors as { month?: unknown }).month
  if (!Array.isArray(month)) return []

  return month.filter((entry): entry is string => typeof entry === 'string')
}

/**
 * Turns anything the fetch layer throws into one of a handful of states the UI
 * knows how to present and, where possible, recover from.
 *
 * Deliberately never throws: a failure while handling a failure would leave the
 * dashboard with no way to explain itself.
 */
export function toAppError(error: unknown): AppError {
  const status = readStatus(error)
  const body = readBody(error)
  const apiMessage = readMessage(body)

  if (status === undefined) {
    return {
      kind: 'network',
      message: "Couldn't reach the capacity service. Check your connection and try again.",
    }
  }

  if (status === 422) {
    const monthErrors = readMonthErrors(body)
    return {
      kind: 'validation',
      status,
      message: apiMessage ?? monthErrors[0] ?? 'That month is not available.',
      monthErrors,
    }
  }

  if (status >= 500) {
    return {
      kind: 'server',
      status,
      // Reachable from the default view: the live API lists 2026-01 as
      // available but returns 500 for it, which is not the user's mistake.
      message: "The capacity service couldn't return this month's data.",
    }
  }

  return {
    kind: 'http',
    status,
    message: apiMessage ?? `The capacity service responded with an error (${status}).`,
  }
}
