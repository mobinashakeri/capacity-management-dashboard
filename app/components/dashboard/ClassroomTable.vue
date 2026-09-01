<script setup lang="ts">
import type { ClassroomSummary, LabelLookup } from '~/types/domain'
import { ageGroupLabel, formatPercent, pluralise } from '~/utils/capacity/format'

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
  over: 'alert',
  full: 'warn',
  healthy: 'good',
  empty: 'muted',
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
  <section aria-labelledby="classrooms-heading" class="card overflow-hidden">
    <header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
      <h2 id="classrooms-heading" class="text-base font-semibold">Rooms</h2>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <!-- One legend for the whole table, so rows stay uncluttered. -->
        <ul class="hidden items-center gap-3.5 text-xs text-body xl:flex" aria-hidden="true">
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full bg-brand" />taken
          </li>
          <li class="flex items-center gap-1.5">
            <span
              class="size-2.5 rounded-full [background:linear-gradient(135deg,var(--color-brand)_0_46%,#fff_46%_54%,var(--color-brand)_54%_100%)]"
            />shared
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full bg-brand-pale" />free
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full bg-alert" />over
          </li>
        </ul>

        <label class="flex items-center gap-2 text-sm">
          <span class="label">Centre</span>
          <select
            v-model="centreFilter"
            class="rounded-soft border border-line-strong bg-white px-3 py-1.5 text-sm text-navy"
          >
            <option value="all">All centres</option>
            <option v-for="centre in centres" :key="centre.id" :value="centre.id">
              {{ centre.name }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <!--
      Desktop: a real table, so rows and columns keep their relationships for
      assistive tech and the eye can scan a single column down the page.
    -->
    <div class="hidden overflow-x-auto border-t border-line-soft lg:block">
      <table class="w-full text-sm">
        <caption class="sr-only">
          Room capacity and occupancy,
          {{
            rows.length
          }}
          rooms
        </caption>
        <thead class="text-left">
          <tr class="border-b border-line-soft">
            <th scope="col" class="label px-4 py-2.5 sm:px-5">Room</th>
            <th scope="col" class="label px-2 py-2.5">Takes</th>
            <th scope="col" class="label px-2 py-2.5">Places</th>
            <th scope="col" class="label px-2 py-2.5 text-right">Cap</th>
            <th scope="col" class="label px-2 py-2.5 text-right">Used</th>
            <th scope="col" class="label px-2 py-2.5 text-right">Free</th>
            <th scope="col" class="label px-2 py-2.5">Status</th>
            <th scope="col" class="px-4 py-2.5 sm:px-5"><span class="sr-only">Children</span></th>
          </tr>
        </thead>

        <tbody>
          <template v-for="room in rows" :key="room.classroom.id">
            <tr
              class="border-b border-line-soft align-middle"
              :class="room.status === 'over' && 'bg-alert-tint/40'"
            >
              <th scope="row" class="px-5 py-3.5 text-left font-normal sm:px-6">
                <span class="figure block text-base leading-tight font-semibold">
                  {{ room.classroom.name }}
                </span>
                <span class="block text-xs text-body">{{ room.centre.name }}</span>
              </th>

              <td class="max-w-44 px-2 py-3.5 text-xs text-body">{{ acceptedGroups(room) }}</td>

              <td class="px-2 py-3">
                <div class="max-w-44">
                  <UiPlaceGrid compact :usage="room.usage" :capacity="room.capacity" />
                </div>
              </td>

              <td class="num px-2 py-3.5 text-right text-body">{{ room.capacity }}</td>

              <td class="num px-2 py-3.5 text-right text-navy">
                {{ room.usage.placesUsed }}
                <span
                  v-if="room.usage.headcount !== room.usage.placesUsed"
                  class="text-xs text-body"
                  :title="`${room.usage.headcount} children sharing ${room.usage.placesUsed} places`"
                >
                  ({{ room.usage.headcount }})
                </span>
              </td>

              <td class="num px-2 py-3.5 text-right text-navy">
                <span v-if="room.overBy > 0" class="font-semibold text-alert-ink">
                  +{{ room.overBy }}
                </span>
                <span v-else :class="room.placesAvailable === 0 && 'text-body'">
                  {{ room.placesAvailable }}
                </span>
              </td>

              <td class="px-2 py-3.5">
                <div class="flex flex-col items-start gap-1.5">
                  <UiStatusBadge
                    :tone="STATUS_TONE[room.status]"
                    :label="STATUS_LABEL[room.status]"
                  />
                  <UiStatusBadge
                    v-if="room.ageMismatchCount"
                    tone="warn"
                    :count="room.ageMismatchCount"
                    label="outside range"
                  />
                </div>
              </td>

              <td class="px-5 py-3.5 text-right sm:px-6">
                <button
                  class="rounded-full border border-line px-3 py-1.5 text-xs whitespace-nowrap text-brand-ink transition-colors hover:bg-brand-tint"
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
            <tr v-show="expanded.has(room.classroom.id)" class="border-b border-line-soft">
              <td
                :id="`occupants-${room.classroom.id}`"
                colspan="8"
                class="bg-line-soft/60 px-5 py-4 sm:px-6"
              >
                <DashboardOccupantList :occupants="room.occupants" :labels="labels" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!--
      Below md: a list of cards. An operator holding a phone in a corridor should
      never pan sideways to find the flag saying a room is over its limit.
    -->
    <ul class="border-t border-line-soft lg:hidden">
      <li
        v-for="room in rows"
        :key="room.classroom.id"
        class="border-b border-line-soft last:border-b-0"
      >
        <div class="px-4 py-3.5" :class="room.status === 'over' && 'bg-alert-tint/40'">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="figure text-lg leading-tight font-semibold">{{ room.classroom.name }}</p>
              <p class="text-xs text-body">{{ room.centre.name }}</p>
            </div>
            <UiStatusBadge :tone="STATUS_TONE[room.status]" :label="STATUS_LABEL[room.status]" />
          </div>

          <div class="mt-3">
            <UiPlaceGrid :usage="room.usage" :capacity="room.capacity" />
          </div>

          <dl class="num mt-3.5 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-navy">
            <div class="flex gap-1.5">
              <dt class="text-xs text-body">Cap</dt>
              <dd>{{ room.capacity }}</dd>
            </div>
            <div class="flex gap-1.5">
              <dt class="text-xs text-body">Used</dt>
              <dd>{{ room.usage.placesUsed }}</dd>
            </div>
            <div class="flex gap-1.5">
              <dt class="text-xs text-body">{{ room.overBy > 0 ? 'Over' : 'Free' }}</dt>
              <dd :class="room.overBy > 0 && 'font-semibold text-alert-ink'">
                {{ room.overBy > 0 ? `+${room.overBy}` : room.placesAvailable }}
              </dd>
            </div>
            <div class="flex gap-1.5">
              <dt class="text-xs text-body">Full</dt>
              <dd>{{ formatPercent(room.utilizationPct) }}</dd>
            </div>
          </dl>

          <div v-if="room.ageMismatchCount" class="mt-2">
            <UiStatusBadge tone="warn" :count="room.ageMismatchCount" label="outside age range" />
          </div>

          <button
            class="mt-3.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-brand-ink"
            :aria-expanded="expanded.has(room.classroom.id)"
            :aria-controls="`occupants-m-${room.classroom.id}`"
            @click="toggle(room.classroom.id)"
          >
            {{ expanded.has(room.classroom.id) ? 'Hide' : 'Show' }}
            {{ pluralise(room.usage.headcount, 'child', 'children') }}
          </button>
        </div>

        <div
          v-show="expanded.has(room.classroom.id)"
          :id="`occupants-m-${room.classroom.id}`"
          class="border-t border-line-soft bg-line-soft/60 px-5 py-4"
        >
          <DashboardOccupantList :occupants="room.occupants" :labels="labels" />
        </div>
      </li>
    </ul>
  </section>
</template>
