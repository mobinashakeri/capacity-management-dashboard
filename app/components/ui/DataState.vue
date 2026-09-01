<script setup lang="ts">
import type { AppError, ViewState } from '~/types/errors'
import type { IsoMonth } from '~/types/api'
import { formatMonth } from '~/utils/capacity/dates'

defineProps<{
  state: ViewState
  error: AppError | null
  month: IsoMonth | null
  /** Offered as recovery chips when the requested month cannot be shown. */
  availableMonths: IsoMonth[]
}>()

const emit = defineEmits<{ retry: []; selectMonth: [month: IsoMonth]; reset: [] }>()

/** Months the user can jump to from an error, capped so the list stays scannable. */
const RECOVERY_LIMIT = 12
</script>

<template>
  <!--
    Skeleton mirrors the real layout so the page does not jump when data lands.
    Only the first load shows it; a month switch keeps the previous data on
    screen and dims it instead (handled by the caller).
  -->
  <div v-if="state === 'loading'" class="space-y-6" aria-busy="true">
    <span class="sr-only">Loading capacity data</span>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div v-for="n in 6" :key="n" class="h-24 animate-pulse rounded-lg border border-line bg-card">
        <div class="m-4 h-3 w-2/3 rounded bg-line" />
        <div class="mx-4 h-6 w-1/3 rounded bg-line" />
      </div>
    </div>
    <div class="h-48 animate-pulse rounded-lg border border-line bg-card" />
  </div>

  <div
    v-else-if="state === 'error' && error"
    class="rounded-lg border border-line bg-card p-6"
    role="alert"
  >
    <h2 class="text-lg font-semibold">
      {{
        error.kind === 'validation'
          ? 'That month isn’t available'
          : error.kind === 'network'
            ? 'Couldn’t reach the service'
            : 'This month couldn’t be loaded'
      }}
    </h2>

    <p class="mt-2 text-sm text-ink-muted">{{ error.message }}</p>

    <!--
      A month listed in available_months can still fail (the API returns 500 for
      2026-01). Saying so plainly stops the user re-trying the same month
      forever, or assuming they mistyped something.
    -->
    <p v-if="error.kind === 'server'" class="mt-1 text-sm text-ink-muted">
      {{
        month
          ? `${formatMonth(month)} is listed as available, but the service couldn’t return it.`
          : 'The service couldn’t return this month.'
      }}
      This is a problem at the service, not with your selection.
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-if="error.kind !== 'validation'"
        class="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-card"
        @click="emit('retry')"
      >
        Try again
      </button>

      <!--
        The month list comes from a successful response, so a bad month in a
        shared link leaves nothing to offer. Falling back to the current month
        always works, and without it that link is a dead end.
      -->
      <button
        v-if="month"
        class="rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium"
        @click="emit('reset')"
      >
        Show current month
      </button>
    </div>

    <div v-if="availableMonths.length" class="mt-5 border-t border-line pt-4">
      <p class="text-sm font-medium">Try another month</p>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="option in availableMonths.slice(0, RECOVERY_LIMIT)" :key="option">
          <button
            class="rounded-full border border-line-strong px-3 py-1 text-xs hover:bg-page"
            :class="option === month && 'opacity-50'"
            :disabled="option === month"
            @click="emit('selectMonth', option)"
          >
            {{ formatMonth(option) }}
          </button>
        </li>
      </ul>
    </div>
  </div>

  <div v-else-if="state === 'empty'" class="rounded-lg border border-line bg-card p-8 text-center">
    <h2 class="text-lg font-semibold">
      No capacity data for {{ month ? formatMonth(month) : 'this month' }}
    </h2>
    <p class="mx-auto mt-2 max-w-md text-sm text-ink-muted">
      The service returned this month successfully, but it contains no centres or classrooms.
    </p>
    <div v-if="availableMonths.length" class="mt-4 flex flex-wrap justify-center gap-2">
      <button
        v-for="option in availableMonths.slice(0, RECOVERY_LIMIT)"
        :key="option"
        class="rounded-full border border-line-strong px-3 py-1 text-xs hover:bg-page"
        @click="emit('selectMonth', option)"
      >
        {{ formatMonth(option) }}
      </button>
    </div>
  </div>

  <slot v-else />
</template>
