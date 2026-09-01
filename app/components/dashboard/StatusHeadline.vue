<script setup lang="ts">
import type { Meta } from '~/types/api'
import type { PortfolioSummary } from '~/types/domain'
import { formatMonth } from '~/utils/capacity/dates'
import { pluralise } from '~/utils/capacity/format'

const props = defineProps<{ portfolio: PortfolioSummary; meta: Meta | null }>()

/**
 * One friendly sentence saying how the month is going.
 *
 * A headline utilization figure would be the obvious thing to lead with, and
 * here it would mislead: this group runs about a third full while two rooms sit
 * over their limit. So the band says what is actually happening, in words, and
 * the aggregate waits its turn below.
 */
const summary = computed(() => {
  const { roomsOverCapacity: over, unassignedCount: unplaced } = props.portfolio

  if (!over && !unplaced) return 'Every room is within capacity and every child has a place.'

  const parts = [
    over ? `${pluralise(over, 'room')} over capacity` : null,
    unplaced ? `${pluralise(unplaced, 'child', 'children')} still without a classroom` : null,
  ].filter(Boolean)

  return `${parts.join(' and ')} — worth a look today.`
})

const allClear = computed(
  () => !props.portfolio.roomsOverCapacity && !props.portfolio.unassignedCount,
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-card border border-line-soft"
    :style="{
      background:
        'linear-gradient(115deg, var(--color-brand-tint) 0%, #ffffff 46%, var(--color-warn-tint) 100%)',
    }"
  >
    <!-- Two soft brand washes, so the band has depth without a hard edge. -->
    <span
      class="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-warn/15 blur-3xl"
      aria-hidden="true"
    />
    <span
      class="pointer-events-none absolute -bottom-28 -left-10 size-72 rounded-full bg-brand/10 blur-3xl"
      aria-hidden="true"
    />

    <div class="relative px-5 py-7 sm:px-8 sm:py-9">
      <p
        class="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-medium text-brand-ink ring-1 ring-brand/15"
      >
        <span class="size-1.5 rounded-full bg-brand" aria-hidden="true" />
        {{ meta ? formatMonth(meta.month) : 'Current month' }}
      </p>

      <h2
        class="mt-3 max-w-2xl text-xl leading-snug font-semibold tracking-tight text-balance sm:text-[1.6rem]"
        :class="allClear ? 'text-good-ink' : 'text-navy'"
      >
        {{ summary }}
      </h2>
    </div>
  </div>
</template>
