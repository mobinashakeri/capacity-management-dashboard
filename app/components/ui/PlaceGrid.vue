<script setup lang="ts">
import { computed } from 'vue'
import type { PlaceUsage } from '~/types/domain'
import { capacityDescription } from '~/utils/capacity/format'

const props = withDefaults(
  defineProps<{ usage: PlaceUsage; capacity: number; compact?: boolean }>(),
  { compact: false },
)

type Cell = 'full' | 'shared' | 'part' | 'free' | 'over'

/**
 * A room's capacity drawn as the places it actually is.
 *
 * A percentage says a room is at 110%. A row of places says the room holds ten,
 * eleven children are in it, and one is past the wall. Cells follow the counting
 * rule: whole places, then shared three-day/two-day places, then part-timers
 * holding a place alone, then whatever is still free.
 */
const cells = computed<Cell[]>(() => {
  const { fullTime, pairedPlaces, unpairedPartTime } = props.usage

  const occupied: Cell[] = [
    ...Array<Cell>(fullTime).fill('full'),
    ...Array<Cell>(pairedPlaces).fill('shared'),
    ...Array<Cell>(unpairedPartTime).fill('part'),
  ]

  const capacity = Math.max(0, props.capacity)
  const inside = occupied.slice(0, capacity)

  return [
    ...inside,
    ...Array<Cell>(Math.max(0, capacity - inside.length)).fill('free'),
    ...Array<Cell>(Math.max(0, occupied.length - capacity)).fill('over'),
  ]
})

const capacityIndex = computed(() => Math.max(0, props.capacity))

const description = computed(() => {
  const base = capacityDescription(props.usage.placesUsed, props.capacity)
  return props.usage.pairedPlaces > 0
    ? `${base}. ${props.usage.pairedPlaces} shared by part-time children.`
    : base
})

const CELL_CLASS: Record<Cell, string> = {
  full: 'bg-brand',
  // Two part-timers in one place: a place split between them.
  shared:
    '[background:linear-gradient(135deg,var(--color-brand)_0_46%,#fff_46%_54%,var(--color-brand)_54%_100%)]',
  part: 'bg-brand/55',
  free: 'bg-brand-pale',
  over: 'bg-alert',
}
</script>

<template>
  <div
    role="meter"
    :aria-valuenow="usage.placesUsed"
    :aria-valuemin="0"
    :aria-valuemax="Math.max(capacity, usage.placesUsed)"
    :aria-valuetext="description"
    class="flex flex-wrap items-center"
    :class="compact ? 'gap-[3px]' : 'gap-1'"
  >
    <template v-for="(cell, index) in cells" :key="index">
      <!-- The room's limit, drawn as the wall the spill crosses. -->
      <span
        v-if="index === capacityIndex && cells.length > capacityIndex"
        class="mx-1 self-stretch border-l-2 border-alert"
        aria-hidden="true"
      />
      <span
        class="shrink-0 rounded-full"
        :class="[CELL_CLASS[cell], compact ? 'h-2 w-2' : 'h-2.5 w-2.5']"
      />
    </template>
  </div>
</template>
