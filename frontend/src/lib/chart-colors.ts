// Validated categorical palette (dark-mode steps), fixed hue order — never cycled.
// Source: dataviz skill reference palette, re-validated against this app's
// pure-black chart surface with scripts/validate_palette.js (all checks pass).
export const CATEGORICAL = [
  '#3987e5', // 1 blue
  '#d95926', // 2 orange
  '#199e70', // 3 aqua
  '#c98500', // 4 yellow
  '#d55181', // 5 magenta
  '#008300', // 6 green
  '#9085e9', // 7 violet
  '#e66767', // 8 red
] as const;

export const CHART_INK = {
  primary: '#ffffff',
  secondary: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
};

// Light-mode counterpart — same roles, re-tuned for a white chart surface.
export const CHART_INK_LIGHT = {
  primary: '#0f172a',
  secondary: '#475569',
  muted: '#94a3b8',
  grid: '#e2e8f0',
  axis: '#cbd5e1',
};

export const CHART_SURFACE = {
  dark: { tooltipBg: '#111110', tooltipBorder: 'rgba(255,255,255,0.1)', cursor: 'rgba(255,255,255,0.04)' },
  light: { tooltipBg: '#ffffff', tooltipBorder: 'rgba(15,23,42,0.1)', cursor: 'rgba(15,23,42,0.04)' },
};

// Application pipeline stages mapped to fixed categorical slots, in stage order.
// "Withdrawn" is an administrative dead-state, not a pipeline outcome, so it
// uses muted gray rather than a categorical hue.
export const STATUS_COLORS: Record<string, string> = {
  Saved: CATEGORICAL[0],
  Applied: CATEGORICAL[1],
  'Online Assessment': CATEGORICAL[2],
  Interviewing: CATEGORICAL[3],
  'Final Round': CATEGORICAL[4],
  Offer: CATEGORICAL[5],
  Rejected: CATEGORICAL[6],
  Ghosted: CATEGORICAL[7],
  Withdrawn: CHART_INK.muted,
};
