// Editable voxel world. Unlike a heightmap, every block lives in a 3D grid so
// the player can MINE (remove) and BUILD (place) blocks. Rendering uses one
// face-culled InstancedMesh per block type, rebuilt whenever the world changes.
import * as THREE from 'three';
import { getBlockMaterials, getQuestionMaterials } from './textures.js';
import { DIMENSIONS } from './dimensions.js';

export const WORLD_SIZE = 48;    // blocks along X and Z
export const WORLD_HEIGHT = 32;  // blocks along Y
export const WATER_LEVEL = 8;

// Block ids.
export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAVES: 6, QUESTION: 7,
  // special reward blocks (unlocked by answering questions correctly)
  GLOW: 8, RUBY: 9, SAPPHIRE: 10,
  // dimension-themed blocks
  SNOW: 11, ICE: 12, CACTUS: 13, BASALT: 14,
};
// id -> texture/material name (for getBlockMaterials)
const NAME = {
  1: 'grass', 2: 'dirt', 3: 'stone', 4: 'sand', 5: 'wood', 6: 'leaves',
  8: 'glow', 9: 'ruby', 10: 'sapphire',
  11: 'snow', 12: 'ice', 13: 'cactus', 14: 'basalt',
};
// name -> id, so dimension configs can reference blocks by name
export const ID_BY_NAME = Object.fromEntries(
  Object.entries(NAME).map(([id, name]) => [name, Number(id)])
);
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
  [B.SNOW]:     { name: 'Snow',     color: '#f4f8fc' },
  [B.ICE]:      { name: 'Ice',      color: '#a8d4ee' },
  [B.CACTUS]:   { name: 'Cactus',   color: '#3e8f3e' },
  [B.BASALT]:   { name: 'Basalt',   color: '#3a3a42' },
};

// How long each block takes to break (seconds with the base pickaxe).
const HARDNESS = {
  [B.GRASS]: 0.45, [B.DIRT]: 0.45, [B.SAND]: 0.35, [B.LEAVES]: 0.25,
  [B.WOOD]: 0.9, [B.STONE]: 1.5,
  [B.GLOW]: 1.1, [B.RUBY]: 1.3, [B.SAPPHIRE]: 1.3,
  [B.SNOW]: 0.3, [B.ICE]: 0.9, [B.CACTUS]: 0.5, [B.BASALT]: 1.6,
};
export function hardness(id) { return HARDNESS[id] ?? 0.6; }

