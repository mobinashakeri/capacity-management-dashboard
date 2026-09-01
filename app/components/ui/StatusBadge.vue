<script setup lang="ts">
type Tone = 'over' | 'unassigned' | 'warn' | 'ok' | 'idle'

withDefaults(defineProps<{ tone: Tone; label: string; count?: number | null }>(), {
  count: null,
})

/**
 * Status always arrives as a mark plus words. The mark is a shape as well as a
 * colour, so the difference survives greyscale and colour blindness.
 */
const TONES: Record<Tone, { classes: string; mark: string }> = {
  over: { classes: 'bg-over-tint text-over-text ring-over/25', mark: '▲' },
  unassigned: { classes: 'bg-unassigned-tint text-unassigned-text ring-unassigned/25', mark: '◆' },
  warn: { classes: 'bg-warn-tint text-warn-text ring-warn/25', mark: '●' },
  ok: { classes: 'bg-ok-tint text-ok-text ring-ok/25', mark: '✓' },
  idle: { classes: 'bg-idle-tint text-idle-text ring-idle/30', mark: '·' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs leading-5 font-medium ring-1 ring-inset"
    :class="TONES[tone].classes"
  >
    <span aria-hidden="true" class="text-[9px] leading-none">{{ TONES[tone].mark }}</span>
    <span v-if="count !== null" class="num font-semibold">{{ count }}</span>
    {{ label }}
  </span>
</template>
