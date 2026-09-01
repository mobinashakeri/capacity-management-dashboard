<script setup lang="ts">
import type { AgeGroupDemand } from '~/types/domain'
import { BASE_CHART_OPTIONS, CATEGORY_LABEL, CHART_COLORS, VALUE_LABEL } from '~/utils/chart-theme'
import { pluralise } from '~/utils/capacity/format'

const props = defineProps<{ demand: AgeGroupDemand[] }>()

/** Loaded on demand — see the note in CentreUtilizationChart. */
const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

/**
 * The "where could this child go" chart.
 *
 * Age-band fit, not attendance mix, is what actually constrains this data — it
 * produces the largest group of flags every month. Setting children per band
 * beside the places in rooms that accept that band shows which moves exist.
 */
const series = computed(() => [
  { name: 'Children', data: props.demand.map((entry) => entry.children) },
  {
    name: 'Places in rooms that accept them',
    data: props.demand.map((entry) => entry.placesInAcceptingRooms),
  },
])

const options = computed(() => ({
  ...BASE_CHART_OPTIONS,
  chart: { ...BASE_CHART_OPTIONS.chart, type: 'bar' as const },
  colors: [CHART_COLORS.ok, CHART_COLORS.free],
  plotOptions: { bar: { borderRadius: 2, columnWidth: '62%' } },
  xaxis: {
    categories: props.demand.map((entry) => entry.label),
    // Rotated and never trimmed: "Kindergarten" reads in full at every width.
    labels: { ...CATEGORY_LABEL, rotate: -40, rotateAlways: true, maxHeight: 90 },
    axisBorder: { color: CHART_COLORS.rule },
    axisTicks: { color: CHART_COLORS.rule },
  },
  yaxis: { labels: VALUE_LABEL },
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
          entry.misplaced ? `, ${entry.misplaced} in a room that does not accept it` : ''
        }`,
    )
    .join('. '),
)
</script>

<template>
  <ChartsChartFrame
    title="Demand by age group"
    caption="A room accepting several age groups counts its places under each, so these are options rather than reservations."
    :summary="summary"
    :height="280"
  >
    <ApexChart type="bar" width="100%" height="280" :options="options" :series="series" />
  </ChartsChartFrame>
</template>