// ---- Tools ----
// The player picks a tool from the hotbar; the right tool digs its matching
// material much faster. HAND is the implicit "no tool" (a block is selected).
export const T = { HAND: 0, PICKAXE: 1, AXE: 2, SHOVEL: 3, SWORD: 4 };
export const TOOL_INFO = {
  [T.PICKAXE]: { name: 'Pickaxe', good: [B.STONE, B.GLOW, B.RUBY, B.SAPPHIRE, B.ICE, B.BASALT] },
  [T.AXE]:     { name: 'Axe',     good: [B.WOOD, B.LEAVES, B.CACTUS] },
  [T.SHOVEL]:  { name: 'Shovel',  good: [B.DIRT, B.GRASS, B.SAND, B.SNOW] },
  [T.SWORD]:   { name: 'Sword',   good: [B.LEAVES, B.CACTUS] }, // fast swing, snips leaves/plants
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
  constructor(seed = 1, dim = DIMENSIONS[0]) {
    this.seed = seed >>> 0;
    this.dim = dim;
    // resolve the dimension's terrain layer names to block ids once
    this.layers = {
      surface: ID_BY_NAME[dim.blocks.surface],
      soil: ID_BY_NAME[dim.blocks.soil],
      deep: ID_BY_NAME[dim.blocks.deep],
      beach: ID_BY_NAME[dim.blocks.beach],
    };
    this.voxels = new Uint8Array(WORLD_SIZE * WORLD_HEIGHT * WORLD_SIZE);
    this.group = new THREE.Group();
    this.blockGroup = new THREE.Group();
    this.group.add(this.blockGroup);
    this.structures = []; // footprints { x, z, r } of placed buildings
    this._generate();
    this._addLiquid();
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
        const terr = this.dim.terrain;
        let h = Math.round(WATER_LEVEL + terr.base + n * terr.relief * fall - (1 - fall) * 7);
        if (terr.cone) h += Math.round(terr.cone * Math.max(0, 1 - dist * 2.2));
        h = Math.max(2, Math.min(WORLD_HEIGHT - 6, h));
        const sandy = h <= WATER_LEVEL + 1;
        const L = this.layers;

        for (let y = 0; y < h; y++) {
          let id;
          if (y === h - 1) id = sandy ? L.beach : L.surface;
          else if (y >= h - 3) id = sandy ? L.beach : L.soil;
          else id = L.deep;
          this.set(x, y, z, id);
        }
        // themed vegetation on dry land (keep the central spawn/portal area clear)
        if (!sandy && treeRng() < this.dim.treeDensity && Math.hypot(x - cx, z - cz) > 6) {
          this._growTree(x, h, z, treeRng);
        }
      }
    }
  }

  // Dispatch to the dimension's vegetation type.
  _growTree(x, baseY, z, rng) {
    switch (this.dim.tree) {
      case 'fir': return this._fir(x, baseY, z, rng);
      case 'jungle': return this._jungleTree(x, baseY, z, rng);
      case 'cactus': return this._cactus(x, baseY, z, rng);
      case 'glowrock': return this._glowRock(x, baseY, z, rng);
      default: return this._tree(x, baseY, z, rng);
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

  // Tall narrow conifer: layered leaves narrowing to a spike.
  _fir(x, baseY, z, rng) {
    const trunk = 4 + Math.floor(rng() * 2);
    for (let i = 0; i < trunk; i++) this.set(x, baseY + i, z, B.WOOD);
    const top = baseY + trunk;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) this.set(x + dx, top - 2, z + dz, B.LEAVES);
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) this.set(x + dx, top - 1, z + dz, B.LEAVES);
    this.set(x, top, z, B.LEAVES);
    this.set(x, top + 1, z, B.SNOW); // snowy tip
  }

  // Big jungle tree: tall trunk, wide two-layer canopy.
  _jungleTree(x, baseY, z, rng) {
    const trunk = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < trunk; i++) this.set(x, baseY + i, z, B.WOOD);
    const top = baseY + trunk;
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++)
        if (Math.abs(dx) + Math.abs(dz) <= 3) this.set(x + dx, top, z + dz, B.LEAVES);
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) this.set(x + dx, top + 1, z + dz, B.LEAVES);
    this.set(x, top + 2, z, B.LEAVES);
  }

  // Short cactus column.
  _cactus(x, baseY, z, rng) {
    const h = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < h; i++) this.set(x, baseY + i, z, B.CACTUS);
  }

  // Volcanic glow: a lone glowstone, sometimes atop a small basalt spike.
  _glowRock(x, baseY, z, rng) {
    if (rng() < 0.5) {
      this.set(x, baseY, z, B.GLOW);
    } else {
      this.set(x, baseY, z, B.BASALT);
      this.set(x, baseY + 1, z, B.GLOW);
    }
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

  // The flat liquid plane at WATER_LEVEL — water in most worlds, lava in the volcano.
  _addLiquid() {
    const L = this.dim.liquid;
    const geo = new THREE.PlaneGeometry(WORLD_SIZE + 8, WORLD_SIZE + 8);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ color: L.color, transparent: L.opacity < 1, opacity: L.opacity });
    if (L.emissive) {
      mat.emissive = new THREE.Color(L.emissive);
      mat.emissiveIntensity = 0.6;
    }
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
    const types = this.dim.structures;
    let placed = 0;
    // Anchor the dimension's signature building over a buried question first,
    // so findStructureSpots avoids it.
    if (entries.length && count > 0) {
      const e = entries[Math.floor(rng() * entries.length)];
      this._buildStructure(types[0], e.x, e.z, this.surfaceY(e.x, e.z), rng);
      this.structures.push({ x: e.x, z: e.z, r: 4 });
      placed++;
    }
    // Scatter the rest on flat dry land.
    for (const s of this.findStructureSpots(count - placed, rng)) {
      const type = types[Math.floor(rng() * types.length)];
      this._buildStructure(type, s.x, s.z, this.surfaceY(s.x, s.z), rng);
      this.structures.push({ x: s.x, z: s.z, r: 4 });
    }
  }

  _buildStructure(type, x, z, g, rng) {
    switch (type) {
      case 'tower': return this._tower(x, z, g, rng);
      case 'well': return this._well(x, z, g, rng);
      case 'pyramid': return this._pyramid(x, z, g, rng);
      case 'igloo': return this._igloo(x, z, g, rng);
      case 'ruin': return this._ruin(x, z, g, rng);
      case 'spire': return this._spire(x, z, g, rng);
      default: return this._house(x, z, g, rng);
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
          if (!this.isSolid(this.get(x, y, z))) this.set(x, y, z, y >= baseY - 1 ? this.layers.soil : this.layers.deep);
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

  // A stepped 7x7 sand pyramid with a hollow treasure chamber and doorway.
  _pyramid(cx, cz, g, rng) {
    const x0 = cx - 3, z0 = cz - 3, baseY = g;
    this._levelGround(x0, z0, 7, 7, baseY);
    // solid stepped layers, shrinking by one ring per level
    for (let lvl = 0; lvl < 4; lvl++) {
      const r = 3 - lvl;
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) this.set(cx + dx, baseY + lvl, cz + dz, B.SAND);
    }
    // hollow out a small chamber with loot
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) this.set(cx + dx, baseY, cz + dz, B.AIR);
    this.set(cx - 1, baseY, cz - 1, B.RUBY);
    this.set(cx + 1, baseY, cz - 1, B.SAPPHIRE);
    this.set(cx, baseY + 1, cz, B.GLOW); // chamber light (inside the 2nd layer)
    // doorway on the south face + entry corridor toward the chamber
    this.set(cx, baseY, z0 + 6, B.AIR);
    this.set(cx, baseY, z0 + 5, B.AIR);
  }

  // A round-ish snow shelter with a glow lamp inside.
  _igloo(cx, cz, g, rng) {
    const x0 = cx - 2, z0 = cz - 2, baseY = g;
    this._levelGround(x0, z0, 5, 5, baseY);
    // walls (5x5 ring, corners trimmed for a rounded look), 2 high
    for (let y = baseY; y <= baseY + 1; y++)
      for (let dz = -2; dz <= 2; dz++)
        for (let dx = -2; dx <= 2; dx++) {
          const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
          if (edge && Math.abs(dx) + Math.abs(dz) < 4) this.set(cx + dx, y, cz + dz, B.SNOW);
        }
    // domed roof: full 3x3 plus a center cap
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) this.set(cx + dx, baseY + 2, cz + dz, B.SNOW);
    this.set(cx, baseY + 3, cz, B.ICE); // ice skylight
    // doorway (2 tall so the player can walk in) + lamp
    this.set(cx, baseY, z0 + 4, B.AIR);
    this.set(cx, baseY + 1, z0 + 4, B.AIR);
    this.set(cx - 1, baseY, cz - 1, B.GLOW);
  }

  // Crumbling overgrown walls — a lost jungle temple.
  _ruin(cx, cz, g, rng) {
    const x0 = cx - 2, z0 = cz - 2, baseY = g;
    this._levelGround(x0, z0, 5, 5, baseY);
    for (let dz = -2; dz <= 2; dz++)
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) !== 2 && Math.abs(dz) !== 2) continue; // walls only
        if (rng() < 0.25) continue;                             // collapsed gaps
        const h = 1 + Math.floor(rng() * 3);
        for (let y = 0; y < h; y++) this.set(cx + dx, baseY + y, cz + dz, B.STONE);
        if (rng() < 0.4) this.set(cx + dx, baseY + h, cz + dz, B.LEAVES); // overgrowth
      }
    // mossy floor + a forgotten treasure
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) this.set(cx + dx, baseY - 1, cz + dz, B.STONE);
    this.set(cx, baseY, cz, rng() < 0.5 ? B.RUBY : B.SAPPHIRE);
  }

  // A jagged 2x2 basalt spire crowned with glowstone — volcanic landmark.
  _spire(cx, cz, g, rng) {
    this._levelGround(cx - 1, cz - 1, 2, 2, g);
    const h = 4 + Math.floor(rng() * 4);
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const colH = h - Math.floor(rng() * 3); // uneven jagged tops
      for (let y = 0; y < colH; y++) this.set(cx - 1 + dx, g + y, cz - 1 + dz, B.BASALT);
      if (rng() < 0.75) this.set(cx - 1 + dx, g + colH, cz - 1 + dz, B.GLOW);
    }
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
