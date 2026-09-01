/**
 * Chart colours.
 *
 * ApexCharts renders SVG and needs literal colour strings, so it cannot read
 * the CSS custom properties the rest of the UI uses. These values mirror the
 * `@theme` block in `assets/css/main.css` exactly — change one, change both.
 */
export const CHART_COLORS = {
  /** Places taken — the brand blue, the same fill the place grid uses. */
  used: '#0578be',
  /** Still free — a pale wash of the same blue, so the bar reads as one family. */
  free: '#cfe6f3',
  /** Over capacity — magenta, reserved for this and nothing else. */
  over: '#c02181',
  warn: '#fcc30c',
  good: '#1d946c',
  navy: '#1e2041',
  body: '#5d5d5d',
  line: '#ececec',
} as const

const FONT = 'Rubik, ui-sans-serif, system-ui, sans-serif'
const DISPLAY = 'Sora, Rubik, ui-sans-serif, system-ui, sans-serif'

/**
 * Shared options.
 *
 * Animation is off: a dashboard that replays a bar race on every month change
 * costs attention and gives nothing back, and switching it off means reduced
 * motion is respected without a separate branch.
 */
export const BASE_CHART_OPTIONS = {
  chart: {
    toolbar: { show: false },
    animations: { enabled: false },
    fontFamily: FONT,
    background: 'transparent',
  },
  grid: { borderColor: CHART_COLORS.line, strokeDashArray: 3 },
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom' as const,
    horizontalAlign: 'left' as const,
    fontSize: '12px',
    fontFamily: FONT,
    labels: { colors: CHART_COLORS.body },
    markers: { size: 5 },
    itemMargin: { horizontal: 10, vertical: 4 },
  },
  tooltip: { theme: 'light' as const, style: { fontFamily: FONT } },
  states: { active: { filter: { type: 'none' as const } } },
}

/** Category labels: never truncated, so a long age band still reads in full. */
export const CATEGORY_LABEL = {
  style: { colors: CHART_COLORS.body, fontSize: '11px', fontFamily: FONT },
  trim: false,
  hideOverlappingLabels: false,
}

/** Value axis labels are numbers, so they take the mono face. */
export const VALUE_LABEL = {
  style: { colors: CHART_COLORS.body, fontSize: '11px', fontFamily: DISPLAY },
}
