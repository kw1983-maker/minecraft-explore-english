// World themes ("dimensions") the player picks on the start screen.
// Pure data — block layers are texture/block NAMES resolved to ids by
// world.js (ID_BY_NAME), so this file imports nothing and adding a new
// world later only means appending one object here and running build.py.
// Each dimension:
//   sky          hex color for background + fog
//   fog          [near, far] fog distances
//   liquid       { color, opacity, emissive? } — the flat plane at WATER_LEVEL
//   blocks       { surface, soil, deep, beach } terrain layers (block names)
//   tree         'oak' | 'fir' | 'jungle' | 'cactus' | 'glowrock'
//   treeDensity  chance per dry column of growing one
//   terrain      { base, relief, cone? } heightmap shape: base lift above the
//                water level, relief = hill strength, cone = extra height
//                rising toward the island center (volcano)
//   structures   building types scattered on the island; the first one is
//                also anchored over a buried question block
//                ('house' | 'tower' | 'well' | 'pyramid' | 'igloo' | 'ruin' | 'spire')
//   hotbar       3 block names for the buildable hotbar slots (+ rewards)

export const DIMENSIONS = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🏝️',
    blurb: 'Green island & oak trees',
    sky: 0x87ceeb,
    fog: [34, 80],
    liquid: { color: 0x2f6fd8, opacity: 0.72 },
    blocks: { surface: 'grass', soil: 'dirt', deep: 'stone', beach: 'sand' },
    tree: 'oak',
    treeDensity: 0.03,
    terrain: { base: 2, relief: 9 },
    structures: ['house', 'tower', 'well'],
    hotbar: ['stone', 'wood', 'dirt'],
  },
  {
    id: 'desert',
    name: 'Desert',
    emoji: '🏜️',
    blurb: 'Sand dunes & cacti',
    sky: 0xf5c97a,
    fog: [28, 70],
    liquid: { color: 0x3a86c8, opacity: 0.72 },
    blocks: { surface: 'sand', soil: 'sand', deep: 'stone', beach: 'sand' },
    tree: 'cactus',
    treeDensity: 0.02,
    terrain: { base: 3, relief: 4 },           // low rolling dunes
    structures: ['pyramid', 'house', 'well'],
    hotbar: ['sand', 'stone', 'wood'],
  },
  {
    id: 'snowy',
    name: 'Snowy',
    emoji: '❄️',
    blurb: 'Snow, ice & fir trees',
    sky: 0xdce9f5,
    fog: [30, 75],
    liquid: { color: 0xbfe0f0, opacity: 0.9 },
    blocks: { surface: 'snow', soil: 'dirt', deep: 'stone', beach: 'ice' },
    tree: 'fir',
    treeDensity: 0.035,
    terrain: { base: 2, relief: 6 },           // gentle snowfields
    structures: ['igloo', 'tower', 'house'],
    hotbar: ['snow', 'ice', 'wood'],
  },
  {
    id: 'jungle',
    name: 'Jungle',
    emoji: '🌴',
    blurb: 'Tall trees & teal water',
    sky: 0x9fd8a0,
    fog: [22, 60],
    liquid: { color: 0x2a9d8f, opacity: 0.75 },
    blocks: { surface: 'grass', soil: 'dirt', deep: 'stone', beach: 'sand' },
    tree: 'jungle',
    treeDensity: 0.07,
    terrain: { base: 3, relief: 11 },          // steep overgrown hills
    structures: ['ruin', 'house', 'well'],
    hotbar: ['wood', 'leaves', 'dirt'],
  },
  {
    id: 'volcano',
    name: 'Volcano',
    emoji: '🌋',
    blurb: 'Dark rock & glowing lava',
    sky: 0x3a2026,
    fog: [24, 65],
    liquid: { color: 0xff5a1f, opacity: 1, emissive: 0xff3300 },
    blocks: { surface: 'basalt', soil: 'basalt', deep: 'basalt', beach: 'basalt' },
    tree: 'glowrock',
    treeDensity: 0.02,
    terrain: { base: 1, relief: 7, cone: 12 }, // a cone rising to the center
    structures: ['spire', 'tower', 'ruin'],
    hotbar: ['basalt', 'stone', 'glow'],
  },
];
