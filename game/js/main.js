// Boot and the one loop: input is read every frame, the snake advances in
// grid steps at its current speed, and the renderer paints what is there.
// The game moves between five screens: title, play, paused, game over and
// win. On the title screen a ghost snake plays behind the panel.
//
// ?seed=N fixes the food pattern. ?shot=start|play|win|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FOOD_KINDS, GOLDEN_FOOD } from './config.js';
import { createRandom } from './random.js';
import { createGame, EVENT_ATE, EVENT_DIED, EVENT_GOLDEN, EVENT_LEVEL, EVENT_WON, speedOf, startRun, stepGame, tickGame } from './engine.js';
import { queueTurn } from './snake.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_TURN, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './renderer.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRandom(seed));
const audio = createAudio();
const input = createInput(canvas);

/** Load every picture the game draws, tolerating any that fails to load. */
function loadPictures() {
  const wanted = { makefun: GOLDEN_FOOD.image };
  for (const kind of FOOD_KINDS) wanted[kind.id] = kind.image;
  const entries = Object.entries(wanted).map(([id, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve([id, { img, ok: true }]);
    img.onerror = () => resolve([id, { img, ok: false }]);
    img.src = src;
  }));
  return Promise.all(entries).then((pairs) => Object.fromEntries(pairs));
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit.
  }
}

function runShot(images) {
  const renderer = createRenderer(canvas, images);
  const scene = stageShot(shot, game);
  const view = {
    snake: game.snake,
    food: game.food,
    score: game.score,
    best: Math.max(readBest(), scene.best),
    level: game.level,
    eaten: game.eaten,
    won: game.won,
    screen: scene.screen,
    muted: audio.muted,
    fraction: 1,
    now: performance.now(),
    toast: null,
    toastLeft: 0,
  };
  let painted = 0;
  function paint() {
    view.now = performance.now();
    renderer.draw(view);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame(images) {
  const renderer = createRenderer(canvas, images);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let stepAccumulator = 0;
  let last = performance.now();
  let toast = null;
  let toastLeft = 0;
  let lastStepAt = performance.now();

  // Screen readers (and anyone watching the page's text) hear the changes.
  function announce(message) {
    status.textContent = message;
  }

  function view() {
    return {
      snake: game.snake,
      food: game.food,
      score: game.score,
      best,
      level: game.level,
      eaten: game.eaten,
      won: game.won,
      screen,
      muted: audio.muted,
      fraction: Math.min(1, Math.max(0, stepAccumulator)),
      now: performance.now(),
      toast,
      toastLeft,
    };
  }

  function startGame() {
    startRun(game);
    stepAccumulator = 0;
    lastStepAt = performance.now();
    screen = SCREEN_PLAY;
    announce('Playing. Eat the rival AIs, reach 500 to win.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (game.score > best) {
      best = game.score;
      saveBest(best);
    }
    audio.lose();
    announce(`Game over. Score ${game.score}. Best ${best}.`);
  }

  function winGame() {
    screen = SCREEN_WIN;
    if (game.score > best) {
      best = game.score;
      saveBest(best);
    }
    audio.win();
    announce(`You ate all the AIs! Score ${game.score}.`);
  }

  function keepPlaying() {
    game.endless = true;
    screen = SCREEN_PLAY;
    announce('Endless mode. Keep eating!');
  }

  function showToast(message) {
    toast = message;
    toastLeft = 2;
  }

  function handleActions() {
    for (const action of input.takeActions()) {
      if (action.type === 'point') {
        audio.unlock();
        const direction = input.steerToward(action.x, action.y, game.snake.segments[0]);
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
        else if (screen === SCREEN_WIN) keepPlaying();
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
        else if (direction && screen === SCREEN_PLAY) queueTurn(game.snake, direction.x, direction.y);
        continue;
      }
      if (action.type === ACTION_RESTART) {
        if (screen === SCREEN_WIN || screen === SCREEN_OVER || screen === SCREEN_PAUSED) startGame();
        continue;
      }
      if (action.type === ACTION_MUTE) {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound off.' : 'Sound on.');
        continue;
      }
      if (action.type === ACTION_TURN) {
        if (screen === SCREEN_PLAY) queueTurn(game.snake, action.x, action.y);
        continue;
      }
      if (action.type === ACTION_CONFIRM) {
        audio.unlock();
        audio.click();
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
        else if (screen === SCREEN_WIN) keepPlaying();
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
        else if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
        continue;
      }
      if (action.type === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          announce('Playing.');
        }
      }
    }
  }

  function step() {
    const now = performance.now();
    tickGame(game, (now - lastStepAt) / 1000);
    lastStepAt = now;
    if (screen === SCREEN_TITLE) {
      stepGame(game, null, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const events = stepGame(game, null, false);
    if (events & EVENT_DIED) endGame();
    else if (events & EVENT_WON) winGame();
    else {
      if (events & EVENT_GOLDEN) {
        audio.golden();
        showToast('GOLDEN make.fun! +50');
      } else if (events & EVENT_ATE) {
        audio.eat(game.combo);
      }
      if (events & EVENT_LEVEL) {
        audio.levelUp();
        showToast(`LEVEL ${game.level} — faster!`);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min((now - last) / 1000, 0.25);
    last = now;
    if (toastLeft > 0) toastLeft -= elapsed;
    else toast = null;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      stepAccumulator += elapsed * speedOf(game);
      while (stepAccumulator >= 1 && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        stepAccumulator -= 1;
      }
    } else {
      stepAccumulator = 0;
    }
    renderer.draw(view());
  }

  // Leaving the tab pauses a running game rather than letting it run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  startRun(game);
  announce('AI Snack Attack. Press Space or click to start.');
  // A read-only handle for automated play-testing; it changes nothing.
  window.__snackState = () => ({
    screen,
    score: game.score,
    best,
    level: game.level,
    eaten: game.eaten,
    length: game.snake.segments.length,
    head: { ...game.snake.segments[0] },
    food: game.food.current ? { ...game.food.current, kind: game.food.current.kind.id } : null,
  });
  requestAnimationFrame(frame);
}

loadPictures().then((images) => {
  if (shot) runShot(images);
  else runGame(images);
});
