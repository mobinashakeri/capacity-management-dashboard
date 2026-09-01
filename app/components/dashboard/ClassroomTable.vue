<script setup lang="ts">
import type { ClassroomSummary, LabelLookup } from '~/types/domain'
import {
  ageGroupLabel,
  capacityDescription,
  formatPercent,
  pluralise,
} from '~/utils/capacity/format'

const props = defineProps<{ classrooms: ClassroomSummary[]; labels: LabelLookup }>()

const centreFilter = ref<string>('all')

const centres = computed(() => {
  const seen = new Map<string, string>()
  for (const room of props.classrooms) seen.set(room.centre.id, room.centre.name)
  return [...seen].map(([id, name]) => ({ id, name }))
})

const rows = computed(() =>
  centreFilter.value === 'all'
    ? props.classrooms
    : props.classrooms.filter((room) => room.centre.id === centreFilter.value),
)

const expanded = ref(new Set<string>())

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (!next.delete(id)) next.add(id)
  expanded.value = next
}

const STATUS_TONE = {
  over: 'critical',
  full: 'warning',
  healthy: 'ok',
  empty: 'neutral',
} as const

const STATUS_LABEL = {
  over: 'Over capacity',
  full: 'Nearly full',
  healthy: 'Healthy',
  empty: 'Empty',
} as const

function acceptedGroups(room: ClassroomSummary): string {
  return room.classroom.accepted_age_group_ids
    .map((id) => ageGroupLabel(props.labels, id))
    .join(', ')
}
</script>

