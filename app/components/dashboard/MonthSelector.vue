<script setup lang="ts">
import type { IsoMonth } from '~/types/api'
import { formatMonth } from '~/utils/capacity/dates'

defineProps<{ months: IsoMonth[]; current: IsoMonth | null; busy?: boolean }>()

const emit = defineEmits<{ select: [month: IsoMonth] }>()

const id = useId()
</script>

<template>
  <div class="flex items-center gap-2">
    <label :for="id" class="text-sm text-ink-muted">Reporting month</label>
    <div class="relative">
      <select
        :id="id"
        :value="current ?? ''"
        :disabled="!months.length"
        class="rounded-md border border-line bg-card py-1.5 pr-8 pl-3 text-sm disabled:opacity-50"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!current" value="" disabled>Select a month</option>
        <option v-for="month in months" :key="month" :value="month">
          {{ formatMonth(month) }}
        </option>
      </select>
      <!-- Progress sits next to the control that caused it, not over the page. -->
      <span
        v-if="busy"
        class="absolute top-1/2 -right-6 size-3 -translate-y-1/2 animate-spin rounded-full border-2 border-line border-t-ink"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
