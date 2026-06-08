// Editable voxel world. Unlike a heightmap, every block lives in a 3D grid so
// the player can MINE (remove) and BUILD (place) blocks. Rendering uses one
// face-culled InstancedMesh per block type, rebuilt whenever the world changes.
import * as THREE from 'three';
import { getBlockMaterials, getQuestionMaterials } from './textures.js';

export const WORLD_SIZE = 48;    // blocks along X and Z
export const WORLD_HEIGHT = 32;  // blocks along Y
export const WATER_LEVEL = 8;

// Block ids.
export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAVES: 6, QUESTION: 7,
  // special reward blocks (unlocked by answering questions correctly)
  GLOW: 8, RUBY: 9, SAPPHIRE: 10,
};
// id -> texture/material name (for getBlockMaterials)
const NAME = {
  1: 'grass', 2: 'dirt', 3: 'stone', 4: 'sand', 5: 'wood', 6: 'leaves',
  8: 'glow', 9: 'ruby', 10: 'sapphire',
};
// Which ids the player can collect/place and a friendly label + hotbar colour.
export const BLOCK_INFO = {
  [B.GRASS]:    { name: 'Grass',    color: '#6abe30' },
  [B.DIRT]:     { name: 'Dirt',     color: '#8a5a2b' },
  [B.STONE]:    { name: 'Stone',    color: '#7d7d7d' },
  [B.SAND]:     { name: 'Sand',     color: '#e3d39b' },
  [B.WOOD]:     { name: 'Wood',     color: '#6b4a25' },
  [B.LEAVES]:   { name: 'Leaves',   color: '#3f8a2e' },
  [B.GLOW]:     { name: 'Glowstone', color: '#ffd23f', reward: true },
  [B.RUBY]:     { name: 'Ruby',      color: '#e0444f', reward: true },
  [B.SAPPHIRE]: { name: 'Sapphire',  color: '#4a6fe0', reward: true },
};

// How long each block takes to break (seconds with the base pickaxe).
const HARDNESS = {
  [B.GRASS]: 0.45, [B.DIRT]: 0.45, [B.SAND]: 0.35, [B.LEAVES]: 0.25,
  [B.WOOD]: 0.9, [B.STONE]: 1.5,
  [B.GLOW]: 1.1, [B.RUBY]: 1.3, [B.SAPPHIRE]: 1.3,
};
export function hardness(id) { return HARDNESS[id] ?? 0.6; }

// ---- Tools ----
// The player picks a tool from the hotbar; the right tool digs its matching
// material much faster. HAND is the implicit "no tool" (a block is selected).
export const T = { HAND: 0, PICKAXE: 1, AXE: 2, SHOVEL: 3, SWORD: 4 };
export const TOOL_INFO = {
  [T.PICKAXE]: { name: 'Pickaxe', good: [B.STONE, B.GLOW, B.RUBY, B.SAPPHIRE] },
  [T.AXE]:     { name: 'Axe',     good: [B.WOOD, B.LEAVES] },
  [T.SHOVEL]:  { name: 'Shovel',  good: [B.DIRT, B.GRASS, B.SAND] },
  [T.SWORD]:   { name: 'Sword',   good: [B.LEAVES] }, // fast swing, snips leaves/plants
};
// 3x on a matching material, 1x otherwise / by hand. No penalty — kind to beginners.
export function toolFactor(toolId, blockId) {
  const info = TOOL_INFO[toolId];
  return info && info.good.includes(blockId) ? 3 : 1;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function makeNoise(seed) {
  const rng = makeRng(seed);
  const G = 16;
  const grid = [];
  for (let i = 0; i < (G + 1) * (G + 1); i++) grid.push(rng());
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const fx = (x / WORLD_SIZE) * G, fz = (z / WORLD_SIZE) * G;
    const x0 = Math.floor(fx), z0 = Math.floor(fz);
    const tx = smooth(fx - x0), tz = smooth(fz - z0);
    const at = (gx, gz) => grid[(gz % (G + 1)) * (G + 1) + (gx % (G + 1))];
    const top = lerp(at(x0, z0), at(x0 + 1, z0), tx);
    const bot = lerp(at(x0, z0 + 1), at(x0 + 1, z0 + 1), tx);
    return lerp(top, bot, tz);
  };
}

