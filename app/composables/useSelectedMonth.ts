import type { IsoMonth } from '~/types/api'
import { normaliseMonth } from '~/utils/api/month'

/**
 * The reporting month, held in the `?month=` query param.
 *
 * The URL owns it rather than component state, so a view is shareable and the
 * back button steps through months. It is a query param rather than a route
 * segment because the site is statically generated - a path segment would need
 * a prerendered route per month.
 */
export function useSelectedMonth() {
  const route = useRoute()
  const router = useRouter()

  /** `null` means "whatever the API considers the current reporting month". */
  const selectedMonth = computed<IsoMonth | null>(() => normaliseMonth(route.query.month))

  /** Passing `null` drops the parameter instead of pinning a month. */
  function setMonth(month: IsoMonth | null) {
    const query = { ...route.query }

    if (month === null) delete query.month
    else query.month = month

    return router.replace({ query })
  }

  return { selectedMonth, setMonth }
}
