<script setup lang="ts">
import type { CapacityException, LabelLookup } from '~/types/domain'
import { ageGroupLabel, childName, formatPercent, pluralise } from '~/utils/capacity/format'

const props = defineProps<{ exceptions: CapacityException[]; labels: LabelLookup }>()

type Kind = CapacityException['kind']
type Urgency = 'act' | 'review' | 'note'

/**
 * Urgency is not the same as severity.
 *
 * A room over its limit and a child with nowhere to sit are things to act on
 * today. Ten children drifting past their room's age range are real, but they
 * are a plan for next term — and left in one flat list they bury the two that
 * matter. Grouping by type, ordered by urgency, keeps the loud things loud
 * without hiding the quiet ones.
 */
const GROUPS: { kind: Kind; title: string; urgency: Urgency; tone: string }[] = [
  { kind: 'over_capacity', title: 'Over capacity', urgency: 'act', tone: 'over' },
  { kind: 'unassigned_child', title: 'No classroom', urgency: 'act', tone: 'unassigned' },
  { kind: 'data_integrity', title: 'Unexpected data', urgency: 'review', tone: 'warn' },
  { kind: 'age_group_mismatch', title: 'Outside age range', urgency: 'note', tone: 'warn' },
  { kind: 'near_capacity', title: 'Filling up', urgency: 'note', tone: 'idle' },
  { kind: 'pairing_opportunity', title: 'Room to grow', urgency: 'note', tone: 'idle' },
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

const TONE_CLASS: Record<string, { rule: string; text: string; chip: string }> = {
  over: { rule: 'bg-over', text: 'text-over-text', chip: 'bg-over-tint text-over-text' },
  unassigned: {
    rule: 'bg-unassigned',
    text: 'text-unassigned-text',
    chip: 'bg-unassigned-tint text-unassigned-text',
  },
  warn: { rule: 'bg-warn', text: 'text-warn-text', chip: 'bg-warn-tint text-warn-text' },
  idle: { rule: 'bg-idle', text: 'text-idle-text', chip: 'bg-idle-tint text-idle-text' },
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
    <header
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5"
    >
      <h2 id="attention-heading" class="text-base font-semibold">Needs attention</h2>
      <p class="text-xs text-ink-2">
        <template v-if="actCount">
          <span class="num font-semibold text-over-text">{{ actCount }}</span> to act on today
        </template>
        <template v-else-if="groups.length">Nothing urgent</template>
      </p>
    </header>

    <p v-if="!groups.length" class="border-t border-rule px-4 py-10 text-center text-sm text-ink-2">
      Nothing needs attention this month.
    </p>

    <ul v-else class="border-t border-rule">
      <li v-for="group in groups" :key="group.kind" class="border-b border-rule last:border-b-0">
        <h3>
          <button
            class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ground/60 sm:px-5"
            :aria-expanded="open.has(group.kind)"
            :aria-controls="`group-${group.kind}`"
            @click="toggle(group.kind)"
          >
            <!-- A coloured rule, not just a tinted word: urgency has a shape. -->
            <span
              class="h-7 w-1 shrink-0 rounded-full"
              :class="TONE_CLASS[group.tone]!.rule"
              aria-hidden="true"
            />

            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-baseline gap-x-2">
                <span class="font-medium" :class="group.urgency === 'act' && 'font-semibold'">
                  {{ group.title }}
                </span>
                <span
                  class="eyebrow"
                  :class="group.urgency === 'act' && TONE_CLASS[group.tone]!.text"
                >
                  {{ URGENCY_LABEL[group.urgency] }}
                </span>
              </span>
            </span>

            <span
              class="num shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="TONE_CLASS[group.tone]!.chip"
            >
              {{ group.items.length }}
            </span>

            <span
              class="shrink-0 text-ink-2 transition-transform"
              :class="open.has(group.kind) && 'rotate-90'"
              aria-hidden="true"
              >›</span
            >
          </button>
        </h3>

        <!-- Kept in the DOM so aria-controls always resolves. -->
        <div v-show="open.has(group.kind)" :id="`group-${group.kind}`" class="bg-ground/50">
          <ul class="divide-y divide-rule border-t border-rule">
            <li
              v-for="exception in group.items"
              :key="exception.id"
              class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 pl-8 sm:px-5 sm:pl-9"
            >
              <p class="text-sm font-medium">{{ headline(exception) }}</p>
              <p v-if="where(exception)" class="num text-xs text-ink-2">{{ where(exception) }}</p>
              <p class="w-full text-xs text-ink-2">{{ detail(exception) }}</p>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>
