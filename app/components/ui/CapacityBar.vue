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
    /** Renders a thinner bar for use inside dense table rows. */
    compact?: boolean
  }>(),
  { compact: false },
)

const fillPercent = computed(() => capacityFillPercent(props.placesUsed, props.capacity))

const description = computed(() => capacityDescription(props.placesUsed, props.capacity))

const fillClass = computed(
  () =>
    ({
      over: 'bg-status-over',
      full: 'bg-status-full',
      healthy: 'bg-status-healthy',
      empty: 'bg-status-empty/30',
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
    class="h-2 w-full overflow-hidden rounded-full bg-line"
    :class="compact ? 'h-1.5' : 'h-2'"
  >
    <div
      class="h-full rounded-full transition-[width] duration-300"
      :class="[fillClass, status === 'over' && 'ring-1 ring-status-over ring-inset']"
      :style="{ width: `${fillPercent}%` }"
    />
  </div>
</template>
