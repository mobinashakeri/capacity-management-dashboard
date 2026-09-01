<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-16">
    <h1 class="text-2xl font-semibold tracking-tight">Capacity Management Dashboard</h1>
    <p class="mt-2 text-ink-muted">
      Scaffold deployed. API base:
      <code class="rounded bg-card px-1.5 py-0.5 ring-1 ring-line">{{
        config.public.apiBase
      }}</code>
    </p>
  </main>
</template>
