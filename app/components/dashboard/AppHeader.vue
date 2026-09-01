<script setup lang="ts">
import type { IsoMonth, Meta } from '~/types/api'
import { formatDate, formatMonth } from '~/utils/capacity/dates'
import logo from '~/assets/logo-clever.jpg'

defineProps<{
  meta: Meta | null
  months: IsoMonth[]
  current: IsoMonth | null
  busy?: boolean
}>()

const emit = defineEmits<{ select: [month: IsoMonth] }>()

/**
 * Compacts once the page has moved, so the month selector stays reachable
 * without the full header following you down the page.
 */
const compact = ref(false)

function onScroll() {
  compact.value = window.scrollY > 12
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-white transition-shadow duration-200"
    :class="
      compact
        ? 'shadow-[0_1px_0_var(--color-line),0_6px_20px_-12px_rgb(30_32_65/0.25)]'
        : 'border-b border-line-soft'
    "
  >
    <!--
      The rule takes its colours from the wordmark itself — the yellow C, blue L,
      magenta E and green V — so the brand is present without tinting the ground
      the logo sits on.
    -->
    <div
      class="h-[3px] w-full"
      style="background: linear-gradient(90deg, #fcc30c 0%, #0578be 34%, #c02181 67%, #1d946c 100%)"
      aria-hidden="true"
    />

    <div
      class="mx-auto flex max-w-352 flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 transition-[padding] duration-200 sm:px-6"
      :class="compact ? 'py-2.5' : 'py-4 lg:py-5'"
    >
      <div class="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        <img
          :src="logo"
          alt="Clever Daycare"
          class="w-auto shrink-0 transition-[height] duration-200"
          :class="compact ? 'h-7' : 'h-8 sm:h-10'"
          width="682"
          height="185"
        />

        <span class="hidden h-9 w-px shrink-0 bg-line sm:block" aria-hidden="true" />

        <div class="min-w-0">
          <h1
            class="font-semibold tracking-tight text-balance transition-[font-size] duration-200"
            :class="compact ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'"
          >
            Rooms, places and children
          </h1>
          <p v-if="meta && !compact" class="mt-0.5 text-sm text-body">
            {{ formatMonth(meta.month) }} · counted as at {{ formatDate(meta.effective_on) }}
            <span class="hidden sm:inline">({{ meta.timezone }})</span>
          </p>
        </div>
      </div>

      <DashboardMonthSelector
        class="w-full sm:w-auto"
        :months="months"
        :current="current"
        :busy="busy"
        @select="emit('select', $event)"
      />
    </div>
  </header>
</template>
