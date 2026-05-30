// Procedural pixel-art block textures drawn on <canvas>.
// No external image assets -> works offline, no CORS issues.
import * as THREE from 'three';

const SIZE = 16; // texels per block face

// Small deterministic RNG so textures look consistent each build.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fill a canvas with a base color + per-pixel noise speckle.
function makeNoisyCanvas(base, speckle, seed, opts = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (rng() < (opts.density ?? 0.5)) {
        const s = speckle[Math.floor(rng() * speckle.length)];
        ctx.fillStyle = s;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  if (opts.grassTop) {
    // green fringe dripping down a couple pixels (side-of-grass look)
    for (let x = 0; x < SIZE; x++) {
      const h = 2 + Math.floor(rng() * 3);
      ctx.fillStyle = rng() < 0.5 ? '#5aa82a' : '#6abe30';
      ctx.fillRect(x, 0, 1, h);
    }
  }
  return c;
}

function texFromCanvas(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; // crisp pixels
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cache so we build each texture only once.
const cache = {};
function tex(name, build) {
  if (!cache[name]) cache[name] = texFromCanvas(build());
  return cache[name];
}

// Build a BoxGeometry material set [+x,-x,+y,-y,+z,-z].
// `faces` can give different textures for top/side/bottom.
function blockMaterials({ top, side, bottom }) {
  const mTop = new THREE.MeshLambertMaterial({ map: top });
  const mSide = new THREE.MeshLambertMaterial({ map: side });
  const mBottom = new THREE.MeshLambertMaterial({ map: bottom ?? side });
  return [mSide, mSide, mTop, mBottom, mSide, mSide];
}

// ---- Public block definitions ----
export const BlockTex = {
  grassTop: () => tex('grassTop', () =>
    makeNoisyCanvas('#6abe30', ['#5aa82a', '#7cce3c', '#4a8a1e'], 11, { density: 0.7 })),
  grassSide: () => tex('grassSide', () =>
    makeNoisyCanvas('#8a5a2b', ['#7a4f24', '#9a6635', '#6e451f'], 12, { density: 0.6, grassTop: true })),
  dirt: () => tex('dirt', () =>
    makeNoisyCanvas('#8a5a2b', ['#7a4f24', '#9a6635', '#6e451f'], 13, { density: 0.6 })),
  stone: () => tex('stone', () =>
    makeNoisyCanvas('#7d7d7d', ['#6e6e6e', '#8c8c8c', '#666666'], 14, { density: 0.5 })),
  sand: () => tex('sand', () =>
    makeNoisyCanvas('#e3d39b', ['#d8c789', '#eaddb0', '#cdbb7c'], 15, { density: 0.5 })),
  wood: () => tex('wood', () =>
    makeNoisyCanvas('#6b4a25', ['#5c3f1f', '#7a572c', '#4f3619'], 16, { density: 0.4 })),
  woodTop: () => tex('woodTop', () =>
    makeNoisyCanvas('#9a7038', ['#876230', '#a87b40'], 17, { density: 0.5 })),
  leaves: () => tex('leaves', () =>
    makeNoisyCanvas('#3f8a2e', ['#347526', '#4aa036', '#2c6620'], 18, { density: 0.7 })),
  water: () => tex('water', () =>
    makeNoisyCanvas('#2f6fd8', ['#2a64c4', '#3a7ce8'], 19, { density: 0.3 })),
};

// Glowing "?" texture + materials for question blocks.
function questionCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#c9a528';
  ctx.fillRect(0, 0, 64, 6); ctx.fillRect(0, 58, 64, 6);
  ctx.fillRect(0, 0, 6, 64); ctx.fillRect(58, 0, 6, 64);
  ctx.fillStyle = '#3a2a00';
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 32, 36);
  return c;
}
let _qMats = null;
export function getQuestionMaterials() {
  if (_qMats) return _qMats;
  const map = texFromCanvas(questionCanvas());
  const mat = new THREE.MeshLambertMaterial({ map, emissive: 0xffaa00, emissiveIntensity: 0.7 });
  _qMats = [mat, mat, mat, mat, mat, mat];
  return _qMats;
}

// Materials per block type, built lazily.
const matCache = {};
export function getBlockMaterials(type) {
  if (matCache[type]) return matCache[type];
  let mats;
  switch (type) {
    case 'grass':
      mats = blockMaterials({ top: BlockTex.grassTop(), side: BlockTex.grassSide(), bottom: BlockTex.dirt() });
      break;
    case 'dirt':
      mats = blockMaterials({ top: BlockTex.dirt(), side: BlockTex.dirt() });
      break;
    case 'stone':
      mats = blockMaterials({ top: BlockTex.stone(), side: BlockTex.stone() });
      break;
    case 'sand':
      mats = blockMaterials({ top: BlockTex.sand(), side: BlockTex.sand() });
      break;
    case 'wood':
      mats = blockMaterials({ top: BlockTex.woodTop(), side: BlockTex.wood(), bottom: BlockTex.woodTop() });
      break;
    case 'leaves':
      mats = blockMaterials({ top: BlockTex.leaves(), side: BlockTex.leaves() });
      break;
    default:
      mats = blockMaterials({ top: BlockTex.dirt(), side: BlockTex.dirt() });
  }
  matCache[type] = mats;
  return mats;
}
