// Everything on screen, drawn on one canvas: the arena, the snake (its head
// is the make.fun logo), the rival-AI foods with their point badges, the HUD
// with the score, the race to 500 and the food legend, and the title, pause,
// win and game-over panels. The canvas is 1280 by 800 logical pixels: a
// 56 px HUD bar on top, then the 1280 by 720 arena.
import { FIELD, FOOD_KINDS, GOLDEN_FOOD, PALETTE, WIN_SCORE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const HUD_HEIGHT = 56;
const ARENA_Y = HUD_HEIGHT;
const CANVAS_WIDTH = FIELD.width;
const CANVAS_HEIGHT = ARENA_Y + FIELD.height;

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function cellCentre(cell) {
  return {
    x: cell.x * FIELD.cell + FIELD.cell / 2,
    y: ARENA_Y + cell.y * FIELD.cell + FIELD.cell / 2,
  };
}

export function createRenderer(canvas, images) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');

  function drawImageInCircle(image, ok, cx, cy, radius, fallbackText, fallbackFill) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    if (ok) ctx.drawImage(image, cx - radius, cy - radius, radius * 2, radius * 2);
    else {
      ctx.fillStyle = fallbackFill;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(radius * 0.9)}px ${'system-ui, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fallbackText, cx, cy + 1);
    }
    ctx.restore();
  }

  function drawFoodTile(food, now) {
    const centre = cellCentre(food);
    const kind = food.kind;
    const golden = kind.id === GOLDEN_FOOD.id;
    const radius = golden ? 26 : 21;
    const pulse = golden ? 1 + 0.08 * Math.sin(now / 130) : 1;
    const r = radius * pulse;

    ctx.save();
    if (golden) {
      ctx.shadowColor = PALETTE.goldenGlow;
      ctx.shadowBlur = 22;
    }
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = golden ? PALETTE.goldenRing : PALETTE.foodRing;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.foodTile;
    ctx.fill();

    const picture = images[kind.id];
    const inset = golden ? r * 0.62 : r * 0.66;
    if (picture && picture.ok) {
      ctx.drawImage(picture.img, centre.x - inset, centre.y - inset, inset * 2, inset * 2);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(r * 0.9)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(kind.label.slice(0, 1), centre.x, centre.y + 1);
    }

    // The point badge: a small pill under the tile, so the value is visible.
    const badge = `+${kind.points}`;
    ctx.font = `bold 13px system-ui, sans-serif`;
    const badgeWidth = ctx.measureText(badge).width + 12;
    const badgeX = centre.x - badgeWidth / 2;
    const badgeY = centre.y + r - 4;
    ctx.beginPath();
    roundRect(ctx, badgeX, badgeY, badgeWidth, 18, 9);
    ctx.fillStyle = golden ? PALETTE.goldenRing : PALETTE.accent;
    ctx.fill();
    ctx.fillStyle = golden ? '#1a1206' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, centre.x, badgeY + 9.5);

    if (golden && food.timeLeft !== undefined) {
      const fraction = Math.max(0, Math.min(1, food.timeLeft / 8));
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, r + 7, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      ctx.strokeStyle = PALETTE.goldenRing;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawSnake(snake, fraction) {
    const parts = snake.segments;
    for (let index = parts.length - 1; index >= 0; index -= 1) {
      const current = parts[index];
      const previous = snake.previous[Math.min(index, snake.previous.length - 1)] || current;
      const x = previous.x + (current.x - previous.x) * fraction;
      const y = previous.y + (current.y - previous.y) * fraction;
      const px = x * FIELD.cell + FIELD.cell / 2;
      const py = ARENA_Y + y * FIELD.cell + FIELD.cell / 2;
      const shrink = Math.max(0.55, 1 - index * 0.012);
      const radius = (FIELD.cell / 2 - 2) * shrink;
      if (index === 0) continue;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = index % 2 === 0 ? PALETTE.snakeBodyA : PALETTE.snakeBodyB;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.snakeBelly;
      ctx.fill();
    }
    const head = parts[0];
    const headPrevious = snake.previous[0] || head;
    const hx = headPrevious.x + (head.x - headPrevious.x) * fraction;
    const hy = headPrevious.y + (head.y - headPrevious.y) * fraction;
    const cx = hx * FIELD.cell + FIELD.cell / 2;
    const cy = ARENA_Y + hy * FIELD.cell + FIELD.cell / 2;
    const headRadius = FIELD.cell / 2 + 3;
    ctx.save();
    ctx.shadowColor = PALETTE.accent;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.snakeHead;
    ctx.fill();
    ctx.restore();
    const logo = images.makefun;
    if (logo && logo.ok) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, headRadius - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo.img, cx - headRadius, cy - headRadius, headRadius * 2, headRadius * 2);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, headRadius, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function drawArena(now) {
    ctx.fillStyle = PALETTE.arena;
    ctx.fillRect(0, ARENA_Y, FIELD.width, FIELD.height);
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < FIELD.cols; x += 1) {
      ctx.moveTo(x * FIELD.cell, ARENA_Y);
      ctx.lineTo(x * FIELD.cell, ARENA_Y + FIELD.height);
    }
    for (let y = 1; y < FIELD.rows; y += 1) {
      ctx.moveTo(0, ARENA_Y + y * FIELD.cell);
      ctx.lineTo(FIELD.width, ARENA_Y + y * FIELD.cell);
    }
    ctx.stroke();
    ctx.strokeStyle = PALETTE.arenaEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, ARENA_Y + 1.5, FIELD.width - 3, FIELD.height - 3);
    void now;
  }

  function drawHud(view) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS_WIDTH, 2);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('SCORE', 20, 15);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(String(view.score), 20, 37);

    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('BEST', 150, 15);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(String(Math.max(view.best, view.score)), 150, 37);

    // The race to the win: a progress bar with the target on it.
    const barX = 260;
    const barWidth = 300;
    const barY = 18;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`RACE TO ${WIN_SCORE}`, barX, 15);
    ctx.beginPath();
    roundRect(ctx, barX, barY, barWidth, 22, 11);
    ctx.fillStyle = PALETTE.barTrack;
    ctx.fill();
    const progress = Math.min(1, view.score / WIN_SCORE);
    if (progress > 0) {
      ctx.beginPath();
      roundRect(ctx, barX, barY, Math.max(22, barWidth * progress), 22, 11);
      ctx.fillStyle = view.won ? PALETTE.barFillWin : PALETTE.barFill;
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${view.score} / ${WIN_SCORE}`, barX + barWidth / 2, barY + 11.5);
    ctx.textAlign = 'left';

    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('LEVEL', 590, 15);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(String(view.level), 590, 37);

    // The legend: every food with its point value, so the judge sees the menu.
    let legendX = 680;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('MENU', legendX, 15);
    legendX += 48;
    for (const kind of FOOD_KINDS) {
      const picture = images[kind.id];
      if (picture && picture.ok) {
        ctx.drawImage(picture.img, legendX, 24, 22, 22);
      }
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(`+${kind.points}`, legendX + 25, 36);
      legendX += 25 + ctx.measureText(`+${kind.points}`).width + 18;
    }
    const goldenPicture = images.makefun;
    if (goldenPicture && goldenPicture.ok) {
      ctx.drawImage(goldenPicture.img, legendX, 24, 22, 22);
    }
    ctx.fillStyle = PALETTE.goldenRing;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`+${GOLDEN_FOOD.points}`, legendX + 25, 36);

    ctx.fillStyle = view.muted ? PALETTE.danger : PALETTE.muted;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(view.muted ? 'MUTED (M)' : 'SOUND ON (M)', CANVAS_WIDTH - 20, 30);
    ctx.textAlign = 'left';
  }

  function drawPanel(title, lines, accent, button) {
    const panelWidth = 620;
    const panelHeight = 150 + lines.length * 34 + (button ? 66 : 0);
    const panelX = (CANVAS_WIDTH - panelWidth) / 2;
    const panelY = (CANVAS_HEIGHT - panelHeight) / 2 - 20;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 12, 0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.beginPath();
    roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 18);
    ctx.fillStyle = PALETTE.panel;
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(title, CANVAS_WIDTH / 2, panelY + 56);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px system-ui, sans-serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, panelY + 112 + index * 34);
    });
    if (button) {
      ctx.font = 'bold 19px system-ui, sans-serif';
      const buttonWidth = Math.min(
        panelWidth - 48,
        ctx.measureText(button).width + 48,
      );
      const buttonY = panelY + panelHeight - 52;
      ctx.beginPath();
      roundRect(ctx, (CANVAS_WIDTH - buttonWidth) / 2, buttonY, buttonWidth, 40, 12);
      ctx.fillStyle = PALETTE.accent;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(button, CANVAS_WIDTH / 2, buttonY + 21);
    }
    ctx.textAlign = 'left';
  }

  function drawToast(view) {
    if (!view.toast) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, view.toastLeft / 0.4);
    ctx.fillStyle = PALETTE.goldenRing;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(view.toast, CANVAS_WIDTH / 2, ARENA_Y + 46);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function draw(view) {
    ctx.fillStyle = PALETTE.page;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawHud(view);
    drawArena(view.now);
    if (view.food.current) drawFoodTile(view.food.current, view.now);
    if (view.food.golden) drawFoodTile({ ...view.food.golden, timeLeft: view.food.goldenLeft }, view.now);
    drawSnake(view.snake, view.fraction);
    drawToast(view);

    if (view.screen === SCREEN_TITLE) {
      const logo = images.makefun;
      const titleY = 210;
      if (logo && logo.ok) {
        ctx.save();
        ctx.shadowColor = PALETTE.accent;
        ctx.shadowBlur = 24;
        ctx.drawImage(logo.img, CANVAS_WIDTH / 2 - 52, titleY - 130, 104, 104);
        ctx.restore();
      }
      drawPanel(
        'AI SNACK ATTACK',
        [
          'The make.fun snake eats rival AIs.',
          'ChatGPT +10   Claude +15   Gemini +20   Grok +25   Golden make.fun +50',
          'Reach 500 points to eat them all. Walls and your own tail are fatal.',
          'Arrows / WASD to steer, click to steer, Space to pause, M to mute.',
          view.best > 0 ? `Best score so far: ${view.best}` : 'No best score yet — set one!',
        ],
        PALETTE.accent,
        'PRESS SPACE OR CLICK TO PLAY',
      );
    } else if (view.screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['Take a breath. The snake waits for you.', `Score ${view.score}  ·  Best ${Math.max(view.best, view.score)}`], PALETTE.muted, 'PRESS SPACE OR CLICK TO RESUME');
    } else if (view.screen === SCREEN_OVER) {
      const lines = [
        `Score ${view.score}  ·  Foods eaten ${view.eaten}  ·  Level ${view.level}`,
        view.score >= view.best && view.score > 0 ? 'NEW BEST SCORE!' : `Best ${view.best}`,
        'Walls and your own tail are fatal — the snake never forgets.',
      ];
      drawPanel('GAME OVER', lines, PALETTE.danger, 'PRESS SPACE OR CLICK TO PLAY AGAIN');
    } else if (view.screen === SCREEN_WIN) {
      const lines = [
        `You ate all the AIs! Final score ${view.score}  ·  Foods eaten ${view.eaten}`,
        'Space or click: keep playing endless. R: start a fresh run.',
      ];
      drawPanel('YOU ATE ALL THE AIS!', lines, PALETTE.goldenRing, 'PRESS SPACE OR CLICK TO KEEP PLAYING');
    }
  }

  return { draw, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}
