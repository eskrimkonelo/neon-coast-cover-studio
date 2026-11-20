// Neon Coast Cover Studio — editor wiring: photo slots, per-panel crop,
// layout / grade / caption controls, undo, and the three-size PNG export.
// Photos are read on this machine with a file input and never uploaded.
import { LAYOUTS, GRADES, SIZES, panelRects, panelAt, renderCover, exportCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const SAMPLES = [
  { file: 'boulevard.jpg', label: 'Boulevard' },
  { file: 'pier.jpg', label: 'Pier' },
  { file: 'neon.jpg', label: 'Neon street' },
  { file: 'convertible.jpg', label: 'Convertible' },
];

const state = {
  layout: 'hero3',
  grade: 'sunset',
  size: 'square',
  title: 'VICE COAST',
  script: 'welcome to the',
  subtitle: 'Neon nights · palm dreams · one last heist',
  badge: 'VICE COAST',
  heat: 4,
  grain: true,
  vignette: true,
  halftone: true,
  palms: true,
  fillAll: false,
  photos: [null, null, null, null],
  slots: [0, 1, 2, 3],
  selectedPanel: 0,
};

let undoStack = [];
let redoStack = [];
let fontsReady = false;

function snapshotState() {
  return JSON.stringify({ ...state, photos: state.photos.map((p) => (p ? { zoom: p.zoom, ox: p.ox, oy: p.oy, name: p.name } : null)) });
}
function pushUndo() {
  undoStack.push(snapshotState());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
}
function restoreSnapshot(json) {
  const saved = JSON.parse(json);
  const oldPhotos = state.photos;
  Object.assign(state, saved);
  state.photos = saved.photos.map((p, i) => (p && oldPhotos[i] ? { ...oldPhotos[i], ...p } : oldPhotos[i]));
  syncControls();
  redraw();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  restoreSnapshot(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadFonts() {
  try {
    await Promise.all([
      new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')").load(),
      new FontFace('Bebas Neue', "url('./fonts/BebasNeue-Regular.ttf')").load(),
      new FontFace('Pacifico', "url('./fonts/Pacifico-Regular.ttf')").load(),
    ].map(async (p) => { const f = await p; document.fonts.add(f); }));
    await document.fonts.ready;
    fontsReady = true;
  } catch (e) {
    fontsReady = false; // fall back to system sans-serif lettering
  }
}

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function redraw() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  renderCover(ctx, w, h, state);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function downloadCanvas(c, filename) {
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportOne() {
  const { w, h } = currentSize();
  await downloadCanvas(exportCover(state, w, h), `neon-coast-${w}x${h}.png`);
  setStatus(`Saved neon-coast-${w}x${h}.png`);
}

async function exportAll() {
  const names = [];
  for (const key of ['square', 'portrait', 'wide']) {
    const { w, h } = SIZES[key];
    await downloadCanvas(exportCover(state, w, h), `neon-coast-${w}x${h}.png`);
    names.push(`${w}x${h}`);
  }
  setStatus(`Saved all three: ${names.join(', ')} — share them anywhere.`);
}

// ---- photo slots -----------------------------------------------------------
const slotsEl = document.getElementById('photoSlots');
state.photos.forEach((_, i) => {
  const box = document.createElement('div');
  box.className = 'photo-slot';
  box.id = `slot${i}`;
  box.innerHTML = `<span>Photo ${i + 1} — tap to add</span><input type="file" accept="image/*" aria-label="Photo ${i + 1}">`;
  box.querySelector('input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pushUndo();
    state.photos[i] = { img: await loadImage(URL.createObjectURL(file)), name: file.name, zoom: 1, ox: 0, oy: 0 };
    box.classList.add('filled');
    box.querySelector('span').textContent = file.name.length > 22 ? file.name.slice(0, 21) + '…' : file.name;
    const img = document.createElement('img');
    img.src = state.photos[i].img.src;
    box.prepend(img);
    redraw();
    setStatus(`Photo ${i + 1} loaded — click a panel, drag to crop it.`);
  });
  slotsEl.appendChild(box);
});

async function loadSample(file, slot) {
  const img = await loadImage(`samples/${file}`);
  state.photos[slot] = { img, name: file, zoom: 1, ox: 0, oy: 0 };
  const box = document.getElementById(`slot${slot}`);
  box.classList.add('filled');
  box.querySelector('span').textContent = file;
  if (!box.querySelector('img')) {
    const thumb = document.createElement('img');
    thumb.src = `samples/${file}`;
    box.prepend(thumb);
  } else {
    box.querySelector('img').src = `samples/${file}`;
  }
}

const sampleRow = document.getElementById('sampleRow');
SAMPLES.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = `Sample: ${s.label}`;
  b.addEventListener('click', async () => {
    pushUndo();
    await loadSample(s.file, i % 4);
    redraw();
    setStatus(`Sample “${s.label}” loaded into photo slot ${i % 4 + 1}.`);
  });
  sampleRow.appendChild(b);
});

// ---- layout + grade pickers ------------------------------------------------
const layoutGrid = document.getElementById('layoutGrid');
LAYOUTS.forEach((l) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.id = l.id;
  b.innerHTML = `${l.name}<small>${l.desc}</small>`;
  b.addEventListener('click', () => {
    pushUndo();
    state.layout = l.id;
    state.selectedPanel = 0;
    syncControls();
    redraw();
  });
  layoutGrid.appendChild(b);
});

