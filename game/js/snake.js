// The snake itself: a list of grid cells, head first, with a queue of turns.
// This file knows nothing about food, screens or drawing: it only moves the
// snake one cell at a time and answers what the next cell would hit.
import { FIELD } from './config.js';

/** A fresh snake: four cells long, in the middle, heading right. */
export function createSnake() {
  return {
    segments: [],
    direction: { x: 1, y: 0 },
    pending: [],
    previous: [],
    growBy: 0,
  };
}

export function resetSnake(snake) {
  const middleY = Math.floor(FIELD.rows / 2);
  const middleX = Math.floor(FIELD.cols / 2);
  snake.segments = [
    { x: middleX, y: middleY },
    { x: middleX - 1, y: middleY },
    { x: middleX - 2, y: middleY },
    { x: middleX - 3, y: middleY },
  ];
  snake.direction = { x: 1, y: 0 };
  snake.pending = [];
  snake.previous = snake.segments.map((cell) => ({ ...cell }));
  snake.growBy = 0;
}

/** Queue a turn; a U-turn against the current or queued direction is refused. */
export function queueTurn(snake, dx, dy) {
  const last = snake.pending.length > 0
    ? snake.pending[snake.pending.length - 1]
    : snake.direction;
  if (dx === -last.x && dy === -last.y) return;
  if (dx === last.x && dy === last.y) return;
  if (snake.pending.length < 3) snake.pending.push({ x: dx, y: dy });
}

/** The cell the head would move into next, after applying a queued turn. */
export function nextHeadCell(snake) {
  const direction = snake.pending.length > 0 ? snake.pending[0] : snake.direction;
  const head = snake.segments[0];
  return { x: head.x + direction.x, y: head.y + direction.y, direction };
}

export function hitsWall(cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= FIELD.cols || cell.y >= FIELD.rows;
}

/**
 * Would the head hit its own body at `cell`? The tail cell is safe when the
 * snake is not growing, because the tail moves away in the same step.
 */
export function hitsSelf(snake, cell) {
  const tailWillMove = snake.growBy === 0;
  const limit = tailWillMove ? snake.segments.length - 1 : snake.segments.length;
  for (let index = 0; index < limit; index += 1) {
    const part = snake.segments[index];
    if (part.x === cell.x && part.y === cell.y) return true;
  }
  return false;
}

/**
 * Move one cell forward, applying a queued turn first. The previous layout is
 * kept so the renderer can glide between the two. Returns the new head cell.
 */
export function advanceSnake(snake) {
  if (snake.pending.length > 0) snake.direction = snake.pending.shift();
  const head = snake.segments[0];
  const next = { x: head.x + snake.direction.x, y: head.y + snake.direction.y };
  snake.previous = snake.segments.map((cell) => ({ ...cell }));
  snake.segments.unshift(next);
  if (snake.growBy > 0) snake.growBy -= 1;
  else snake.segments.pop();
  return next;
}

/** Grow by one cell on the next step (and the one after, for a visible gain). */
export function growSnake(snake, cells) {
  snake.growBy += cells;
}

/** True when the snake occupies `cell` (used when placing food). */
export function snakeOccupies(snake, x, y) {
  for (const part of snake.segments) {
    if (part.x === x && part.y === y) return true;
  }
  return false;
}
