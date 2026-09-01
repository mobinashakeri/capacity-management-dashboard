/**
 * Chart colours.
 *
 * ApexCharts renders SVG and needs literal colour strings, so it cannot read
 * the CSS custom properties the rest of the UI uses. These values are the
 * single source of truth and `assets/css/main.css` mirrors them exactly - if
 * one changes, change both.
 */
export const CHART_COLORS = {
  over: '#dc2626',
  full: '#d97706',
  healthy: '#059669',
  empty: '#94a3b8',
  available: '#cbd5e1',
  ink: '#1e293b',
  inkMuted: '#64748b',
  line: '#e2e8f0',
} as const

/**
 * Options shared by every chart.
 *
 * Toolbars and animations are off: the toolbar's export/zoom controls are noise
 * on a dashboard this size, and animation is disabled so a month switch does
 * not re-run a bar race every time - which also respects reduced-motion
 * preferences without a separate media query.
 */
export const BASE_CHART_OPTIONS = {
  chart: {
    toolbar: { show: false },
    animations: { enabled: false },
    fontFamily: 'inherit',
    background: 'transparent',
  },
  grid: {
    borderColor: CHART_COLORS.line,
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom' as const,
    horizontalAlign: 'left' as const,
    fontSize: '12px',
    markers: { size: 6 },
    itemMargin: { horizontal: 8, vertical: 4 },
  },
  tooltip: { theme: 'light' as const },
  states: { active: { filter: { type: 'none' as const } } },
}

/** Axis label styling, applied to whichever axis carries the categories. */
export const AXIS_LABEL_STYLE = {
  style: { colors: CHART_COLORS.inkMuted, fontSize: '12px' },
}
