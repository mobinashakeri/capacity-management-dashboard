<script setup lang="ts">
// `computed` is imported explicitly rather than relying on Nuxt's auto-import,
// so this component mounts in a plain Vitest environment without standing up a
// Nuxt test harness.
import { computed } from 'vue'
import type { ClassroomStatus } from '~/types/domain'
import { capacityDescription, capacityFillPercent } from '~/utils/capacity/format'

const props = withDefaults(
  defineProps<{
    placesUsed: number
    capacity: number
    status: ClassroomStatus
    compact?: boolean
  }>(),
  { compact: false },
)

/**
 * Used where a room's places would be too many to count — a whole centre holds
 * hundreds. Rooms themselves use PlaceGrid, which shows the actual places.
 */
const fillPercent = computed(() => capacityFillPercent(props.placesUsed, props.capacity))

const description = computed(() => capacityDescription(props.placesUsed, props.capacity))

const fillClass = computed(
  () =>
    ({
      over: 'bg-over',
      full: 'bg-warn',
      healthy: 'bg-ok',
      empty: 'bg-idle',
    })[props.status],
)
</script>

<template>
  <div
    role="meter"
    :aria-valuenow="placesUsed"
    :aria-valuemin="0"
    :aria-valuemax="Math.max(capacity, placesUsed)"
    :aria-valuetext="description"
    class="w-full overflow-hidden rounded-full bg-ground"
    :class="compact ? 'h-1.5' : 'h-2'"
  >
    <div class="h-full rounded-full" :class="fillClass" :style="{ width: `${fillPercent}%` }" />
  </div>
</template>
