<script setup lang="ts">
type Tone = 'brand' | 'alert' | 'warn' | 'good' | 'muted'
type StatIcon = 'rooms' | 'children' | 'free' | 'share' | 'alert' | 'unplaced'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    tone?: Tone
    icon?: StatIcon
  }>(),
  { hint: undefined, tone: 'brand', icon: 'rooms' },
)

const TONES: Record<Tone, { badge: string; value: string }> = {
  brand: { badge: 'bg-brand-tint text-brand-ink', value: 'text-navy' },
  alert: { badge: 'bg-alert-tint text-alert-ink', value: 'text-alert-ink' },
  warn: { badge: 'bg-warn-tint text-warn-ink', value: 'text-navy' },
  good: { badge: 'bg-good-tint text-good-ink', value: 'text-navy' },
  muted: { badge: 'bg-muted-tint text-body', value: 'text-navy' },
}

/**
 * Line icons rather than a generic dot, so each card is recognisable by shape
 * before its label is read. Stroked in currentColor, so they take the tint.
 */
const ICONS: Record<StatIcon, string> = {
  rooms: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  children:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M17 8.5a2.5 2.5 0 1 0 0-5M18 14.6c2 .6 3 2.5 3 5.4',
  free: 'M5 12.8 9.2 17 19 7',
  share: 'M6 19V5M12 19v-8M18 19v-5',
  alert: 'M12 4.5 21 20H3zM12 10.5v4M12 17.4h.01',
  unplaced: 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5.5 20c0-3.3 2.9-5.5 6.5-5.5M4 4l16 16',
}
</script>

<template>
  <div class="card flex flex-col gap-3 p-4 sm:p-5">
    <div class="flex items-start justify-between gap-2">
      <dt class="label leading-tight">{{ label }}</dt>
      <span
        class="grid size-9 shrink-0 place-items-center rounded-soft"
        :class="TONES[tone].badge"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" class="size-[18px]" fill="none" stroke="currentColor">
          <path
            :d="ICONS[icon]"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>
    <div>
      <dd class="figure text-3xl leading-none font-semibold" :class="TONES[tone].value">
        {{ value }}
      </dd>
      <p v-if="hint" class="mt-1.5 text-xs text-body">{{ hint }}</p>
    </div>
  </div>
</template>
