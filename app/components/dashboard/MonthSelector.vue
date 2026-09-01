<script setup lang="ts">
import type { IsoMonth } from '~/types/api'
import { formatMonth } from '~/utils/capacity/dates'

defineProps<{ months: IsoMonth[]; current: IsoMonth | null; busy?: boolean }>()

const emit = defineEmits<{ select: [month: IsoMonth] }>()

const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
    <label :for="id" class="label shrink-0 sm:text-right">Reporting month</label>

    <!--
      A styled shell around a native select: the control keeps every bit of
      built-in keyboard and screen-reader behaviour, and the focus ring is drawn
      on the shell so it traces the pill rather than a rectangle inside it.
    -->
    <!--
      Focus turns the border brand blue rather than drawing a halo around the
      pill. Chrome matches :focus-visible on a select even for a mouse click, so
      a ring would appear on every click; a border colour change still leaves a
      visible indicator for keyboard users without that glow.
    -->
    <div
      class="relative flex items-center rounded-full border border-line-strong bg-white transition-colors focus-within:border-brand"
    >
      <span class="pointer-events-none absolute left-3 text-brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="size-[18px]" fill="none" stroke="currentColor">
          <path
            d="M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5zM8 3.5v3M16 3.5v3M4.5 9.5h15"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <select
        :id="id"
        :value="current ?? ''"
        :disabled="!months.length"
        class="w-full appearance-none rounded-full bg-transparent py-2.5 pr-9 pl-10 text-sm font-medium text-navy focus:outline-none disabled:opacity-50 sm:w-auto"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!current" value="" disabled>Select a month</option>
        <option v-for="month in months" :key="month" :value="month">
          {{ formatMonth(month) }}
        </option>
      </select>

      <span class="pointer-events-none absolute right-3.5 text-body" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor">
          <path d="m6 9 6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>

      <!-- Progress sits on the control that caused it, not over the page. -->
      <span
        v-if="busy"
        class="absolute -right-6 size-3.5 animate-spin rounded-full border-2 border-line border-t-brand"
        aria-hidden="true"
      />
      <span v-if="busy" class="sr-only">Loading</span>
    </div>
  </div>
</template>
