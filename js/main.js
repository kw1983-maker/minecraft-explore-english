// WordCraft — entry point. Explore a voxel world, MINE down to buried question
// blocks, answer English questions for keys, BUILD with what you mine, then open
// the portal to advance.
import * as THREE from 'three';
import { World, WORLD_SIZE, B, BLOCK_INFO, hardness, T, TOOL_INFO, toolFactor } from './world.js';
import { Player } from './player.js';
import { Objectives } from './objectives.js';
import { Quiz } from './quiz.js';
import { pickQuestions, TIERS } from './questions.js';
import { Sfx, Music } from './audio.js';
import { ViewModel } from './viewmodel.js';
import { getCrackTexture, getToolIcon } from './textures.js';

// ---- Renderer / scene ----
const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false; // we clear manually so the held hand can render on top
container.appendChild(renderer.domElement);

const viewModel = new ViewModel();
viewModel.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 34, 80);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x6a8a4a, 0.95));
const sun = new THREE.DirectionalLight(0xfff4d6, 0.7);
sun.position.set(30, 60, 20);
scene.add(sun);

// targeted-block highlight (wireframe cube)
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
);
highlight.visible = false;
scene.add(highlight);

const player = new Player(camera, renderer.domElement);
const quiz = new Quiz();

// ---- Game state ----
// The hotbar mixes TOOLS (pick the right one to dig faster) and BLOCKS (place
// with right-click). Each slot is tagged so selection logic knows which is which.
const HOTBAR = [
  { kind: 'tool', id: T.PICKAXE }, { kind: 'tool', id: T.AXE },
  { kind: 'tool', id: T.SHOVEL }, { kind: 'tool', id: T.SWORD },
  { kind: 'block', id: B.STONE }, { kind: 'block', id: B.WOOD }, { kind: 'block', id: B.DIRT },
  { kind: 'block', id: B.GLOW }, { kind: 'block', id: B.RUBY }, { kind: 'block', id: B.SAPPHIRE },
];
const REWARD_BLOCKS = [B.GLOW, B.RUBY, B.SAPPHIRE];
const state = {
  level: 1, score: 0, streak: 0, bestStreak: 0,
  keys: 0, keysTotal: 0, playing: false,
  inv: {}, selected: 0,     // start holding the Pickaxe
  pickFactor: 1,            // base mining speed multiplier (rises with level)
};

let world = null;
let objectives = null;
let target = null;          // { hit:{x,y,z,id}, prev:{x,y,z} } | null
let targetEntry = null;     // question entry under the crosshair | null

// ---- Mining (hold-to-break) + crack overlay ----
let leftHeld = false;
let mining = null;          // { x, y, z, id, progress, swingTimer } | null
let crackStage = -1;
const crackMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1.003, 1.003, 1.003),
  new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })
);
crackMesh.visible = false;
scene.add(crackMesh);

// ---- Break particles ----
const particles = [];
function spawnParticles(cx, cy, cz, hex) {
  const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex) });
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.set(cx, cy, cz);
    const v = new THREE.Vector3((Math.random() - 0.5) * 3.5, Math.random() * 3 + 1, (Math.random() - 0.5) * 3.5);
    scene.add(p);
    particles.push({ mesh: p, v, life: 0.7 });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.v.y -= 12 * dt;
    p.mesh.position.addScaledVector(p.v, dt);
    if (p.life <= 0) { scene.remove(p.mesh); p.mesh.geometry.dispose(); particles.splice(i, 1); }
  }
}

// ---- DOM ----
const el = {
  start: document.getElementById('start'),
  hud: document.getElementById('hud'),
  crosshair: document.getElementById('crosshair'),
  prompt: document.getElementById('prompt'),
  toast: document.getElementById('toast'),
  loading: document.getElementById('loading'),
  levelend: document.getElementById('levelend'),
  hotbar: document.getElementById('hotbar'),
  hudLevel: document.getElementById('hud-level'),
  hudKeys: document.getElementById('hud-keys'),
  hudKeysTotal: document.getElementById('hud-keys-total'),
  hudScore: document.getElementById('hud-score'),
  hudStreak: document.getElementById('hud-streak'),
  hudTier: document.getElementById('hud-tier'),
};

let toastTimer = null;
function toast(msg, ms = 1800) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  el.toast.style.animation = 'none';
  void el.toast.offsetWidth;
  el.toast.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), ms);
}

function updateHud() {
  el.hudLevel.textContent = state.level;
  el.hudKeys.textContent = state.keys;
  el.hudKeysTotal.textContent = state.keysTotal;
  el.hudScore.textContent = state.score;
  el.hudStreak.textContent = state.streak;
}

