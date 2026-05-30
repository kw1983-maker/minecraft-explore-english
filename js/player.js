// First-person player with voxel AABB collision: stands on blocks, can't walk
// through them, falls into mined holes, and is blocked by blocks you build.
// `pos` is the FEET position (bottom-centre of the player box).
import * as THREE from 'three';
import { Sfx } from './audio.js';
import { WORLD_SIZE, WORLD_HEIGHT } from './world.js';

const EYE = 1.62;     // camera height above the feet
const HALF = 0.3;     // half player width (x/z)
const BODY = 1.8;     // player height
const SPEED = 5.5;
const GRAVITY = 24.0;
const JUMP_VEL = 8.4;

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.world = null;

    this.yaw = 0;
    this.pitch = 0;
    this.pos = new THREE.Vector3(WORLD_SIZE / 2, 20, WORLD_SIZE / 2);
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.locked = false;

    this.keys = {};
    this._enabled = false;
    this._dragging = false;

    this._bindEvents();
  }

  setWorld(world) {
    this.world = world;
    const cx = WORLD_SIZE / 2, cz = WORLD_SIZE / 2;
    this.pos.set(cx + 0.5, world.surfaceY(cx, cz) + 0.5, cz + 4.5);
    this.vel.set(0, 0, 0);
  }

  setEnabled(v) { this._enabled = v; }
  requestLock() { if (this.dom.requestPointerLock) this.dom.requestPointerLock(); }

  // Camera forward direction (used for mining/placing raycasts).
  forward() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }
  eyePosition() { return new THREE.Vector3(this.pos.x, this.pos.y + EYE, this.pos.z); }

  _bindEvents() {
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
    });
    this.dom.addEventListener('mousedown', () => { if (!this.locked) this._dragging = true; });
    window.addEventListener('mouseup', () => { this._dragging = false; });
    this.dom.addEventListener('mouseleave', () => { this._dragging = false; });

    document.addEventListener('mousemove', (e) => {
      if (!this._enabled) return;
      if (!this.locked && !this._dragging) return;
      const s = 0.0024;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      const lim = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (this._enabled && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' && this.onGround && this._enabled) {
        this.vel.y = JUMP_VEL;
        this.onGround = false;
        Sfx.jump();
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  // Does the player box at (px,py,pz feet) intersect any solid voxel?
  _collides(px, py, pz) {
    const w = this.world;
    const x0 = Math.floor(px - HALF), x1 = Math.floor(px + HALF);
    const y0 = Math.floor(py), y1 = Math.floor(py + BODY - 0.001);
    const z0 = Math.floor(pz - HALF), z1 = Math.floor(pz + HALF);
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (w.isSolid(w.get(x, y, z))) return true;
    return false;
  }

  update(dt) {
    if (!this.world) return;
    dt = Math.min(dt, 0.05);

    // desired horizontal velocity
    let vx = 0, vz = 0;
    if (this._enabled) {
      const fwd = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
      const str = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
      if (fwd || str) {
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        let dx = -sin * fwd + cos * str;
        let dz = -cos * fwd - sin * str;
        const len = Math.hypot(dx, dz) || 1;
        vx = (dx / len) * SPEED;
        vz = (dz / len) * SPEED;
      }
    }

    // gravity
    this.vel.y -= GRAVITY * dt;

    // ---- move + resolve, axis by axis ----
    // X
    let nx = this.pos.x + vx * dt;
    nx = Math.max(HALF, Math.min(WORLD_SIZE - HALF, nx));
    if (!this._collides(nx, this.pos.y, this.pos.z)) this.pos.x = nx;
    // Z
    let nz = this.pos.z + vz * dt;
    nz = Math.max(HALF, Math.min(WORLD_SIZE - HALF, nz));
    if (!this._collides(this.pos.x, this.pos.y, nz)) this.pos.z = nz;
    // Y
    const ny = this.pos.y + this.vel.y * dt;
    if (!this._collides(this.pos.x, ny, this.pos.z)) {
      this.pos.y = ny;
      this.onGround = false;
    } else {
      if (this.vel.y < 0) {                 // falling: land on the block below
        this.pos.y = Math.floor(ny) + 1;     // rest feet on the block's top face
        this.onGround = true;
      }
      // (moving up: bumped head — just stop vertical motion)
      this.vel.y = 0;
    }
    if (this.pos.y < -20) this.setWorld(this.world); // safety: fell out

    // ---- apply to camera ----
    this.camera.position.set(this.pos.x, this.pos.y + EYE, this.pos.z);
    const dir = this.forward();
    this.camera.lookAt(this.camera.position.clone().add(dir));
  }
}
