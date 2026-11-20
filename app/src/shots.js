// Fixed scenes for screenshots: each ?shot= value stages one exact scene and
// sets window.__shotReady once it is painted, so headless Chrome can capture it.
// cover  — the best exported cover, full frame (first screenshot, landscape).
// editor — the editor with photos loaded, ready to crop and caption.
// cover2 — a second cover: portrait, another layout and grade.
// sizes  — the three exported post sizes side by side.
// exportcheck — renders all three export sizes and records their PNG bytes.
import { SIZES } from './cover.js';

async function loadAllSamples(state, helpers) {
  const files = ['boulevard.jpg', 'pier.jpg', 'neon.jpg', 'convertible.jpg'];
  for (let i = 0; i < files.length; i++) await helpers.loadSample(files[i], i);
  // Give each panel a slightly different crop so the panels read as four shots.
  const crops = [
    { zoom: 1.15, ox: -0.05, oy: 0.02 },
    { zoom: 1.08, ox: 0.02, oy: 0 },
    { zoom: 1.1, ox: 0, oy: 0.04 },
    { zoom: 1.2, ox: -0.03, oy: 0 },
  ];
  state.photos.forEach((p, i) => { if (p) Object.assign(p, crops[i]); });
  state.slots = [0, 1, 2, 3];
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, state, helpers) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await loadAllSamples(state, helpers);
    state.layout = 'hero3';
    state.grade = 'sunset';
    state.size = 'wide';
    state.title = 'VICE COAST';
    state.script = 'welcome to the';
    state.subtitle = 'Neon nights · palm dreams · one last heist';
    state.badge = 'VICE COAST';
    state.heat = 5;
    helpers.syncControls();
    helpers.redraw();
    markReady();
    return;
  }

  if (shot === 'editor') {
    await loadAllSamples(state, helpers);
    state.layout = 'grid9';
    state.grade = 'neon';
    state.size = 'square';
    state.title = 'NEON SHORE';
    state.script = 'tonight we ride';
    state.subtitle = 'Nine panels · four photos · one story';
    state.badge = 'NEON SHORE';
    state.heat = 4;
    state.selectedPanel = 4;
    helpers.syncControls();
    helpers.redraw();
    helpers.setStatus('Photo loaded — click a panel, drag to crop it, then export all 3 sizes.');
    markReady();
    return;
  }

  if (shot === 'cover2') {
    document.body.classList.add('shot-cover');
    await loadAllSamples(state, helpers);
    state.layout = 'snapshots';
    state.grade = 'neon';
    state.size = 'portrait';
    state.title = 'NIGHT SHIFT';
    state.script = 'after dark in';
    state.subtitle = 'Vice City stories · vol. 6';
    state.badge = 'NIGHT SHIFT';
    state.heat = 4;
    helpers.syncControls();
    helpers.redraw();
    markReady();
    return;
  }

  if (shot === 'sizes') {
    document.body.classList.add('shot-sizes');
    await loadAllSamples(state, helpers);
    state.layout = 'slash';
    state.grade = 'gold';
    state.title = 'PALM GOLD';
    state.script = 'golden hour in';
    state.subtitle = 'Three sizes · one click · every feed';
    state.badge = 'PALM GOLD';
    state.heat = 5;
    const strip = document.getElementById('shotStrip');
    strip.hidden = false;
    for (const key of ['square', 'portrait', 'wide']) {
      const { w, h, label } = SIZES[key];
      const fig = document.createElement('figure');
      const c = helpers.exportCover(state, w, h);
      const scale = Math.min(1, 560 / Math.max(w, h));
      c.style.width = `${Math.round(w * scale * (key === 'wide' ? 0.9 : 0.62))}px`;
      c.style.height = 'auto';
      const cap = document.createElement('figcaption');
      cap.textContent = label;
      fig.appendChild(c);
      fig.appendChild(cap);
      strip.appendChild(fig);
    }
    markReady();
    return;
  }

  if (shot === 'exportcheck') {
    await loadAllSamples(state, helpers);
    state.layout = 'hero3';
    state.grade = 'sunset';
    const results = [];
    for (const key of ['square', 'portrait', 'wide']) {
      const { w, h } = SIZES[key];
      const c = helpers.exportCover(state, w, h);
      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      const buf = new Uint8Array(await blob.arrayBuffer());
      const magic = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const pw = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
      const ph = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
      results.push({ key, w: pw, h: ph, bytes: buf.length, pngMagic: magic });
    }
    window.__exports = results;
    document.title = `EXPORTCHECK ${results.map((r) => `${r.key}:${r.w}x${r.h}:${r.pngMagic}`).join(' ')}`;
    helpers.redraw();
    markReady();
    return;
  }

  // Unknown scene: plain editor with samples.
  await loadAllSamples(state, helpers);
  helpers.syncControls();
  helpers.redraw();
  markReady();
}
