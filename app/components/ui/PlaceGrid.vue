<script setup lang="ts">
import { computed } from 'vue'
import type { PlaceUsage } from '~/types/domain'
import { capacityDescription } from '~/utils/capacity/format'

const props = withDefaults(
  defineProps<{
    usage: PlaceUsage
    capacity: number
    /** Smaller cells for dense table rows. */
    compact?: boolean
  }>(),
  { compact: false },
)

type Cell = 'full' | 'shared' | 'part' | 'free' | 'over'

/**
 * A room's capacity drawn as the physical places it actually is.
 *
 * A percentage tells an operator a room is at 110%. A row of places tells them
 * the room holds ten, eleven children are in it, and one is standing past the
 * wall. Cells are ordered the way the counting rule works: whole places first,
 * then shared three-day/two-day places, then part-timers holding a place alone,
 * then whatever is still free.
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
  const spilled: Cell[] = Array<Cell>(Math.max(0, occupied.length - capacity)).fill('over')
  const free: Cell[] = Array<Cell>(Math.max(0, capacity - inside.length)).fill('free')

  return [...inside, ...free, ...spilled]
})

/** Where the room's limit falls, so the spill reads as crossing a boundary. */
const capacityIndex = computed(() => Math.max(0, props.capacity))

const description = computed(() => {
  const base = capacityDescription(props.usage.placesUsed, props.capacity)
  return props.usage.pairedPlaces > 0
    ? `${base}. ${props.usage.pairedPlaces} shared by part-time children.`
    : base
})

const CELL_CLASS: Record<Cell, string> = {
  full: 'bg-ok',
  // Two part-timers in one place: drawn as a place split between them.
  shared:
    'bg-ok [background:linear-gradient(135deg,var(--color-ok)_0_48%,var(--color-ok-tint)_48%_52%,var(--color-ok)_52%_100%)]',
  part: 'bg-ok/45',
  free: 'bg-surface border border-rule',
  over: 'bg-over',
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
    :class="compact ? 'gap-[2px]' : 'gap-[3px]'"
  >
    <template v-for="(cell, index) in cells" :key="index">
      <!-- The room's limit, drawn as the wall the spill crosses. -->
      <span
        v-if="index === capacityIndex && cells.length > capacityIndex"
        class="mx-1 self-stretch border-l-2 border-over"
        aria-hidden="true"
      />
      <span
        class="shrink-0 rounded-xs"
        :class="[CELL_CLASS[cell], compact ? 'h-3.5 w-[7px]' : 'h-4 w-2']"
      />
    </template>
  </div>
</template>
