<script setup lang="ts">
type Tone = 'alert' | 'warn' | 'good' | 'brand' | 'muted'

withDefaults(defineProps<{ tone: Tone; label: string; count?: number | null }>(), {
  count: null,
})

/**
 * Status arrives as a mark plus words, never colour alone. The sunny brand
 * yellow is too light to carry meaning by itself, so its mark takes a darker
 * ring — the chip still reads as yellow, the shape still reads without colour.
 */
const TONES: Record<Tone, { chip: string; dot: string; mark: string }> = {
  alert: { chip: 'bg-alert-tint text-alert-ink', dot: 'bg-alert', mark: '▲' },
  warn: { chip: 'bg-warn-tint text-warn-ink', dot: 'bg-warn ring-1 ring-warn-ink/40', mark: '●' },
  good: { chip: 'bg-good-tint text-good-ink', dot: 'bg-good', mark: '✓' },
  brand: { chip: 'bg-brand-tint text-brand-ink', dot: 'bg-brand', mark: '◆' },
  muted: { chip: 'bg-muted-tint text-body', dot: 'bg-muted', mark: '·' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-4 font-medium"
    :class="TONES[tone].chip"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="TONES[tone].dot" aria-hidden="true" />
    <span v-if="count !== null" class="num font-semibold">{{ count }}</span>
    {{ label }}
  </span>
</template>
