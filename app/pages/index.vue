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
  <div class="min-h-dvh">
    <a
      href="#dashboard"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow-lg"
    >
      Skip to dashboard
    </a>

    <header class="border-b border-line-soft bg-white">
      <div
        class="mx-auto flex max-w-352 flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 py-4 sm:px-6 lg:py-5"
      >
        <div class="min-w-0">
          <p class="label font-semibold text-brand-ink">Clever Daycare</p>
          <h1 class="mt-1 text-lg leading-tight font-semibold tracking-tight sm:text-xl">
            Rooms, places and children
          </h1>
          <!--
            The snapshot date is stated, never implied: effective_on is the end of
            the reporting month, which for the current month is still ahead, so
            these figures describe the rooms as they will stand then.
          -->
          <p v-if="meta" class="mt-1 text-xs text-body">
            <span class="num">{{ formatMonth(meta.month) }}</span> · as at
            <span class="num">{{ formatDate(meta.effective_on) }}</span>
            <span class="text-body"> ({{ meta.timezone }})</span>
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

    <main id="dashboard" class="mx-auto max-w-352 px-4 py-5 sm:px-6 lg:py-7">
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
          <div class="grid items-stretch gap-3 lg:grid-cols-5 lg:gap-4">
            <div class="lg:col-span-2 [&>*]:h-full">
              <DashboardStatusHeadline :portfolio="model.portfolio" :meta="meta" />
            </div>
            <div class="lg:col-span-3 [&>*]:h-full">
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
