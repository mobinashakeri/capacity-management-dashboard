<script setup lang="ts">
import { formatDate, formatMonth } from '~/utils/capacity/dates'

const { model, meta, error, viewState, availableMonths, selectedMonth, selectMonth, refresh } =
  useCapacityOverview()
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-10">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Capacity Management Dashboard</h1>
        <p v-if="meta" class="mt-1 text-sm text-ink-muted">
          {{ formatMonth(meta.month) }} · as of {{ formatDate(meta.effective_on) }} ({{
            meta.timezone
          }})
        </p>
      </div>

      <label class="text-sm">
        <span class="mr-2">Month</span>
        <select
          :value="selectedMonth ?? meta?.month ?? ''"
          class="rounded border border-line bg-card px-2 py-1"
          @change="selectMonth(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="month in availableMonths" :key="month" :value="month">
            {{ formatMonth(month) }}
          </option>
        </select>
      </label>
    </header>

    <p class="mt-6 text-xs text-ink-muted">State: {{ viewState }}</p>

    <div v-if="error" class="mt-4 rounded border border-line bg-status-over-bg p-4">
      <p class="font-medium">{{ error.message }}</p>
      <button class="mt-2 rounded border border-line px-3 py-1 text-sm" @click="refresh()">
        Try again
      </button>
    </div>

    <dl v-else-if="model" class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div
        v-for="stat in [
          { label: 'Capacity', value: model.portfolio.capacity },
          { label: 'Places used', value: model.portfolio.placesUsed },
          { label: 'Places available', value: model.portfolio.placesAvailable },
          { label: 'Rooms over capacity', value: model.portfolio.roomsOverCapacity },
          { label: 'Unassigned children', value: model.portfolio.unassignedCount },
          { label: 'Age mismatches', value: model.portfolio.ageMismatchCount },
        ]"
        :key="stat.label"
        class="rounded border border-line bg-card p-4"
      >
        <dt class="text-sm text-ink-muted">{{ stat.label }}</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ stat.value }}</dd>
      </div>
    </dl>

    <p v-if="model" class="mt-6 text-sm text-ink-muted">
      {{ model.exceptions.length }} exceptions across
      {{ model.portfolio.classroomCount }} classrooms.
    </p>
  </main>
</template>
