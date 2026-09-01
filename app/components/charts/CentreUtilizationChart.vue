<script setup lang="ts">
import type { CentreSummary } from '~/types/domain'
import { AXIS_LABEL_STYLE, BASE_CHART_OPTIONS, CHART_COLORS } from '~/utils/chart-theme'
import { formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ centres: CentreSummary[] }>()

/**
 * Loaded on demand rather than registered as a plugin.
 *
 * ApexCharts is ~280 KB gzipped; registering it globally put it in a
 * modulepreload on every page load, ahead of numbers that are all readable
 * without it. Charts sit below the fold behind `<ClientOnly>`, so they can
 * fetch their own library once they are actually needed.
 */
const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

/**
 * Horizontal stacked bars, because comparing centres against each other is the
 * one question a table answers worse than a picture - and horizontal bars keep
 * their labels readable at phone widths where vertical ones collide.
 *
 * "Over" is stacked as its own segment rather than extending "used", so a room
 * spilling past its limit is visible as a distinct block instead of a bar that
 * merely looks long.
 */
const series = computed(() => [
  { name: 'Used', data: props.centres.map((centre) => centre.placesUsed - centre.overBy) },
  { name: 'Over capacity', data: props.centres.map((centre) => centre.overBy) },
  { name: 'Available', data: props.centres.map((centre) => centre.placesAvailable) },
])

const options = computed(() => ({
  ...BASE_CHART_OPTIONS,
  chart: { ...BASE_CHART_OPTIONS.chart, type: 'bar' as const, stacked: true },
  colors: [CHART_COLORS.healthy, CHART_COLORS.over, CHART_COLORS.available],
  plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '60%' } },
  xaxis: {
    categories: props.centres.map((centre) => centre.centre.name),
    labels: AXIS_LABEL_STYLE,
    axisBorder: { color: CHART_COLORS.line },
    axisTicks: { color: CHART_COLORS.line },
  },
  yaxis: { labels: AXIS_LABEL_STYLE },
  tooltip: {
    ...BASE_CHART_OPTIONS.tooltip,
    y: { formatter: (value: number) => pluralise(value, 'place') },
  },
  responsive: [
    {
      breakpoint: 640,
      options: {
        // Abbreviations at phone widths: the API supplies them for exactly this.
        xaxis: { categories: props.centres.map((centre) => centre.centre.abbreviation) },
      },
    },
  ],
}))

const summary = computed(() =>
  props.centres
    .map(
      (centre) =>
        `${centre.centre.name}: ${centre.placesUsed} of ${centre.capacity} places used, ${formatPercent(centre.utilizationPct)}${
          centre.overBy ? `, over capacity by ${centre.overBy}` : ''
        }`,
    )
    .join('. '),
)
</script>

<template>
  <ChartsChartFrame
    title="Capacity by centre"
    caption="Places used, over capacity and still available."
    :summary="summary"
    :height="Math.max(200, centres.length * 56)"
  >
    <ApexChart
      type="bar"
      width="100%"
      :height="Math.max(200, centres.length * 56)"
      :options="options"
      :series="series"
    />
  </ChartsChartFrame>
</template>
