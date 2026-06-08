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

    // Held items — each is gripped by the fist (top of the forearm) and swings
    // with the arm. Only one is visible at a time (see setHeld). Their metal
    // parts are collected in _metalMats so setTier() can re-colour them by level.
    this._metalMats = [];
    const metal = () => { const m = new THREE.MeshLambertMaterial({ color: 0x8d8d8d }); this._metalMats.push(m); return m; };
    const wood = (c = 0x5c3f1f) => new THREE.MeshLambertMaterial({ color: c });
    const handleGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);

    this.heldItems = {};
    const addItem = (key, group) => {
      group.position.set(0.02, 1.2, 0.16);
      group.rotation.set(0.55, 0.0, 0.25);
      group.visible = false;
      this.arm.add(group);
      this.heldItems[key] = group;
    };

    // Pickaxe: handle + a wide crossbar head.
    const pick = new THREE.Group();
    pick.add(new THREE.Mesh(handleGeo, wood()));
    const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.16), metal());
    pickHead.position.y = 0.5; pick.add(pickHead);
    addItem('pickaxe', pick);

    // Axe: handle + a chunky head offset to one side.
    const axe = new THREE.Group();
    axe.add(new THREE.Mesh(handleGeo, wood()));
    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.36, 0.14), metal());
    axeHead.position.set(0.20, 0.42, 0); axe.add(axeHead);
    addItem('axe', axe);

    // Shovel: handle + a flat blade.
    const shovel = new THREE.Group();
    shovel.add(new THREE.Mesh(handleGeo, wood()));
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.32, 0.08), metal());
    blade.position.y = 0.56; shovel.add(blade);
    addItem('shovel', shovel);

    // Sword: blade + gold crossguard + grip.
    const sword = new THREE.Group();
    const swBlade = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.05, 0.14), metal());
    swBlade.position.y = 0.35; sword.add(swBlade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.10, 0.16), wood(0xc9a528));
    guard.position.y = -0.18; sword.add(guard);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.26, 0.12), wood());
    grip.position.y = -0.38; sword.add(grip);
    addItem('sword', sword);

    // Held block: a small tinted cube shown when a block slot is selected.
    const block = new THREE.Group();
    this._blockMat = new THREE.MeshLambertMaterial({ color: 0x6abe30 });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this._blockMat);
    cube.position.y = 0.35; block.add(cube);
    addItem('block', block);

    this._heldKey = 'pickaxe';
    this.heldItems.pickaxe.visible = true;
    this.setTier(1);

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

  // Tool tier: 1 = wood, 2 = stone, 3 = iron (re-colours every metal head).
  setTier(tier) {
    const colors = { 1: 0x8a6a3a, 2: 0x8d8d8d, 3: 0xcfd6e0 };
    this._tier = tier;
    const hex = colors[Math.min(tier, 3)] || 0x8d8d8d;
    for (const m of this._metalMats) m.color.setHex(hex);
  }

  // Show the held item matching the selected hotbar slot.
  // slot = { kind: 'tool'|'block', id, color? }
  setHeld(slot) {
    let key = 'block';
    if (slot.kind === 'tool') {
      // T.PICKAXE=1, T.AXE=2, T.SHOVEL=3, T.SWORD=4
      key = { 1: 'pickaxe', 2: 'axe', 3: 'shovel', 4: 'sword' }[slot.id] || 'pickaxe';
    } else if (this._blockMat && slot.color) {
      this._blockMat.color.set(slot.color);
    }
    if (key === this._heldKey) return;
    if (this.heldItems[this._heldKey]) this.heldItems[this._heldKey].visible = false;
    this.heldItems[key].visible = true;
    this._heldKey = key;
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
