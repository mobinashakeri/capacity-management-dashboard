<script setup lang="ts">
import type { AppError, ViewState } from '~/types/errors'
import type { IsoMonth } from '~/types/api'
import { formatMonth } from '~/utils/capacity/dates'

defineProps<{
  state: ViewState
  error: AppError | null
  month: IsoMonth | null
  /** Offered as recovery when the requested month cannot be shown. */
  availableMonths: IsoMonth[]
}>()

const emit = defineEmits<{ retry: []; selectMonth: [month: IsoMonth]; reset: [] }>()

/** Capped so the recovery list stays scannable. */
const RECOVERY_LIMIT = 12
</script>

<template>
  <!--
    The skeleton mirrors the real layout, so the page does not jump when data
    lands. Only a first load shows it; a month switch keeps the previous month
    on screen and dims it instead.
  -->
  <div v-if="state === 'loading'" class="space-y-3" aria-busy="true">
    <span class="sr-only">Loading capacity data</span>
    <div class="card h-28 animate-pulse" />
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      <div v-for="n in 6" :key="n" class="card h-24 animate-pulse" />
    </div>
    <div class="card h-56 animate-pulse" />
  </div>

  <div v-else-if="state === 'error' && error" class="card p-6 sm:p-8" role="alert">
    <p class="label" :class="error.kind === 'validation' ? 'text-warn-ink' : 'text-alert-ink'">
      {{ error.kind === 'validation' ? 'Month not available' : 'Could not load' }}
    </p>

    <h2 class="mt-2 text-xl font-semibold tracking-tight">
      {{
        error.kind === 'validation'
          ? 'That month isn’t available'
          : error.kind === 'network'
            ? 'Couldn’t reach the service'
            : 'This month couldn’t be loaded'
      }}
    </h2>

    <p class="mt-2 max-w-prose text-sm text-body">{{ error.message }}</p>

    <!--
      A month the API advertises can still fail: it returns 500 for 2026-01.
      Saying so stops the user retrying the same month, or assuming they mistyped.
    -->
    <p v-if="error.kind === 'server'" class="mt-1.5 max-w-prose text-sm text-body">
      {{
        month
          ? `${formatMonth(month)} is listed as available, but the service couldn’t return it.`
          : 'The service couldn’t return this month.'
      }}
      This is a problem at the service, not with your selection.
    </p>

    <div class="mt-5 flex flex-wrap gap-2">
      <button
        v-if="error.kind !== 'validation'"
        class="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white"
        @click="emit('retry')"
      >
        Try again
      </button>

      <!--
        The month list only exists after a successful response, so a bad month in
        a shared link leaves nothing to offer. Falling back to the current month
        always works, and without it that link is a dead end.
      -->
      <button
        v-if="month"
        class="rounded border border-line-strong px-3 py-1.5 text-sm font-medium"
        @click="emit('reset')"
      >
        Show current month
      </button>
    </div>

    <div v-if="availableMonths.length" class="mt-6 border-t border-line-soft pt-4">
      <p class="label">Other months</p>
      <ul class="mt-2.5 flex flex-wrap gap-1.5">
        <li v-for="option in availableMonths.slice(0, RECOVERY_LIMIT)" :key="option">
          <button
            class="num rounded border border-line-soft px-2.5 py-1 text-xs hover:border-line-strong hover:bg-line-soft disabled:opacity-40"
            :disabled="option === month"
            @click="emit('selectMonth', option)"
          >
            {{ formatMonth(option) }}
          </button>
        </li>
      </ul>
    </div>
  </div>

  <div v-else-if="state === 'empty'" class="card p-8 text-center sm:p-12">
    <p class="label">Nothing to show</p>
    <h2 class="mt-2 text-xl font-semibold tracking-tight">
      No rooms recorded for {{ month ? formatMonth(month) : 'this month' }}
    </h2>
    <p class="mx-auto mt-2 max-w-md text-sm text-body">
      The service returned this month successfully, but it contains no centres or rooms. Pick
      another month to carry on.
    </p>
    <ul v-if="availableMonths.length" class="mt-5 flex flex-wrap justify-center gap-1.5">
      <li v-for="option in availableMonths.slice(0, RECOVERY_LIMIT)" :key="option">
        <button
          class="num rounded border border-line-soft px-2.5 py-1 text-xs hover:border-line-strong hover:bg-line-soft"
          @click="emit('selectMonth', option)"
        >
          {{ formatMonth(option) }}
        </button>
      </li>
    </ul>
  </div>

  <slot v-else />
</template>
