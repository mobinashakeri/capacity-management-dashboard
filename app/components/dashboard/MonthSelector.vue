<script setup lang="ts">
import type { IsoMonth } from '~/types/api'
import { formatMonth } from '~/utils/capacity/dates'

defineProps<{ months: IsoMonth[]; current: IsoMonth | null; busy?: boolean }>()

const emit = defineEmits<{ select: [month: IsoMonth] }>()

const id = useId()
</script>

<template>
  <div class="flex items-center gap-2.5">
    <label :for="id" class="eyebrow whitespace-nowrap">Reporting month</label>
    <div class="flex items-center gap-2">
      <select
        :id="id"
        :value="current ?? ''"
        :disabled="!months.length"
        class="num rounded border border-rule-strong bg-surface px-2.5 py-1.5 text-sm disabled:opacity-50"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!current" value="" disabled>Select a month</option>
        <option v-for="month in months" :key="month" :value="month">
          {{ formatMonth(month) }}
        </option>
      </select>
      <!-- Progress sits beside the control that caused it, not over the page. -->
      <span
        v-if="busy"
        class="size-3 shrink-0 animate-spin rounded-full border-2 border-rule border-t-accent"
        aria-hidden="true"
      />
      <span v-if="busy" class="sr-only">Loading</span>
    </div>
  </div>
</template>
