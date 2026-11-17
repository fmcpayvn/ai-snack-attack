// The food on the board: one rival AI at a time, plus a rare golden bonus.
// Spawning never lands on the snake, and never right in front of its nose.
import { FIELD, FOOD_KINDS, GOLDEN_AFTER_EATS, GOLDEN_FOOD, GOLDEN_LIFETIME } from './config.js';
import { pickWeighted } from './random.js';
import { snakeOccupies } from './snake.js';

export function createFoodState() {
  return {
    current: null,
    golden: null,
    goldenLeft: 0,
    eatenCount: 0,
    sinceGolden: 0,
  };
}

/** A free cell: not on the snake, not on the other food, not beside the head. */
function freeCell(random, snake, other) {
  const head = snake.segments[0];
  for (let tries = 0; tries < 200; tries += 1) {
    const x = Math.floor(random() * FIELD.cols);
    const y = Math.floor(random() * FIELD.rows);
    if (snakeOccupies(snake, x, y)) continue;
    if (other && other.x === x && other.y === y) continue;
    if (Math.abs(x - head.x) + Math.abs(y - head.y) < 3) continue;
    return { x, y };
  }
  for (let y = 0; y < FIELD.rows; y += 1) {
    for (let x = 0; x < FIELD.cols; x += 1) {
      if (!snakeOccupies(snake, x, y) && !(other && other.x === x && other.y === y)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

export function spawnFood(state, snake, random) {
  const kind = pickWeighted(random, FOOD_KINDS);
  const cell = freeCell(random, snake, state.golden);
  state.current = { ...cell, kind };
}

export function spawnGolden(state, snake, random) {
  const cell = freeCell(random, snake, state.current);
  state.golden = { ...cell, kind: GOLDEN_FOOD };
  state.goldenLeft = GOLDEN_LIFETIME;
  state.sinceGolden = 0;
}

/** After an eat: count it, and open the golden bonus once it is due. */
export function noteEaten(state, snake, random) {
  state.eatenCount += 1;
  state.sinceGolden += 1;
  if (state.golden === null && state.sinceGolden >= GOLDEN_AFTER_EATS) {
    spawnGolden(state, snake, random);
  }
}

/** Count the golden bonus down; it blinks out when its time runs out. */
export function tickFood(state, dt) {
  if (state.golden === null) return;
  state.goldenLeft -= dt;
  if (state.goldenLeft <= 0) {
    state.golden = null;
    state.goldenLeft = 0;
  }
}
