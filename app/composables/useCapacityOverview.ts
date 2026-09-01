import type { CapacityOverviewResponse, IsoMonth, Meta } from '~/types/api'
import type { AppError, ViewState } from '~/types/errors'
import { fetchCapacityOverview } from '~/utils/api/capacity'
import { toAppError } from '~/utils/api/errors'
import { buildDashboardModel } from '~/utils/capacity/summarise'

/**
 * Loads the selected reporting month and hands back the finished dashboard
 * model, plus a single view state for the UI to switch on.
 *
 * Which month is selected belongs to `useSelectedMonth`, and how the request is
 * addressed belongs to `utils/api/capacity` - this composable only joins them
 * to the async state and the derivation.
 */
export function useCapacityOverview() {
  const config = useRuntimeConfig()
  const { selectedMonth, setMonth } = useSelectedMonth()

  const { data, error, status, refresh } = useAsyncData<CapacityOverviewResponse>(
    'capacity-overview',
    () => fetchCapacityOverview($fetch, config.public.apiBase, selectedMonth.value),
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

  /**
   * Choosing the month the API already defaults to drops the parameter rather
   * than pinning it, so the shared URL keeps following the current month.
   */
  function selectMonth(month: IsoMonth | null) {
    return setMonth(month === lastKnownMeta.value?.month ? null : month)
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
