<script setup lang="ts">
import type { PortfolioSummary } from '~/types/domain'
import { formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ portfolio: PortfolioSummary }>()

/**
 * The headline is deliberately not left to speak for itself. On the live data a
 * comfortable-looking utilization sits on top of rooms that are genuinely over
 * capacity, so the cards that carry bad news are toned even when the average is
 * calm - and the exceptions panel sits directly beneath this row.
 */
const stats = computed(() => [
  {
    label: 'Total capacity',
    value: props.portfolio.capacity,
    hint: pluralise(props.portfolio.classroomCount, 'classroom'),
  },
  {
    label: 'Places used',
    value: props.portfolio.placesUsed,
    hint:
      props.portfolio.placesSavedByPairing > 0
        ? `${props.portfolio.headcount} children · ${props.portfolio.placesSavedByPairing} saved by pairing`
        : `${props.portfolio.headcount} children`,
  },
  {
    label: 'Places available',
    value: props.portfolio.placesAvailable,
    hint: 'summed per room',
  },
  {
    label: 'Utilization',
    value: formatPercent(props.portfolio.utilizationPct),
    hint: 'across all centres',
  },
  {
    label: 'Rooms over capacity',
    value: props.portfolio.roomsOverCapacity,
    hint: props.portfolio.overBy ? `${props.portfolio.overBy} places over` : 'none',
    tone: props.portfolio.roomsOverCapacity ? ('critical' as const) : undefined,
  },
  {
    label: 'Unassigned children',
    value: props.portfolio.unassignedCount,
    hint: 'not counted against any room',
    tone: props.portfolio.unassignedCount ? ('warning' as const) : undefined,
  },
])
</script>

<template>
  <section aria-labelledby="portfolio-heading">
    <h2 id="portfolio-heading" class="sr-only">Portfolio summary</h2>
    <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
