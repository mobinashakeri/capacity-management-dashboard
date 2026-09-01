<script setup lang="ts">
import type { CapacityException, LabelLookup } from '~/types/domain'
import { ageGroupLabel, childName, formatPercent, pluralise } from '~/utils/capacity/format'
import { countBySeverity } from '~/utils/capacity/exceptions'

const props = defineProps<{ exceptions: CapacityException[]; labels: LabelLookup }>()

const counts = computed(() => countBySeverity(props.exceptions))

/**
 * Info-level entries are opportunities rather than problems, so they start
 * collapsed - the panel opens on what needs doing, not on everything known.
 */
const showInfo = ref(false)

const visible = computed(() =>
  showInfo.value
    ? props.exceptions
    : props.exceptions.filter((exception) => exception.severity !== 'info'),
)

const infoCount = computed(() => counts.value.info)

const TONE = { critical: 'critical', warning: 'warning', info: 'info' } as const

/**
 * The badge names the kind of problem, not the severity - the severity is
 * already carried by the colour, the icon and the ordering, so repeating it as
 * text would spend the badge on nothing.
 */
const CATEGORY: Record<CapacityException['kind'], string> = {
  over_capacity: 'Over capacity',
  age_group_mismatch: 'Age range',
  unassigned_child: 'Unassigned',
  data_integrity: 'Data',
  near_capacity: 'Filling up',
  pairing_opportunity: 'Opportunity',
}

function headline(exception: CapacityException): string {
  switch (exception.kind) {
    case 'over_capacity':
      return `${exception.classroom.name} is over capacity by ${exception.overBy}`
    case 'age_group_mismatch':
      return `${childName(exception.occupant.child)} is outside ${exception.classroom.name}’s age range`
    case 'unassigned_child':
      return `${childName(exception.occupant.child)} has no classroom`
    case 'near_capacity':
      return `${exception.classroom.name} is ${formatPercent(exception.utilizationPct)} full`
    case 'pairing_opportunity':
      return `${exception.classroom.name} has ${pluralise(exception.opportunity.count, 'unpaired part-time place')}`
    case 'data_integrity':
      return 'Unexpected data in this month'
  }
}

function detail(exception: CapacityException): string {
  switch (exception.kind) {
    case 'over_capacity':
      return `${exception.placesUsed} places used against a capacity of ${exception.capacity}. Move a child or raise the room limit.`
    case 'age_group_mismatch':
      return `${ageGroupLabel(props.labels, exception.occupant.ageGroup)}, in a room for ${exception.acceptedAgeGroupIds
        .map((id) => ageGroupLabel(props.labels, id))
        .join(' or ')}. They still take a place here.`
    case 'unassigned_child':
      return exception.reason === 'assignment_ended'
        ? 'Their classroom assignment has ended. Not counted against any room.'
        : exception.reason === 'unknown_classroom'
          ? 'Assigned to a classroom missing from this month’s data. Not counted against any room.'
          : 'Enrolled but never assigned to a classroom. Not counted against any room.'
    case 'near_capacity':
      return `${pluralise(exception.placesAvailable, 'place')} left.`
    case 'pairing_opportunity':
      return `Adding ${pluralise(exception.opportunity.count, 'child', 'children')} at ${
        props.labels.attendanceTypes[exception.opportunity.needs]?.label ??
        exception.opportunity.needs
      } would use existing places rather than new ones.`
    case 'data_integrity':
      return exception.detail
  }
}

function where(exception: CapacityException): string | null {
  return 'classroom' in exception
    ? `${exception.centre.name} · ${exception.classroom.name}`
    : 'centre' in exception
      ? exception.centre.name
      : null
}
</script>

<template>
  <section aria-labelledby="attention-heading" class="rounded-lg border border-line bg-card">
    <header
      class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"
    >
      <h2 id="attention-heading" class="text-base font-semibold">Needs attention</h2>

      <div class="flex flex-wrap items-center gap-2">
        <UiStatusBadge
          v-if="counts.critical"
          tone="critical"
          :label="pluralise(counts.critical, 'over capacity', 'over capacity')"
        />
        <UiStatusBadge
          v-if="counts.warning"
          tone="warning"
          :label="pluralise(counts.warning, 'warning')"
        />
        <UiStatusBadge v-if="!counts.critical && !counts.warning" tone="ok" label="All clear" />
      </div>
    </header>

    <p v-if="!visible.length" class="px-4 py-8 text-center text-sm text-ink-muted">
      Nothing needs attention this month.
    </p>

    <ul v-else class="divide-y divide-line">
      <li v-for="exception in visible" :key="exception.id" class="flex gap-3 px-4 py-3">
        <UiStatusBadge
          :tone="TONE[exception.severity]"
          :label="CATEGORY[exception.kind]"
          class="mt-0.5 w-28 shrink-0 justify-center"
        />
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ headline(exception) }}</p>
          <p class="mt-0.5 text-sm text-ink-muted">{{ detail(exception) }}</p>
          <p v-if="where(exception)" class="mt-0.5 text-xs text-ink-muted">
            {{ where(exception) }}
          </p>
        </div>
      </li>
    </ul>

    <footer v-if="infoCount" class="border-t border-line px-4 py-2">
      <button
        class="text-sm text-ink-muted underline underline-offset-2"
        :aria-expanded="showInfo"
        @click="showInfo = !showInfo"
      >
        {{ showInfo ? 'Hide' : 'Show' }} {{ pluralise(infoCount, 'opportunity', 'opportunities') }}
      </button>
    </footer>
  </section>
</template>