// ---- Hotbar / inventory ----
function renderHotbar() {
  el.hotbar.innerHTML = '';
  HOTBAR.forEach((sd, i) => {
    const slot = document.createElement('div');
    const isTool = sd.kind === 'tool';
    slot.className = 'slot' + (isTool ? ' tool' : '') + (i === state.selected ? ' sel' : '');
    const numLabel = i < 9 ? `<span class="num">${i + 1}</span>` : '';
    if (isTool) {
      slot.innerHTML = `<span class="icon" style="background-image:url(${getToolIcon(sd.id)})"></span>` + numLabel;
      slot.title = TOOL_INFO[sd.id].name;
    } else {
      const info = BLOCK_INFO[sd.id];
      slot.innerHTML =
        `<span class="swatch" style="background:${info.color}"></span>` +
        `<span class="count">${state.inv[sd.id] || 0}</span>` + numLabel;
      slot.title = info.name;
    }
    slot.addEventListener('click', () => { state.selected = i; renderHotbar(); });
    el.hotbar.appendChild(slot);
  });
  // keep the held model in sync with the selection
  const sel = HOTBAR[state.selected];
  viewModel.setHeld(sel.kind === 'tool'
    ? { kind: 'tool', id: sel.id }
    : { kind: 'block', id: sel.id, color: BLOCK_INFO[sel.id].color });
}

// ---- Level building ----
function tierForLevel(level) { return Math.min(level - 1, TIERS.length - 1); }

