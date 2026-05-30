// Objectives: question blocks are now real voxels BURIED under a stone cap, so
// the player must MINE down to uncover them. Each has a glowing beacon so it can
// be found. Solving every question activates the central portal.
import * as THREE from 'three';
import { WORLD_SIZE, WORLD_HEIGHT, B } from './world.js';

export class Objectives {
  constructor(scene, world, questions, rng) {
    this.scene = scene;
    this.world = world;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.entries = [];
    this.byKey = new Map();   // "x,y,z" -> entry
    this.particles = [];
    this.total = questions.length;
    this.solvedCount = 0;
    this.portalActive = false;
    this.levelDone = false;

    this._placeQuestions(questions, rng);
    this._buildPortal();
  }

  key(x, y, z) { return `${x},${y},${z}`; }

  _placeQuestions(questions, rng) {
    const spots = this.world.findObjectiveSpots(questions.length, rng);
    questions.forEach((q, i) => {
      const s = spots[i];
      if (!s) return;
      const x = s.x, z = s.z;
      // Bury the block ~3 blocks below the surface, inside solid ground, so the
      // player must dig down to uncover it. A beacon marks the column.
      const y = Math.max(1, s.y - 3);
      this.world.set(x, y, z, B.QUESTION);

      const beacon = this._beacon(x, y, z);
      this.group.add(beacon);

      const entry = { x, y, z, question: q, solved: false, beacon };
      this.entries.push(entry);
      this.byKey.set(this.key(x, y, z), entry);
    });
  }

  // A tall translucent glowing column marking a buried question block.
  _beacon(x, y, z) {
    const h = WORLD_HEIGHT - y;
    const geo = new THREE.BoxGeometry(0.35, h, 0.35);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.32 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + 0.5, y + h / 2, z + 0.5);
    return m;
  }

  _buildPortal() {
    this.portal = new THREE.Group();
    const cx = Math.floor(WORLD_SIZE / 2), cz = Math.floor(WORLD_SIZE / 2);
    const baseY = this.world.surfaceY(cx, cz);
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x2a2433 });
    const frameGeo = new THREE.BoxGeometry(1, 1, 1);
    for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [1, 2], [-1, 3], [0, 3], [1, 3]]) {
      const b = new THREE.Mesh(frameGeo, frameMat);
      b.position.set(cx + dx + 0.5, baseY + dy + 0.5, cz + 0.5);
      this.portal.add(b);
    }
    this.portalMat = new THREE.MeshBasicMaterial({ color: 0x333344, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    this.portalSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3), this.portalMat);
    this.portalSurface.position.set(cx + 0.5, baseY + 2, cz + 0.5);
    this.portal.add(this.portalSurface);
    this.portalPos = new THREE.Vector3(cx + 0.5, baseY + 1, cz + 0.5);
    this.scene.add(this.portal);
  }

  getQuestionAt(x, y, z) { return this.byKey.get(this.key(x, y, z)) || null; }

  // Solve a question block: clear it, drop the beacon, reward. Caller rebuilds.
  solve(entry) {
    if (entry.solved) return;
    entry.solved = true;
    this.solvedCount++;
    this.world.set(entry.x, entry.y, entry.z, B.AIR);
    this._shatter(entry.x + 0.5, entry.y + 0.5, entry.z + 0.5, 0xffd23f);
    if (entry.beacon) { this.group.remove(entry.beacon); entry.beacon.geometry.dispose(); entry.beacon = null; }
    if (this.solvedCount >= this.total) this._activatePortal();
  }

  _activatePortal() {
    this.portalActive = true;
    this.portalMat.color.set(0x9b59ff);
    this.portalMat.opacity = 0.9;
  }

  getPortalNearby(p) {
    if (!this.portalActive || this.levelDone) return false;
    return Math.hypot(this.portalPos.x - p.x, this.portalPos.z - p.z) < 2.6;
  }

  _shatter(x, y, z, color) {
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, z);
      const v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4 + 1, (Math.random() - 0.5) * 4);
      this.scene.add(p);
      this.particles.push({ mesh: p, v, life: 0.8 });
    }
  }

  update(dt, t) {
    // pulse beacons
    for (const e of this.entries) {
      if (e.solved || !e.beacon) continue;
      e.beacon.material.opacity = 0.25 + Math.abs(Math.sin(t * 2)) * 0.2;
    }
    if (this.portalActive && this.portalSurface) {
      this.portalSurface.material.opacity = 0.75 + Math.sin(t * 5) * 0.2;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.v.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      if (p.life <= 0) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); this.particles.splice(i, 1); }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.portal);
    for (const p of this.particles) this.scene.remove(p.mesh);
    this.particles = [];
  }
}
