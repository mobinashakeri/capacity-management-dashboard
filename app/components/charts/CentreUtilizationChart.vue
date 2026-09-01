<script setup lang="ts">
import type { CentreSummary } from '~/types/domain'
import { BASE_CHART_OPTIONS, CATEGORY_LABEL, CHART_COLORS, VALUE_LABEL } from '~/utils/chart-theme'
import { formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ centres: CentreSummary[] }>()

/**
 * Loaded on demand rather than registered as a plugin. ApexCharts is ~250 KB
 * gzipped; as a plugin it sat in a modulepreload on every page load, ahead of
 * numbers that read fine without it.
 */
const ApexChart = defineAsyncComponent(() => import('vue3-apexcharts'))

/**
 * Horizontal stacked bars: comparing centres is the one question a table
 * answers worse than a picture, and horizontal bars keep their labels legible
 * at phone widths where vertical ones collide.
 *
 * Over-capacity is its own segment rather than a longer "used" bar, so a room
 * past its limit reads as a distinct block instead of merely a long one.
 */
const series = computed(() => [
  { name: 'Taken', data: props.centres.map((centre) => centre.placesUsed - centre.overBy) },
  { name: 'Over capacity', data: props.centres.map((centre) => centre.overBy) },
  { name: 'Free', data: props.centres.map((centre) => centre.placesAvailable) },
])

const height = computed(() => Math.max(220, props.centres.length * 62))

const options = computed(() => ({
  ...BASE_CHART_OPTIONS,
  chart: { ...BASE_CHART_OPTIONS.chart, type: 'bar' as const, stacked: true },
  colors: [CHART_COLORS.ok, CHART_COLORS.over, CHART_COLORS.free],
  plotOptions: { bar: { horizontal: true, borderRadius: 2, barHeight: '58%' } },
  xaxis: {
    categories: props.centres.map((centre) => centre.centre.name),
    labels: VALUE_LABEL,
    axisBorder: { color: CHART_COLORS.rule },
    axisTicks: { color: CHART_COLORS.rule },
  },
  yaxis: { labels: CATEGORY_LABEL },
  tooltip: {
    ...BASE_CHART_OPTIONS.tooltip,
    y: { formatter: (value: number) => pluralise(value, 'place') },
  },
  responsive: [
    {
      breakpoint: 640,
      // The API supplies real abbreviations, so a narrow screen gets a shorter
      // name rather than a cut-off one.
      options: {
        xaxis: { categories: props.centres.map((centre) => centre.centre.abbreviation) },
      },
    },
  ],
}))

const summary = computed(() =>
  props.centres
    .map(
      (centre) =>
        `${centre.centre.name}: ${centre.placesUsed} of ${centre.capacity} places taken, ${formatPercent(centre.utilizationPct)}${
          centre.overBy ? `, over capacity by ${centre.overBy}` : ''
        }`,
    )
    .join('. '),
)
</script>

<template>
  <ChartsChartFrame
    title="Places by centre"
    caption="Taken, over capacity, and still free."
    :summary="summary"
    :height="height"
  >
    <ApexChart type="bar" width="100%" :height="height" :options="options" :series="series" />
  </ChartsChartFrame>
</template>