function buildLevel(level) {
  el.loading.classList.remove('hidden');
  if (objectives) objectives.dispose();
  if (world) { scene.remove(world.group); world.dispose(); }

  const seed = (level * 92821 + 7) >>> 0;
  world = new World(seed);                  // generates voxels
  scene.add(world.group);

  const tierIdx = tierForLevel(level);
  const count = Math.min(3 + level, 6);
  const { tierName, questions } = pickQuestions(tierIdx, count);

  const rng = (() => { let s = seed ^ 0x55aa; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
  objectives = new Objectives(scene, world, questions, rng); // edits voxels
  const structCount = Math.min(3 + Math.floor(level / 2), 6);
  world.addStructures(rng, structCount, { entries: objectives.entries }); // buildings on top
  world.rebuild();                          // build meshes from final voxels

  player.setWorld(world);

  state.keys = 0;
  state.keysTotal = objectives.total;
  // starter blocks so you can build right away (plus whatever you mine)
  state.inv = {
    [B.GRASS]: 0, [B.DIRT]: 0, [B.STONE]: 20, [B.SAND]: 0, [B.WOOD]: 10, [B.LEAVES]: 0,
    [B.GLOW]: 0, [B.RUBY]: 0, [B.SAPPHIRE]: 0,
  };
  // pickaxe tier rises with level (wood -> stone -> iron), mining faster each time
  const tier = Math.min(level, 3);
  state.pickFactor = [1, 1, 1.6, 2.4][tier];
  viewModel.setTier(tier);
  cancelMining();

  renderHotbar();
  el.hudTier.textContent = `📚 ${tierName} — dig to ${objectives.total} glowing beacons`;
  updateHud();
  setTimeout(() => el.loading.classList.add('hidden'), 150);
}

// ---- Mining / building ----
function cancelMining() {
  mining = null;
  crackStage = -1;
  crackMesh.visible = false;
}

// Called every frame: hold left mouse on a block to break it over time.
function updateMining(dt) {
  if (!state.playing || quiz.isOpen() || !leftHeld || !target || target.hit.id === B.QUESTION) {
    cancelMining();
    return;
  }
  const h = target.hit;
  if (!mining || mining.x !== h.x || mining.y !== h.y || mining.z !== h.z) {
    mining = { x: h.x, y: h.y, z: h.z, id: h.id, progress: 0, swingTimer: 0 };
  }
  // break speed = base pickaxe speed × how good the held tool is for this block
  const sel = HOTBAR[state.selected];
  const selTool = sel.kind === 'tool' ? sel.id : T.HAND;
  mining.progress += dt * state.pickFactor * toolFactor(selTool, h.id) / hardness(h.id);

  // keep swinging + a soft dig tick
  mining.swingTimer -= dt;
  if (mining.swingTimer <= 0) { viewModel.swing(); Sfx.mine(); mining.swingTimer = 0.3; }

  // crack overlay
  const stage = Math.max(0, Math.min(9, Math.floor(mining.progress * 10)));
  crackMesh.position.set(h.x + 0.5, h.y + 0.5, h.z + 0.5);
  crackMesh.visible = true;
  if (stage !== crackStage) {
    crackStage = stage;
    crackMesh.material.map = getCrackTexture(stage);
    crackMesh.material.needsUpdate = true;
  }

  if (mining.progress >= 1) breakBlock(h);
}

function breakBlock(h) {
  if (BLOCK_INFO[h.id]) state.inv[h.id] = (state.inv[h.id] || 0) + 1; // collect
  spawnParticles(h.x + 0.5, h.y + 0.5, h.z + 0.5, BLOCK_INFO[h.id] ? BLOCK_INFO[h.id].color : '#888888');
  Sfx.breakBlock();
  world.set(h.x, h.y, h.z, B.AIR);
  world.rebuild();
  renderHotbar();
  cancelMining(); // will re-target / re-start on the next block while held
}

function build() {
  if (!target) return;
  const sel = HOTBAR[state.selected];
  if (sel.kind !== 'block') { toast('Hold a block to build (keys 5–9)'); return; }
  const id = sel.id;
  if ((state.inv[id] || 0) <= 0) { toast(`No ${BLOCK_INFO[id].name} left to place`); return; }
  const { x, y, z } = target.prev;
  if (world.get(x, y, z) !== B.AIR) return;
  if (overlapsPlayer(x, y, z)) return;       // don't trap the player
  world.set(x, y, z, id);
  state.inv[id]--;
  world.rebuild();
  renderHotbar();
}

function overlapsPlayer(x, y, z) {
  const p = player.pos, HALF = 0.3, BODY = 1.8;
  return x >= Math.floor(p.x - HALF) && x <= Math.floor(p.x + HALF) &&
         y >= Math.floor(p.y) && y <= Math.floor(p.y + BODY - 0.001) &&
         z >= Math.floor(p.z - HALF) && z <= Math.floor(p.z + HALF);
}

// ---- Quiz ----
function openQuiz(entry = targetEntry) {
  if (!entry || quiz.isOpen()) return;
  releaseControl();
  quiz.open(entry.question, {
    onCorrect: () => {
      state.score += 10 + state.streak * 5;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      updateHud();
    },
    onWrong: () => { state.streak = 0; updateHud(); },
    onSolved: () => {
      objectives.solve(entry);
      world.rebuild();
      state.keys++;
      Sfx.collect();
      // reward: unlock a stack of special glowing build blocks (more for streaks)
      const rewardId = REWARD_BLOCKS[(state.keys - 1) % REWARD_BLOCKS.length];
      const amount = 3 + Math.min(state.streak, 5);
      state.inv[rewardId] = (state.inv[rewardId] || 0) + amount;
      renderHotbar();
      updateHud();
      if (objectives.solvedCount >= objectives.total) {
        toast('🌟 Portal unlocked! Head to the center!', 2600);
        Sfx.portal();
      } else {
        toast(`🔑 Key + ${amount} ${BLOCK_INFO[rewardId].name} blocks to build with!`, 2400);
      }
      resumeControl();
    },
    onAbandon: () => resumeControl(),
  });
}

function releaseControl() { player.setEnabled(false); if (document.exitPointerLock) document.exitPointerLock(); }
function resumeControl() { if (!state.playing) return; player.setEnabled(true); player.requestLock(); }

function completeLevel() {
  if (!objectives || objectives.levelDone) return;
  objectives.levelDone = true;
  state.playing = false;
  releaseControl();
  Sfx.portal();
  el.levelend.querySelector('#levelend-title').innerHTML = `LEVEL ${state.level} <span>COMPLETE!</span>`;
  el.levelend.querySelector('#levelend-msg').textContent = 'You opened the portal! Ready for harder English?';
  el.levelend.querySelector('#levelend-stats').innerHTML =
    `<div>⭐ Score: <b>${state.score}</b></div>
     <div>🔥 Best streak: <b>${state.bestStreak}</b></div>
     <div>🔑 Questions solved: <b>${state.keysTotal}</b></div>`;
  el.levelend.classList.remove('hidden');
}

// ---- Start / next ----
function startGame() {
  Sfx.unlock();
  Music.start();
  el.start.classList.add('hidden');
  el.hud.classList.remove('hidden');
  el.crosshair.classList.remove('hidden');
  el.hotbar.classList.remove('hidden');
  state.level = 1; state.score = 0; state.streak = 0; state.bestStreak = 0;
  buildLevel(state.level);
  state.playing = true;
  player.setEnabled(true);
  player.requestLock();
  toast('⛏️ Pick a tool (1–4) • left-click mine • right-click build • dig to the beacons!', 4200);
}

function nextLevel() {
  el.levelend.classList.add('hidden');
  state.level++;
  buildLevel(state.level);
  state.playing = true;
  player.setEnabled(true);
  player.requestLock();
}

document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-next').addEventListener('click', nextLevel);

// ---- Music toggle (button + M key) ----
const musicBtn = document.getElementById('music-toggle');
function refreshMusicBtn() {
  musicBtn.textContent = Music.enabled ? '🎵' : '🔇';
  musicBtn.classList.toggle('off', !Music.enabled);
}
musicBtn.addEventListener('click', () => { Music.toggle(); refreshMusicBtn(); });
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') { Music.toggle(); refreshMusicBtn(); }
});

