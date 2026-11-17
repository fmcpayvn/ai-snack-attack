// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the
// real rules forward from a fresh run for a fixed amount of game time,
// steered by a simple autopilot (look ahead a few cells each way the snake
// could turn, keep the ways that survive, chase the food), so the frame is
// what a short game really looks like and the same seed always gives the
// same frame.
import { FIELD } from './config.js';
import { EVENT_DIED, EVENT_WON, speedOf, startRun, stepGame } from './engine.js';
import { hitsSelf, hitsWall } from './snake.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './renderer.js';

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

const PLAY_SECONDS = 38;
const END_LIMIT_SECONDS = 600;

/**
 * How many cells ahead, along `direction`, the snake survives from `head`
 * against the walls and its own body (the body is read as it stands, which
 * is exact for the next few cells and cautious after that).
 */
function surviveSteps(snake, head, direction, horizon) {
  let x = head.x;
  let y = head.y;
  for (let step = 1; step <= horizon; step += 1) {
    x += direction.x;
    y += direction.y;
    if (hitsWall({ x, y })) return step - 1;
    if (hitsSelf(snake, { x, y })) return step - 1;
  }
  return horizon;
}

/**
 * How much open room the snake would have after moving its head to `cell`:
 * a flood fill over the cells that are neither wall nor body. The tail cell
 * is left out of the body, because it moves away on the next step. A big
 * room means the snake can turn and keep hunting; a tiny one is a trap.
 */
function openRoom(snake, cell) {
  const blocked = new Set();
  for (let index = 0; index < snake.segments.length - 1; index += 1) {
    const part = snake.segments[index];
    blocked.add(`${part.x},${part.y}`);
  }
  const key = (x, y) => `${x},${y}`;
  const seen = new Set([key(cell.x, cell.y)]);
  const queue = [{ x: cell.x, y: cell.y }];
  let count = 0;
  while (queue.length > 0) {
    const current = queue.pop();
    count += 1;
    for (const step of DIRECTIONS) {
      const x = current.x + step.x;
      const y = current.y + step.y;
      if (x < 0 || y < 0 || x >= FIELD.cols || y >= FIELD.rows) continue;
      if (blocked.has(key(x, y)) || seen.has(key(x, y))) continue;
      seen.add(key(x, y));
      queue.push({ x, y });
    }
  }
  return count;
}

/** Of the ways to turn, the one that nears the food among the ways that
 * leave the snake room to turn afterwards; when none does, the roomiest way.
 * A straight ray ahead is the wrong test: it calls a wall-side food unsafe,
 * because the snake survives only one cell past it, and the snake then
 * circles forever instead of eating. The room after the move is the test
 * that matters, since the snake turns again on the very next step. */
function autopilot(game, horizon) {
  const snake = game.snake;
  const head = snake.segments[0];
  const current = snake.pending.length > 0 ? snake.pending[0] : snake.direction;
  const food = game.food.current || game.food.golden;
  const roomNeeded = snake.segments.length + 4;
  const options = [];
  for (const direction of DIRECTIONS) {
    if (direction.x === -current.x && direction.y === -current.y) continue;
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    if (hitsWall(next) || hitsSelf(snake, next)) continue;
    const room = horizon <= 1
      ? surviveSteps(snake, head, direction, horizon)
      : openRoom(snake, next);
    const distance = food
      ? Math.abs(next.x - food.x) + Math.abs(next.y - food.y)
      : 0;
    options.push({ direction, room, distance });
  }
  if (options.length === 0) return null;
  const roomy = horizon <= 1
    ? options
    : options.filter((option) => option.room >= roomNeeded);
  const pool = roomy.length > 0 ? roomy : options;
  let best = pool[0];
  for (const option of pool) {
    if (horizon <= 1) {
      if (option.room > best.room
        || (option.room === best.room && option.distance < best.distance)) best = option;
    } else if (option.distance < best.distance
      || (option.distance === best.distance && option.room > best.room)) {
      best = option;
    }
  }
  return best.direction;
}

/** Run the game forward for `seconds` of game time with the autopilot. */
function playForward(game, seconds, horizon) {
  let elapsed = 0;
  while (elapsed < seconds) {
    const stepSeconds = 1 / speedOf(game);
    const events = stepGame(game, autopilot(game, horizon), false);
    elapsed += stepSeconds;
    if (events & EVENT_DIED) return 'died';
    if (events & EVENT_WON) return 'won';
  }
  return 'playing';
}

/**
 * Set `game` to the named scene (start, play, win or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, game) {
  startRun(game);
  if (name !== 'play' && name !== 'win' && name !== 'end') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    // Stage the run one food short of the win, with the food right ahead.
    game.score = 490;
    game.level = 5;
    game.eaten = 34;
    const head = game.snake.segments[0];
    const aheadX = Math.min(head.x + 2, FIELD.cols - 2);
    game.food.current = { x: aheadX, y: head.y, kind: game.food.current.kind };
    playForward(game, 30, 6);
    return { screen: game.won ? SCREEN_WIN : SCREEN_PLAY, best: game.score };
  }
  if (name === 'end') {
    // A hurried pilot, looking one cell ahead, is caught out in the end.
    const outcome = playForward(game, END_LIMIT_SECONDS, 1);
    void outcome;
    return { screen: SCREEN_OVER, best: game.score };
  }
  playForward(game, PLAY_SECONDS, 6);
  return { screen: SCREEN_PLAY, best: game.score };
}
