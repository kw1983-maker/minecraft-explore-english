# 🟩 WordCraft — Explore & Learn English

A Minecraft-style 3D educational game. Explore a blocky voxel island in first
person, find the glowing **question blocks**, and answer English questions to
collect keys. Open every block to unlock the **portal** and advance to a harder
level. Built for **ESL beginners** (any age) with a focus on **vocabulary &
grammar**.

Pure browser game — **no install, no API keys**. Three.js is loaded from a CDN
and all textures/sounds are generated in code.

---

## ▶ How to run

**Just double-click `index.html`** — it opens in your default browser and you
click **▶ Click to Play**. `index.html` is a single self-contained file, so no
server is needed.

> 📶 You need an **internet connection on the first run** — the 3D engine
> (Three.js) is fetched from a CDN. After it's cached, it loads fast.
>
> 🖱️ Use a desktop browser (Chrome / Edge / Firefox). Click the screen to capture
> the mouse for looking around (press **Esc** to release); if mouse capture
> doesn't engage, just **click and drag** to look.

<details>
<summary>Optional: run via a local server instead</summary>

```bash
python -m http.server 8000   # then open http://localhost:8000
# or:  npx serve .
```
</details>

---

## 🎮 Controls

| Key | Action |
| --- | --- |
| **W A S D** | Move |
| **Mouse** | Look around (click the screen to capture the mouse) |
| **Click + drag** | Look around if mouse capture doesn't engage |
| **Space** | Jump |
| **Left-click** | ⛏️ Mine the block under the crosshair (collects it) |
| **Right-click** | 🧱 Place the selected block |
| **1 – 6 / scroll** | Pick which block to build with |
| **E** | Answer an uncovered question block / enter the portal |
| **Esc** | Release the mouse |

## 🎯 How to play

1. The world is a fully **mineable & buildable** voxel island. Tall, glowing
   **beacons** mark where question blocks are **buried underground**.
2. Walk to a beacon and **dig down** (left-click) until you uncover the glowing
   **`?` block**.
3. Click it (or press **E**) to open a question, then choose the answer:
   - ✅ **Correct** — the block shatters, you collect a key + points
     (bigger streak = more points), and a short explanation teaches the rule.
   - ❌ **Wrong** — no penalty, just try again. Stuck? Press **💡 Hint**.
4. **Build** anything you like with blocks you mine (or your starter stack) —
   right-click to place, pick blocks from the hotbar.
5. Uncover and answer **every** question to **unlock the portal** in the center.
6. Step into the portal and press **E** to complete the level. Each new level
   has a fresh world and harder English.

### Difficulty tiers
- **Level 1 — Vocabulary:** name animals, food, colors, objects, numbers.
- **Level 2 — Words & Grammar:** plurals, a/an, am/is/are, opposites.
- **Level 3+ — Grammar Quest:** verb tenses, prepositions, articles, word order.

---

## ✍️ Adding or editing questions

All questions live in [`js/questions.js`](js/questions.js) as plain data, grouped
into tiers. Add an object to any tier's `questions` array:

```js
{
  visual: '🦊',                 // optional emoji/picture shown above the question
  category: 'Animals',          // small label in the quiz panel
  q: 'What is this animal?',    // the question text
  options: ['Fox', 'Wolf', 'Dog', 'Cat'],
  answer: 0,                    // index of the correct option
  hint: 'It is orange and clever.',     // optional
  explain: 'A fox is a clever wild animal.'  // shown after a correct answer
}
```

After editing, **rebuild** the standalone file (see below) so your changes show
up when you double-click `index.html`.

---

## 🛠️ Editing the game / rebuilding

The readable source lives in `js/*.js` and `css/style.css`. The playable
`index.html` is **generated** from them (everything inlined into one file so it
runs from `file://`). After changing any source file, regenerate it:

```bash
python build.py
```

(If you run via a local server you can instead point it at the `js/` modules,
but the double-click experience always uses the built `index.html`.)

---

## 🗂️ Project structure

```
index.html         GENERATED self-contained game — double-click to play
build.py           Bundles js/ + css/ into index.html (run after edits)
build/template.html HTML shell used by the build
css/style.css       Pixel/Minecraft-style UI
js/main.js          Bootstrap, game loop, level orchestration
js/world.js         Editable voxel grid (mine/build), raycast, face-culled meshes
js/player.js        First-person controls, gravity, voxel AABB collision
js/viewmodel.js     First-person held hand (bob + swing)
js/objectives.js    Buried question blocks + beacons, portal, progression
js/quiz.js          Quiz overlay (answer, hint, explanation, scoring)
js/questions.js     The question bank (edit me!)
js/textures.js      Procedural block textures
js/audio.js         WebAudio sound effects
```
