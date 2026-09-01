<script setup lang="ts">
import type { PortfolioSummary } from '~/types/domain'
import { pluralise } from '~/utils/capacity/format'

const props = defineProps<{ portfolio: PortfolioSummary }>()

/**
 * The page opens by saying what is wrong, in words.
 *
 * A headline utilization figure would be the obvious thing to lead with, and it
 * would mislead: this group runs about a third full while two rooms are over
 * their limit. So the first line names the problems and the aggregate waits its
 * turn below.
 */
const problems = computed(() => {
  const items: { text: string; tone: 'over' | 'unassigned' }[] = []

  if (props.portfolio.roomsOverCapacity > 0) {
    items.push({
      text: `${pluralise(props.portfolio.roomsOverCapacity, 'room')} over capacity`,
      tone: 'over',
    })
  }
  if (props.portfolio.unassignedCount > 0) {
    items.push({
      text: `${pluralise(props.portfolio.unassignedCount, 'child', 'children')} without a classroom`,
      tone: 'unassigned',
    })
  }

  return items
})
</script>

<template>
  <div class="card px-4 py-5 sm:px-6 sm:py-6">
    <p class="eyebrow">Today’s position</p>

    <p
      v-if="problems.length"
      class="mt-2 text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl"
    >
      <template v-for="(problem, index) in problems" :key="problem.text"
        ><span
          class="whitespace-nowrap"
          :class="problem.tone === 'over' ? 'text-over-text' : 'text-unassigned-text'"
          >{{ problem.text }}</span
        ><span v-if="index < problems.length - 1" class="text-ink-2">, and </span></template
      ><span class="text-ink-2"> need attention.</span>
    </p>

    <p v-else class="mt-2 text-xl leading-snug font-semibold tracking-tight sm:text-2xl">
      Every room is within capacity and every child has a place.
    </p>

    <p class="mt-2.5 max-w-prose text-sm text-ink-2">
      <span class="num">{{ portfolio.placesAvailable }}</span> places are free across
      <span class="num">{{ portfolio.classroomCount }}</span> rooms, but free places in one room
      cannot seat a child who is over the limit in another.
    </p>
  </div>
</template>
