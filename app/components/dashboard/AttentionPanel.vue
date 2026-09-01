<script setup lang="ts">
import type { CapacityException, LabelLookup } from '~/types/domain'
import { ageGroupLabel, childName, formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ exceptions: CapacityException[]; labels: LabelLookup }>()

type Kind = CapacityException['kind']
type Urgency = 'act' | 'review' | 'note'
type Tone = 'alert' | 'warn' | 'brand'

/**
 * Urgency is not the same as severity.
 *
 * A room over its limit and a child with nowhere to sit are things to act on
 * today. Ten children drifting past their room's age range are real, but they
 * are a plan for next term — and left in one flat list they bury the two that
 * matter. Grouping by type, ordered by urgency, keeps the loud things loud
 * without hiding the quiet ones.
 */
const GROUPS: { kind: Kind; title: string; urgency: Urgency; tone: Tone }[] = [
  { kind: 'over_capacity', title: 'Over capacity', urgency: 'act', tone: 'alert' },
  { kind: 'unassigned_child', title: 'No classroom', urgency: 'act', tone: 'alert' },
  { kind: 'data_integrity', title: 'Unexpected data', urgency: 'review', tone: 'warn' },
  { kind: 'age_group_mismatch', title: 'Outside age range', urgency: 'note', tone: 'warn' },
  { kind: 'near_capacity', title: 'Filling up', urgency: 'note', tone: 'brand' },
  { kind: 'pairing_opportunity', title: 'Room to grow', urgency: 'note', tone: 'brand' },
]

const URGENCY_LABEL: Record<Urgency, string> = {
  act: 'Act today',
  review: 'Review',
  note: 'Plan ahead',
}

const groups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    items: props.exceptions.filter((exception) => exception.kind === group.kind),
  })).filter((group) => group.items.length > 0),
)

const actCount = computed(() =>
  groups.value
    .filter((group) => group.urgency === 'act')
    .reduce((sum, group) => sum + group.items.length, 0),
)

/** Every group starts closed; the counts in the headers carry the signal. */
const open = ref(new Set<Kind>())

function toggle(kind: Kind) {
  const next = new Set(open.value)
  if (!next.delete(kind)) next.add(kind)
  open.value = next
}

const TONE_CLASS: Record<Tone, { dot: string; text: string; chip: string; row: string }> = {
  alert: {
    dot: 'bg-alert',
    text: 'text-alert-ink',
    chip: 'bg-alert text-white',
    row: 'bg-alert-tint/45',
  },
  warn: {
    dot: 'bg-warn ring-1 ring-warn-ink/40',
    text: 'text-warn-ink',
    chip: 'bg-warn-tint text-warn-ink',
    row: 'bg-warn-tint/40',
  },
  brand: {
    dot: 'bg-brand',
    text: 'text-brand-ink',
    chip: 'bg-brand-tint text-brand-ink',
    row: 'bg-brand-tint/40',
  },
}

function headline(exception: CapacityException): string {
  switch (exception.kind) {
    case 'over_capacity':
      return `${exception.classroom.name} holds ${exception.placesUsed} in ${exception.capacity} places`
    case 'age_group_mismatch':
      return childName(exception.occupant.child)
    case 'unassigned_child':
      return childName(exception.occupant.child)
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
      return `Over by ${exception.overBy}. Move a child, or raise the room’s limit.`
    case 'age_group_mismatch':
      return `${ageGroupLabel(props.labels, exception.occupant.ageGroup)}, in a room for ${exception.acceptedAgeGroupIds
        .map((id) => ageGroupLabel(props.labels, id))
        .join(' or ')}. Still takes a place here.`
    case 'unassigned_child':
      return exception.reason === 'assignment_ended'
        ? 'Their classroom assignment has ended. Counted against no room.'
        : exception.reason === 'unknown_classroom'
          ? 'Assigned to a room missing from this month. Counted against no room.'
          : 'Enrolled, never placed in a room. Counted against no room.'
    case 'near_capacity':
      return `${pluralise(exception.placesAvailable, 'place')} left.`
    case 'pairing_opportunity':
      return `${pluralise(exception.opportunity.count, 'child', 'children')} at ${
        props.labels.attendanceTypes[exception.opportunity.needs]?.label ??
        exception.opportunity.needs
      } would fit without using a new place.`
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
  <section aria-labelledby="attention-heading" class="card overflow-hidden">
    <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6">
      <h2 id="attention-heading" class="text-base font-semibold">Needs attention</h2>
      <p v-if="actCount" class="text-xs text-body">
        <span class="figure text-sm font-semibold text-alert-ink">{{ actCount }}</span>
        to act on today
      </p>
      <p v-else-if="groups.length" class="text-xs text-body">Nothing urgent</p>
    </header>

    <div v-if="!groups.length" class="px-5 pb-10 text-center">
      <p class="mx-auto grid size-12 place-items-center rounded-full bg-good-tint text-good-ink">
        <span aria-hidden="true">✓</span>
      </p>
      <p class="mt-3 text-sm text-body">Nothing needs attention this month.</p>
    </div>

    <ul v-else class="px-3 pb-3 sm:px-4 sm:pb-4">
      <li v-for="group in groups" :key="group.kind" class="mb-1.5 last:mb-0">
        <h3>
          <button
            class="flex w-full items-center gap-3 rounded-soft px-3 py-3 text-left transition-colors hover:bg-line-soft sm:px-3.5"
            :class="group.urgency === 'act' && TONE_CLASS[group.tone].row"
            :aria-expanded="open.has(group.kind)"
            :aria-controls="`group-${group.kind}`"
            @click="toggle(group.kind)"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :class="TONE_CLASS[group.tone].dot"
              aria-hidden="true"
            />

            <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <span
                class="font-display text-sm font-semibold text-navy"
                :class="group.urgency === 'act' && TONE_CLASS[group.tone].text"
              >
                {{ group.title }}
              </span>
              <span class="text-xs text-body">{{ URGENCY_LABEL[group.urgency] }}</span>
            </span>

            <span
              class="num shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="TONE_CLASS[group.tone].chip"
            >
              {{ group.items.length }}
            </span>

            <span
              class="shrink-0 text-body transition-transform"
              :class="open.has(group.kind) && 'rotate-90'"
              aria-hidden="true"
              >›</span
            >
          </button>
        </h3>

        <!-- Kept in the DOM so aria-controls always resolves. -->
        <div v-show="open.has(group.kind)" :id="`group-${group.kind}`">
          <ul class="mt-1 space-y-1 pl-6 sm:pl-8">
            <li
              v-for="exception in group.items"
              :key="exception.id"
              class="rounded-soft bg-line-soft/70 px-3.5 py-2.5"
            >
              <div class="flex flex-wrap items-baseline gap-x-2.5">
                <p class="text-sm font-medium text-navy">{{ headline(exception) }}</p>
                <p v-if="where(exception)" class="text-xs text-body">{{ where(exception) }}</p>
              </div>
              <p class="mt-0.5 text-xs text-body">{{ detail(exception) }}</p>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>
