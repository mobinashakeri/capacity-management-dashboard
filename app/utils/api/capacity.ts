import type { CapacityOverviewResponse, IsoMonth } from '~/types/api'

export const CAPACITY_OVERVIEW_PATH = '/api/v1/capacity-overview'

export interface CapacityOverviewQuery {
  month: IsoMonth
}

/**
 * The query string the endpoint expects.
 *
 * `month` is omitted entirely rather than sent empty: the API treats a missing
 * parameter as "the current reporting month", and sending `month=` would be a
 * different request.
 */
export function capacityOverviewQuery(month: IsoMonth | null): CapacityOverviewQuery | undefined {
  return month ? { month } : undefined
}

/**
 * The slice of `$fetch` this module needs.
 *
 * Declared structurally rather than imported, so this file stays free of Nuxt
 * and its tests need no harness — the caller passes `$fetch` in.
 */
export type CapacityFetcher = <T>(
  path: string,
  options: { baseURL: string; query?: CapacityOverviewQuery },
) => Promise<T>

/** Requests one reporting month. Rejections are normalised by `toAppError`. */
export function fetchCapacityOverview(
  fetcher: CapacityFetcher,
  baseURL: string,
  month: IsoMonth | null,
): Promise<CapacityOverviewResponse> {
  return fetcher<CapacityOverviewResponse>(CAPACITY_OVERVIEW_PATH, {
    baseURL,
    query: capacityOverviewQuery(month),
  })
}
