// Shared Theme Presets, Bottom Dock Styles & Stepless Daylight Color Engine
// (used by both Cloudflare Worker & React Mini App)

export const DEFAULT_THEME_PRESET = 'rose';
export const DEFAULT_DOCK_STYLE = 'solid';

// Ink polarity flips smoothly right at mid-luminance (L_rel ~ 0.19) around 0.60 while
// background & card surfaces interpolate 100% continuously with zero brightness jump.
export const DAYLIGHT_POLARITY_PIVOT = 0.6;

export const THEME_PRESETS = [
  {
    id: 'rose',
    name: '玫瑰瓷',
    desc: '经典淡粉瓷白与酒红玫瑰',
    swatch: '#a32952',
    swatchSoft: '#fae9ee',
    lightBg: '#faf4f5',
    darkBg: '#141012',
  },
  {
    id: 'ocean',
    name: '海盐晴蓝',
    desc: '清爽冷淡晴空蓝，技术风首选',
    swatch: '#1d63b8',
    swatchSoft: '#e4f0fd',
    lightBg: '#f3f7fb',
    darkBg: '#0f141a',
  },
  {
    id: 'matcha',
    name: '抹茶青瓷',
    desc: '低饱和温润奶绿，久看不累',
    swatch: '#2c7a56',
    swatchSoft: '#e4f3eb',
    lightBg: '#f4f8f5',
    darkBg: '#101613',
  },
  {
    id: 'lavender',
    name: '暮紫雾灰',
    desc: '柔和薰衣草雾紫，自带夜色氛围',
    swatch: '#6d46b8',
    swatchSoft: '#efe9fb',
    lightBg: '#f6f4fa',
    darkBg: '#131119',
  },
  {
    id: 'mono',
    name: '极简黑白',
    desc: '中性高级冷灰，无明显色调倾向',
    swatch: '#27272c',
    swatchSoft: '#dedee6',
    lightBg: '#f5f5f7',
    darkBg: '#111113',
  },
];

export const THEME_PRESET_IDS = THEME_PRESETS.map((p) => p.id);

export const DOCK_STYLES = [
  {
    id: 'solid',
    name: '瓷感实体',
    desc: '沉稳清晰，滚过图文不透底',
  },
  {
    id: 'glass',
    name: '轻磨砂玻璃',
    desc: '高透液态玻璃 + 边缘高光，滑动时背景柔和透出',
  },
];

export const DOCK_STYLE_IDS = DOCK_STYLES.map((d) => d.id);

export function normalizeThemePreset(raw) {
  const val = String(raw || '').trim().toLowerCase();
  return THEME_PRESET_IDS.includes(val) ? val : DEFAULT_THEME_PRESET;
}

export function normalizeDockStyle(raw) {
  const val = String(raw || '').trim().toLowerCase();
  return DOCK_STYLE_IDS.includes(val) ? val : DEFAULT_DOCK_STYLE;
}

export function getThemePresetMeta(id) {
  const clean = normalizeThemePreset(id);
  return THEME_PRESETS.find((p) => p.id === clean) || THEME_PRESETS[0];
}

export function getDockStyleMeta(id) {
  const clean = normalizeDockStyle(id);
  return DOCK_STYLES.find((d) => d.id === clean) || DOCK_STYLES[0];
}

// 6-stop perceptually uniform surface keyframes per palette (zero brightness cliff from 0.00 to 1.00!):
//   0.00 night   (L* ~ 6%)  — exact dark mode
//   0.30 starlit (L* ~ 18%) — soft velvety evening
//   0.50 dusk    (L* ~ 32%) — rich warm sunset twilight (tap-center sweet spot)
//   0.60 horizon (L* ~ 48%) — silky mid-tone dusty velvet (seamless ink flip, ZERO flash!)
//   0.80 mist    (L* ~ 82%) — warm eye-care morning mist (gentle on max brightness)
//   1.00 day     (L* ~ 97%) — exact light mode
const SURFACE_STOPS = [0, 0.3, 0.5, 0.6, 0.8, 1];

