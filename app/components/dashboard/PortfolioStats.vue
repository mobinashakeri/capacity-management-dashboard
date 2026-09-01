<script setup lang="ts">
import type { PortfolioSummary } from '~/types/domain'
import { formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ portfolio: PortfolioSummary }>()

const stats = computed(() => [
  {
    label: 'Capacity',
    value: props.portfolio.capacity,
    hint: pluralise(props.portfolio.classroomCount, 'room'),
  },
  {
    label: 'Places used',
    value: props.portfolio.placesUsed,
    hint:
      props.portfolio.placesSavedByPairing > 0
        ? `${props.portfolio.headcount} children · ${props.portfolio.placesSavedByPairing} shared`
        : `${props.portfolio.headcount} children`,
  },
  { label: 'Free', value: props.portfolio.placesAvailable, hint: 'summed per room' },
  {
    label: 'Utilization',
    value: formatPercent(props.portfolio.utilizationPct),
    hint: 'group-wide',
  },
  {
    label: 'Over capacity',
    value: props.portfolio.roomsOverCapacity,
    hint: props.portfolio.overBy ? `${props.portfolio.overBy} places over` : 'no rooms',
    tone: props.portfolio.roomsOverCapacity ? ('over' as const) : undefined,
  },
  {
    label: 'No classroom',
    value: props.portfolio.unassignedCount,
    hint: 'against no room',
    tone: props.portfolio.unassignedCount ? ('unassigned' as const) : undefined,
  },
])
</script>

<template>
  <section aria-labelledby="portfolio-heading">
    <h2 id="portfolio-heading" class="sr-only">Group totals</h2>
    <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      <UiStatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :hint="stat.hint"
        :tone="stat.tone"
      />
    </dl>
  </section>
</template>
