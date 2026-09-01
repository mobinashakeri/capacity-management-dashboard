<script setup lang="ts">
type Tone = 'default' | 'over' | 'unassigned'

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
  over: 'text-over-text',
  unassigned: 'text-unassigned-text',
}
</script>

<template>
  <div class="card flex flex-col justify-between p-3 sm:p-4">
    <dt class="eyebrow">{{ label }}</dt>
    <dd class="num mt-2 text-2xl leading-none font-semibold sm:text-[1.75rem]" :class="TONES[tone]">
      {{ value }}
    </dd>
    <p v-if="hint" class="mt-1.5 text-xs text-ink-2">{{ hint }}</p>
  </div>
</template>