const DAYLIGHT_KEYFRAMES = {
  rose: {
    surfaces: [
      { bg: '#141012', elevated: '#1f181b', subtle: '#2a2024', ticket: ['#241b1f', '#1f171b', '#2a1c22'], shadowRgb: [0, 0, 0], borderRgb: [255, 224, 235], borderAlpha: 0.08 },
      { bg: '#2c1b24', elevated: '#392430', subtle: '#482e3c', ticket: ['#402835', '#37222e', '#492b3a'], shadowRgb: [24, 8, 18], borderRgb: [255, 218, 230], borderAlpha: 0.1 },
      { bg: '#4f3342', elevated: '#5b3c4d', subtle: '#6b495b', ticket: ['#634254', '#58394a', '#6d4759'], shadowRgb: [48, 16, 34], borderRgb: [255, 226, 236], borderAlpha: 0.13 },
      { bg: '#8d6f7e', elevated: '#917282', subtle: '#7f6271', ticket: ['#967787', '#8e6f7f', '#9a7a8a'], shadowRgb: [72, 32, 54], borderRgb: [255, 238, 244], borderAlpha: 0.18 },
      { bg: '#e5d1da', elevated: '#f3e5eb', subtle: '#dac2cd', ticket: ['#f6ebf0', '#f0dfe7', '#e9d3dd'], shadowRgb: [122, 46, 76], borderRgb: [163, 41, 82], borderAlpha: 0.1 },
      { bg: '#faf4f5', elevated: '#ffffff', subtle: '#f6ecef', ticket: ['#ffffff', '#fff8fa', '#fdf1f4'], shadowRgb: [140, 38, 72], borderRgb: [163, 41, 82], borderAlpha: 0.08 },
    ],
    darkInk: {
      night: { text: '#f7eef1', secondary: '#b9a6ae', muted: '#84727a', accent: '#e56b92', strong: '#f082a5', gradFrom: '#f49bb8', onAccent: '#220912' },
      dusk: { text: '#ffffff', secondary: '#fff5f8', muted: '#ead4df', accent: '#ffb4cd', strong: '#ffcadc', gradFrom: '#ffd4c2', onAccent: '#2b0b17' },
    },
    lightInk: {
      horizon: { text: '#11060b', secondary: '#1c0c14', muted: '#331b26', accent: '#650f2f', strong: '#4d0923', gradFrom: '#a6335c', onAccent: '#ffffff' },
      mist: { text: '#24161d', secondary: '#654e59', muted: '#8b727e', accent: '#ad2f5a', strong: '#8f2247', gradFrom: '#ee97b3', onAccent: '#ffffff' },
      day: { text: '#1e1619', secondary: '#6f5f66', muted: '#9f8f96', accent: '#a32952', strong: '#871d41', gradFrom: '#f095b3', onAccent: '#ffffff' },
    },
  },
  ocean: {
    surfaces: [
      { bg: '#0f141a', elevated: '#171f29', subtle: '#212c39', ticket: ['#1b2532', '#151d27', '#1e2b3c'], shadowRgb: [0, 0, 0], borderRgb: [210, 232, 255], borderAlpha: 0.09 },
      { bg: '#1a2536', elevated: '#24334a', subtle: '#2f415d', ticket: ['#293952', '#223046', '#31415e'], shadowRgb: [10, 18, 36], borderRgb: [214, 234, 255], borderAlpha: 0.11 },
      { bg: '#30435e', elevated: '#3a506f', subtle: '#486083', ticket: ['#405778', '#374c6a', '#495f82'], shadowRgb: [18, 32, 58], borderRgb: [224, 240, 255], borderAlpha: 0.14 },
      { bg: '#687c96', elevated: '#6c809a', subtle: '#5d7089', ticket: ['#7185a0', '#697d97', '#7589a4'], shadowRgb: [32, 52, 82], borderRgb: [232, 244, 255], borderAlpha: 0.18 },
      { bg: '#d4e2f2', elevated: '#eaf2fb', subtle: '#c6d8ec', ticket: ['#eff6fd', '#e4eef9', '#d8e6f5'], shadowRgb: [26, 72, 130], borderRgb: [29, 99, 184], borderAlpha: 0.1 },
      { bg: '#f3f7fb', elevated: '#ffffff', subtle: '#e9f1f9', ticket: ['#ffffff', '#f6faff', '#ebf3fc'], shadowRgb: [22, 74, 140], borderRgb: [29, 99, 184], borderAlpha: 0.08 },
    ],
    darkInk: {
      night: { text: '#edf4fb', secondary: '#9eb1c6', muted: '#6f8398', accent: '#63a4f5', strong: '#82b8f8', gradFrom: '#93c4fb', onAccent: '#091320' },
      dusk: { text: '#ffffff', secondary: '#f2f7fd', muted: '#d6e3f2', accent: '#b8d8ff', strong: '#d0e6ff', gradFrom: '#dfc8f7', onAccent: '#091526' },
    },
    lightInk: {
      horizon: { text: '#070e17', secondary: '#111e2e', muted: '#273a50', accent: '#103e7a', strong: '#092f61', gradFrom: '#3a79c9', onAccent: '#ffffff' },
      mist: { text: '#16212d', secondary: '#4b5e73', muted: '#71859b', accent: '#2269bf', strong: '#17529c', gradFrom: '#79b6f8', onAccent: '#ffffff' },
      day: { text: '#131b24', secondary: '#536475', muted: '#8495a7', accent: '#1d63b8', strong: '#154d94', gradFrom: '#6fb2f7', onAccent: '#ffffff' },
    },
  },
  matcha: {
    surfaces: [
      { bg: '#101613', elevated: '#18211c', subtle: '#222f28', ticket: ['#1c2821', '#161f1a', '#1e2e25'], shadowRgb: [0, 0, 0], borderRgb: [210, 245, 224], borderAlpha: 0.09 },
      { bg: '#1c2b24', elevated: '#263a30', subtle: '#324b3f', ticket: ['#2b4136', '#24372d', '#33483b'], shadowRgb: [12, 26, 18], borderRgb: [214, 245, 226], borderAlpha: 0.11 },
      { bg: '#334c40', elevated: '#3d5a4b', subtle: '#4b6c5b', ticket: ['#436252', '#3a5647', '#4d6a58'], shadowRgb: [20, 42, 30], borderRgb: [224, 248, 234], borderAlpha: 0.14 },
      { bg: '#668273', elevated: '#688475', subtle: '#5b7567', ticket: ['#6d897a', '#668273', '#718d7e'], shadowRgb: [32, 62, 46], borderRgb: [232, 250, 240], borderAlpha: 0.18 },
      { bg: '#d7e8dc', elevated: '#ecf5ef', subtle: '#c9dfd0', ticket: ['#f1f8f3', '#e6f1ea', '#dbeae0'], shadowRgb: [32, 88, 60], borderRgb: [44, 122, 86], borderAlpha: 0.1 },
      { bg: '#f4f8f5', elevated: '#ffffff', subtle: '#eaf2ec', ticket: ['#ffffff', '#f7fbf8', '#edf5ef'], shadowRgb: [31, 96, 66], borderRgb: [44, 122, 86], borderAlpha: 0.08 },
    ],
    darkInk: {
      night: { text: '#eef6f1', secondary: '#a1b8aa', muted: '#72887b', accent: '#5bc290', strong: '#78d1a6', gradFrom: '#8edbb5', onAccent: '#091a12' },
      dusk: { text: '#ffffff', secondary: '#f2faf5', muted: '#d6e8dd', accent: '#acefd4', strong: '#c8f6e3', gradFrom: '#e8e6bc', onAccent: '#091f14' },
    },
    lightInk: {
      horizon: { text: '#08120c', secondary: '#13241a', muted: '#294032', accent: '#124e33', strong: '#0b3c26', gradFrom: '#3d8f69', onAccent: '#ffffff' },
      mist: { text: '#18231c', secondary: '#4e6255', muted: '#758a7c', accent: '#2c7e58', strong: '#206344', gradFrom: '#7bcca4', onAccent: '#ffffff' },
      day: { text: '#151e18', secondary: '#58695e', muted: '#87988d', accent: '#2c7a56', strong: '#205f42', gradFrom: '#72c99e', onAccent: '#ffffff' },
    },
  },
  lavender: {
    surfaces: [
      { bg: '#131119', elevated: '#1c1925', subtle: '#272334', ticket: ['#221e2e', '#1a1724', '#272138'], shadowRgb: [0, 0, 0], borderRgb: [226, 214, 255], borderAlpha: 0.09 },
      { bg: '#261e38', elevated: '#32284a', subtle: '#41345e', ticket: ['#382c52', '#2f2546', '#43315b'], shadowRgb: [18, 12, 36], borderRgb: [230, 220, 255], borderAlpha: 0.11 },
      { bg: '#453863', elevated: '#504273', subtle: '#605088', ticket: ['#57487c', '#4d3e6e', '#624c86'], shadowRgb: [36, 24, 66], borderRgb: [238, 230, 255], borderAlpha: 0.14 },
      { bg: '#7f729c', elevated: '#8376a0', subtle: '#73668f', ticket: ['#887ba6', '#80739d', '#8c7faa'], shadowRgb: [56, 42, 92], borderRgb: [242, 236, 255], borderAlpha: 0.18 },
      { bg: '#dfd6ee', elevated: '#f1ecf9', subtle: '#d1c5e6', ticket: ['#f5f1fb', '#ebe4f7', '#e1d7f2'], shadowRgb: [76, 48, 136], borderRgb: [109, 70, 184], borderAlpha: 0.1 },
      { bg: '#f6f4fa', elevated: '#ffffff', subtle: '#eeeaf6', ticket: ['#ffffff', '#f9f7fd', '#f1ecf9'], shadowRgb: [84, 52, 148], borderRgb: [109, 70, 184], borderAlpha: 0.08 },
    ],
    darkInk: {
      night: { text: '#f3effb', secondary: '#b0a7c4', muted: '#7f7694', accent: '#a685f0', strong: '#bc9ff6', gradFrom: '#c8b0fa', onAccent: '#120c21' },
      dusk: { text: '#ffffff', secondary: '#f6f2fd', muted: '#dfd6f0', accent: '#d6c2ff', strong: '#e6d8ff', gradFrom: '#f7c1dc', onAccent: '#160d2b' },
    },
    lightInk: {
      horizon: { text: '#0e0a19', secondary: '#1c142e', muted: '#362a4f', accent: '#442087', strong: '#33156b', gradFrom: '#7e59cc', onAccent: '#ffffff' },
      mist: { text: '#1f1a2a', secondary: '#5a516e', muted: '#807795', accent: '#714abe', strong: '#5936a1', gradFrom: '#b69aef', onAccent: '#ffffff' },
      day: { text: '#1b1724', secondary: '#625b73', muted: '#928aa4', accent: '#6d46b8', strong: '#553399', gradFrom: '#b093ec', onAccent: '#ffffff' },
    },
  },
  mono: {
    surfaces: [
      { bg: '#111113', elevated: '#1b1b1e', subtle: '#26262b', ticket: ['#212125', '#19191d', '#25252b'], shadowRgb: [0, 0, 0], borderRgb: [255, 255, 255], borderAlpha: 0.09 },
      { bg: '#252429', elevated: '#323037', subtle: '#403e47', ticket: ['#38363e', '#2f2d34', '#3d3942'], shadowRgb: [14, 14, 18], borderRgb: [248, 246, 252], borderAlpha: 0.11 },
      { bg: '#45434b', elevated: '#504d57', subtle: '#605d68', ticket: ['#57545e', '#4d4a54', '#5f5b66'], shadowRgb: [28, 28, 34], borderRgb: [252, 250, 255], borderAlpha: 0.14 },
      { bg: '#7b7982', elevated: '#7f7d86', subtle: '#706e76', ticket: ['#84828b', '#7c7a83', '#88868f'], shadowRgb: [46, 46, 54], borderRgb: [255, 255, 255], borderAlpha: 0.18 },
      { bg: '#dcdce4', elevated: '#f0f0f5', subtle: '#cfcfe0', ticket: ['#f4f4f8', '#eaeaf1', '#e0e0ea'], shadowRgb: [24, 24, 30], borderRgb: [39, 39, 44], borderAlpha: 0.1 },
      { bg: '#f5f5f7', elevated: '#ffffff', subtle: '#ebebef', ticket: ['#ffffff', '#fafafa', '#f2f2f5'], shadowRgb: [24, 24, 28], borderRgb: [39, 39, 44], borderAlpha: 0.08 },
    ],
    darkInk: {
      night: { text: '#f4f4f6', secondary: '#a8a8b2', muted: '#787882', accent: '#e0e0e8', strong: '#f2f2f6', gradFrom: '#9b9ba6', onAccent: '#141417' },
      dusk: { text: '#ffffff', secondary: '#f5f4f8', muted: '#dcd8e2', accent: '#f6f4fb', strong: '#ffffff', gradFrom: '#dad2e0', onAccent: '#17161b' },
    },
    lightInk: {
      horizon: { text: '#0b0b0e', secondary: '#19191f', muted: '#33333c', accent: '#1a1a21', strong: '#0d0d11', gradFrom: '#4d4d59', onAccent: '#ffffff' },
      mist: { text: '#1a1a1e', secondary: '#52525c', muted: '#787884', accent: '#2c2c34', strong: '#16161a', gradFrom: '#6c6c78', onAccent: '#ffffff' },
      day: { text: '#161618', secondary: '#5c5c63', muted: '#8c8c94', accent: '#27272c', strong: '#111114', gradFrom: '#64646e', onAccent: '#ffffff' },
    },
  },
};

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const clean = String(hex || '#000000').replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex([r, g, b]) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixRgb(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function mixHex(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t));
}

