// Keyboard, mouse and touch input, all feeding the same four actions:
// turn (a direction), confirm (start / restart / keep playing), pause and
// mute. A click or tap on the arena steers the snake toward that point;
// a swipe does the same in the swipe's direction.
export const ACTION_TURN = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const KEY_DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
};

export function createInput(canvas) {
  const queued = [];
  let swipeStart = null;

  function push(action) {
    if (queued.length < 8) queued.push(action);
  }

  function onKeyDown(event) {
    const direction = KEY_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      push({ type: ACTION_TURN, x: direction.x, y: direction.y });
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      push({ type: ACTION_CONFIRM });
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      push({ type: ACTION_PAUSE });
    } else if (event.key === 'm' || event.key === 'M') {
      push({ type: ACTION_MUTE });
    } else if (event.key === 'r' || event.key === 'R') {
      push({ type: ACTION_RESTART });
    }
  }

  /** Turn the snake toward a point on the canvas (the longer axis wins). */
  function steerToward(clientX, clientY, headCell) {
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor(((clientX - rect.left) / rect.width) * 32);
    const cellY = Math.floor(((clientY - rect.top) / rect.height) * 18);
    const dx = cellX - headCell.x;
    const dy = cellY - headCell.y;
    if (dx === 0 && dy === 0) return null;
    if (Math.abs(dx) >= Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
    return { x: 0, y: Math.sign(dy) };
  }

  function onPointerDown(event) {
    push({ type: 'point', x: event.clientX, y: event.clientY });
  }

  function onTouchStart(event) {
    const touch = event.touches[0];
    swipeStart = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    if (swipeStart === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const direction = Math.abs(dx) > Math.abs(dy)
      ? { x: Math.sign(dx), y: 0 }
      : { x: 0, y: Math.sign(dy) };
    push({ type: ACTION_TURN, x: direction.x, y: direction.y });
  }

  document.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });

  return {
    /** Take and clear everything queued since the last frame. */
    takeActions() {
      return queued.splice(0, queued.length);
    },
    steerToward,
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    },
  };
}
