<script setup lang="ts">
import { formatMonth } from '~/utils/capacity/dates'

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
  <div class="min-h-dvh">
    <a
      href="#dashboard"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-40 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow-lg"
    >
      Skip to dashboard
    </a>

    <DashboardAppHeader
      :meta="meta"
      :months="availableMonths"
      :current="reportingMonth"
      :busy="isPending"
      @select="selectMonth"
    />

    <main id="dashboard" class="mx-auto max-w-352 scroll-mt-24 px-4 py-5 sm:px-6 lg:py-7">
      <UiDataState
        :state="viewState"
        :error="error"
        :month="reportingMonth"
        :available-months="availableMonths"
        @retry="refresh()"
        @select-month="selectMonth"
        @reset="selectMonth(null)"
      >
        <!--
          Data stays on screen while the next month loads, dimmed rather than
          replaced by a skeleton, so a comparison is never interrupted.
        -->
        <div
          v-if="model"
          class="space-y-6 lg:space-y-8"
          :class="viewState === 'refreshing' && 'pointer-events-none opacity-55'"
          aria-live="polite"
          :aria-busy="viewState === 'refreshing'"
        >
          <!-- What is wrong, then what needs doing, then the numbers behind it. -->
          <!--
            items-start, so opening a group in the attention panel grows only that
            panel. Stretching the row would make the band beside it jump too.
          -->
          <div class="grid items-start gap-3 lg:grid-cols-5 lg:gap-4">
            <div class="lg:col-span-2">
              <DashboardStatusHeadline :portfolio="model.portfolio" :meta="meta" />
            </div>
            <div class="lg:col-span-3">
              <DashboardAttentionPanel :exceptions="model.exceptions" :labels="model.labels" />
            </div>
          </div>

          <DashboardPortfolioStats :portfolio="model.portfolio" />

          <section aria-labelledby="centres-heading">
            <div class="mb-3 flex items-baseline justify-between border-b border-line-soft pb-2">
              <h2 id="centres-heading" class="text-base font-semibold">Centres</h2>
              <p class="label">{{ model.centres.length }} sites</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCentreCard
                v-for="centre in model.centres"
                :key="centre.centre.id"
                :centre="centre"
                :labels="model.labels"
              />
            </div>
          </section>

          <section aria-labelledby="charts-heading">
            <div class="mb-3 flex items-baseline justify-between border-b border-line-soft pb-2">
              <h2 id="charts-heading" class="text-base font-semibold">Where the pressure is</h2>
            </div>
            <div class="grid gap-3 xl:grid-cols-2">
              <ChartsCentreUtilizationChart :centres="model.centres" />
              <ChartsAgeGroupDemandChart :demand="model.ageGroupDemand" />
            </div>
          </section>

          <DashboardClassroomTable :classrooms="model.classrooms" :labels="model.labels" />
        </div>
      </UiDataState>
    </main>
  </div>
</template>