function fmtRgb(rgb) {
  return `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
}

export function normalizeDaylightPos(raw, fallback = 0.5) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return clamp01(fallback);
  return Math.round(clamp01(n) * 1000) / 1000;
}

// Gentle magnetic alignment only at pure Night (0), Sunset Dusk (0.5), and Bright Day (1);
// everywhere else is 100% stepless because surfaces have zero brightness jump and every stop is readable.
export function settleDaylightPos(raw) {
  const p = clamp01(raw);
  if (p < 0.025) return 0;
  if (p > 0.975) return 1;
  if (Math.abs(p - 0.5) < 0.025) return 0.5;
  return Math.round(p * 1000) / 1000;
}

export function isDaylightDark(pos) {
  return clamp01(pos) < DAYLIGHT_POLARITY_PIVOT;
}

export function describeDaylightStage(pos) {
  const p = clamp01(pos);
  const totalMinutes = Math.round(lerp(0, 12 * 60, p) / 5) * 5;
  const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  const clock = `${hh}:${mm}`;

  if (p <= 0.14) return { id: 'night', icon: '🌙', label: '午夜 · 深色', short: '午夜', clock };
  if (p <= 0.36) return { id: 'starlit', icon: '✨', label: '星夜 · 微暗', short: '星夜', clock };
  if (p < DAYLIGHT_POLARITY_PIVOT) return { id: 'dusk', icon: '🌅', label: '黄昏 · 暮色', short: '黄昏', clock };
  if (p <= 0.72) return { id: 'dawn', icon: '🌷', label: '破晓 · 玫瑰雾', short: '破晓', clock };
  if (p <= 0.88) return { id: 'mist', icon: '🌤', label: '晨雾 · 柔光', short: '晨雾', clock };
  return { id: 'day', icon: '☀️', label: '白天 · 晴朗', short: '白天', clock };
}

function sampleSurface(surfaces, p) {
  let seg = 0;
  for (let i = 0; i < SURFACE_STOPS.length - 1; i += 1) {
    if (p >= SURFACE_STOPS[i]) seg = i;
  }
  const s0 = SURFACE_STOPS[seg];
  const s1 = SURFACE_STOPS[seg + 1];
  const t = s1 > s0 ? clamp01((p - s0) / (s1 - s0)) : 0;
  const a = surfaces[seg];
  const b = surfaces[seg + 1];
  return {
    bg: mixHex(a.bg, b.bg, t),
    elevated: mixHex(a.elevated, b.elevated, t),
    subtle: mixHex(a.subtle, b.subtle, t),
    ticket: [
      mixHex(a.ticket[0], b.ticket[0], t),
      mixHex(a.ticket[1], b.ticket[1], t),
      mixHex(a.ticket[2], b.ticket[2], t),
    ],
    shadowRgb: mixRgb(a.shadowRgb, b.shadowRgb, t),
    borderRgb: mixRgb(a.borderRgb, b.borderRgb, t),
    borderAlpha: Number(lerp(a.borderAlpha, b.borderAlpha, t).toFixed(3)),
  };
}

function mixInk(a, b, t) {
  return {
    text: mixHex(a.text, b.text, t),
    secondary: mixHex(a.secondary, b.secondary, t),
    muted: mixHex(a.muted, b.muted, t),
    accent: mixHex(a.accent, b.accent, t),
    strong: mixHex(a.strong, b.strong, t),
    gradFrom: mixHex(a.gradFrom, b.gradFrom, t),
    onAccent: mixHex(a.onAccent, b.onAccent, t),
  };
}

/**
 * Computes full CSS custom properties for any stepless daylight position `pos` in `[0, 1]`.
 * Surfaces follow a 100% continuous 6-stop perceptual ramp (zero sudden flash at dawn), while
 * ink colors track each half's contrast envelope so every stop remains crisp & readable.
 */
export function computeDaylightTokens(pos, presetId = DEFAULT_THEME_PRESET) {
  const p = clamp01(pos);
  const preset = normalizeThemePreset(presetId);
  const kf = DAYLIGHT_KEYFRAMES[preset] || DAYLIGHT_KEYFRAMES.rose;
  const dark = isDaylightDark(p);

  const surf = sampleSurface(kf.surfaces, p);
  let ink;
  if (dark) {
    ink = mixInk(kf.darkInk.night, kf.darkInk.dusk, clamp01(p / DAYLIGHT_POLARITY_PIVOT));
  } else if (p < 0.8) {
    const t = clamp01((p - DAYLIGHT_POLARITY_PIVOT) / (0.8 - DAYLIGHT_POLARITY_PIVOT));
    ink = mixInk(kf.lightInk.horizon, kf.lightInk.mist, t);
  } else {
    const t = clamp01((p - 0.8) / 0.2);
    ink = mixInk(kf.lightInk.mist, kf.lightInk.day, t);
  }

  const accentRgb = hexToRgb(ink.accent);
  const onAccentRgb = hexToRgb(ink.onAccent);
  const elevatedRgb = hexToRgb(surf.elevated);

  const accentSoft = dark
    ? `rgba(${fmtRgb(accentRgb)}, ${lerp(0.15, 0.22, clamp01(p / DAYLIGHT_POLARITY_PIVOT)).toFixed(3)})`
    : mixHex(
        surf.elevated,
        ink.accent,
        lerp(0.15, 0.1, clamp01((p - DAYLIGHT_POLARITY_PIVOT) / (1 - DAYLIGHT_POLARITY_PIVOT))),
      );
  const accentSoftHover = dark
    ? `rgba(${fmtRgb(accentRgb)}, ${lerp(0.24, 0.32, clamp01(p / DAYLIGHT_POLARITY_PIVOT)).toFixed(3)})`
    : mixHex(
        surf.elevated,
        ink.accent,
        lerp(0.22, 0.16, clamp01((p - DAYLIGHT_POLARITY_PIVOT) / (1 - DAYLIGHT_POLARITY_PIVOT))),
      );

  const vars = {
    '--bg': surf.bg,
    '--bg-elevated': surf.elevated,
    '--bg-subtle': surf.subtle,
    '--bg-ticket': `linear-gradient(145deg, ${surf.ticket[0]} 0%, ${surf.ticket[1]} ${dark ? '70%' : '65%'}, ${surf.ticket[2]} 100%)`,
    '--text': ink.text,
    '--text-secondary': ink.secondary,
    '--text-muted': ink.muted,
    '--accent': ink.accent,
    '--accent-strong': ink.strong,
    '--accent-grad-from': ink.gradFrom,
    '--accent-rgb': fmtRgb(accentRgb),
    '--shadow-rgb': fmtRgb(surf.shadowRgb),
    '--on-accent': ink.onAccent,
    '--on-accent-rgb': fmtRgb(onAccentRgb),
    '--accent-soft': accentSoft,
    '--accent-soft-hover': accentSoftHover,
    '--accent-line': `rgba(${fmtRgb(accentRgb)}, ${dark ? '0.24' : '0.18'})`,
    '--border': `rgba(${fmtRgb(surf.borderRgb)}, ${surf.borderAlpha})`,
    '--dock-bg': `rgba(${fmtRgb(elevatedRgb)}, 0.96)`,
    '--shadow': dark
      ? `0 8px 26px rgba(${fmtRgb(surf.shadowRgb)}, ${lerp(0.35, 0.24, clamp01(p / DAYLIGHT_POLARITY_PIVOT)).toFixed(2)})`
      : `0 6px 24px rgba(${fmtRgb(surf.shadowRgb)}, ${lerp(0.14, 0.06, clamp01((p - DAYLIGHT_POLARITY_PIVOT) / (1 - DAYLIGHT_POLARITY_PIVOT))).toFixed(3)}), 0 1px 3px rgba(${fmtRgb(surf.shadowRgb)}, 0.04)`,
    '--shadow-dock': dark
      ? `0 12px 36px rgba(${fmtRgb(surf.shadowRgb)}, ${lerp(0.52, 0.36, clamp01(p / DAYLIGHT_POLARITY_PIVOT)).toFixed(2)})`
      : `0 10px 34px rgba(${fmtRgb(surf.shadowRgb)}, ${lerp(0.22, 0.13, clamp01((p - DAYLIGHT_POLARITY_PIVOT) / (1 - DAYLIGHT_POLARITY_PIVOT))).toFixed(2)}), 0 2px 8px rgba(${fmtRgb(surf.shadowRgb)}, 0.06)`,
  };

  return {
    pos: p,
    preset,
    theme: dark ? 'dark' : 'light',
    chromeBg: surf.bg,
    stage: describeDaylightStage(p),
    vars,
  };
}

export const DAYLIGHT_VAR_KEYS = Object.keys(computeDaylightTokens(0.5, DEFAULT_THEME_PRESET).vars);

export function applyDaylightThemeToDocument(pos, presetId = DEFAULT_THEME_PRESET) {
  const result = computeDaylightTokens(pos, presetId);
  if (typeof document === 'undefined') return result;
  const root = document.documentElement;
  root.setAttribute('data-theme', result.theme);
  root.setAttribute('data-daylight-stage', result.stage.id);
  root.style.setProperty('--daylight', String(result.pos));
  if (result.pos <= 0.001 || result.pos >= 0.999) {
    for (const key of DAYLIGHT_VAR_KEYS) {
      root.style.removeProperty(key);
    }
  } else {
    for (const [key, val] of Object.entries(result.vars)) {
      root.style.setProperty(key, val);
    }
  }
  return result;
}

export function getThemeChromeBg(theme = 'light', presetId = DEFAULT_THEME_PRESET) {
  if (typeof theme === 'number' && Number.isFinite(theme)) {
    return computeDaylightTokens(theme, presetId).chromeBg;
  }
  const meta = getThemePresetMeta(presetId);
  return theme === 'dark' ? meta.darkBg : meta.lightBg;
}
