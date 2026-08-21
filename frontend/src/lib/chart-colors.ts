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
