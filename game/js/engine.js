// The game's rules, with no drawing and no browser in it: one fixed grid
// step at a time. The live loop and the screenshot staging both step through
// this file, so a staged frame is a real game, not a mock-up.
import {
  FIELD,
  LEVEL_POINTS,
  MAX_LEVEL,
  SPEED,
  WIN_SCORE,
} from './config.js';
import { createFoodState, noteEaten, spawnFood, tickFood } from './food.js';
import {
  advanceSnake,
  createSnake,
  growSnake,
  hitsSelf,
  hitsWall,
  nextHeadCell,
  queueTurn,
  resetSnake,
} from './snake.js';

export const EVENT_ATE = 1;
export const EVENT_GOLDEN = 2;
export const EVENT_LEVEL = 4;
export const EVENT_DIED = 8;
export const EVENT_WON = 16;

export function createGame(random) {
  return {
    random,
    snake: createSnake(),
    food: createFoodState(),
    score: 0,
    best: 0,
    level: 1,
    eaten: 0,
    won: false,
    endless: false,
    combo: 0,
    comboLeft: 0,
    stepLeft: 0,
  };
}

export function startRun(game) {
  resetSnake(game.snake);
  game.food = createFoodState();
  game.score = 0;
  game.level = 1;
  game.eaten = 0;
  game.won = false;
  game.endless = false;
  game.combo = 0;
  game.comboLeft = 0;
  game.stepLeft = 0;
  spawnFood(game.food, game.snake, game.random);
}

/** Cells per second right now: faster with every food and every level. */
export function speedOf(game) {
  return Math.min(
    SPEED.max,
    SPEED.start + game.eaten * SPEED.perFood + (game.level - 1) * 0.5,
  );
}

function levelOf(score) {
  return Math.min(MAX_LEVEL, 1 + Math.floor(score / LEVEL_POINTS));
}

/**
 * One grid step. `direction` is applied first when given. Returns the event
 * flags for what happened, so the caller can play sounds and change screens.
 * In attract mode the snake wraps around the walls and passes through itself,
 * so the title screen always has a living snake behind it.
 */
export function stepGame(game, direction, attract) {
  if (direction) queueTurn(game.snake, direction.x, direction.y);
  const next = nextHeadCell(game.snake);

  if (attract) {
    if (hitsWall(next)) {
      const head = game.snake.segments[0];
      const wrapped = {
        x: (head.x + game.snake.direction.x + FIELD.cols) % FIELD.cols,
        y: (head.y + game.snake.direction.y + FIELD.rows) % FIELD.rows,
        direction: game.snake.direction,
      };
      advanceSnake(game.snake);
      game.snake.segments[0] = { x: wrapped.x, y: wrapped.y };
      game.snake.previous[0] = { x: wrapped.x, y: wrapped.y };
      return 0;
    }
    const head = advanceSnake(game.snake);
    if (game.food.current && head.x === game.food.current.x && head.y === game.food.current.y) {
      growSnake(game.snake, 1);
      spawnFood(game.food, game.snake, game.random);
    }
    return 0;
  }

  if (hitsWall(next) || hitsSelf(game.snake, next)) return EVENT_DIED;

  const head = advanceSnake(game.snake);
  let events = 0;
  const food = game.food.current;
  if (food && head.x === food.x && head.y === food.y) {
    const kind = food.kind;
    game.score += kind.points;
    game.eaten += 1;
    game.combo = game.comboLeft > 0 ? game.combo + 1 : 1;
    game.comboLeft = 4;
    growSnake(game.snake, 2);
    events |= EVENT_ATE;
    noteEaten(game.food, game.snake, game.random);
    spawnFood(game.food, game.snake, game.random);
  }
  const golden = game.food.golden;
  if (golden && head.x === golden.x && head.y === golden.y) {
    game.score += golden.kind.points;
    game.eaten += 1;
    game.combo = game.comboLeft > 0 ? game.combo + 1 : 1;
    game.comboLeft = 4;
    growSnake(game.snake, 2);
    game.food.golden = null;
    game.food.goldenLeft = 0;
    events |= EVENT_ATE | EVENT_GOLDEN;
  }

  const level = levelOf(game.score);
  if (level > game.level) {
    game.level = level;
    events |= EVENT_LEVEL;
  }
  if (!game.won && !game.endless && game.score >= WIN_SCORE) {
    game.won = true;
    events |= EVENT_WON;
  }
  return events;
}

/** The golden bonus and the eat combo count down in real seconds. */
export function tickGame(game, dt) {
  tickFood(game.food, dt);
  if (game.comboLeft > 0) {
    game.comboLeft -= dt;
    if (game.comboLeft <= 0) game.combo = 0;
  }
}
