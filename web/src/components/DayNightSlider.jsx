import React, { useCallback, useEffect, useRef, useState } from 'react';
import { haptic, lockVerticalSwipes } from '../lib/telegram.js';
import { describeDaylightStage, settleDaylightPos } from '../lib/themes.js';

// Stepless bubble-lens daylight slider: continuous 0.00 (Midnight) -> 0.50 (Sunset Dusk)
// -> 0.75 (Morning Mist) -> 1.00 (Bright Day), driving real-time full-page dimming & atmosphere.
// Rendered on a fine 224x84 Retina micro-pixel grid (2x Retina native on the 112x42 track, sharp
// 2.15x crystal jelly-glass bubble magnifier) with sweeping dawn/dusk terminator curtain,
// progressive sequential fairy lights, sunset rim highlights, and live pixel bunny storytelling.

const W = 112;
const H = 42;
const PAD = 2;
const D = 38;
const TRAVEL = W - PAD * 2 - D;
const ZOOM = 2.15;
const VW = 224;
const VH = 84;
const GROUND = 68;

export const THEME_MODES = ['dark', 'auto', 'light'];
const HAPTIC_NOTCHES = [0, 0.25, 0.5, 0.75, 1];
const NOTCH_HALF = 0.04;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const tri = (p) => clamp(1 - Math.abs(p - 0.5) * 2, 0, 1);

// 19-Color Curated Rose-Porcelain Palette (<= 20 colors, lineless soft shading, zero harsh primaries)
const C = {
  ink: '#1b0f24',       // 1  deep night zenith / bunny eye
  plum: '#2c1736',      // 2  night sky mid / dark wood
  mulberry: '#442248',  // 3  night horizon / soft shadow
  wine: '#642c54',      // 4  dusk zenith / roof shade
  crimson: '#87294d',   // 5  crimson trim / deep roof
  accent: '#a32952',    // 6  signature RosePanel rose
  carmine: '#c64b74',   // 7  rose carmine / roof highlight
  coral: '#e27699',     // 8  soft rose coral / dusk sky
  blush: '#f3a4be',     // 9  blush pink / inner ear
  petal: '#fad0df',     // 10 pale rose petal / soft fur shade
  mist: '#fce9f0',      // 11 rose porcelain mist
  white: '#fff8fa',     // 12 porcelain snow white
  peach: '#f7b398',     // 13 sunset warm peach-rose
  honey: '#f6c87e',     // 14 candlelight honey gold
  cream: '#fff0c4',     // 15 warm starlight cream
  slate: '#322b3a',     // 16 night bush shadow
  sageDark: '#52685b',  // 17 dusty sage deep leaf
  sageMid: '#6e917b',   // 18 soft sage mid leaf
  sageLight: '#93b99f', // 19 celadon leaf highlight
};

function hexToRgb(h) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
}
function mix3(night, dusk, day, p) {
  const qp = Math.round(clamp(p, 0, 1) * 96) / 96;
  return qp <= 0.5 ? mixHex(night, dusk, qp * 2) : mixHex(dusk, day, (qp - 0.5) * 2);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Shared discrete pixel frame clock (~7fps retro animation) synced across track & bubble magnifier
let sharedTick = 0;
let sharedTimer = null;
const tickListeners = new Set();

function usePixelTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    tickListeners.add(setTick);
    if (!sharedTimer) {
      sharedTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        sharedTick = (sharedTick + 1) % 720;
        tickListeners.forEach((fn) => fn(sharedTick));
      }, 145);
    }
    return () => {
      tickListeners.delete(setTick);
      if (tickListeners.size === 0 && sharedTimer) {
        clearInterval(sharedTimer);
        sharedTimer = null;
      }
    };
  }, []);
  return prefersReducedMotion() ? 0 : tick;
}

// Run-length merges an ASCII pixel matrix into 1 integer SVG <path> per color (supports 1x or 2x scale)
function renderSprite(rows, palette, ox = 0, oy = 0, flipX = false, scale = 1) {
  const paths = new Map();
  const h = rows.length;
  for (let r = 0; r < h; r += 1) {
    const line = rows[r];
    const w = line.length;
    let c = 0;
    while (c < w) {
      const idx = flipX ? w - 1 - c : c;
      const ch = line[idx];
      if (ch === '.' || ch === ' ' || !palette[ch]) {
        c += 1;
        continue;
      }
      let run = 1;
      while (c + run < w) {
        const nextIdx = flipX ? w - 1 - (c + run) : c + run;
        if (line[nextIdx] !== ch) break;
        run += 1;
      }
      const x = ox + c * scale;
      const y = oy + r * scale;
      const rw = run * scale;
      const d = `M${x} ${y}h${rw}v${scale}h-${rw}Z`;
      paths.set(ch, (paths.get(ch) || '') + d);
      c += run;
    }
  }
  const out = [];
  paths.forEach((d, ch) => {
    out.push(<path key={ch} d={d} fill={palette[ch]} />);
  });
  return out;
}

