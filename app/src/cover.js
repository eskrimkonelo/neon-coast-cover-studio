// Neon Coast Cover Studio — the cover engine.
// Draws a multi-panel GTA-style poster cover onto any canvas: panels of the
// visitor's photos, a gradient-map colour grade, a halftone title block with
// bold display lettering, a badge ribbon, a heat-meter of stars, procedurally
// drawn palms and sun, grain and vignette. Everything here is original art.

export const LAYOUTS = [
  { id: 'hero3', name: 'Hero + Three', desc: 'One hero panel, three stacked' },
  { id: 'grid9', name: 'Nine Panel', desc: 'Classic 3 × 3 cover grid' },
  { id: 'slash', name: 'Diagonal Slash', desc: 'Three slanted comic bands' },
  { id: 'snapshots', name: 'Tilted Snapshots', desc: 'Polaroid snaps on a sunset' },
  { id: 'fullbleed', name: 'Full Bleed + Inset', desc: 'One big photo, one inset' },
  { id: 'duo', name: 'Split Duo', desc: 'Two tall panels side by side' },
  { id: 'triptych', name: 'Triptych', desc: 'Three tall panels' },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', shadow: [42, 10, 58], mid: [255, 94, 58], high: [255, 209, 102], css: 'linear-gradient(90deg,#2a0a3a,#ff5e3a,#ffd166)' },
  { id: 'neon', name: 'Neon Nights', shadow: [10, 10, 46], mid: [255, 46, 136], high: [45, 226, 255], css: 'linear-gradient(90deg,#0a0a2e,#ff2e88,#2de2ff)' },
  { id: 'gold', name: 'Palm Gold', shadow: [26, 18, 6], mid: [232, 134, 46], high: [255, 233, 168], css: 'linear-gradient(90deg,#1a1206,#e8862e,#ffe9a8)' },
  { id: 'pink', name: 'Heatwave Pink', shadow: [43, 10, 46], mid: [255, 77, 157], high: [255, 194, 226], css: 'linear-gradient(90deg,#2b0a2e,#ff4d9d,#ffc2e2)' },
  { id: 'teal', name: 'Midnight Teal', shadow: [3, 24, 31], mid: [15, 118, 110], high: [165, 243, 252], css: 'linear-gradient(90deg,#03181f,#0f766e,#a5f3fc)' },
  { id: 'ink', name: 'Poster Ink', shadow: [13, 13, 13], mid: [90, 90, 96], high: [255, 255, 255], css: 'linear-gradient(90deg,#0d0d0d,#5a5a60,#ffffff)' },
];

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

const GAP = 0.008; // gutter between panels, as a fraction of width

/** Panel rectangles for a layout, as fractions of the cover: {x, y, w, h, rot, clip}. */
export function panelRects(layoutId, W, H) {
  const g = GAP * (W / Math.min(W, H));
  const inset = (p) => ({ ...p, x: p.x + g / 2, y: p.y + g / 2, w: p.w - g, h: p.h - g, rot: p.rot || 0, clip: p.clip || null });
  switch (layoutId) {
    case 'grid9': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push(inset({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3 }));
      return out;
    }
    case 'slash': {
      const bands = [
        [[0, 0], [0.40, 0], [0.20, 1], [0, 1]],
        [[0.40, 0], [0.74, 0], [0.54, 1], [0.20, 1]],
        [[0.74, 0], [1, 0], [1, 1], [0.54, 1]],
      ];
      return bands.map((poly) => {
        const xs = poly.map((p) => p[0]); const ys = poly.map((p) => p[1]);
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0, rot: 0, clip: poly };
      });
    }
    case 'snapshots':
      return [
        inset({ x: 0.05, y: 0.04, w: 0.40, h: 0.52, rot: -7 }),
        inset({ x: 0.55, y: 0.03, w: 0.40, h: 0.52, rot: 6 }),
        inset({ x: 0.30, y: 0.50, w: 0.42, h: 0.26, rot: -2 }),
      ];
    case 'fullbleed':
      return [
        { x: 0, y: 0, w: 1, h: 1, rot: 0, clip: null },
        inset({ x: 0.58, y: 0.56, w: 0.37, h: 0.30, rot: -2 }),
      ];
    case 'duo':
      return [inset({ x: 0, y: 0, w: 0.5, h: 1 }), inset({ x: 0.5, y: 0, w: 0.5, h: 1 })];
    case 'triptych':
      return [0, 1, 2].map((i) => inset({ x: i / 3, y: 0, w: 1 / 3, h: 1 }));
    case 'hero3':
    default:
      return [
        inset({ x: 0, y: 0, w: 0.62, h: 1 }),
        inset({ x: 0.62, y: 0, w: 0.38, h: 1 / 3 }),
        inset({ x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 }),
        inset({ x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 }),
      ];
  }
}

