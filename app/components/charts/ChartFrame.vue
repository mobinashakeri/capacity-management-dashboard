<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    /** Shown under the title; use it to state a caveat the chart cannot. */
    caption?: string
    /**
     * Plain-text equivalent. The plot is aria-hidden because a screen reader
     * cannot usefully traverse an SVG — the same numbers sit in the tables, and
     * this sentence gives the shape.
     */
    summary: string
    height?: number
  }>(),
  { caption: undefined, height: 280 },
)
</script>

<template>
  <figure class="card flex min-w-0 flex-col p-4">
    <figcaption>
      <h3 class="text-base font-semibold">{{ title }}</h3>
      <p v-if="caption" class="mt-1 max-w-prose text-xs text-body">{{ caption }}</p>
    </figcaption>

    <p class="sr-only">{{ summary }}</p>

    <div class="mt-3 min-w-0" :style="{ minHeight: `${height}px` }" aria-hidden="true">
      <ClientOnly>
        <slot />
        <template #fallback>
          <!-- Reserves the plot's height so nothing shifts when it hydrates. -->
          <div class="animate-pulse rounded bg-line-soft" :style="{ height: `${height}px` }" />
        </template>
      </ClientOnly>
    </div>
  </figure>
</template>