function rectsPath(rects) {
  return rects.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}Z`).join('');
}

// --- Fine Lineless Micro-Pixel Sprites (drawn clean shape-on-shape, zero muddy black borders!) ---

// 24x24 Lineless Expressive Rose Bunny (base faces +x right; integer-flipped when walking left)
// Keys: B = pure snow fur, s = blush belly/limb shade, p = soft pink inner ear/cheek,
//       e = deep plum eye, w = crisp 1px eye sparkle, n = tiny rose nose
const BUNNY_SIT = [
  '........BB...BB.........',
  '.......BBBB.BBBB........',
  '.......BBpp.BBpp........',
  '.......BBpp.BBpp........',
  '.......BBpp.BBpp........',
  '.......BBpp.BBpp........',
  '........BBp.BBp.........',
  '........BBBBBBBB........',
  '.......BBBBBBBBBB.......',
  '......BBBBBBBBBBBB......',
  '......BBBBBBBBewBB......',
  '......BBBBBBBBeeBB......',
  '......BBBBBBBBeeBBn.....',
  '......BBBBBBBpppBB......',
  '.....BBBBBBBBBBBB.......',
  '..BB.BBBBBBBBBBBss......',
  '.BBBBBBBBBBBBBBBss......',
  '.BBBBBBBBBBBBBBsss......',
  '.BBsBBBBBBBBBBBsss......',
  '..ssBBBBBBBBBBssBB......',
  '....sBBBBBBBBBssBB......',
  '.....sssssssssBBBB......',
  '.....ssBBBBss..ss.......',
  '......ssssss............',
];

const BUNNY_SIT_BLINK = BUNNY_SIT.map((row, idx) =>
  idx === 10 || idx === 11 ? '......BBBBBBBBBBBB......' : idx === 12 ? '......BBBBBBBBssBBn.....' : row
);

const BUNNY_SIT_TWITCH = BUNNY_SIT.map((row, idx) => {
  if (idx === 0) return '........BB....BB........';
  if (idx === 1) return '.......BBBB..BBBB.......';
  if (idx === 2) return '.......BBpp..BBpp.......';
  if (idx === 3) return '.......BBpp.BBpp........';
  return row;
});

const BUNNY_SLEEP_0 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '......BBBBBBBB..........',
  '.....BBppppBBBB.........',
  '....BBBBBBBBBBBB........',
  '...BBBBBBBBBBBBBB.......',
  '..BBBBBBBBBBBBBBBB......',
  '.BBBBBBBBBBBBBBBBBB.....',
  'BBBBsBBBBBBBBBBBBBBB....',
  'BBBBssBBBBBBBBeeBBBB....',
  'BBsssBBBBBBBBBBpppBBn...',
  '.ssssBBBBBBBBBBBBBBB....',
  '..ssssBBBBBBBBBBBBss....',
  '...ssssssssssssssss.....',
  '....ssssssssssssss......',
];

const BUNNY_SLEEP_1 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '......BBBBBBBB..........',
  '.....BBppppBBBB.........',
  '....BBBBBBBBBBBB........',
  '...BBBBBBBBBBBBBB.......',
  '..BBBBBBBBBBBBBBBB......',
  '..BBBBBBBBBBBBBBBB......',
  '.BBBBBBBBBBBBBBBBBB.....',
  'BBBBsBBBBBBBBBBBBBBB....',
  'BBBBssBBBBBBBBeeBBBB....',
  'BBsssBBBBBBBBBBpppBBn...',
  '.ssssBBBBBBBBBBBBBBB....',
  '..ssssBBBBBBBBBBBBss....',
  '...ssssssssssssssss.....',
  '....ssssssssssssss......',
];

const BUNNY_WAKE = [
  '........................',
  '........................',
  '............BB..........',
  '...........BBBB.........',
  '...........BBpp.........',
  '....BBBB...BBpp.........',
  '...BBpppB..BBpp.........',
  '....BBBBBBBBBBBB........',
  '......BBBBBBBBBBB.......',
  '......BBBBBBBBBBBB......',
  '......BBBBBBBBewBB......',
  '......BBBBBBBBeeBBn.....',
  '......BBBBBBBpppBB......',
  '.....BBBBBBBBBBBB.......',
  '..BB.BBBBBBBBBBBss......',
  '.BBBBBBBBBBBBBBBss......',
  '.BBBBBBBBBBBBBBsss......',
  '.BBsBBBBBBBBBBBsss......',
  '..ssBBBBBBBBBBssBB......',
  '....sBBBBBBBBBssBB......',
  '.....sBBBBBBBBBBBB......',
  '.....ssBBBBssBBBB.......',
  '......ssss....sss.......',
  '........................',
];

const BUNNY_WALK_0 = [
  '........................',
  '......BB...BB...........',
  '.....BBBB.BBBB..........',
  '......BBpp.BBpp.........',
  '.......BBpp.BBpp........',
  '........BBp.BBp.........',
  '........BBBBBBBB........',
  '.......BBBBBBBBBB.......',
  '......BBBBBBBBBBBB......',
  '......BBBBBBBBewBB......',
  '......BBBBBBBBeeBB......',
  '......BBBBBBBBeeBBn.....',
  '......BBBBBBBpppBB......',
  '....BBBBBBBBBBBBB.......',
  '.BB.BBBBBBBBBBBBss......',
  'BBBBBBBBBBBBBBBBss......',
  'BBBsBBBBBBBBBBBsss......',
  '.sssBBBBBBBBBBsss.......',
  '...sBBBBBBBBBBsBB.......',
  '...BBBBs....ssBBBB......',
  '..BBBB........BBBB......',
  '..sss..........sss......',
  '........................',
  '........................',
];

const BUNNY_WALK_1 = [
  '.......BB...BB..........',
  '......BBBB.BBBB.........',
  '......BBpp.BBpp.........',
  '......BBpp.BBpp.........',
  '.......BBp.BBp..........',
  '.......BBBBBBBB.........',
  '......BBBBBBBBBB........',
  '.....BBBBBBBBBBBB.......',
  '.....BBBBBBBBewBB.......',
  '.....BBBBBBBBeeBB.......',
  '.....BBBBBBBBeeBBn......',
  '.....BBBBBBBpppBB.......',
  '....BBBBBBBBBBBB........',
  '.BB.BBBBBBBBBBBss.......',
  'BBBBBBBBBBBBBBBss.......',
  'BBBsBBBBBBBBBBsss.......',
  '.sssBBBBBBBBBsss........',
  '...sBBBBBBBBssBB........',
  '.....sBBBBBBssBB........',
  '......BBBB..BBBB........',
  '......sss....sss........',
  '........................',
  '........................',
  '........................',
];

// 10x9 Lush Layered Spiral Pixel Rose (lineless 4-shade petal depth!)
const ROSE_FULL = [
  '..pppppp..',
  '.ppRRRRpp.',
  'pRRccccRRp',
  'pRcAAAAcRp',
  'pRcAccAcRp',
  'pRRccccRRp',
  '.pRRRRRRp.',
  '..ppRRpp..',
  '...llll...',
];

const ROSE_HALF = [
  '..pppp..',
  '.pRRRRp.',
  'pRcAAcRp',
  'pRccccRp',
  '.pRRRRp.',
  '..llll..',
];

const ROSE_BUD = [
  '.cc.',
  'cAAc',
  'cAAc',
  '.ll.',
];

// 10x8 Delicate Lineless Pixel Butterfly (3-frame wing motion)
const BFLY_OPEN = [
  'KKK....KKK',
  'KKKK..KKKK',
  'KKPK..KPKK',
  '.PPAAAAAPP',
  '..PAAAAP..',
  '.PPK..KPP.',
  '.PPP..PPP.',
  '..P....P..',
];
const BFLY_MID = [
  '..KK..KK..',
  '.KKK..KKK.',
  '.KPK..KPK.',
  '..PAAAAP..',
  '..PAAAAP..',
  '..PK..KP..',
  '..PP..PP..',
  '..........',
];
const BFLY_CLOSED = [
  '...KK.....',
  '...KKK....',
  '...KPK....',
  '...AAA....',
  '...PAA....',
  '...PP.....',
  '..........',
  '..........',
];

// 16x16 Smooth-Stepped Crescent Moon
const MOON_SPRITE = [
  '.....MMMMMM.....',
  '...MMMMMMmm.....',
  '..MMMMmm........',
  '.MMMMm..........',
  '.MMMM...........',
  'MMMM............',
  'MMMM............',
  'MMMM............',
  'MMMM............',
  '.MMMM...........',
  '.MMMMm..........',
  '..MMMMmm........',
  '...MMMMMMmm.....',
  '.....MMMMMM.....',
];

// 18x18 Layered Pixel Sun
const SUN_SPRITE = [
  '......SSSSSS......',
  '....SSccccccSS....',
  '...SccccccccccS...',
  '..ScccCCCCCCcccS..',
  '.ScccCCCCCCCCcccS.',
  '.SccCCCCCCCCCCccS.',
  'SccCCCCCCCCCCCCccS',
  'SccCCCCCCCCCCCCccS',
  'SccCCCCCCCCCCCCccS',
  'SccCCCCCCCCCCCCccS',
  '.SccCCCCCCCCCCccS.',
  '.ScccCCCCCCCCcccS.',
  '..ScccCCCCCCcccS..',
  '...SccccccccccS...',
  '....SSccccccSS....',
  '......SSSSSS......',
];

// Sculpted Lineless Fluffy Pixel Clouds
const CLOUD_LG = [
  '........CCCCCC............',
  '......CCCCCCCCCC..........',
  '....CCCCCCCCCCCCCC..CCCC..',
  '..CCCCCCCCCCCCCCCCCCCCCCC.',
  '.CCCCCCCCCCCCCCCCCCCCCCCCC',
  'CCssssssssssssssssssssssCC',
  '.ssssssssssssssssssssssss.',
];

const CLOUD_SM = [
  '.....CCCCC......',
  '...CCCCCCCCC....',
  '.CCCCCCCCCCCCC..',
  'CCssssssssssssC.',
  '.sssssssssssss..',
];

// Crisp Pixel "Z" for sleeping bunny
const Z_BIG = [
  'zzzzzz',
  '....zz',
  '...zz.',
  '..zz..',
  '.zz...',
  'zzzzzz',
];
const Z_SM = [
  'zzzz',
  '..z.',
  '.z..',
  'zzzz',
];

// Precomputed calm stepped 224-col mountain silhouettes
const FAR_MOUNTAIN_PATH = Array.from({ length: VW }, (_, x) => {
  const h = Math.round(
    52 -
      Math.sin((x / VW) * Math.PI * 2.2 + 0.4) * 7.5 -
      Math.cos((x / VW) * Math.PI * 4.8) * 3.2
  );
  const y = clamp(h, 40, 62);
  return `M${x} ${y}h1v${GROUND - y}h-1Z`;
}).join('');

const NEAR_MOUNTAIN_PATH = Array.from({ length: VW }, (_, x) => {
  const h = Math.round(
    59 -
      Math.sin((x / VW) * Math.PI * 3.0 - 0.6) * 4.5 -
      Math.cos((x / VW) * Math.PI * 6.0) * 2.0
  );
  const y = clamp(h, 52, 65);
  return `M${x} ${y}h1v${GROUND - y}h-1Z`;
}).join('');

// Precomputed fine catenary fairy-light string across the top (night & dusk!)
const WIRE_POINTS = Array.from({ length: VW }, (_, x) => {
  const seg = x < 75 ? 0 : x < 150 ? 1 : 2;
  const x0 = seg === 0 ? 0 : seg === 1 ? 75 : 150;
  const span = seg === 2 ? 74 : 75;
  const t = (x - x0) / span;
  const sag = Math.sin(t * Math.PI) * 11;
  const y = Math.round(5 + sag);
  return [x, y];
});
const WIRE_PATH = WIRE_POINTS.map(([x, y]) => `M${x} ${y}h1v1h-1Z`).join('');
const FAIRY_XS = [14, 28, 42, 56, 68, 86, 100, 114, 128, 142, 162, 176, 190, 206];

// Starfield coordinates (pinpoint 1x1 & 2x2 crisp stars)
const STARS = [
  [10, 8], [22, 14], [35, 6], [48, 11], [63, 7], [108, 9], [122, 6],
  [136, 13], [150, 7], [164, 15], [178, 8], [192, 12], [208, 7], [216, 17],
  [18, 22], [72, 20], [128, 22], [186, 21],
];

// Clean pointed white garden picket fence (x = 148..214, y = 48..68)
const FENCE_PICKETS_PATH = Array.from({ length: 8 }, (_, i) => {
  const cx = 152 + i * 9;
  return `M${cx} 47h2v2h-2ZM${cx - 1} 49h4v19h-4Z`;
}).join('');

// Sculpted lineless Rose Bush mound rectangles (3 harmonious celadon tones)
const BUSH_DEEP_PATH = rectsPath([
  [158, 54, 48, 14],
  [162, 50, 40, 18],
  [168, 46, 28, 22],
]);
const BUSH_MID_PATH = rectsPath([
  [160, 52, 44, 12],
  [164, 46, 36, 14],
  [170, 42, 24, 14],
  [174, 40, 16, 8],
]);
const BUSH_LIGHT_PATH = rectsPath([
  [166, 46, 12, 6],
  [175, 41, 14, 5],
  [190, 47, 10, 5],
  [163, 52, 8, 4],
  [194, 53, 8, 4],
]);

// Precomputed stepped pitched gable roof paths (18px tall, y = 24..42, peak at x = 40)
const { ROOF_STEPS_PATH, ROOF_HIGHLIGHT_PATH } = (() => {
  const steps = [];
  const highlights = [];
  for (let row = 0; row < 18; row += 1) {
    const half = 3 + Math.floor(row * 1.45);
    const rx = 40 - half;
    const rw = half * 2;
    steps.push([rx, 24 + row, rw, 1]);
    if (row % 3 === 1 && row > 1) {
      for (let sx = rx + 3; sx < rx + rw - 4; sx += 6) {
        highlights.push([sx, 24 + row, 3, 1]);
      }
    }
  }
  return {
    ROOF_STEPS_PATH: rectsPath(steps),
    ROOF_HIGHLIGHT_PATH: rectsPath(highlights),
  };
})();

// Architectural Lineless Rose-Porcelain Cottage (x = 14..68, y = 20..68)
function PixelCottage({ cp, tick }) {
  const lampOn = cp < 0.72;
  const flicker = lampOn && tick % 11 === 0;
  const roofMain = mix3(C.accent, C.accent, C.carmine, cp);
  const roofHi = mix3(C.carmine, C.coral, C.blush, cp);
  const roofShade = mix3(C.wine, C.crimson, C.accent, cp);
  const wallMain = mix3(C.wine, C.petal, C.white, cp);
  const wallShade = mix3(C.mulberry, C.blush, C.mist, cp);
  const wood = mix3(C.plum, C.wine, C.crimson, cp);
  const woodHi = mix3(C.mulberry, C.crimson, C.accent, cp);
  const winGlass = lampOn ? (flicker ? C.cream : C.honey) : C.petal;
  const winHi = lampOn ? C.cream : C.white;

  // Rising chimney smoke puffs (6-step continuous drift when idle!)
  const smokePhase = tick % 6;

  return (
    <g>
      {/* Subtle warm window spill on meadow grass at night/dusk */}
      {lampOn && (
        <path
          d={rectsPath([
            [22, 68, 22, 3],
            [25, 71, 16, 2],
            [11, 68, 7, 2],
          ])}
          fill={C.honey}
          opacity={flicker ? 0.45 : 0.32}
        />
      )}

      {/* Brick Chimney (x = 50..57, y = 20..36) */}
      <rect x={50} y={22} width={7} height={15} fill={roofShade} />
      <rect x={49} y={20} width={9} height={3} fill={roofMain} />
      <path d={rectsPath([[51, 24, 2, 1], [54, 26, 2, 1], [51, 29, 2, 1]])} fill={roofHi} />

      {/* Continuously curling pixel chimney smoke (night & dusk) */}
      {cp < 0.82 && (
        <g fill={C.mist}>
          <rect x={52 + (smokePhase % 2)} y={17 - smokePhase} width={3} height={2} opacity={0.85} />
          <rect x={54 + Math.floor(smokePhase / 2)} y={12 - smokePhase} width={4} height={3} opacity={0.65} />
          <rect x={57 + (smokePhase % 3)} y={7 - Math.floor(smokePhase / 2)} width={5} height={3} opacity={0.4} />
        </g>
      )}

      {/* Clean Plaster Cottage Body + Eave Shadow + Stone Foundation */}
      <rect x={19} y={42} width={42} height={26} fill={wallMain} />
      <rect x={19} y={42} width={42} height={3} fill={wallShade} />
      <rect x={19} y={42} width={2} height={26} fill={wallShade} />
      <rect x={59} y={42} width={2} height={26} fill={wallShade} />
      <rect x={18} y={65} width={44} height={3} fill={wood} />

      {/* Pitched Scalloped Tile Roof */}
      <path d={ROOF_STEPS_PATH} fill={roofMain} />
      <path d={ROOF_HIGHLIGHT_PATH} fill={roofHi} />
      <rect x={13} y={41} width={54} height={2} fill={roofShade} />
      {/* 1px Golden-Hour Sunset / Dawn Roof Ridge Rim Light */}
      {cp > 0.2 && cp < 0.88 && (
        <path
          d={rectsPath([
            [37, 23, 6, 1],
            [49, 19, 9, 1],
            [43, 25, 3, 1],
            [46, 27, 3, 1],
            [49, 29, 3, 1],
            [52, 31, 3, 1],
            [55, 33, 3, 1],
            [58, 35, 3, 1],
            [61, 37, 3, 1],
            [64, 39, 3, 1],
          ])}
          fill={C.cream}
          opacity={Number((smooth(0.2, 0.46, cp) * (1 - smooth(0.66, 0.88, cp)) * 0.85).toFixed(2))}
        />
      )}

      {/* Hanging Porch Lantern on Left Eave (x = 13..17, y = 43..52) */}
      <rect x={15} y={43} width={1} height={3} fill={wood} />
      <rect x={14} y={46} width={3} height={1} fill={wood} />
      <rect x={14} y={47} width={3} height={4} fill={lampOn ? C.cream : C.coral} />
      {lampOn && <rect x={12} y={46} width={7} height={6} fill={C.honey} opacity={0.28} />}
      <rect x={14} y={51} width={3} height={1} fill={wood} />

      {/* 4-Pane Mullioned Window (x = 24..38, y = 48..60) + Cozy Rose Flower-Box */}
      <rect x={24} y={48} width={14} height={12} fill={wood} />
      <rect x={25} y={49} width={12} height={10} fill={winGlass} />
      {/* Top-left bright reflection / warm curtain corner */}
      <path d={rectsPath([[25, 49, 5, 4], [32, 49, 5, 2]])} fill={winHi} />
      {/* Thin 1px muntin cross */}
      <rect x={30} y={49} width={2} height={10} fill={wood} />
      <rect x={25} y={53} width={12} height={2} fill={wood} />
      {/* Windowsill + pixel flower box with tiny rosebuds */}
      <rect x={23} y={59} width={16} height={2} fill={woodHi} />
      <rect x={24} y={61} width={14} height={3} fill={mix3(C.slate, C.sageDark, C.sageMid, cp)} />
      <path
        d={rectsPath([[26, 60, 2, 2], [30, 60, 2, 2], [34, 60, 2, 2]])}
        fill={cp < 0.4 ? C.accent : C.coral}
      />

      {/* Arched Wooden Front Door (x = 44..55, y = 49..68) */}
      <rect x={45} y={49} width={10} height={19} fill={wood} />
      <rect x={44} y={51} width={12} height={17} fill={wood} />
      <rect x={46} y={51} width={8} height={17} fill={woodHi} />
      {/* Subtle plank grooves + tiny round transom + golden knob */}
      <rect x={49} y={52} width={1} height={16} fill={wood} />
      <rect x={52} y={52} width={1} height={16} fill={wood} />
      <rect x={48} y={52} width={4} height={2} fill={lampOn ? C.honey : C.petal} />
      <rect x={52} y={59} width={2} height={2} fill={C.cream} />

      {/* Cute Rose Mailbox on Right (x = 64..70, y = 55..68) */}
      <rect x={66} y={60} width={2} height={8} fill={wood} />
      <rect x={64} y={55} width={6} height={5} fill={roofMain} />
      <rect x={65} y={54} width={4} height={1} fill={roofHi} />
      <rect x={68} y={56} width={2} height={2} fill={C.cream} />
    </g>
  );
}

function Bunny({ p, motion, facing, tick }) {
  const bunnyPal = {
    B: mix3(C.mist, C.white, C.white, p),
    s: mix3(C.blush, C.petal, C.petal, p),
    p: mix3(C.coral, C.blush, C.blush, p),
    e: C.ink,
    w: C.white,
    n: C.carmine,
  };

  let sprite = BUNNY_SIT;
  let dy = 0;

  if (motion > 0.14) {
    const stride = (Math.floor(Math.abs(p) * 24) + tick) % 2;
    sprite = stride === 0 ? BUNNY_WALK_0 : BUNNY_WALK_1;
    dy = stride === 1 ? -2 : 0;
  } else if (p < 0.18) {
    // Gentle sleeping chest breath
    sprite = tick % 8 < 4 ? BUNNY_SLEEP_0 : BUNNY_SLEEP_1;
  } else if (p < 0.36) {
    sprite = BUNNY_WAKE;
  } else if (p < 0.68) {
    // Sitting at sunset: periodic blink + playful ear twitch!
    const phase = tick % 20;
    sprite = phase === 0 || phase === 1 ? BUNNY_SIT_BLINK : phase === 10 || phase === 11 ? BUNNY_SIT_TWITCH : BUNNY_SIT;
  } else if (p < 0.84) {
    sprite = tick % 4 < 2 ? BUNNY_SIT : BUNNY_WALK_1;
  } else {
    // Daytime idle joyful 6-step hop cycle right outside the cottage door!
    const hop = tick % 6;
    if (hop === 0) {
      sprite = BUNNY_SIT;
      dy = 0;
    } else if (hop === 1) {
      sprite = BUNNY_WALK_0;
      dy = -3;
    } else if (hop === 2) {
      sprite = BUNNY_WALK_1;
      dy = -6;
    } else if (hop === 3) {
      sprite = BUNNY_WALK_0;
      dy = -3;
    } else {
      sprite = BUNNY_SIT;
      dy = 0;
    }
  }

  const flipX = facing < 0;
  const showSleepZ = p < 0.18 && motion <= 0.14;
  const zCycle = tick % 8;
  const zx = flipX ? -6 : 22;

  return (
    <g>
      {/* Soft shadow shrinking slightly during hop */}
      <rect
        x={dy < -2 ? 5 : 3}
        y={23}
        width={dy < -2 ? 14 : 18}
        height={2}
        fill={mix3(C.ink, C.wine, C.coral, p)}
        opacity={0.35}
      />
      {renderSprite(sprite, bunnyPal, 0, dy, flipX, 1)}
      {showSleepZ && (
        <g>
          <g opacity={zCycle < 6 ? 0.92 : 0.45}>
            {renderSprite(Z_BIG, { z: C.cream }, zx, 6 - zCycle, false, 1)}
          </g>
          <g opacity={zCycle >= 2 ? 0.85 : 0.35}>
            {renderSprite(Z_SM, { z: C.petal }, zx + (flipX ? -6 : 7), -1 - Math.floor(zCycle / 2), false, 1)}
          </g>
        </g>
      )}
    </g>
  );
}

export function DayNightScene({ p, motion = 0, facing = -1 }) {
  const tick = usePixelTick();
  const cp = clamp(p, 0, 1);

  // Clean 6-band stepped 16-bit sky (zero noisy dotted dithering, zero smooth gradients!)
  const sky0 = mix3(C.ink, C.wine, C.blush, cp);
  const sky1 = mix3(C.ink, C.crimson, C.blush, cp);
  const sky2 = mix3(C.plum, C.carmine, C.petal, cp);
  const sky3 = mix3(C.plum, C.coral, C.petal, cp);
  const sky4 = mix3(C.mulberry, C.coral, C.mist, cp);
  const sky5 = mix3(C.mulberry, C.peach, C.white, cp);

  const farMtn = mix3(C.plum, C.crimson, C.petal, cp);
  const nearMtn = mix3(C.ink, C.accent, C.blush, cp);
  const turfTop = mix3(C.wine, C.carmine, C.coral, cp);
  const turfMid = mix3(C.mulberry, C.accent, C.carmine, cp);
  const turfDeep = mix3(C.plum, C.wine, C.accent, cp);

  // Celestial integer positions
  const showNight = cp < 0.48;
  const moonY = Math.round(lerp(8, 48, smooth(0.14, 0.48, cp)));
  const showSun = cp >= 0.24;
  const sunX = Math.round(lerp(116, 128, smooth(0.5, 1, cp)));
  const sunY = cp < 0.5
    ? Math.round(lerp(60, 38, smooth(0.24, 0.5, cp)))
    : Math.round(lerp(38, 9, smooth(0.5, 1, cp)));

  // Shooting star streak every ~2.5s at night
  const shootStep = cp < 0.34 ? tick % 20 : -1;

  // Bubble center X mapped onto the 224x84 micro-pixel grid for the sweeping dawn/dusk terminator
  const knobPx = Math.round((PAD + D / 2 + cp * TRAVEL) * 2);
  const terminatorStrength = Math.sin(cp * Math.PI);
  const rimStrength = smooth(0.2, 0.48, cp) * (1 - smooth(0.68, 0.92, cp));

  // Fairy lights visible sequentially along the catenary wire as twilight & night sweep across
  const showFairyWire = cp < 0.88;
  const showClouds = cp >= 0.44;
  const cloudDriftA = (Math.floor(tick / 3) % 16) - 8;
  const cloudDriftB = (Math.floor(tick / 4) % 14) - 7;

  // Rose Garden 3-stage bloom
  const bloomStage = cp < 0.35 ? 0 : cp < 0.72 ? 1 : 2;
  const rosePal = {
    A: C.accent,
    c: C.carmine,
    R: C.coral,
    p: C.petal,
    l: mix3(C.slate, C.sageDark, C.sageDark, cp),
  };
  const fenceMain = mix3(C.wine, C.petal, C.white, cp);
  const fenceShade = mix3(C.mulberry, C.blush, C.petal, cp);

  // Bunny center X: 138 (night sleeping beside garden) -> 112 (dead center under Dusk lens) -> 80 (hopping outside cottage!)
  const bunnyCx = Math.round(lerp(138, 82, cp));

  // Butterfly wing frame (3-frame smooth flap!) & orbital float
  const wingIdx = tick % 4;
  const bflyA = wingIdx === 0 ? BFLY_OPEN : wingIdx === 2 ? BFLY_CLOSED : BFLY_MID;
  const bflyB = wingIdx === 2 ? BFLY_OPEN : wingIdx === 0 ? BFLY_CLOSED : BFLY_MID;
  const bflyFloatX = Math.round(Math.sin((tick / 12) * Math.PI * 2) * 4);
  const bflyFloatY = Math.round(Math.cos((tick / 12) * Math.PI * 2) * 2);

  return (
    <svg
      className="dn-scene"
      viewBox={`0 0 ${VW} ${VH}`}
      width={W}
      height={H}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* 6-band crisp flat pixel sky */}
      <rect x={0} y={0} width={VW} height={11} fill={sky0} />
      <rect x={0} y={11} width={VW} height={11} fill={sky1} />
      <rect x={0} y={22} width={VW} height={11} fill={sky2} />
      <rect x={0} y={33} width={VW} height={11} fill={sky3} />
      <rect x={0} y={44} width={VW} height={12} fill={sky4} />
      <rect x={0} y={56} width={VW} height={12} fill={sky5} />

      {/* Sweeping Dawn/Dusk Terminator Light Curtain following the bubble across the sky */}
      {terminatorStrength > 0.08 && (
        <g>
          {/* Cooler starlit shade ahead (right of bubble) while morning sweeps in from the left */}
          {knobPx + 14 < VW && (
            <rect
              x={knobPx + 14}
              y={0}
              width={VW - (knobPx + 14)}
              height={GROUND}
              fill={C.ink}
              opacity={Number((terminatorStrength * 0.22).toFixed(2))}
            />
          )}
          {/* Stepped 16-bit golden-peach terminator shimmer columns centered on knobPx */}
          <rect
            x={clamp(knobPx - 24, 0, VW)}
            y={0}
            width={48}
            height={GROUND}
            fill={cp < 0.55 ? C.coral : C.peach}
            opacity={Number((terminatorStrength * 0.14).toFixed(2))}
          />
          <rect
            x={clamp(knobPx - 12, 0, VW)}
            y={0}
            width={24}
            height={GROUND}
            fill={C.peach}
            opacity={Number((terminatorStrength * 0.22).toFixed(2))}
          />
          <rect
            x={clamp(knobPx - 4, 0, VW)}
            y={6}
            width={8}
            height={GROUND - 6}
            fill={C.cream}
            opacity={Number((terminatorStrength * (tick % 6 < 3 ? 0.26 : 0.18)).toFixed(2))}
          />
        </g>
      )}

      {/* Night Sky: pinpoint stars, sparkling diamond stars, shooting star & crescent moon */}
      {showNight && (
        <g opacity={Number((1 - smooth(0.22, 0.48, cp)).toFixed(2))}>
          {STARS.map(([sx, sy], i) => {
            const phase = (tick + i * 3) % 8;
            const size = phase < 2 ? 2 : 1;
            return (
              <rect
                key={i}
                x={sx}
                y={sy}
                width={size}
                height={size}
                fill={phase < 4 ? C.white : C.blush}
                opacity={phase === 7 ? 0.3 : 1}
              />
            );
          })}
          {/* Twinkling 5x5 pixel diamond stars */}
          <path
            d={
              tick % 4 < 2
                ? 'M34 10h1v5h-1ZM32 12h5v1h-5ZM154 9h1v5h-1ZM152 11h5v1h-5Z'
                : 'M34 11h1v3h-1ZM33 12h3v1h-3ZM154 10h1v3h-1ZM153 11h3v1h-3Z'
            }
            fill={C.cream}
          />
          {shootStep >= 0 && shootStep < 5 && (
            <path
              d={rectsPath([
                [188 - shootStep * 14, 6 + shootStep * 4, 5, 1],
                [193 - shootStep * 14, 5 + shootStep * 4, 4, 1],
                [197 - shootStep * 14, 4 + shootStep * 4, 2, 1],
              ])}
              fill={C.cream}
            />
          )}
          {renderSprite(MOON_SPRITE, { M: C.cream, m: C.honey }, 78, moonY, false, 1)}
        </g>
      )}

      {/* Pixel Sun (sinking gracefully behind dusk hills -> rising high with pulsing sunbeams by day) */}
      {showSun && (
        <g opacity={Number(smooth(0.24, 0.42, cp).toFixed(2))}>
          {renderSprite(
            SUN_SPRITE,
            {
              S: cp < 0.6 ? C.peach : C.honey,
              c: C.cream,
              C: C.white,
            },
            sunX,
            sunY,
            false,
            1
          )}
          {cp >= 0.7 && (
            <path
              d={
                tick % 4 < 2
                  ? rectsPath([
                      [sunX + 8, sunY - 5, 2, 3],
                      [sunX + 8, sunY + 18, 2, 3],
                      [sunX - 5, sunY + 7, 3, 2],
                      [sunX + 20, sunY + 7, 3, 2],
                    ])
                  : rectsPath([
                      [sunX - 2, sunY - 2, 2, 2],
                      [sunX + 18, sunY - 2, 2, 2],
                      [sunX - 2, sunY + 16, 2, 2],
                      [sunX + 18, sunY + 16, 2, 2],
                    ])
              }
              fill={C.honey}
            />
          )}
        </g>
      )}

      {/* Daytime sculpted clouds drifting continuously in integer steps */}
      {showClouds && (
        <g opacity={Number(smooth(0.46, 0.76, cp).toFixed(2))}>
          {renderSprite(CLOUD_LG, { C: C.white, s: C.mist }, 76 + cloudDriftA, 11, false, 1)}
          {renderSprite(CLOUD_SM, { C: C.white, s: C.mist }, 172 - cloudDriftB, 8, false, 1)}
        </g>
      )}

      {/* Stepped pixel mountains (clips the lower half of the setting dusk sun cleanly) */}
      <path d={FAR_MOUNTAIN_PATH} fill={farMtn} />
      <path d={NEAR_MOUNTAIN_PATH} fill={nearMtn} />

      {/* Progressive sequential fairy string lights (bulbs ignite one-by-one as twilight sweeps across!) */}
      {showFairyWire && (
        <g opacity={Number((1 - smooth(0.74, 0.88, cp)).toFixed(2))}>
          <path d={WIRE_PATH} fill={C.plum} opacity={0.72} />
          {FAIRY_XS.map((bx, i) => {
            const by = WIRE_POINTS[bx][1];
            const bulbRatio = i / (FAIRY_XS.length - 1);
            // Right-to-left cascade: bulbs illuminate progressively as darkness sweeps right->left
            const threshold = 0.28 + bulbRatio * 0.56;
            const lit = clamp((threshold - cp) / 0.14, 0, 1);
            const phase = (tick + i * 2) % 6;
            const palette = [C.cream, C.blush, C.honey, C.peach];
            const col = palette[i % palette.length];
            return (
              <g key={bx}>
                {lit > 0.25 && phase < 4 && (
                  <rect
                    x={bx - 1}
                    y={by + 1}
                    width={4}
                    height={4}
                    fill={col}
                    opacity={Number((lit * 0.34).toFixed(2))}
                  />
                )}
                <rect
                  x={bx}
                  y={by + 2}
                  width={2}
                  height={2}
                  fill={lit > 0.35 && phase < 5 ? col : C.wine}
                  opacity={Number((0.45 + lit * 0.55).toFixed(2))}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Distant bright morning sky birds */}
      {cp >= 0.66 && (
        <g fill={C.accent} opacity={Number((smooth(0.66, 0.86, cp) * 0.55).toFixed(2))}>
          <path
            d={
              tick % 6 < 3
                ? rectsPath([
                    [114 + (tick % 16), 17, 2, 1],
                    [116 + (tick % 16), 18, 1, 1],
                    [117 + (tick % 16), 17, 2, 1],
                    [146 - (tick % 12), 14, 2, 1],
                    [148 - (tick % 12), 15, 1, 1],
                    [149 - (tick % 12), 14, 2, 1],
                  ])
                : rectsPath([
                    [114 + (tick % 16), 18, 5, 1],
                    [146 - (tick % 12), 15, 5, 1],
                  ])
            }
          />
        </g>
      )}

      {/* Dusk gliding birds (2-frame gentle wingbeat) */}
      {tri(cp) > 0.15 && (
        <g fill={C.wine} opacity={Number(tri(cp).toFixed(2))}>
          <path
            d={
              tick % 4 < 2
                ? rectsPath([
                    [88 + (tick % 12), 23, 3, 1],
                    [91 + (tick % 12), 24, 2, 1],
                    [93 + (tick % 12), 23, 3, 1],
                    [140 - (tick % 10), 20, 3, 1],
                    [143 - (tick % 10), 21, 2, 1],
                    [145 - (tick % 10), 20, 3, 1],
                  ])
                : rectsPath([
                    [88 + (tick % 12), 24, 8, 1],
                    [140 - (tick % 10), 21, 8, 1],
                  ])
            }
          />
        </g>
      )}

      {/* Foreground Layered Meadow, Grass Blades & Stepping Stones */}
      <rect x={0} y={GROUND} width={VW} height={4} fill={turfTop} />
      <rect x={0} y={GROUND + 4} width={VW} height={5} fill={turfMid} />
      <rect x={0} y={GROUND + 9} width={VW} height={VH - GROUND - 9} fill={turfDeep} />
      {/* Soft grass highlight flecks */}
      <path
        d={rectsPath([
          [6, 69, 8, 1], [74, 69, 10, 1], [104, 70, 8, 1], [132, 69, 9, 1], [210, 69, 8, 1],
        ])}
        fill={farMtn}
      />
      {/* Cottage cobblestone stepping-stone path */}
      <path
        d={rectsPath([
          [46, 70, 9, 3], [58, 74, 9, 3], [70, 72, 8, 3], [82, 75, 7, 2],
        ])}
        fill={C.petal}
        opacity={0.78}
      />
      {/* Fine pixel meadow grass tufts */}
      <path
        d={rectsPath([
          [8, 65, 1, 3], [10, 66, 1, 2], [88, 66, 1, 2], [90, 65, 1, 3],
          [144, 65, 1, 3], [146, 66, 1, 2], [214, 65, 1, 3],
        ])}
        fill={turfTop}
      />

      {/* Left Zone (x = 12..70): Architectural Lineless Rose-Porcelain Cottage */}
      <PixelCottage cp={cp} tick={tick} />

      {/* Right Zone (x = 148..214): White Picket Fence + Sculpted 3-Tone Rose Garden + Butterflies */}
      <path d={FENCE_PICKETS_PATH} fill={fenceMain} />
      {rimStrength > 0.1 && (
        <path
          d={Array.from({ length: 8 }, (_, i) => `M${152 + i * 9} 47h2v1h-2Z`).join('')}
          fill={C.cream}
          opacity={Number((rimStrength * 0.85).toFixed(2))}
        />
      )}
      <rect x={150} y={54} width={66} height={2} fill={fenceShade} />
      <rect x={150} y={62} width={66} height={2} fill={fenceShade} />

      {/* Sculpted 3-tone lineless rose foliage bush */}
      <path d={BUSH_DEEP_PATH} fill={mix3(C.slate, C.sageDark, C.sageDark, cp)} />
      <path d={BUSH_MID_PATH} fill={mix3(C.mulberry, C.sageDark, C.sageMid, cp)} />
      <path d={BUSH_LIGHT_PATH} fill={mix3(C.wine, C.sageMid, C.sageLight, cp)} />

      {/* Side garden stems */}
      <path d={rectsPath([[152, 61, 2, 7], [208, 61, 2, 7]])} fill={mix3(C.slate, C.sageDark, C.sageDark, cp)} />

      {/* 3-Stage Spiral Pixel Roses driven continuously by p */}
      {bloomStage === 0 && (
        <g>
          {renderSprite(ROSE_BUD, rosePal, 166, 48, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 179, 43, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 192, 50, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 174, 57, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 187, 58, false, 1)}
        </g>
      )}
      {bloomStage === 1 && (
        <g>
          {renderSprite(ROSE_HALF, rosePal, 164, 47, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 178, 42, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 191, 49, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 172, 56, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 186, 57, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 151, 57, false, 1)}
          {renderSprite(ROSE_BUD, rosePal, 207, 57, false, 1)}
        </g>
      )}
      {bloomStage === 2 && (
        <g>
          {renderSprite(ROSE_FULL, rosePal, 162, 46, false, 1)}
          {renderSprite(ROSE_FULL, rosePal, 177, 40, false, 1)}
          {renderSprite(ROSE_FULL, rosePal, 191, 48, false, 1)}
          {renderSprite(ROSE_FULL, rosePal, 170, 55, false, 1)}
          {renderSprite(ROSE_FULL, rosePal, 185, 56, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 149, 55, false, 1)}
          {renderSprite(ROSE_HALF, rosePal, 205, 55, false, 1)}
        </g>
      )}

      {/* Daytime fluttering 3-frame pixel butterflies & drifting rose petals */}
      {cp >= 0.58 && (
        <g opacity={Number(smooth(0.58, 0.82, cp).toFixed(2))}>
          {renderSprite(
            bflyA,
            { K: C.cream, P: C.blush, A: C.accent },
            165 + bflyFloatX,
            30 + bflyFloatY,
            false,
            1
          )}
          {renderSprite(
            bflyB,
            { K: C.white, P: C.petal, A: C.carmine },
            190 - bflyFloatX,
            26 - bflyFloatY,
            true,
            1
          )}
          {/* Gently drifting pink rose petals across the sunny garden */}
          {[
            [62, 0],
            [116, 7],
            [156, 14],
            [204, 4],
          ].map(([bx, off], idx) => {
            const step = (tick + off) % 24;
            const px = bx - step * 2;
            const py = 8 + step * 3;
            return py < GROUND ? (
              <rect
                key={idx}
                x={px}
                y={py}
                width={step % 2 === 0 ? 3 : 2}
                height={2}
                fill={idx % 2 === 0 ? C.blush : C.coral}
                opacity={0.9}
              />
            ) : null;
          })}
        </g>
      )}

      {/* Night & dusk drifting warm pixel fireflies */}
      {cp < 0.68 && (
        <g opacity={Number((1 - smooth(0.45, 0.68, cp)).toFixed(2))}>
          {[
            [10, 58, 0],
            [76, 52, 3],
            [140, 55, 6],
            [212, 50, 9],
          ].map(([bx, by, off], i) => {
            const dx = Math.round(Math.sin(((tick + off) / 10) * Math.PI * 2) * 3);
            const dy = Math.round(Math.cos(((tick + off) / 8) * Math.PI * 2) * 2);
            const glow = (tick + off) % 6 < 4;
            return (
              <g key={i}>
                {glow && <rect x={bx + dx - 1} y={by + dy - 1} width={4} height={4} fill={C.honey} opacity={0.28} />}
                <rect x={bx + dx} y={by + dy} width={2} height={2} fill={C.cream} opacity={glow ? 1 : 0.45} />
              </g>
            );
          })}
        </g>
      )}

      {/* 24x24 Fine Lineless Pixel Bunny */}
      <g transform={`translate(${bunnyCx - 12} ${GROUND - 23})`}>
        <Bunny p={cp} motion={motion} facing={facing} tick={tick} />
      </g>
    </svg>
  );
}

const modeToPos = (mode) => {
  if (typeof mode === 'number' && Number.isFinite(mode)) return clamp(mode, 0, 1);
  const idx = THEME_MODES.indexOf(mode);
  return idx >= 0 ? idx / 2 : 0.5;
};
const rubber = (v) => (v < 0 ? Math.max(-0.09, v * 0.28) : v > 1 ? Math.min(1.09, 1 + (v - 1) * 0.28) : v);

function nearestNotchIdx(x) {
  for (let i = 0; i < HAPTIC_NOTCHES.length; i += 1) {
    if (Math.abs(x - HAPTIC_NOTCHES[i]) <= NOTCH_HALF) return i;
  }
  return -1;
}

export default function DayNightSlider({
  value,
  mode = 'auto',
  isAuto = false,
  onScrub,
  onChange,
  onResetAuto,
}) {
  const initialPos = typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, 1) : modeToPos(mode);
  const rootRef = useRef(null);
  const phys = useRef({ x: initialPos, v: 0, target: initialPos, raf: 0, last: 0 });
  const drag = useRef(null);
  const lastTapRef = useRef({ t: 0, pos: -1 });
  const hudTimerRef = useRef(null);
  const onScrubRef = useRef(onScrub);
  onScrubRef.current = onScrub;

  const [pos, setPos] = useState(initialPos);
  const [dragging, setDragging] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [motion, setMotion] = useState(0);
  const [facing, setFacing] = useState(-1);
  const [squash, setSquash] = useState(0);
  const [tilt, setTilt] = useState(0);

  const flashHud = useCallback((ms = 1250) => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      hudTimerRef.current = null;
      setHudVisible(false);
    }, ms);
  }, []);

  const stopSpring = () => {
    if (phys.current.raf) cancelAnimationFrame(phys.current.raf);
    phys.current.raf = 0;
  };

  const springTo = useCallback((target, kick = 0, emitScrub = true) => {
    const s = phys.current;
    s.target = clamp(target, 0, 1);
    s.v += kick;
    if (prefersReducedMotion()) {
      s.x = s.target;
      s.v = 0;
      setPos(s.target);
      setMotion(0);
      setSquash(0);
      setTilt(0);
      if (emitScrub) onScrubRef.current?.(s.target);
      return;
    }
    if (s.raf) return;
    s.last = performance.now();
    const step = (now) => {
      const dt = Math.min(1 / 30, (now - s.last) / 1000);
      s.last = now;
      // Lively jelly-glass spring with gentle overshoot wobble on stop
      const a = -340 * (s.x - s.target) - 20 * s.v;
      s.v += a * dt;
      s.x += s.v * dt;
      const speed = Math.abs(s.v);
      const clampedX = clamp(s.x, 0, 1);
      setPos(s.x);
      setMotion(clamp(speed * 0.88, 0, 1));
      setSquash(clamp(s.v * 0.058, -0.18, 0.18));
      setTilt(clamp(s.v * 2.1, -6.5, 6.5));
      if (emitScrub) onScrubRef.current?.(clampedX);
      if (Math.abs(s.x - s.target) < 0.0008 && speed < 0.01) {
        s.x = s.target;
        s.v = 0;
        s.raf = 0;
        setPos(s.target);
        setMotion(0);
        setSquash(0);
        setTilt(0);
        if (emitScrub) onScrubRef.current?.(s.target);
        return;
      }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }, []);

  // Follow external value changes (e.g. Telegram theme change in auto mode, or restored preference)
  useEffect(() => {
    if (drag.current) return;
    const target = typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, 1) : modeToPos(mode);
    if (Math.abs(phys.current.target - target) > 0.002) {
      setFacing(target > phys.current.x ? -1 : 1);
      springTo(target, 0, true);
    }
  }, [value, mode, springTo]);

  useEffect(() => () => {
    stopSpring();
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    lockVerticalSwipes(false);
  }, []);

  const lensCenter = (p) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: rect.left + PAD + D / 2 + clamp(p, 0, 1) * TRAVEL, y: rect.top + H / 2 };
  };

  const commit = (rawTarget, { kick = 0, showHud = true } = {}) => {
    const target = settleDaylightPos(rawTarget);
    const willAnimate = !prefersReducedMotion() && Math.abs(phys.current.x - target) > 0.006;
    setFacing(target > phys.current.x ? -1 : target < phys.current.x ? 1 : facing);
    springTo(target, kick, true);
    if (showHud) flashHud();
    haptic('light');
    onChange?.(target, { origin: lensCenter(target), animating: willAnimate });
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    stopSpring();
    try {
      rootRef.current?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic / WebView pointer capture rejections
    }
    lockVerticalSwipes(true);
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startPos: clamp(phys.current.x, 0, 1),
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0,
      moved: false,
      notch: nearestNotchIdx(phys.current.x),
    };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 3) return;
    d.moved = true;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT) / 1000;
    const inst = (e.clientX - d.lastX) / TRAVEL / dt;
    d.vel = d.vel * 0.62 + inst * 0.38;
    d.lastX = e.clientX;
    d.lastT = now;
    const x = rubber(d.startPos + dx / TRAVEL);
    const cx = clamp(x, 0, 1);
    phys.current.x = x;
    phys.current.v = d.vel;
    setPos(x);
    setMotion(clamp(Math.abs(d.vel) * 0.88, 0, 1));
    setSquash(clamp(d.vel * 0.058, -0.18, 0.18));
    setTilt(clamp(d.vel * 2.1, -6.5, 6.5));
    if (Math.abs(inst) > 0.05) setFacing(inst > 0 ? -1 : 1);
    onScrubRef.current?.(cx);

    const notch = nearestNotchIdx(cx);
    if (notch !== -1 && notch !== d.notch) {
      d.notch = notch;
      haptic('selection');
    } else if (notch === -1) {
      d.notch = -1;
    }
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    lockVerticalSwipes(false);

    if (!d.moved) {
      const rect = rootRef.current.getBoundingClientRect();
      const tapPos = clamp((e.clientX - rect.left - PAD - D / 2) / TRAVEL, 0, 1);
      // Quick tap thirds jump directly to Midnight (0), Sunset Dusk (0.5), or Bright Day (1)
      const target = tapPos < 0.33 ? 0 : tapPos > 0.67 ? 1 : 0.5;
      const now = performance.now();
      const prevTap = lastTapRef.current;
      const isDoubleTapSameSpot =
        now - prevTap.t < 340 &&
        Math.abs(tapPos - prevTap.pos) < 0.18 &&
        Math.abs(target - clamp(phys.current.x, 0, 1)) < 0.08;
      lastTapRef.current = { t: now, pos: tapPos };

      if (isDoubleTapSameSpot && onResetAuto) {
        haptic('success');
        flashHud(1500);
        onResetAuto();
        return;
      }

      if (Math.abs(target - clamp(phys.current.x, 0, 1)) < 0.015) {
        haptic('selection');
        flashHud();
        springTo(target, target >= 1 ? -1.8 : 1.8, false);
        if (isAuto) onChange?.(target, lensCenter(target));
      } else {
        commit(target);
      }
      return;
    }

    // Stepless release: keep light momentum and stop wherever the user releases!
    const idle = performance.now() - d.lastT > 85;
    const vel = idle ? 0 : clamp(d.vel, -3.2, 3.2);
    const projected = clamp(phys.current.x + vel * 0.045, 0, 1);
    commit(projected, { kick: vel * 0.18 });
  };

  const onKeyDown = (e) => {
    const curr = clamp(phys.current.target, 0, 1);
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      flashHud(1500);
      onResetAuto?.();
      return;
    }
    let next = curr;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(curr - 0.125, 0, 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(curr + 0.125, 0, 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      const stops = [0, 0.5, 0.75, 1];
      const nextStop = stops.find((s) => s > curr + 0.04);
      next = nextStop !== undefined ? nextStop : 0;
    } else return;
    e.preventDefault();
    commit(next);
  };

  const cp = clamp(pos, 0, 1);
  const stage = describeDaylightStage(cp);
  const lensX = clamp(pos, -0.09, 1.09) * TRAVEL;
  const cx = PAD + D / 2 + lensX;
  const cy = H / 2 + 4; // focus slightly below centre so the crystal bubble frames cottage / bunny / roses
  const lensTx = Math.round(D / 2 - cx * ZOOM);
  const lensTy = Math.round(D / 2 - cy * ZOOM);
  const pct = Math.round(cp * 100);

  return (
    <div
      ref={rootRef}
      className={`dn-slider${dragging ? ' is-dragging' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label="无级昼夜调光"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${stage.clock} ${stage.label}${isAuto ? '（跟随系统）' : ''}`}
      title={`${stage.clock} · ${stage.label}（拖动无级调光 · 点按三段直达 · 双击恢复跟随 Telegram）`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <div className="dn-track">
        <DayNightScene p={cp} motion={motion} facing={facing} />
      </div>
      <div className="dn-lens" style={{ transform: `translate3d(${Math.round(lensX)}px,0,0)` }}>
        <div
          className="dn-lens-body"
          style={{
            '--sx': (1 + Math.abs(squash)).toFixed(3),
            '--sy': (1 - Math.abs(squash) * 0.68).toFixed(3),
            '--tilt': `${tilt.toFixed(2)}deg`,
          }}
        >
          <div className="dn-lens-view">
            <div
              className="dn-lens-scene"
              style={{ transform: `translate(${lensTx}px, ${lensTy}px) scale(${ZOOM})` }}
            >
              <DayNightScene p={cp} motion={motion} facing={facing} />
            </div>
          </div>
          <span className="dn-lens-glass" />
        </div>
      </div>
      <div className={`dn-hud${dragging || hudVisible ? ' is-visible' : ''}`} aria-hidden="true">
        <span className="dn-hud-clock">{stage.clock}</span>
        <span className="dn-hud-sep">·</span>
        <span className="dn-hud-label">{stage.short}</span>
        {isAuto && <span className="dn-hud-auto">自动</span>}
      </div>
    </div>
  );
}