export class World {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this.voxels = new Uint8Array(WORLD_SIZE * WORLD_HEIGHT * WORLD_SIZE);
    this.group = new THREE.Group();
    this.blockGroup = new THREE.Group();
    this.group.add(this.blockGroup);
    this.structures = []; // footprints { x, z, r } of placed buildings
    this._generate();
    this._addWater();
  }

  idx(x, y, z) { return (y * WORLD_SIZE + z) * WORLD_SIZE + x; }

  inBounds(x, y, z) {
    return x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_HEIGHT && z >= 0 && z < WORLD_SIZE;
  }

  // Raw get used for rendering/collision: below the world is solid stone,
  // everything else out of bounds is air.
  get(x, y, z) {
    if (y < 0) return B.STONE;
    if (!this.inBounds(x, y, z)) return B.AIR;
    return this.voxels[this.idx(x, y, z)];
  }
  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.voxels[this.idx(x, y, z)] = id;
  }

  isSolid(id) { return id !== B.AIR; }
  solidAt(wx, wy, wz) { return this.isSolid(this.get(Math.floor(wx), Math.floor(wy), Math.floor(wz))); }

  // Top surface (first air) at a column — used for spawning/placement.
  surfaceY(x, z) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (this.isSolid(this.get(x, y, z))) return y + 1;
    }
    return 0;
  }

  _generate() {
    const noiseA = makeNoise(this.seed);
    const noiseB = makeNoise(this.seed ^ 0x9e3779b9);
    const cx = WORLD_SIZE / 2, cz = WORLD_SIZE / 2, maxR = WORLD_SIZE / 2;
    const treeRng = makeRng(this.seed ^ 0x1234abcd);

    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const n = noiseA(x, z) * 0.7 + noiseB(x * 2, z * 2) * 0.3;
        const dx = (x - cx) / maxR, dz = (z - cz) / maxR;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const fall = Math.max(0, 1 - dist * dist * 1.15);
        let h = Math.round(WATER_LEVEL + 2 + n * 9 * fall - (1 - fall) * 7);
        h = Math.max(2, Math.min(WORLD_HEIGHT - 6, h));
        const sandy = h <= WATER_LEVEL + 1;

        for (let y = 0; y < h; y++) {
          let id;
          if (y === h - 1) id = sandy ? B.SAND : B.GRASS;
          else if (y >= h - 3) id = sandy ? B.SAND : B.DIRT;
          else id = B.STONE;
          this.set(x, y, z, id);
        }
        // trees on dry grass
        if (!sandy && treeRng() < 0.03) this._tree(x, h, z, treeRng);
      }
    }
  }

  _tree(x, baseY, z, rng) {
    const trunk = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < trunk; i++) this.set(x, baseY + i, z, B.WOOD);
    const top = baseY + trunk;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        this.set(x + dx, top, z + dz, B.LEAVES);
        if (Math.abs(dx) + Math.abs(dz) <= 1) this.set(x + dx, top + 1, z + dz, B.LEAVES);
      }
    this.set(x, top + 1, z, B.LEAVES);
  }

  // A solid block is drawn only if it has at least one air-facing side.
  _exposed(x, y, z) {
    return (
      this.get(x + 1, y, z) === B.AIR || this.get(x - 1, y, z) === B.AIR ||
      this.get(x, y + 1, z) === B.AIR || this.get(x, y - 1, z) === B.AIR ||
      this.get(x, y, z + 1) === B.AIR || this.get(x, y, z - 1) === B.AIR
    );
  }

  // (Re)build the instanced meshes from the current voxel data.
  rebuild() {
    // clear old meshes
    for (let i = this.blockGroup.children.length - 1; i >= 0; i--) {
      const m = this.blockGroup.children[i];
      this.blockGroup.remove(m);
      if (m.geometry) m.geometry.dispose();
    }

    const buckets = {}; // name -> [Matrix4]
    const qMats = [];
    const tmp = new THREE.Matrix4();
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        for (let x = 0; x < WORLD_SIZE; x++) {
          const id = this.voxels[this.idx(x, y, z)];
          if (id === B.AIR) continue;
          if (!this._exposed(x, y, z)) continue;
          tmp.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
          if (id === B.QUESTION) { qMats.push(tmp.clone()); continue; }
          const name = NAME[id];
          (buckets[name] ||= []).push(tmp.clone());
        }
      }
    }

    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (const [name, mats] of Object.entries(buckets)) {
      const inst = new THREE.InstancedMesh(geo, getBlockMaterials(name), mats.length);
      mats.forEach((mm, i) => inst.setMatrixAt(i, mm));
      inst.instanceMatrix.needsUpdate = true;
      this.blockGroup.add(inst);
    }
    if (qMats.length) {
      const inst = new THREE.InstancedMesh(geo, getQuestionMaterials(), qMats.length);
      qMats.forEach((mm, i) => inst.setMatrixAt(i, mm));
      inst.instanceMatrix.needsUpdate = true;
      this.blockGroup.add(inst);
    }
  }

  _addWater() {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE + 8, WORLD_SIZE + 8);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x2f6fd8, transparent: true, opacity: 0.72 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WORLD_SIZE / 2, WATER_LEVEL, WORLD_SIZE / 2);
    this.group.add(mesh);
  }

  // Voxel ray traversal (Amanatides & Woo). Returns the first solid block hit
  // plus the empty cell just before it (where a new block would be placed).
  raycast(origin, dir, maxDist = 6, ignoreId = -1) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
    const fb = (o, s) => s > 0 ? (Math.floor(o) + 1 - o) : (o - Math.floor(o));
    let tMaxX = dir.x !== 0 ? fb(origin.x, stepX) * tDeltaX : Infinity;
    let tMaxY = dir.y !== 0 ? fb(origin.y, stepY) * tDeltaY : Infinity;
    let tMaxZ = dir.z !== 0 ? fb(origin.z, stepZ) * tDeltaZ : Infinity;

    let px = x, py = y, pz = z;
    let t = 0;
    while (t <= maxDist) {
      const id = this.get(x, y, z);
      if (id !== B.AIR && id !== ignoreId) {
        return { hit: { x, y, z, id }, prev: { x: px, y: py, z: pz } };
      }
      px = x; py = y; pz = z;
      if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; }
      else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; }
      else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; }
    }
    return null;
  }

  // Spread-out dry-land columns for placing objectives.
  findObjectiveSpots(count, rng) {
    const spots = [];
    const cx = WORLD_SIZE / 2, cz = WORLD_SIZE / 2;
    let attempts = 0;
    while (spots.length < count && attempts < 4000) {
      attempts++;
      const x = 5 + Math.floor(rng() * (WORLD_SIZE - 10));
      const z = 5 + Math.floor(rng() * (WORLD_SIZE - 10));
      const sy = this.surfaceY(x, z);
      if (sy <= WATER_LEVEL + 1) continue;
      if (Math.hypot(x - cx, z - cz) < 7) continue;
      if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 7)) continue;
      spots.push({ x, z, y: sy });
    }
    return spots;
  }

  // ---- Hand-built structures ----------------------------------------------
  // Buildings made of ordinary blocks, placed on dry flat land. They give the
  // island landmarks to explore and a little loot to mine. One house is anchored
  // over a buried question so digging through its floor uncovers it.
  addStructures(rng, count, opts = {}) {
    const entries = opts.entries || [];
    let placed = 0;
    // Anchor a house over a buried question first, so findStructureSpots avoids it.
    if (entries.length && count > 0) {
      const e = entries[Math.floor(rng() * entries.length)];
      this._house(e.x, e.z, this.surfaceY(e.x, e.z), rng);
      this.structures.push({ x: e.x, z: e.z, r: 4 });
      placed++;
    }
    // Scatter the rest on flat dry land.
    const types = ['house', 'tower', 'well'];
    for (const s of this.findStructureSpots(count - placed, rng)) {
      const g = this.surfaceY(s.x, s.z);
      const type = types[Math.floor(rng() * types.length)];
      if (type === 'tower') this._tower(s.x, s.z, g, rng);
      else if (type === 'well') this._well(s.x, s.z, g, rng);
      else this._house(s.x, s.z, g, rng);
      this.structures.push({ x: s.x, z: s.z, r: 4 });
    }
  }

  // Spread-out, dry, roughly-flat 5x5 spots away from the central portal.
  findStructureSpots(count, rng) {
    const spots = [];
    const cx = WORLD_SIZE / 2, cz = WORLD_SIZE / 2;
    let attempts = 0;
    while (spots.length < count && attempts < 4000) {
      attempts++;
      const x = 6 + Math.floor(rng() * (WORLD_SIZE - 12));
      const z = 6 + Math.floor(rng() * (WORLD_SIZE - 12));
      const sy = this.surfaceY(x, z);
      if (sy <= WATER_LEVEL + 1) continue;             // not on/under water
      if (Math.hypot(x - cx, z - cz) < 8) continue;     // clear of the portal
      let flat = true;                                  // require an even footprint
      for (let dz = -2; dz <= 2 && flat; dz++)
        for (let dx = -2; dx <= 2; dx++) {
          const h = this.surfaceY(x + dx, z + dz);
          if (Math.abs(h - sy) > 2 || h <= WATER_LEVEL + 1) { flat = false; break; }
        }
      if (!flat) continue;
      if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 8)) continue;
      if (this.structures.some((s) => Math.hypot(s.x - x, s.z - z) < 8)) continue;
      spots.push({ x, z, y: sy });
    }
    return spots;
  }

  // Flatten a footprint to `baseY`: fill gaps below it solid, clear everything
  // above (trees/slopes), so a building never floats or half-sinks.
  _levelGround(x0, z0, w, d, baseY) {
    for (let z = z0; z < z0 + d; z++)
      for (let x = x0; x < x0 + w; x++) {
        for (let y = 0; y < baseY; y++)
          if (!this.isSolid(this.get(x, y, z))) this.set(x, y, z, y >= baseY - 1 ? B.DIRT : B.STONE);
        for (let y = baseY; y < WORLD_HEIGHT; y++) this.set(x, y, z, B.AIR);
      }
  }

  // A 5x5 cottage: wood floor + walls (doorway + windows), leaf roof, a glowstone
  // lamp and a small loot stash inside.
  _house(cx, cz, g, rng) {
    const w = 5, d = 5, x0 = cx - 2, z0 = cz - 2, baseY = g;
    this._levelGround(x0, z0, w, d, baseY);
    const floorY = baseY - 1, wallTop = baseY + 2;
    for (let z = z0; z < z0 + d; z++)
      for (let x = x0; x < x0 + w; x++) this.set(x, floorY, z, B.WOOD);
    for (let y = baseY; y <= wallTop; y++)
      for (let z = z0; z < z0 + d; z++)
        for (let x = x0; x < x0 + w; x++)
          if (x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1) this.set(x, y, z, B.WOOD);
    // doorway (front wall, 2 tall) + side windows
    this.set(cx, baseY, z0 + d - 1, B.AIR);
    this.set(cx, baseY + 1, z0 + d - 1, B.AIR);
    this.set(x0, baseY + 1, cz, B.AIR);
    this.set(x0 + w - 1, baseY + 1, cz, B.AIR);
    // overhanging roof
    const roofY = wallTop + 1;
    for (let z = z0 - 1; z <= z0 + d; z++)
      for (let x = x0 - 1; x <= x0 + w; x++) this.set(x, roofY, z, B.WOOD);
    // lamp + corner loot to mine
    this.set(cx, baseY + 2, cz, B.GLOW);
    this.set(x0 + 1, baseY, z0 + 1, B.RUBY);
    this.set(x0 + 1, baseY, z0 + 2, B.SAPPHIRE);
    this.set(x0 + 1, baseY + 1, z0 + 1, B.GLOW);
  }

  // A stone watchtower with a glowstone light on top — a far-visible landmark.
  _tower(cx, cz, g, rng) {
    const w = 3, x0 = cx - 1, z0 = cz - 1, baseY = g;
    this._levelGround(x0, z0, w, w, baseY);
    const h = 5 + Math.floor(rng() * 3);
    for (let y = baseY; y < baseY + h; y++)
      for (let z = z0; z < z0 + w; z++)
        for (let x = x0; x < x0 + w; x++)
          if (x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + w - 1) this.set(x, y, z, B.STONE);
    const topY = baseY + h;
    for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) this.set(x0 + dx, topY, z0 + dz, B.STONE);
    this.set(cx, topY, cz, B.GLOW);
  }

  // A small stone well with wooden posts and a leaf canopy.
  _well(cx, cz, g, rng) {
    const w = 3, x0 = cx - 1, z0 = cz - 1, baseY = g;
    this._levelGround(x0, z0, w, w, baseY);
    for (let y = baseY; y <= baseY + 1; y++)
      for (let z = z0; z < z0 + w; z++)
        for (let x = x0; x < x0 + w; x++)
          if (x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + w - 1) this.set(x, y, z, B.STONE);
    this.set(cx, baseY, cz, B.SAPPHIRE); // water in the middle
    for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) this.set(x0 + dx, baseY + 2, z0 + dz, B.WOOD);
    for (let z = z0; z < z0 + w; z++)
      for (let x = x0; x < x0 + w; x++) this.set(x, baseY + 3, z, B.LEAVES);
  }

  dispose() {
    for (const m of this.blockGroup.children) if (m.geometry) m.geometry.dispose();
  }
}
