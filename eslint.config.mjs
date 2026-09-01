import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

// Prettier owns formatting, ESLint owns correctness. `prettier` last disables
// every stylistic rule that would otherwise fight the formatter.
export default withNuxt(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  prettier,
).append({
  ignores: ['.nuxt/**', '.output/**', 'dist/**', 'coverage/**', 'node_modules/**'],
})
