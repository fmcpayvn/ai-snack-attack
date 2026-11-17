// AI Snack Attack: every tuning number, colour and food in one place.
// The arena is a fixed 32 by 18 grid of 40 px cells (1280 by 720 logical
// pixels); the renderer scales it to the window, so no rule depends on the
// screen size.

export const FIELD = { cols: 32, rows: 18, cell: 40, width: 1280, height: 720 };

/** Points that end the run with a win. */
export const WIN_SCORE = 500;

/** Points per level; each level makes the snake a little faster. */
export const LEVEL_POINTS = 100;
export const MAX_LEVEL = 9;

/** Snake speed in cells per second: start, gain per food eaten, hard cap. */
export const SPEED = { start: 7, perFood: 0.22, max: 15 };

/** How many foods must be eaten before the golden bonus can appear. */
export const GOLDEN_AFTER_EATS = 10;
/** Seconds the golden make.fun bonus stays on the board. */
export const GOLDEN_LIFETIME = 8;

/** The rival AIs the snake snacks on: label, points, spawn weight, picture. */
export const FOOD_KINDS = [
  { id: 'chatgpt', label: 'ChatGPT', points: 10, weight: 40, image: 'assets/chatgpt.svg' },
  { id: 'claude', label: 'Claude', points: 15, weight: 30, image: 'assets/claude.svg' },
  { id: 'gemini', label: 'Gemini', points: 20, weight: 20, image: 'assets/gemini.svg' },
  { id: 'grok', label: 'Grok', points: 25, weight: 10, image: 'assets/grok.png' },
];

/** The rare golden bonus: the make.fun logo itself, worth fifty points. */
export const GOLDEN_FOOD = {
  id: 'makefun',
  label: 'make.fun',
  points: 50,
  image: 'assets/makefun-logo.svg',
};

export const PALETTE = {
  page: '#0b0d12',
  arena: '#12151f',
  arenaEdge: '#232a3d',
  grid: '#1a2033',
  snakeHead: '#ffffff',
  snakeBodyA: '#2ee6a8',
  snakeBodyB: '#22d3ee',
  snakeBelly: '#0f766e',
  foodTile: '#1e2536',
  foodRing: '#3b4763',
  goldenRing: '#f2c94c',
  goldenGlow: '#f2c94c',
  text: '#eef1f5',
  muted: '#8b93a3',
  accent: '#c41c83',
  accentSoft: '#ff7ac0',
  danger: '#e5534b',
  panel: '#171c2a',
  panelEdge: '#2a3247',
  barTrack: '#232a3d',
  barFill: '#c41c83',
  barFillWin: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ai-snack-attack.best';
