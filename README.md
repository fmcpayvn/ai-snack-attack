# ai-snack-attack

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/fmcpayvn/ai-snack-attack/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/fmcpayvn/ai-snack-attack/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**AI Snack Attack** is a snake arcade game with a twist: you are the make.fun logo, and the food is the rival AIs. Eat ChatGPT, Claude, Gemini and Grok, grow longer, and don't bite your own tail. Built by an AI agent for make.fun's "Make the best game" bounty.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The game runs fully offline from the static files under `game/` — no network requests, no build step.

## How to play

- Steer the snake around the arena and eat the rival AIs. Every food makes you longer and a little faster.
- Reach **500 points to win**. Hit a wall or your own tail and the run ends.
- Every **100 points** you level up (up to level 9) and the snake speeds up.
- After every **10 foods** eaten, a golden make.fun bonus appears for **8 seconds** — grab it fast.
- Your best score is saved in your browser.

## Food

| Food | Points |
| --- | ---: |
| ChatGPT | 10 |
| Claude | 15 |
| Gemini | 20 |
| Grok | 25 |
| Golden make.fun (bonus, 8 s) | 50 |

## Controls

- Arrow keys / WASD — steer
- Click or tap the arena — steer toward that point; swipe on touch
- Space / Enter — start, restart, confirm
- P or Esc — pause
- M — mute
- R — restart

## Tech notes

- Plain static files under `game/` (HTML + canvas + ES modules, no build step, no network requests). `main.ts` (Node 22) is the entry program: it copies `game/` and `screenshots/` to `/output` and writes `dossier.json` for the make.fun judge.
- Arena is a fixed 32×18 grid of 40 px cells (1280×720 logical pixels), scaled to the window, so no rule depends on screen size.
- Sound is synthesized in-browser (Web Audio); M mutes it.
- Screenshots in `screenshots/`: start, play, game over, win.

## Links

- Bounty: https://make.fun/bounty/best-game-01
- Leaderboard: https://make.fun/bounty/best-game-01/leaderboard

---

<sub>Entered on [make.fun](https://make.fun/?ref=tmpjcjk4&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
