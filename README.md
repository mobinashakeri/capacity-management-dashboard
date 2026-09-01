# Capacity Management Dashboard

Turns the raw `capacity-overview` API into decisions an operations user can act on:
which room is over capacity, who has no classroom, who has outgrown their room.

**Live:** https://mobinashakeri.github.io/capacity-management-dashboard/

## Setup

Node 22.20+.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run verify     # lint + typecheck + 126 tests — the one command to run
npm run generate   # static build in .output/public
```

The API root is config, not a constant: `NUXT_PUBLIC_API_BASE` (defaults to the
workshape host).

## Architecture

```
API → useCapacityOverview → toAppError → pure derivation → view models → components
```

The API returns **raw records only** — no utilization, no warnings. Deriving those is
the actual work, so it lives in `app/utils/capacity/` as plain functions over plain
data: no Vue, no Nuxt, no fetch. That layer is imported explicitly, so its tests run in
bare Node with no Nuxt harness (126 tests in ~450 ms). Components receive finished view
models and do no arithmetic.

| Where             | What                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `utils/capacity/` | dates · places · summarise · exceptions · format                       |
| `utils/api/`      | capacity (the request) · errors (failure states) · month (URL parsing) |
| `composables/`    | `useCapacityOverview` (data) · `useSelectedMonth` (URL state)          |
| `components/`     | `ui/` primitives · `dashboard/` sections · `charts/`                   |

**The capacity rule.** A full-time enrolment takes one place; one three-day and one
two-day may share; an unpaired part-timer still takes a whole place. So
`used = F + max(T3, T2)`. Greedy pairing here is _exact_, not a heuristic: each pair
saves exactly one place and at most `min(T3, T2)` pairs exist.

## Assumptions

- **"Active" is a snapshot on `meta.effective_on`**, not an overlap with the month. A
  place is physical — a child leaving on the 3rd and one starting on the 5th never need
  the same chair. `ends_on` is inclusive.
- Dates are compared as `YYYY-MM-DD` strings, so no timezone can shift a boundary.
- Enrolment and assignment activity are independent: an active enrolment whose
  assignment ended is unassigned, not an occupant.
- An age-range mismatch is a warning and **the child still takes a place** — they are in
  the room; not counting them would hide real occupancy.
- `age_group` is trusted as given, never re-derived from date of birth (the observed
  bands have gaps).
- Availability is summed **per room**, never `capacity − used`. The naive subtraction
  lets an over-capacity room cancel free space elsewhere: 192 places are genuinely free
  _and_ 2 children are over their room's limit. Both are true.

## Trade-offs

- **SSG on GitHub Pages.** Public, read-only, single route — SSR buys nothing. CORS was
  verified open rather than assumed, so no proxy layer was needed.
- **No Pinia.** One route, one server-owned dataset, one piece of UI state (the month,
  which lives in the URL so it's shareable). It would earn its place with cross-route
  mutable state; there isn't any.
- **Hand-rolled components over a UI kit** — keeps the accessibility decisions explicit.
- **Room capacity is drawn as countable places, not a percentage bar.** A percentage says
  a room is at 110%; a row of places says it holds ten, eleven are in it, and one is past
  the wall.
- **Only two charts.** Per-room occupancy is plain HTML — the place grid in the table, a
  CSS bar on the centre cards — because sixteen chart instances would each bring an SVG
  renderer and a resize observer, and axes squeezed into a table row read as a smudge.
- **Nothing is plotted over time.** One response covers one month, so a trend line would
  have no data behind it — decoration shaped like insight.
- **ApexCharts, loaded on demand.** Registering it as a Nuxt plugin put the whole library
  in a modulepreload on every page load, ahead of numbers that read fine without it. The
  chart components import it themselves, cutting the critical path from 340 KB to 84 KB
  gzipped.

## Edge cases handled

Over capacity · age-range mismatch (still counted) · unassigned children · assignment
ended mid-enrolment · unknown classroom · zero-capacity room (`n/a`, no division by
zero) · empty-but-valid month · **422** for a rejected month · **500 for a month the API
lists as available** (`2026-01` does this — presented as a service problem, not the
user's mistake) · malformed `?month=` falls back to the current month.

## What I'd do next

- **A better month picker.** It's a native `<select>` today: correct and accessible, but
  plain. A custom listbox could show each month's status inline (a dot for months with
  rooms over capacity) and mark the one the API can't serve.
- **Split the attention panel by urgency.** It is one stacked list today, with the
  urgency only in a label. Two columns — _Act today_ (over capacity, no classroom) beside
  _Plan ahead_ (age range, filling up, room to grow) — would halve its height and put the
  priority in the layout itself rather than in words the eye has to read first.

- **A fuller rooms table.** Today it sorts by centre then room and filters by centre,
  nothing else. It wants: sort by utilization, by how far over a room is, or by places
  free; search across room, centre and child name — _"which room is Ivy Moore in?"_ is a
  real question it cannot answer today; filter by status and by accepted age group; a
  sticky header row; and sort and filters kept in the URL beside the month, so a view
  stays shareable. A "showing 12 of 16" line and a CSV export would round it out for
  taking into a planning meeting. **Pagination and row virtualisation** would be good to
  add as the group grows — sixteen rooms fit on one screen, but more data would need them.
- **The aging-out view.** Age mismatches climb 6 → 16 from August to December as children
  age into new bands while staying put. Listing who will fall outside their room's range
  by a chosen month is the most useful thing not built.
- **A year at a glance** — one row per month with capacity, used, over and mismatches, so
  pressure building across the year is visible without stepping month by month. There is
  no range parameter, so it means twelve requests filled in progressively, with `2026-01`
  degrading to an unavailable row rather than taking down the table.
- **An E2E smoke test over the error states.**
- **Centre, classroom and children pages, behind a sidebar.** All three are already in
  the one response, so this is navigation, not new endpoints — a children list would
  answer _"where is this child?"_, which the dashboard cannot today.
