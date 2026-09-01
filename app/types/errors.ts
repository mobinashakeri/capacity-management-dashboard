/**
 * Normalised failure states.
 *
 * The API fails in genuinely different ways that call for different responses
 * from the user, so components switch on `kind` and never inspect a raw
 * `FetchError`:
 *
 *  - `validation` - the month was rejected (422). The user picked something
 *    invalid and can pick again.
 *  - `server` - the month is listed in `available_months` but the API cannot
 *    serve it (the live `2026-01` returns 500). Not the user's mistake, and
 *    retrying is worth offering.
 *  - `http` - any other unexpected status.
 *  - `network` - the request never got a response at all.
 */
export type AppError =
  | {
      kind: 'validation'
      status: number
      message: string
      /** The API's own wording, e.g. "The selected month is invalid." */
      monthErrors: string[]
    }
  | { kind: 'server'; status: number; message: string }
  | { kind: 'http'; status: number; message: string }
  | { kind: 'network'; message: string }

/** What the dashboard is doing right now, as a single value the UI can switch on. */
export type ViewState =
  /** First load: nothing to show yet. */
  | 'loading'
  /** A month switch is in flight while previous data stays on screen. */
  | 'refreshing'
  | 'error'
  /** Loaded successfully, but the month genuinely has no centres or classrooms. */
  | 'empty'
  | 'ready'