const gradeGrid = document.getElementById('gradeGrid');
GRADES.forEach((g) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.id = g.id;
  b.innerHTML = `<span class="swatch" style="background:${g.css}"></span>${g.name}`;
  b.addEventListener('click', () => {
    pushUndo();
    state.grade = g.id;
    syncControls();
    redraw();
  });
  gradeGrid.appendChild(b);
});

// ---- caption + toggles ------------------------------------------------------
function bindText(id, key) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { state[key] = el.value; redraw(); });
  el.addEventListener('change', () => pushUndo());
}
bindText('titleInput', 'title');
bindText('scriptInput', 'script');
bindText('subtitleInput', 'subtitle');
bindText('badgeInput', 'badge');

document.getElementById('heatRange').addEventListener('input', (e) => {
  state.heat = Number(e.target.value);
  document.getElementById('heatLabel').textContent = `${state.heat} of 5 stars`;
  redraw();
});
document.getElementById('heatRange').addEventListener('change', () => pushUndo());

function bindToggle(id, key) {
  document.getElementById(id).addEventListener('change', (e) => {
    pushUndo();
    state[key] = e.target.checked;
    redraw();
  });
}
bindToggle('grainToggle', 'grain');
bindToggle('vignetteToggle', 'vignette');
bindToggle('halftoneToggle', 'halftone');
bindToggle('palmsToggle', 'palms');

document.getElementById('fillAll').addEventListener('change', (e) => {
  pushUndo();
  state.fillAll = e.target.checked;
  redraw();
});

document.querySelectorAll('input[name=size]').forEach((r) => {
  r.addEventListener('change', () => {
    pushUndo();
    state.size = r.value;
    redraw();
  });
});

// ---- per-panel crop controls -----------------------------------------------
const panelPhotoSel = document.getElementById('panelPhoto');
function refreshPanelSelect() {
  panelPhotoSel.innerHTML = '';
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `Photo ${i + 1}${p ? ' — ' + p.name.slice(0, 18) : ' (empty)'}`;
    panelPhotoSel.appendChild(o);
  });
  const rects = panelRects(state.layout, 1, 1);
  const slot = state.slots[state.selectedPanel] ?? state.selectedPanel % 4;
  panelPhotoSel.value = String(slot);
  document.getElementById('panelName').textContent = `${state.selectedPanel + 1} of ${rects.length}`;
  const photo = state.photos[slot];
  document.getElementById('zoomRange').value = photo ? photo.zoom : 1;
  document.getElementById('oxRange').value = photo ? photo.ox : 0;
  document.getElementById('oyRange').value = photo ? photo.oy : 0;
}
panelPhotoSel.addEventListener('change', () => {
  pushUndo();
  state.slots[state.selectedPanel] = Number(panelPhotoSel.value);
  redraw();
});
function bindCrop(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    const slot = state.slots[state.selectedPanel] ?? 0;
    const photo = state.photos[slot];
    if (!photo) return;
    photo[key] = Number(e.target.value);
    redraw();
  });
  document.getElementById(id).addEventListener('change', () => pushUndo());
}
bindCrop('zoomRange', 'zoom');
bindCrop('oxRange', 'ox');
bindCrop('oyRange', 'oy');

// ---- canvas pointer: pick a panel, drag to pan, wheel to zoom --------------
let dragging = false;
let lastX = 0, lastY = 0;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (idx < 0) return;
  state.selectedPanel = idx;
  refreshPanelSelect();
  dragging = true;
  lastX = p.x; lastY = p.y;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const slot = state.slots[state.selectedPanel] ?? 0;
  const photo = state.photos[slot];
  if (!photo) return;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const r = rects[state.selectedPanel];
  photo.ox += (p.x - lastX) / (r.w * canvas.width);
  photo.oy += (p.y - lastY) / (r.h * canvas.height);
  photo.ox = Math.max(-0.6, Math.min(0.6, photo.ox));
  photo.oy = Math.max(-0.6, Math.min(0.6, photo.oy));
  lastX = p.x; lastY = p.y;
  document.getElementById('oxRange').value = photo.ox;
  document.getElementById('oyRange').value = photo.oy;
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) pushUndo(); dragging = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.slots[state.selectedPanel] ?? 0;
  const photo = state.photos[slot];
  if (!photo) return;
  photo.zoom = Math.max(1, Math.min(3, photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  document.getElementById('zoomRange').value = photo.zoom;
  redraw();
}, { passive: false });

// ---- buttons ----------------------------------------------------------------
document.getElementById('exportOne').addEventListener('click', exportOne);
document.getElementById('exportAll').addEventListener('click', exportAll);
document.getElementById('exportAll2').addEventListener('click', exportAll);
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

function syncControls() {
  document.querySelectorAll('#layoutGrid button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
  document.querySelectorAll('#gradeGrid button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.grade));
  document.getElementById('titleInput').value = state.title;
  document.getElementById('scriptInput').value = state.script;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('heatRange').value = state.heat;
  document.getElementById('heatLabel').textContent = `${state.heat} of 5 stars`;
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('halftoneToggle').checked = state.halftone;
  document.getElementById('palmsToggle').checked = state.palms;
  document.getElementById('fillAll').checked = state.fillAll;
  document.querySelector(`input[name=size][value="${state.size}"]`).checked = true;
  refreshPanelSelect();
}

// ---- boot -------------------------------------------------------------------
const shot = new URLSearchParams(location.search).get('shot');
async function boot() {
  await loadFonts();
  syncControls();
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, { loadImage, loadSample, redraw, syncControls, exportCover, setStatus });
  } else {
    await loadSample('boulevard.jpg', 0);
    await loadSample('pier.jpg', 1);
    redraw();
  }
}
boot();
