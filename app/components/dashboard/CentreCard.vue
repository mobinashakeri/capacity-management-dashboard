<script setup lang="ts">
import type { CentreSummary, LabelLookup } from '~/types/domain'
import { childName, formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ centre: CentreSummary; labels: LabelLookup }>()

const showUnassigned = ref(false)

/**
 * The bar measures how full the centre is, so it stays brand blue even when a
 * room inside is over — a whole centre painted magenta reads as though every
 * room were in trouble. The exception is carried by the chips and by the card's
 * own tinted edge instead.
 */
const tone = computed(() => (props.centre.placesAvailable === 0 ? 'full' : 'healthy'))

/** Needs action today: a room over its limit, or a child with nowhere to sit. */
const needsAction = computed(
  () => props.centre.roomsOverCapacity > 0 || props.centre.unassigned.length > 0,
)
</script>

<template>
  <article class="card flex flex-col p-4" :class="needsAction && 'ring-1 ring-alert/25'">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="leading-tight font-semibold">{{ centre.centre.name }}</h3>
        <p class="text-xs text-body">{{ pluralise(centre.classrooms.length, 'room') }}</p>
      </div>
      <p class="shrink-0 text-right">
        <span class="num block text-xl leading-none font-semibold">
          {{ formatPercent(centre.utilizationPct) }}
        </span>
        <span class="label">full</span>
      </p>
    </header>

    <UiCapacityBar
      class="mt-3.5"
      :places-used="centre.placesUsed"
      :capacity="centre.capacity"
      :status="tone"
    />

    <dl class="num mt-3 flex items-baseline gap-4 text-sm">
      <div class="flex items-baseline gap-1.5">
        <dt class="label">Used</dt>
        <dd>{{ centre.placesUsed }}</dd>
      </div>
      <div class="flex items-baseline gap-1.5">
        <dt class="label">Free</dt>
        <dd>{{ centre.placesAvailable }}</dd>
      </div>
      <div class="flex items-baseline gap-1.5">
        <dt class="label">Cap</dt>
        <dd>{{ centre.capacity }}</dd>
      </div>
    </dl>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <UiStatusBadge
        v-if="centre.roomsOverCapacity"
        tone="alert"
        :count="centre.roomsOverCapacity"
        label="over capacity"
      />
      <UiStatusBadge
        v-if="centre.unassigned.length"
        tone="alert"
        :count="centre.unassigned.length"
        label="no classroom"
      />
      <UiStatusBadge
        v-if="centre.ageMismatchCount"
        tone="warn"
        :count="centre.ageMismatchCount"
        label="outside range"
      />
      <UiStatusBadge
        v-if="!centre.roomsOverCapacity && !centre.ageMismatchCount && !centre.unassigned.length"
        tone="good"
        label="Nothing flagged"
      />
    </div>

    <!--
      Unassigned children belong to the centre, not to any room, so they are
      listed here rather than in the room table.
    -->
    <div v-if="centre.unassigned.length" class="mt-auto border-t border-line-soft pt-3">
      <button
        class="text-xs text-brand-ink underline underline-offset-2"
        :aria-expanded="showUnassigned"
        :aria-controls="`unassigned-${centre.centre.id}`"
        @click="showUnassigned = !showUnassigned"
      >
        {{ showUnassigned ? 'Hide' : 'Show' }} children without a classroom
      </button>
      <ul
        v-show="showUnassigned"
        :id="`unassigned-${centre.centre.id}`"
        class="mt-2 space-y-1 text-sm"
      >
        <li v-for="occupant in centre.unassigned" :key="occupant.enrolmentId" class="flex gap-2">
          <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-alert" aria-hidden="true" />
          <span>
            {{ childName(occupant.child) }}
            <span class="text-xs text-body">
              · {{ labels.ageGroups[occupant.ageGroup] ?? occupant.ageGroup }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </article>
</template>
