<script setup lang="ts">
type Tone = 'default' | 'critical' | 'warning'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    /** Short clarification, e.g. "of 282 places". */
    hint?: string
    tone?: Tone
  }>(),
  { hint: undefined, tone: 'default' },
)

const TONES: Record<Tone, string> = {
  default: 'text-ink',
  critical: 'text-status-over',
  warning: 'text-status-full',
}
</script>

<template>
  <div class="rounded-lg border border-line bg-card p-4">
    <dt class="text-sm text-ink-muted">{{ label }}</dt>
    <!-- Tabular figures stop the numbers jittering as months change. -->
    <dd class="mt-1 text-2xl font-semibold tabular-nums" :class="TONES[tone]">
      {{ value }}
    </dd>
    <p v-if="hint" class="mt-0.5 text-xs text-ink-muted">{{ hint }}</p>
  </div>
</template>
