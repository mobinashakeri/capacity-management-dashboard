import type { CapacityOverviewResponse, IsoMonth, Meta } from '~/types/api'
import type { AppError, ViewState } from '~/types/errors'
import { toAppError } from '~/utils/api/errors'
import { normaliseMonth } from '~/utils/api/month'
import { buildDashboardModel } from '~/utils/capacity/summarise'

/**
 * Loads one reporting month and hands back the finished dashboard model.
 *
 * The selected month lives in the `?month=` query param rather than component
 * state, so a view is shareable by URL and the back button works. It is a query
 * param rather than a route segment because the site is statically generated -
 * a path segment would need a prerendered route per month.
 */
export function useCapacityOverview() {
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()

  /** `null` means "whatever the API considers the current reporting month". */
  const selectedMonth = computed<IsoMonth | null>(() => normaliseMonth(route.query.month))

  const { data, error, status, refresh } = useAsyncData<CapacityOverviewResponse>(
    'capacity-overview',
    () =>
      $fetch<CapacityOverviewResponse>('/api/v1/capacity-overview', {
        baseURL: config.public.apiBase,
        query: selectedMonth.value ? { month: selectedMonth.value } : undefined,
      }),
    { watch: [selectedMonth] },
  )

  /**
   * The last successfully loaded meta, kept across failures.
   *
   * `useAsyncData` clears `data` when a request rejects, which would otherwise
   * strip the month list out of the picker at the exact moment the user needs
   * it to recover from a bad month.
   */
  const lastKnownMeta = useState<Meta | null>('capacity-last-meta', () => null)

  watch(
    data,
    (response) => {
      if (response) lastKnownMeta.value = response.meta
    },
    { immediate: true },
  )

  const model = computed(() => (data.value ? buildDashboardModel(data.value) : null))

  const appError = computed<AppError | null>(() => (error.value ? toAppError(error.value) : null))

  const meta = computed(() => data.value?.meta ?? lastKnownMeta.value)
  const availableMonths = computed<IsoMonth[]>(() => meta.value?.available_months ?? [])

  /** The month actually being shown, which may differ from an unset selection. */
  const reportingMonth = computed<IsoMonth | null>(
    () => data.value?.meta.month ?? selectedMonth.value,
  )

  const isPending = computed(() => status.value === 'pending')

  const viewState = computed<ViewState>(() => {
    if (appError.value) return 'error'
    // Keep showing the previous month while the next one loads, so switching
    // months never blanks the screen mid-comparison.
    if (isPending.value) return model.value ? 'refreshing' : 'loading'
    if (!model.value) return 'loading'
    return model.value.classrooms.length === 0 && model.value.centres.length === 0
      ? 'empty'
      : 'ready'
  })

  /** Selecting the current reporting month drops the param instead of pinning it. */
  function selectMonth(month: IsoMonth | null) {
    const query = { ...route.query }

    if (month === null || month === lastKnownMeta.value?.month) delete query.month
    else query.month = month

    return router.replace({ query })
  }

  return {
    model,
    meta,
    error: appError,
    viewState,
    isPending,
    selectedMonth,
    reportingMonth,
    availableMonths,
    selectMonth,
    refresh,
  }
}
