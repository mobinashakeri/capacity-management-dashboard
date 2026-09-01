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
  <p v-if="!occupants.length" class="text-sm text-body">
    {{ emptyMessage ?? 'No children in this room.' }}
  </p>

  <ul v-else class="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
    <li
      v-for="occupant in occupants"
      :key="occupant.enrolmentId"
      class="flex items-center justify-between gap-2 rounded border border-line-soft bg-white px-2.5 py-1.5"
      :class="!occupant.ageGroupMatches && 'border-warn/40 bg-warn-tint'"
    >
      <span class="min-w-0">
        <span class="block truncate text-sm">{{ childName(occupant.child) }}</span>
        <span class="block text-xs text-body">
          {{ ageGroupLabel(labels, occupant.ageGroup) }}
          <template v-if="!occupant.ageGroupMatches"> · outside range</template>
        </span>
      </span>

      <span
        class="num shrink-0 rounded bg-line-soft px-1.5 py-0.5 text-xs font-medium"
        :title="attendanceLabel(labels, occupant.attendanceType)"
      >
        <span aria-hidden="true">{{
          attendanceAbbreviation(labels, occupant.attendanceType)
        }}</span>
        <span class="sr-only">{{ attendanceLabel(labels, occupant.attendanceType) }}</span>
      </span>
    </li>
  </ul>
</template>