/** Which panel (index) contains point px,py on a W×H cover, or -1. */
export function panelAt(layoutId, W, H, px, py) {
  const rects = panelRects(layoutId, W, H);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x * W && px <= (r.x + r.w) * W && py >= r.y * H && py <= (r.y + r.h) * H) return i;
  }
  return -1;
}

function lerpColor(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Gradient-map + posterize grade, applied in place on a photo-layer canvas. */
export function applyGrade(layer, grade) {
  const ctx = layer.getContext('2d');
  const img = ctx.getImageData(0, 0, layer.width, layer.height);
  const d = img.data;
  const { shadow, mid, high } = grade;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    lum = Math.round(lum * 7) / 7; // cel-shading posterize: 8 flat levels
    const mapped = lum < 0.5 ? lerpColor(shadow, mid, lum * 2) : lerpColor(mid, high, (lum - 0.5) * 2);
    d[i] = d[i] * 0.18 + mapped[0] * 0.82;
    d[i + 1] = d[i + 1] * 0.18 + mapped[1] * 0.82;
    d[i + 2] = d[i + 2] * 0.18 + mapped[2] * 0.82;
  }
  ctx.putImageData(img, 0, 0);
}

function drawPhotoInto(ctx, photo, panel, W, H) {
  if (!photo || !photo.img) return;
  const px = panel.x * W, py = panel.y * H, pw = panel.w * W, ph = panel.h * H;
  const iw = photo.img.naturalWidth, ih = photo.img.naturalHeight;
  const base = Math.max(pw / iw, ph / ih) * (photo.zoom || 1);
  const dw = iw * base, dh = ih * base;
  const dx = px + (pw - dw) / 2 + (photo.ox || 0) * pw;
  const dy = py + (ph - dh) / 2 + (photo.oy || 0) * ph;
  ctx.save();
  ctx.beginPath();
  if (panel.clip) {
    panel.clip.forEach(([fx, fy], i) => (i === 0 ? ctx.moveTo(fx * W, fy * H) : ctx.lineTo(fx * W, fy * H)));
    ctx.closePath();
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  if (panel.rot) {
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.drawImage(photo.img, dx - (px + pw / 2), dy - (py + ph / 2), dw, dh);
  } else {
    ctx.drawImage(photo.img, dx, dy, dw, dh);
  }
  ctx.restore();
}

function drawRetroSun(ctx, cx, cy, r, grade) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.6);
  glow.addColorStop(0, 'rgba(255,209,102,0.85)');
  glow.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sun.addColorStop(0, '#ffd166');
  sun.addColorStop(0.55, '#ff5e3a');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.id === 'neon' ? '#12081f' : '#2a0a3a';
  let y = cy + r * 0.08, gap = r * 0.10;
  while (y < cy + r) { ctx.fillRect(cx - r, y, r * 2, gap * 0.45); y += gap; gap *= 1.35; }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 22, -88);
  ctx.stroke();
  const topX = 22, topY = -88;
  for (let i = 0; i < 7; i++) {
    const a = (-165 + i * 52) * (Math.PI / 180);
    const len = 46 - Math.abs(i - 3) * 4;
    const ex = topX + Math.cos(a) * len, ey = topY + Math.sin(a) * len * 0.55;
    const mx = topX + Math.cos(a) * len * 0.55, my = topY + Math.sin(a) * len * 0.55 - 14;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey + 12);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let noiseCanvas = null;
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 140; noiseCanvas.height = 140;
  const c = noiseCanvas.getContext('2d');
  const img = c.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
  }
  c.putImageData(img, 0, 0);
  return noiseCanvas;
}

