import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// The capacity logic is deliberately framework-free, so it runs in a plain node
// environment with no Nuxt test harness - which keeps the suite near-instant.
// The few component specs opt into a DOM with a `@vitest-environment happy-dom`
// docblock at the top of the file.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    coverage: {
      include: ['app/utils/**', 'app/composables/**'],
      reporter: ['text', 'html'],
    },
  },
})