<template>
  <section aria-labelledby="classrooms-heading" class="rounded-lg border border-line bg-card">
    <header
      class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3"
    >
      <h2 id="classrooms-heading" class="text-base font-semibold">Classrooms</h2>

      <label class="text-sm">
        <span class="mr-2 text-ink-muted">Centre</span>
        <select
          v-model="centreFilter"
          class="rounded-md border border-line-strong bg-card px-2 py-1"
        >
          <option value="all">All centres</option>
          <option v-for="centre in centres" :key="centre.id" :value="centre.id">
            {{ centre.name }}
          </option>
        </select>
      </label>
    </header>

    <!--
      Desktop: a real table, so the data keeps its row/column relationships for
      assistive tech and can be scanned column-wise.
    -->
    <div class="hidden overflow-x-auto md:block">
      <table class="w-full text-sm">
        <caption class="sr-only">
          Classroom capacity and utilization,
          {{
            rows.length
          }}
          rooms
        </caption>
        <thead class="border-b border-line text-left text-xs text-ink-muted">
          <tr>
            <th scope="col" class="px-4 py-2 font-medium">Classroom</th>
            <th scope="col" class="px-4 py-2 font-medium">Age groups</th>
            <th scope="col" class="px-4 py-2 text-right font-medium">Capacity</th>
            <th scope="col" class="px-4 py-2 text-right font-medium">Used</th>
            <th scope="col" class="px-4 py-2 text-right font-medium">Available</th>
            <th scope="col" class="px-4 py-2 font-medium">Utilization</th>
            <th scope="col" class="px-4 py-2 font-medium">Status</th>
            <th scope="col" class="px-4 py-2"><span class="sr-only">Children</span></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-line">
          <template v-for="room in rows" :key="room.classroom.id">
            <tr :class="room.status === 'over' && 'bg-status-over-bg/40'">
              <th scope="row" class="px-4 py-2.5 text-left font-medium">
                {{ room.classroom.name }}
                <span class="block text-xs font-normal text-ink-muted">{{ room.centre.name }}</span>
              </th>
              <td class="px-4 py-2.5 text-ink-muted">{{ acceptedGroups(room) }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums">{{ room.capacity }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums">
                {{ room.usage.placesUsed }}
                <span
                  v-if="room.usage.headcount !== room.usage.placesUsed"
                  class="text-xs text-ink-muted"
                  :title="`${room.usage.headcount} children sharing ${room.usage.placesUsed} places`"
                >
                  ({{ room.usage.headcount }})
                </span>
              </td>
              <td class="px-4 py-2.5 text-right tabular-nums">
                <span v-if="room.overBy" class="font-medium text-status-over-text">
                  +{{ room.overBy }} over
                </span>
                <span v-else>{{ room.placesAvailable }}</span>
              </td>
              <td class="w-40 px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <UiCapacityBar
                    compact
                    :places-used="room.usage.placesUsed"
                    :capacity="room.capacity"
                    :status="room.status"
                  />
                  <span class="w-12 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                    {{ formatPercent(room.utilizationPct) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex flex-wrap gap-1">
                  <UiStatusBadge
                    :tone="STATUS_TONE[room.status]"
                    :label="STATUS_LABEL[room.status]"
                  />
                  <UiStatusBadge
                    v-if="room.ageMismatchCount"
                    tone="warning"
                    :label="`${room.ageMismatchCount} age`"
                  />
                </div>
              </td>
              <td class="px-4 py-2.5 text-right">
                <button
                  class="rounded-md border border-line-strong px-2 py-1 text-xs whitespace-nowrap hover:bg-page"
                  :aria-expanded="expanded.has(room.classroom.id)"
                  :aria-controls="`occupants-${room.classroom.id}`"
                  @click="toggle(room.classroom.id)"
                >
                  {{ expanded.has(room.classroom.id) ? 'Hide' : 'Show' }}
                  {{ pluralise(room.usage.headcount, 'child', 'children') }}
                </button>
              </td>
            </tr>

            <!--
              Kept in the DOM and hidden rather than removed, so the aria-controls
              on the toggle always points at an element that exists.
            -->
            <tr v-show="expanded.has(room.classroom.id)">
              <td :id="`occupants-${room.classroom.id}`" colspan="8" class="bg-page px-4 py-3">
                <DashboardOccupantList :occupants="room.occupants" :labels="labels" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!--
      Mobile: a list of cards rather than a horizontally scrolling table. An
      operator on a phone should never have to pan sideways to find the flag
      telling them a room is over capacity.
    -->
    <ul class="divide-y divide-line md:hidden">
      <li v-for="room in rows" :key="room.classroom.id" class="px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium">{{ room.classroom.name }}</p>
            <p class="text-xs text-ink-muted">{{ room.centre.name }}</p>
          </div>
          <UiStatusBadge :tone="STATUS_TONE[room.status]" :label="STATUS_LABEL[room.status]" />
        </div>

        <div class="mt-2 flex items-center gap-2">
          <UiCapacityBar
            :places-used="room.usage.placesUsed"
            :capacity="room.capacity"
            :status="room.status"
          />
          <span class="shrink-0 text-xs tabular-nums text-ink-muted">
            {{ formatPercent(room.utilizationPct) }}
          </span>
        </div>

        <p class="mt-1.5 text-xs text-ink-muted">
          {{ capacityDescription(room.usage.placesUsed, room.capacity) }}
          <template v-if="room.ageMismatchCount">
            · {{ room.ageMismatchCount }} outside age range
          </template>
        </p>

        <button
          class="mt-2 rounded-md border border-line-strong px-2 py-1 text-xs"
          :aria-expanded="expanded.has(room.classroom.id)"
          :aria-controls="`occupants-m-${room.classroom.id}`"
          @click="toggle(room.classroom.id)"
        >
          {{ expanded.has(room.classroom.id) ? 'Hide' : 'Show' }}
          {{ pluralise(room.usage.headcount, 'child', 'children') }}
        </button>

        <div
          v-show="expanded.has(room.classroom.id)"
          :id="`occupants-m-${room.classroom.id}`"
          class="mt-3"
        >
          <DashboardOccupantList :occupants="room.occupants" :labels="labels" />
        </div>
      </li>
    </ul>
  </section>
</template>
