<script setup lang="ts">
import type { AgeGroupDemand } from '~/types/domain'
import { AXIS_LABEL_STYLE, BASE_CHART_OPTIONS, CHART_COLORS } from '~/utils/chart-theme'
import { pluralise } from '~/utils/capacity/format'

const props = defineProps<{ demand: AgeGroupDemand[] }>()

/** Loaded on demand - see the note in CentreUtilizationChart. */
const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

/**
 * The "where could this child go" chart.
 *
 * Age-band fit, not attendance mix, is what actually constrains this data - it
 * produces the largest group of warnings every month. Putting children per band
 * beside the places in rooms that accept that band shows at a glance which
 * moves are even possible.
 */
const series = computed(() => [
  { name: 'Children', data: props.demand.map((entry) => entry.children) },
  {
    name: 'Places in accepting rooms',
    data: props.demand.map((entry) => entry.placesInAcceptingRooms),
  },
])

const options = computed(() => ({
  ...BASE_CHART_OPTIONS,
  chart: { ...BASE_CHART_OPTIONS.chart, type: 'bar' as const },
  colors: [CHART_COLORS.ink, CHART_COLORS.available],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
  xaxis: {
    categories: props.demand.map((entry) => entry.label),
    labels: { ...AXIS_LABEL_STYLE, rotate: -45, trim: true, hideOverlappingLabels: false },
    axisBorder: { color: CHART_COLORS.line },
    axisTicks: { color: CHART_COLORS.line },
  },
  yaxis: { labels: AXIS_LABEL_STYLE },
  tooltip: {
    ...BASE_CHART_OPTIONS.tooltip,
    // ApexCharts types `opts` as optional, so the series index is read defensively.
    y: {
      formatter: (value: number, opts?: { seriesIndex?: number }) =>
        opts?.seriesIndex === 0 ? pluralise(value, 'child', 'children') : pluralise(value, 'place'),
    },
  },
}))

const summary = computed(() =>
  props.demand
    .map(
      (entry) =>
        `${entry.label}: ${pluralise(entry.children, 'child', 'children')}, ${entry.placesInAcceptingRooms} places in rooms accepting this group${
          entry.misplaced ? `, ${entry.misplaced} currently in a room that does not accept it` : ''
        }`,
    )
    .join('. '),
)
</script>

<template>
  <ChartsChartFrame
    title="Demand by age group"
    caption="Rooms accepting several age groups count their places under each, so these are options rather than reservations."
    :summary="summary"
  >
    <ApexChart type="bar" width="100%" height="260" :options="options" :series="series" />
  </ChartsChartFrame>
</template>
