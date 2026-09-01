<script setup lang="ts">
import type { ExceptionSeverity } from '~/types/domain'

type Tone = ExceptionSeverity | 'ok' | 'neutral'

withDefaults(defineProps<{ tone: Tone; label: string; icon?: string }>(), { icon: undefined })

/**
 * Every badge carries an icon and a text label, never colour alone - the status
 * has to survive greyscale printing and colour blindness.
 */
const TONES: Record<Tone, { classes: string; icon: string }> = {
  critical: { classes: 'bg-status-over-bg text-status-over-text ring-status-over/30', icon: '!' },
  warning: { classes: 'bg-status-full-bg text-status-full-text ring-status-full/40', icon: '▲' },
  info: { classes: 'bg-status-empty-bg text-status-empty-text ring-status-empty/40', icon: 'i' },
  ok: {
    classes: 'bg-status-healthy-bg text-status-healthy-text ring-status-healthy/30',
    icon: '✓',
  },
  neutral: { classes: 'bg-page text-ink-muted ring-line', icon: '·' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="TONES[tone].classes"
  >
    <span aria-hidden="true" class="font-bold">{{ icon ?? TONES[tone].icon }}</span>
    {{ label }}
  </span>
</template>
