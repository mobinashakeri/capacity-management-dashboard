<script setup lang="ts">
import { formatDate, formatMonth } from '~/utils/capacity/dates'

const {
  model,
  meta,
  error,
  viewState,
  isPending,
  availableMonths,
  reportingMonth,
  selectMonth,
  refresh,
} = useCapacityOverview()

useHead({
  title: () =>
    reportingMonth.value
      ? `Capacity · ${formatMonth(reportingMonth.value)}`
      : 'Capacity Management Dashboard',
})
</script>

<template>
  <div class="min-h-dvh bg-page">
    <a
      href="#dashboard"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:ring-2"
    >
      Skip to dashboard
    </a>

    <header class="border-b border-line bg-card">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6"
      >
        <div>
          <h1 class="text-xl font-semibold tracking-tight sm:text-2xl">
            Capacity Management Dashboard
          </h1>
          <!--
            The snapshot date is stated, never implied: effective_on is the end
            of the reporting month, which for the current month is a future
            date, so the figures describe the room as it will stand then.
          -->
          <p v-if="meta" class="mt-1 text-sm text-ink-muted">
            {{ formatMonth(meta.month) }} · as of {{ formatDate(meta.effective_on) }}
            <span class="text-xs">({{ meta.timezone }})</span>
          </p>
        </div>

        <DashboardMonthSelector
          :months="availableMonths"
          :current="reportingMonth"
          :busy="isPending"
          @select="selectMonth"
        />
      </div>
    </header>

    <main id="dashboard" class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <UiDataState
        :state="viewState"
        :error="error"
        :month="reportingMonth"
        :available-months="availableMonths"
        @retry="refresh()"
        @select-month="selectMonth"
      >
        <!--
          Data stays on screen while the next month loads, dimmed rather than
          replaced by a skeleton, so a comparison is never interrupted.
        -->
        <div
          v-if="model"
          class="space-y-6 transition-opacity"
          :class="viewState === 'refreshing' && 'pointer-events-none opacity-50'"
          aria-live="polite"
          :aria-busy="viewState === 'refreshing'"
        >
          <DashboardPortfolioStats :portfolio="model.portfolio" />

          <DashboardAttentionPanel :exceptions="model.exceptions" :labels="model.labels" />

          <section aria-labelledby="centres-heading">
            <h2 id="centres-heading" class="mb-3 text-base font-semibold">Centres</h2>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCentreCard
                v-for="centre in model.centres"
                :key="centre.centre.id"
                :centre="centre"
                :labels="model.labels"
              />
            </div>
          </section>

          <DashboardClassroomTable :classrooms="model.classrooms" :labels="model.labels" />
        </div>
      </UiDataState>
    </main>
  </div>
</template>
