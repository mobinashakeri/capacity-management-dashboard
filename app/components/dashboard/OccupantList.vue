<script setup lang="ts">
import type { LabelLookup, Occupant } from '~/types/domain'
import {
  ageGroupLabel,
  attendanceAbbreviation,
  attendanceLabel,
  childName,
} from '~/utils/capacity/format'

defineProps<{ occupants: Occupant[]; labels: LabelLookup; emptyMessage?: string }>()
</script>

<template>
  <p v-if="!occupants.length" class="text-sm text-ink-muted">
    {{ emptyMessage ?? 'No children in this room.' }}
  </p>

  <ul v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
    <li
      v-for="occupant in occupants"
      :key="occupant.enrolmentId"
      class="flex items-start justify-between gap-2 rounded-md border border-line bg-page px-3 py-2"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ childName(occupant.child) }}</p>
        <p class="text-xs text-ink-muted">
          {{ ageGroupLabel(labels, occupant.ageGroup) }}
        </p>
      </div>

      <div class="flex shrink-0 flex-col items-end gap-1">
        <!-- Abbreviation for density; the full label stays available on hover and to assistive tech. -->
        <span
          class="rounded bg-card px-1.5 py-0.5 text-xs font-medium ring-1 ring-line ring-inset"
          :title="attendanceLabel(labels, occupant.attendanceType)"
        >
          <span aria-hidden="true">{{
            attendanceAbbreviation(labels, occupant.attendanceType)
          }}</span>
          <span class="sr-only">{{ attendanceLabel(labels, occupant.attendanceType) }}</span>
        </span>
        <UiStatusBadge v-if="!occupant.ageGroupMatches" tone="warning" label="Age" />
      </div>
    </li>
  </ul>
</template>
