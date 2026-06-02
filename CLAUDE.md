# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**WordCraft** — a Minecraft-style 3D browser game for ESL beginners. Players explore a voxel island, dig to buried question blocks, and answer English multiple-choice questions. Pure browser game: no install, no server, no API keys. Three.js is loaded from a CDN.

## Running the game

**Simplest:** double-click `index.html` — it is a single self-contained file that runs from `file://`.

**Alternatively**, serve over HTTP (required if editing modular source directly without building):
```bash
python -m http.server 8000
# or: npx serve .
```

## Build

`index.html` is **generated** — never edit it directly. The source of truth is `js/*.js` + `css/style.css`.

After any source change, rebuild:
```bash
python build.py
```

`build.py` strips ES module syntax (`import`/`export`) and concatenates all JS in dependency order into a single `<script type="module">` inside `build/template.html`. The result is written to `index.html`.

Build order matters (defined in `build.py`):
`textures → audio → questions → world → player → objectives → viewmodel → quiz → main`

## Architecture

All game logic is in `js/`. There is no framework, bundler, or package manager — plain ES modules served from a CDN import map.

**`js/main.js`** — entry point and game loop. Owns the Three.js scene, renderer, camera, lights, game state (`state` object), mining/building logic, input handling, and level orchestration. Exposes `window.WordCraft` for browser-console debugging.

**`js/world.js`** — voxel grid (`Uint8Array`, 48×32×48). Generates the island procedurally from a seed (smooth noise heightmap), manages water. `World.set(x,y,z,id)` mutates a voxel; `World.rebuild()` regenerates the Three.js `InstancedMesh` geometry (one mesh per block type, face-culled). `World.raycast()` returns the block under the crosshair.

**`js/player.js`** — first-person controller: pointer-lock mouse look, WASD movement, gravity, jump, AABB collision against the voxel grid, auto step-up for 1-block ledges.

**`js/objectives.js`** — places question blocks and glowing beacons in the world (buried underground). Tracks which questions are solved and whether the portal should be unlocked. The portal is a glowing column in the center of the island.

**`js/quiz.js`** — modal quiz overlay: shows the question, 4 answer buttons, hint, and explanation. Fires `onCorrect`, `onWrong`, `onSolved`, `onAbandon` callbacks.

**`js/questions.js`** — the question bank. Three tiers (`TIERS[0..2]`): Vocabulary, Words & Grammar, Grammar Quest. Each question: `{ visual?, category, q, options[], answer, hint?, explain? }`. `pickQuestions(tierIdx, count)` randomly samples from a tier.

**`js/audio.js`** — synthesized sound effects and background music via the WebAudio API. `Sfx.*` for one-shot effects; `Music` for the procedural ambient loop. No audio files — everything is oscillators.

**`js/textures.js`** — procedural block textures drawn to `<canvas>` at runtime. `getCrackTexture(stage)` for 10-stage mining crack overlay.

**`js/viewmodel.js`** — first-person held hand rendered in a separate scene/camera (depth-cleared before rendering, so the hand always appears in front). Animates bob and swing.

## Key data contracts

- Block IDs live in `B` (exported from `world.js`). Never hardcode numeric IDs.
- `BLOCK_INFO[id]` gives `{ name, color, reward? }` for placeable/collectable blocks.
- `hardness(id)` returns break time in seconds for the base pickaxe; `state.pickFactor` multiplies speed.
- Level number → tier index: `Math.min(level - 1, TIERS.length - 1)`.
- Scoring: +10 pts per correct answer + 5× streak bonus; streak resets on wrong answers.

## Adding questions

Edit `js/questions.js` — add objects to any tier's `questions` array, then run `python build.py`.

## Debug console

`window.WordCraft` exposes live game state and helper methods (`mineTarget()`, `answerNearest()`, `digToFirstQuestion()`, etc.) for in-browser testing.
