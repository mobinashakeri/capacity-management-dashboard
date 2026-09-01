<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    /** Shown under the title; use it to state any caveat the chart cannot. */
    caption?: string
    /**
     * Plain-text equivalent for assistive tech. The chart itself is aria-hidden
     * because a screen reader cannot usefully traverse an SVG plot - the same
     * numbers are in the tables below, and this sentence gives the shape.
     */
    summary: string
    height?: number
  }>(),
  { caption: undefined, height: 260 },
)
</script>

<template>
  <figure class="rounded-lg border border-line bg-card p-4">
    <figcaption>
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p v-if="caption" class="mt-0.5 text-xs text-ink-muted">{{ caption }}</p>
    </figcaption>

    <p class="sr-only">{{ summary }}</p>

    <div class="mt-2" :style="{ minHeight: `${height}px` }" aria-hidden="true">
      <ClientOnly>
        <slot />
        <template #fallback>
          <!-- Reserves the chart's height so nothing shifts when it hydrates. -->
          <div class="animate-pulse rounded-md bg-page" :style="{ height: `${height}px` }" />
        </template>
      </ClientOnly>
    </div>
  </figure>
</template>
