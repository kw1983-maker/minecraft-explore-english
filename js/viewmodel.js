// First-person held "hand" (like the Minecraft arm). It lives in its own scene
// rendered on top of the world, so it never clips into terrain. It bobs while
// walking and swings when the player interacts/mines.
import * as THREE from 'three';

// Pixel-y skin texture for the arm.
function skinTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c98e6d';
  ctx.fillRect(0, 0, 16, 16);
  // light speckle so it doesn't look flat
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * 16), y = Math.floor(Math.random() * 16);
    ctx.fillStyle = Math.random() < 0.5 ? '#bd8463' : '#d49a78';
    ctx.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const SWING_DURATION = 0.28; // seconds

export class ViewModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
    this.camera.position.set(0, 0, 0);

    // lighting so the Lambert arm is visible
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(0.5, 1, 1);
    this.scene.add(dir);

    // The arm: the group pivot is the elbow (down at the bottom-right, mostly
    // off-screen). The skin forearm extends UP from the elbow so the fist sits
    // near the screen centre; a small blue sleeve cuff sits below at the elbow.
    this.arm = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ map: skinTexture() });
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.4, 0.42), skin);
    forearm.position.y = 0.62; // extends upward from the elbow pivot
    this.arm.add(forearm);
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.45, 0.48),
      new THREE.MeshLambertMaterial({ color: 0x4a6fb0 })
    );
    sleeve.position.y = -0.08; // cuff at the elbow
    this.arm.add(sleeve);

    // Rest pose: elbow low-right (off-screen), forearm angles up-left toward
    // the centre — the classic Minecraft first-person arm.
    this.basePos = new THREE.Vector3(0.6, -0.95, -1.15);
    this.baseRot = new THREE.Euler(-0.12, -0.2, 0.42);
    this.arm.position.copy(this.basePos);
    this.arm.rotation.copy(this.baseRot);
    this.scene.add(this.arm);

    this.bobPhase = 0;
    this.swingT = -1; // <0 means not swinging
  }

  setSize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  swing() {
    // restart the swing (allows rapid repeated swings)
    this.swingT = 0;
  }

  update(dt, moving) {
    // ---- walk bob ----
    if (moving) this.bobPhase += dt * 9;
    // ease the bob amplitude up/down so it doesn't pop
    this._bobAmt = THREE.MathUtils.lerp(this._bobAmt ?? 0, moving ? 1 : 0, dt * 8);
    const bobX = Math.cos(this.bobPhase) * 0.03 * this._bobAmt;
    const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.05 * this._bobAmt;
    // gentle idle breathing
    const idle = Math.sin(performance.now() * 0.0015) * 0.012;

    this.arm.position.set(
      this.basePos.x + bobX,
      this.basePos.y + bobY + idle,
      this.basePos.z
    );
    this.arm.rotation.copy(this.baseRot);

    // ---- swing animation ----
    if (this.swingT >= 0) {
      this.swingT += dt;
      const p = this.swingT / SWING_DURATION;
      if (p >= 1) {
        this.swingT = -1;
      } else {
        // quick punch: arm rotates forward and swings across, then returns
        const s = Math.sin(p * Math.PI);
        this.arm.rotation.x = this.baseRot.x - s * 0.85;
        this.arm.rotation.z = this.baseRot.z + s * 0.35;
        this.arm.position.x = this.basePos.x + bobX - s * 0.12;
        this.arm.position.y = this.basePos.y + bobY + idle - s * 0.06;
        this.arm.position.z = this.basePos.z + s * 0.15;
      }
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}
