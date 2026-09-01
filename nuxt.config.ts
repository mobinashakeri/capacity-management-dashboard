import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint'],

  // Prerendered to static HTML: GitHub Pages serves files only. The dashboard is
  // public and read-only, so SSR buys nothing, while prerendering still gives a
  // real HTML shell instead of a blank page on first paint.
  ssr: true,
  nitro: { preset: 'github_pages' },

  // GitHub Pages serves the app from /<repo-name>/. Defaults to '/' so local dev
  // and `npx serve .output/public` are unaffected; CI sets the real value.
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Capacity Management Dashboard',
      meta: [
        {
          name: 'description',
          content:
            'Centre and classroom capacity, utilization and exceptions for operations planning.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          // Sora for headings and figures, Rubik for body and table text.
          // Only the weights used, with swap so text never blocks paint.
          href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&family=Sora:wght@500;600;700&display=swap',
        },
      ],
    },
  },

  // CORS on the upstream API was verified open (access-control-allow-origin: *),
  // so the browser calls it directly - no proxy layer needed.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://capacity.workshape.dev',
    },
  },

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  typescript: { strict: true },
})
