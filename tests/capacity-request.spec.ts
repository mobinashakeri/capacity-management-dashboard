import { describe, expect, it, vi } from 'vitest'
import type { CapacityOverviewResponse } from '~/types/api'
import {
  CAPACITY_OVERVIEW_PATH,
  capacityOverviewQuery,
  fetchCapacityOverview,
} from '~/utils/api/capacity'

const BASE = 'https://capacity.example.test'

/** Stands in for `$fetch`, recording how it was called. */
function stubFetcher(result: unknown = {}) {
  return vi.fn(() => Promise.resolve(result as CapacityOverviewResponse))
}

describe('capacityOverviewQuery', () => {
  // Sending `month=` is a different request from sending nothing: the API reads
  // a missing parameter as "the current reporting month".
  it('omits the parameter entirely for the current month', () => {
    expect(capacityOverviewQuery(null)).toBeUndefined()
  })

  it('sends the month when one is selected', () => {
    expect(capacityOverviewQuery('2026-08')).toEqual({ month: '2026-08' })
  })
})

describe('fetchCapacityOverview', () => {
  it('requests the documented path', async () => {
    const fetcher = stubFetcher()
    await fetchCapacityOverview(fetcher, BASE, '2026-08')

    expect(CAPACITY_OVERVIEW_PATH).toBe('/api/v1/capacity-overview')
    expect(fetcher).toHaveBeenCalledWith(CAPACITY_OVERVIEW_PATH, expect.anything())
  })

  it('sends the base URL it is given rather than a hardcoded host', async () => {
    const fetcher = stubFetcher()
    await fetchCapacityOverview(fetcher, BASE, null)

    expect(fetcher).toHaveBeenCalledWith(
      CAPACITY_OVERVIEW_PATH,
      expect.objectContaining({ baseURL: BASE }),
    )
  })

  it('carries the selected month through to the query', async () => {
    const fetcher = stubFetcher()
    await fetchCapacityOverview(fetcher, BASE, '2026-12')

    expect(fetcher).toHaveBeenCalledWith(
      CAPACITY_OVERVIEW_PATH,
      expect.objectContaining({ query: { month: '2026-12' } }),
    )
  })

  it('asks for the current month with no query at all', async () => {
    const fetcher = stubFetcher()
    await fetchCapacityOverview(fetcher, BASE, null)

    expect(fetcher).toHaveBeenCalledWith(
      CAPACITY_OVERVIEW_PATH,
      expect.objectContaining({ query: undefined }),
    )
  })

  it('returns the response untouched, leaving derivation to the model', async () => {
    const payload = { meta: { month: '2026-08' } }
    const fetcher = stubFetcher(payload)

    await expect(fetchCapacityOverview(fetcher, BASE, '2026-08')).resolves.toBe(payload)
  })

  it('lets a rejection through for the error normaliser to classify', async () => {
    const boom = Object.assign(new Error('HTTP 422'), { statusCode: 422 })
    const fetcher = vi.fn(() => Promise.reject(boom))

    await expect(fetchCapacityOverview(fetcher, BASE, '2025-12')).rejects.toBe(boom)
  })
})