// ---- Input ----
window.addEventListener('keydown', (e) => {
  if (!state.playing) return;
  if (e.code === 'KeyE') {
    if (objectives.getPortalNearby(player.pos)) completeLevel();
    else if (targetEntry && !quiz.isOpen()) { viewModel.swing(); openQuiz(); }
  }
  // hotbar select 1..6
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= HOTBAR.length) { state.selected = n - 1; renderHotbar(); }
});

window.addEventListener('wheel', (e) => {
  if (!state.playing || quiz.isOpen()) return;
  state.selected = (state.selected + (e.deltaY > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length;
  renderHotbar();
}, { passive: true });

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!state.playing || quiz.isOpen()) return;
  if (!player.locked) { player.requestLock(); return; }
  if (e.button === 0) {
    // left: click an uncovered question to answer; otherwise hold to mine
    if (target && target.hit.id === B.QUESTION) { viewModel.swing(); openQuiz(); }
    else { leftHeld = true; viewModel.swing(); }
  } else if (e.button === 2) {
    viewModel.swing();
    build();   // right: place a block (instant)
  }
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) { leftHeld = false; cancelMining(); } });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) { leftHeld = false; cancelMining(); } });

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  viewModel.setSize(window.innerWidth, window.innerHeight);
});

// ---- Game loop ----
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  player.update(dt);

  const k = player.keys;
  const moving = state.playing && player.onGround && (k['KeyW'] || k['KeyA'] || k['KeyS'] || k['KeyD']);
  viewModel.update(dt, !!moving);
  updateParticles(dt);

  if (objectives && state.playing) {
    objectives.update(dt, t);

    // what block is under the crosshair?
    target = quiz.isOpen() ? null : world.raycast(player.eyePosition(), player.forward(), 6);
    targetEntry = (target && target.hit.id === B.QUESTION)
      ? objectives.getQuestionAt(target.hit.x, target.hit.y, target.hit.z) : null;

    updateMining(dt);

    if (target) {
      highlight.position.set(target.hit.x + 0.5, target.hit.y + 0.5, target.hit.z + 0.5);
      highlight.visible = true;
    } else highlight.visible = false;

    // prompt
    if (targetEntry) {
      el.prompt.innerHTML = 'Click the glowing block (or <kbd>E</kbd>) to answer!';
      el.prompt.classList.remove('hidden');
    } else if (objectives.getPortalNearby(player.pos)) {
      el.prompt.innerHTML = 'Press <kbd>E</kbd> to enter the portal';
      el.prompt.classList.remove('hidden');
    } else {
      el.prompt.classList.add('hidden');
    }
  } else {
    highlight.visible = false;
    el.prompt.classList.add('hidden');
  }

  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth();
  if (state.playing) viewModel.render(renderer);
}
animate();

// Debug handle.
window.WordCraft = {
  state,
  get world() { return world; },
  get objectives() { return objectives; },
  player, quiz, scene, viewModel,
  get target() { return target; },
  get targetEntry() { return targetEntry; },
  build, breakBlock, openQuiz,
  mineTarget() { if (target && target.hit.id !== B.QUESTION) breakBlock(target.hit); },
  answerNearest() { const e = objectives.entries.find((x) => !x.solved); if (e) openQuiz(e); return !!e; },
  digToFirstQuestion() {
    const e = objectives && objectives.entries.find((x) => !x.solved);
    if (!e) return false;
    // clear the column above the buried block and stand the player there
    for (let y = e.y + 1; y < world.surfaceY(e.x, e.z) + 1; y++) world.set(e.x, y, e.z, B.AIR);
    world.rebuild();
    player.pos.set(e.x + 0.5, e.y + 1.5, e.z + 0.5);
    player.vel.set(0, 0, 0);
    return true;
  },
};