function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(14, w / 72);
  ctx.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const cx = x + col * step + (row % 2 ? step / 2 : 0);
      const cy = y + row * step;
      const r = step * 0.16 * (1 + (row / Math.max(1, h / step)) * 1.6);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function fitFont(ctx, text, font, maxWidth, startSize) {
  let size = startSize;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd166' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

/** Renders the whole cover onto ctx at W×H from the editor state. */
export function renderCover(ctx, W, H, state) {
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const layoutId = state.layout || 'hero3';
  const rects = panelRects(layoutId, W, H);

  // 1 · backdrop: deep violet, plus a sunset sky for the snapshot layout.
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, W, H);
  if (layoutId === 'snapshots') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a0a3a');
    sky.addColorStop(0.55, '#ff5e3a');
    sky.addColorStop(1, '#ffd166');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.78);
    drawRetroSun(ctx, W * 0.72, H * 0.30, H * 0.11, grade);
    if (state.palms) {
      drawPalm(ctx, W * 0.06, H * 0.72, H / 430, 'rgba(20,4,32,0.9)');
      drawPalm(ctx, W * 0.94, H * 0.70, H / 520, 'rgba(20,4,32,0.9)');
    }
  } else if (state.palms) {
    // A small palm cluster peeking over the top edge of the hero panel.
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawPalm(ctx, W * 0.03, H * 0.02, H / 700, '#12081f');
    ctx.restore();
  }

  // 2 · photo layer, graded as one poster print.
  const layer = document.createElement('canvas');
  layer.width = W; layer.height = H;
  const lctx = layer.getContext('2d');
  const photos = state.photos || [];
  const fillAll = state.fillAll && photos[0] && photos[0].img;
  rects.forEach((panel, i) => {
    const photo = fillAll ? photos[0] : photos[state.slots ? state.slots[i] ?? i % Math.max(1, photos.length) : i % Math.max(1, photos.length)];
    drawPhotoInto(lctx, photo, panel, W, H);
  });
  applyGrade(layer, grade);
  ctx.drawImage(layer, 0, 0);

  // 3 · panel frames: white ink borders, thicker on the inset snapshot frames.
  ctx.save();
  ctx.lineJoin = 'round';
  rects.forEach((panel) => {
    const px = panel.x * W, py = panel.y * H, pw = panel.w * W, ph = panel.h * H;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.strokeStyle = layoutId === 'snapshots' ? '#ffffff' : 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
    if (layoutId === 'snapshots') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-pw / 2, ph / 2, pw, Math.max(10, H * 0.018)); // polaroid foot
    }
    ctx.restore();
  });
  ctx.restore();

  // 4 · outer neon frame.
  ctx.strokeStyle = 'rgba(255,209,102,0.9)';
  ctx.lineWidth = Math.max(3, W * 0.005);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);

  // 5 · title block.
  const bandH = H * (layoutId === 'snapshots' ? 0.24 : 0.21);
  const bandY = H - bandH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, 'rgba(16,5,28,0.82)');
  bandGrad.addColorStop(1, 'rgba(16,5,28,0.97)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  if (state.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.20;
    drawHalftone(ctx, W * 0.02, bandY + bandH * 0.62, W * 0.30, bandH * 0.34, '#ffffff');
    ctx.restore();
  }

  const pad = W * 0.04;
  const title = (state.title || 'VICE COAST').toUpperCase();
  const script = state.script || '';
  const subtitle = state.subtitle || '';
  let cursorY = bandY + bandH * 0.30;

  if (script.trim()) {
    const sSize = fitFont(ctx, script, (s) => `${s}px Pacifico, cursive`, W * 0.5, H * 0.038);
    ctx.font = `${sSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff7ad9';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = sSize * 0.7;
    ctx.textAlign = 'left';
    ctx.fillText(script, pad, cursorY);
    ctx.shadowBlur = 0;
    cursorY += bandH * 0.16;
  }
  const tSize = fitFont(ctx, title, (s) => `${s}px Anton, sans-serif`, W - pad * 2, H * 0.115);
  ctx.font = `${tSize}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  const titleGrad = ctx.createLinearGradient(0, cursorY - tSize, 0, cursorY + tSize * 0.2);
  titleGrad.addColorStop(0, '#ffe9a8');
  titleGrad.addColorStop(0.5, '#ff9e4d');
  titleGrad.addColorStop(1, '#ff2e88');
  ctx.lineWidth = Math.max(2, tSize * 0.045);
  ctx.strokeStyle = '#14041f';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, pad, cursorY + tSize * 0.62);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, pad, cursorY + tSize * 0.62);
  cursorY += tSize * 0.78;

  if (subtitle.trim()) {
    const subSize = fitFont(ctx, subtitle.toUpperCase(), (s) => `${s}px "Bebas Neue", sans-serif`, W * 0.62, H * 0.032);
    ctx.font = `${subSize}px "Bebas Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, subSize * 0.12)}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = '#f5eefc';
    ctx.fillText(subtitle.toUpperCase(), pad, cursorY + subSize * 0.5);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }

  // Heat meter: five stars, bottom-right of the title block.
  const starR = Math.max(9, H * 0.016);
  const starY = bandY + bandH * 0.82;
  ctx.font = `${Math.max(11, H * 0.02)}px "Bebas Neue", sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'right';
  ctx.fillText('HEAT', W - pad - starR * 11.4, starY + starR * 0.35);
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, W - pad - starR * (9.4 - i * 2.2), starY, starR, i < (state.heat || 0));
  }

  // 6 · badge ribbon, top-left, tilted.
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.translate(W * 0.02, H * 0.055);
    ctx.rotate(-0.10);
    const bSize = Math.max(14, H * 0.028);
    ctx.font = `${bSize}px "Bebas Neue", sans-serif`;
    const bw = ctx.measureText(badge).width + bSize * 1.7;
    const bh = bSize * 1.7;
    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(bw, 0); ctx.lineTo(bw + bh * 0.4, bh / 2); ctx.lineTo(bw, bh); ctx.lineTo(0, bh); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('★ ' + badge, bSize * 0.55, bh * 0.68);
    ctx.restore();
  }

  // 7 · grain + vignette.
  if (state.grain) {
    const pat = ctx.createPattern(grainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,2,16,0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
}

/** Renders the cover at an exact pixel size and returns the canvas. */
export function exportCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  renderCover(canvas.getContext('2d'), w, h, state);
  return canvas;
}
