<script setup lang="ts">
import type { CentreSummary, LabelLookup } from '~/types/domain'
import { childName, formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ centre: CentreSummary; labels: LabelLookup }>()

const showUnassigned = ref(false)

/** A centre is only "healthy" if no room inside it is over - the average can hide that. */
const tone = computed(() =>
  props.centre.roomsOverCapacity > 0
    ? 'over'
    : props.centre.placesAvailable === 0
      ? 'full'
      : 'healthy',
)
</script>

<template>
  <article class="rounded-lg border border-line bg-card p-4">
    <header class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold">{{ centre.centre.name }}</h3>
        <p class="text-xs text-ink-muted">
          {{ pluralise(centre.classrooms.length, 'classroom') }}
        </p>
      </div>
      <span class="text-right">
        <span class="block text-xl font-semibold tabular-nums">
          {{ formatPercent(centre.utilizationPct) }}
        </span>
        <span class="text-xs text-ink-muted">utilized</span>
      </span>
    </header>

    <UiCapacityBar
      class="mt-3"
      :places-used="centre.placesUsed"
      :capacity="centre.capacity"
      :status="tone"
    />

    <dl class="mt-3 grid grid-cols-3 gap-2 text-sm">
      <div>
        <dt class="text-xs text-ink-muted">Used</dt>
        <dd class="tabular-nums">{{ centre.placesUsed }}</dd>
      </div>
      <div>
        <dt class="text-xs text-ink-muted">Available</dt>
        <dd class="tabular-nums">{{ centre.placesAvailable }}</dd>
      </div>
      <div>
        <dt class="text-xs text-ink-muted">Capacity</dt>
        <dd class="tabular-nums">{{ centre.capacity }}</dd>
      </div>
    </dl>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <UiStatusBadge
        v-if="centre.roomsOverCapacity"
        tone="critical"
        :label="`${centre.roomsOverCapacity} over capacity`"
      />
      <UiStatusBadge
        v-if="centre.ageMismatchCount"
        tone="warning"
        :label="`${centre.ageMismatchCount} outside age range`"
      />
      <UiStatusBadge
        v-if="centre.unassigned.length"
        tone="warning"
        :label="`${centre.unassigned.length} unassigned`"
      />
      <UiStatusBadge
        v-if="!centre.roomsOverCapacity && !centre.ageMismatchCount && !centre.unassigned.length"
        tone="ok"
        label="No exceptions"
      />
    </div>

    <!--
      Unassigned children belong to the centre, not to any room, so they are
      listed here rather than in the classroom table.
    -->
    <div v-if="centre.unassigned.length" class="mt-3 border-t border-line pt-3">
      <button
        class="text-sm text-ink-muted underline underline-offset-2"
        :aria-expanded="showUnassigned"
        @click="showUnassigned = !showUnassigned"
      >
        {{ showUnassigned ? 'Hide' : 'Show' }} unassigned children
      </button>
      <ul v-if="showUnassigned" class="mt-2 space-y-1 text-sm">
        <li v-for="occupant in centre.unassigned" :key="occupant.enrolmentId">
          {{ childName(occupant.child) }}
          <span class="text-xs text-ink-muted">
            · {{ labels.ageGroups[occupant.ageGroup] ?? occupant.ageGroup }}
          </span>
        </li>
      </ul>
    </div>
  </article>
</template>
