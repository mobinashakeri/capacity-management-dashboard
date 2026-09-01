<script setup lang="ts">
import type { CentreSummary, LabelLookup } from '~/types/domain'
import { childName, formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ centre: CentreSummary; labels: LabelLookup }>()

const showUnassigned = ref(false)

/** A centre is only healthy if no room inside it is over — the average hides that. */
const tone = computed(() =>
  props.centre.roomsOverCapacity > 0
    ? 'over'
    : props.centre.placesAvailable === 0
      ? 'full'
      : 'healthy',
)
</script>

<template>
  <article class="card flex flex-col p-4">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="leading-tight font-semibold">{{ centre.centre.name }}</h3>
        <p class="text-xs text-ink-2">{{ pluralise(centre.classrooms.length, 'room') }}</p>
      </div>
      <p class="shrink-0 text-right">
        <span class="num block text-xl leading-none font-semibold">
          {{ formatPercent(centre.utilizationPct) }}
        </span>
        <span class="eyebrow">full</span>
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
        <dt class="eyebrow">Used</dt>
        <dd>{{ centre.placesUsed }}</dd>
      </div>
      <div class="flex items-baseline gap-1.5">
        <dt class="eyebrow">Free</dt>
        <dd>{{ centre.placesAvailable }}</dd>
      </div>
      <div class="flex items-baseline gap-1.5">
        <dt class="eyebrow">Cap</dt>
        <dd>{{ centre.capacity }}</dd>
      </div>
    </dl>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <UiStatusBadge
        v-if="centre.roomsOverCapacity"
        tone="over"
        :count="centre.roomsOverCapacity"
        label="over capacity"
      />
      <UiStatusBadge
        v-if="centre.unassigned.length"
        tone="unassigned"
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
        tone="ok"
        label="Nothing flagged"
      />
    </div>

    <!--
      Unassigned children belong to the centre, not to any room, so they are
      listed here rather than in the room table.
    -->
    <div v-if="centre.unassigned.length" class="mt-auto border-t border-rule pt-3">
      <button
        class="text-xs text-accent underline underline-offset-2"
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
          <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-unassigned" aria-hidden="true" />
          <span>
            {{ childName(occupant.child) }}
            <span class="text-xs text-ink-2">
              · {{ labels.ageGroups[occupant.ageGroup] ?? occupant.ageGroup }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </article>
</template>
