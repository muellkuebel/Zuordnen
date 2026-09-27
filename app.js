/**
 * Zuordnen — finger-draw matching for iPad (kids)
 * Primary interaction: paint a visible line from source → target.
 * Correct = green line + Haken; wrong = shake + line vanishes.
 */
(function () {
  'use strict';

  const COLORS = {
    green: '#52B788',
    red: '#E63946',
    yellow: '#FFD60A',
    orange: '#FF8C42',
    teal: '#2EC4B6',
    pink: '#FF6B9D',
    blue: '#4361EE',
    brown: '#8B5E3C',
  };

  /* —— SVG motifs (original, simple) —— */
  function candySvg(color) {
    return `
      <svg viewBox="0 0 80 48" aria-hidden="true">
        <polygon points="4,24 16,10 16,38" fill="${color}"/>
        <ellipse cx="40" cy="24" rx="24" ry="16" fill="${color}"/>
        <polygon points="76,24 64,10 64,38" fill="${color}"/>
        <ellipse cx="32" cy="18" rx="8" ry="5" fill="#fff" opacity=".35"/>
        <path d="M28 24 Q40 30 52 24" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
      </svg>`;
  }

  function basketSvg(labelColor) {
    return `
      <svg viewBox="0 0 100 90" aria-hidden="true">
        <path d="M28 28 Q50 8 72 28" fill="none" stroke="${COLORS.brown}" stroke-width="5" stroke-linecap="round"/>
        <path d="M12 38 Q14 78 50 82 Q86 78 88 38 Z" fill="#C4A574" stroke="${COLORS.brown}" stroke-width="3"/>
        <path d="M20 48 H80 M22 58 H78 M26 68 H74" stroke="${COLORS.brown}" stroke-width="2" opacity=".45"/>
        <g transform="translate(50,52) scale(0.55)">
          <polygon points="-28,0 -18,-10 -18,10" fill="${labelColor}"/>
          <ellipse cx="0" cy="0" rx="18" ry="12" fill="${labelColor}"/>
          <polygon points="28,0 18,-10 18,10" fill="${labelColor}"/>
        </g>
      </svg>`;
  }

  function hatSvg(body, accent) {
    return `
      <svg viewBox="0 0 70 78" aria-hidden="true">
        <circle cx="35" cy="12" r="10" fill="${accent}"/>
        <ellipse cx="35" cy="38" rx="22" ry="26" fill="${body}"/>
        <rect x="8" y="52" width="54" height="16" rx="6" fill="${accent}"/>
        <path d="M12 56 H58 M12 60 H58 M12 64 H58" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
        <ellipse cx="28" cy="30" rx="6" ry="4" fill="#fff" opacity=".25"/>
      </svg>`;
  }

  function snowmanSvg(c1, c2) {
    return `
      <svg viewBox="0 0 90 110" aria-hidden="true">
        <circle cx="45" cy="78" r="26" fill="#F5F7FA" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="45" cy="42" r="18" fill="#F5F7FA" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="18" y1="70" x2="4" y2="58" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
        <line x1="72" y1="70" x2="86" y2="58" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
        <!-- striped scarf -->
        <path d="M28 52 Q45 62 62 52" fill="none" stroke="${c1}" stroke-width="7" stroke-linecap="round"/>
        <path d="M55 54 Q62 72 58 88" fill="none" stroke="${c2}" stroke-width="6" stroke-linecap="round"/>
        <path d="M58 62 Q64 78 68 90" fill="none" stroke="${c1}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="38" cy="40" r="2.2" fill="#222"/>
        <circle cx="52" cy="40" r="2.2" fill="#222"/>
        <path d="M45 43 L56 46 L45 49 Z" fill="${COLORS.orange}"/>
        <circle cx="40" cy="72" r="2.5" fill="#222"/>
        <circle cx="45" cy="80" r="2.5" fill="#222"/>
        <circle cx="50" cy="72" r="2.5" fill="#222"/>
      </svg>`;
  }

  /* —— Exercise definitions —— */
  const EXERCISES = {
    bonbons: {
      title: 'Bunte Bonbons',
      hint: 'Verbinde jedes Bonbon mit dem passenden Korb!',
      mode: 'many-to-one',
      sources: [
        { id: 'c1', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.18, y: 0.14, w: 0.14 },
        { id: 'c2', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.42, y: 0.12, w: 0.14 },
        { id: 'c3', match: 'yellow', svg: () => candySvg(COLORS.yellow), x: 0.68, y: 0.15, w: 0.14 },
        { id: 'c4', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.28, y: 0.32, w: 0.14 },
        { id: 'c5', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.55, y: 0.30, w: 0.14 },
        { id: 'c6', match: 'yellow', svg: () => candySvg(COLORS.yellow), x: 0.82, y: 0.34, w: 0.14 },
        { id: 'c7', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.14, y: 0.48, w: 0.14 },
        { id: 'c8', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.40, y: 0.50, w: 0.14 },
      ],
      targets: [
        { id: 'green',  match: 'green',  svg: () => basketSvg(COLORS.green),  x: 0.20, y: 0.82, w: 0.22 },
        { id: 'red',    match: 'red',    svg: () => basketSvg(COLORS.red),    x: 0.50, y: 0.82, w: 0.22 },
        { id: 'yellow', match: 'yellow', svg: () => basketSvg(COLORS.yellow), x: 0.80, y: 0.82, w: 0.22 },
      ],
    },
    schneemaenner: {
      title: 'Schneemänner',
      hint: 'Welche Mütze gehört zu welchem Schneemann? Verbinde!',
      mode: 'one-to-one',
      sources: [
        { id: 'h1', match: 'ry', svg: () => hatSvg(COLORS.red, COLORS.yellow),  x: 0.18, y: 0.16, w: 0.15 },
        { id: 'h2', match: 'yo', svg: () => hatSvg(COLORS.yellow, COLORS.orange), x: 0.18, y: 0.39, w: 0.15 },
        { id: 'h3', match: 'tp', svg: () => hatSvg(COLORS.teal, COLORS.pink),   x: 0.18, y: 0.62, w: 0.15 },
        { id: 'h4', match: 'bg', svg: () => hatSvg(COLORS.blue, COLORS.green),  x: 0.18, y: 0.85, w: 0.15 },
      ],
      targets: [
        /* shuffled order so not aligned 1:1 visually */
        { id: 't_tp', match: 'tp', svg: () => snowmanSvg(COLORS.teal, COLORS.pink),   x: 0.78, y: 0.16, w: 0.18 },
        { id: 't_bg', match: 'bg', svg: () => snowmanSvg(COLORS.blue, COLORS.green),  x: 0.78, y: 0.39, w: 0.18 },
        { id: 't_ry', match: 'ry', svg: () => snowmanSvg(COLORS.red, COLORS.yellow),  x: 0.78, y: 0.62, w: 0.18 },
        { id: 't_yo', match: 'yo', svg: () => snowmanSvg(COLORS.yellow, COLORS.orange), x: 0.78, y: 0.85, w: 0.18 },
      ],
    },
  };

  /* —— DOM —— */
  const screenHome = document.getElementById('screen-home');
  const screenPlay = document.getElementById('screen-play');
  const stageWrap = document.getElementById('stage-wrap');
  const stage = document.getElementById('stage');
  const board = document.getElementById('board');
  const linesSvg = document.getElementById('lines');
  const drawSvg = document.getElementById('draw-line');
  const playTitle = document.getElementById('play-title');
  const hintEl = document.getElementById('hint');
  const celebrate = document.getElementById('celebrate');
  const btnBack = document.getElementById('btn-back');
  const btnAgain = document.getElementById('btn-again');
  const celebrateAgain = document.getElementById('celebrate-again');
  const celebrateHome = document.getElementById('celebrate-home');

  let currentId = null;
  let exercise = null;
  let matched = new Set(); // source ids that are correctly matched
  let connections = []; // { fromId, toId, pathEl }
  let itemEls = new Map(); // id -> element
  let itemMeta = new Map(); // id -> { kind, match, x, y, w }

  /* Drawing state */
  let drawing = false;
  let drawFromId = null;
  let livePath = null;
  let points = [];
  let activePointerId = null;

  function showScreen(which) {
    const home = which === 'home';
    screenHome.classList.toggle('active', home);
    screenHome.hidden = !home;
    screenPlay.classList.toggle('active', !home);
    screenPlay.hidden = home;
    if (home) hideCelebrate();
  }

  function hideCelebrate() {
    celebrate.hidden = true;
  }

  function showCelebrate() {
    celebrate.hidden = false;
  }

  /* —— Layout (always upright portrait) —— */
  const portraitShell = document.getElementById('portrait-shell');
  const PORTRAIT_ASPECT = 3 / 4; /* width / height */

  function sizePortraitShell() {
    if (!portraitShell) return;
    const appEl = document.getElementById('app');
    const r = appEl.getBoundingClientRect();
    const availW = Math.max(120, r.width);
    const availH = Math.max(160, r.height);
    /* Fit largest 3:4 portrait rect inside viewport (pillarbox/letterbox) */
    let w = availW;
    let h = w / PORTRAIT_ASPECT;
    if (h > availH) {
      h = availH;
      w = h * PORTRAIT_ASPECT;
    }
    portraitShell.style.width = Math.floor(w) + 'px';
    portraitShell.style.height = Math.floor(h) + 'px';
  }

  function sizeStage() {
    sizePortraitShell();
    const rect = stageWrap.getBoundingClientRect();
    const pad = 4;
    const availW = Math.max(80, rect.width - pad);
    const availH = Math.max(80, rect.height - pad);
    /* Fill play area; keep slightly portrait if space is wide */
    let w = availW;
    let h = availH;
    if (w / h > 0.95) {
      /* don't go landscape-wide on the board */
      w = h * 0.92;
    }
    if (w > availW) w = availW;
    if (h > availH) h = availH;
    stage.style.width = Math.floor(w) + 'px';
    stage.style.height = Math.floor(h) + 'px';
    repositionItems();
    redrawConnections();
  }

  function tryLockPortrait() {
    try {
      const o = screen.orientation || screen.mozOrientation;
      if (o && typeof o.lock === 'function') {
        o.lock('portrait').catch(() => {});
      }
    } catch (_) {}
  }

  function stageSize() {
    return {
      w: stage.clientWidth || 1,
      h: stage.clientHeight || 1,
    };
  }

  function repositionItems() {
    const { w, h } = stageSize();
    itemMeta.forEach((meta, id) => {
      const el = itemEls.get(id);
      if (!el) return;
      const size = meta.w * Math.min(w, h);
      el.style.width = size + 'px';
      el.style.height = size * (meta.kind === 'basket' ? 0.9 : meta.kind === 'snowman' ? 1.15 : meta.kind === 'hat' ? 1.05 : 0.65) + 'px';
      el.style.left = meta.x * w + 'px';
      el.style.top = meta.y * h + 'px';
    });
  }

  function centerOf(el) {
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - sr.left,
      y: r.top + r.height / 2 - sr.top,
    };
  }

  function pointInEl(clientX, clientY, el) {
    const r = el.getBoundingClientRect();
    /* generous hit padding for kids */
    const pad = 12;
    return (
      clientX >= r.left - pad &&
      clientX <= r.right + pad &&
      clientY >= r.top - pad &&
      clientY <= r.bottom + pad
    );
  }

  /* —— Build board —— */
  function clearBoard() {
    board.innerHTML = '';
    linesSvg.innerHTML = '';
    drawSvg.innerHTML = '';
    matched.clear();
    connections = [];
    itemEls.clear();
    itemMeta.clear();
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
  }

  function makeItem(def, kind) {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = def.id;
    el.dataset.kind = kind;
    el.dataset.match = def.match;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', kind === 'source' ? 'Objekt' : 'Ziel');
    el.innerHTML = def.svg() + '<span class="check-badge" aria-hidden="true">✓</span>';
    board.appendChild(el);
    itemEls.set(def.id, el);
    itemMeta.set(def.id, {
      kind: kind === 'source'
        ? (currentId === 'bonbons' ? 'candy' : 'hat')
        : (currentId === 'bonbons' ? 'basket' : 'snowman'),
      match: def.match,
      x: def.x,
      y: def.y,
      w: def.w,
      role: kind,
    });
    return el;
  }

  function startExercise(id) {
    currentId = id;
    exercise = EXERCISES[id];
    if (!exercise) return;
    clearBoard();
    hideCelebrate();
    playTitle.textContent = exercise.title;
    hintEl.textContent = exercise.hint;
    exercise.sources.forEach((s) => makeItem(s, 'source'));
    exercise.targets.forEach((t) => makeItem(t, 'target'));
    showScreen('play');
    requestAnimationFrame(() => {
      sizeStage();
      requestAnimationFrame(sizeStage);
    });
  }

  function allDone() {
    if (!exercise) return false;
    return matched.size >= exercise.sources.length;
  }

  function isSourceMatched(id) {
    return matched.has(id);
  }

  function targetTaken(targetId) {
    if (!exercise || exercise.mode !== 'one-to-one') return false;
    return connections.some((c) => c.toId === targetId);
  }

  /* —— Line drawing —— */
  function pathFromPoints(pts) {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  function simplify(pts, minDist) {
    if (pts.length < 2) return pts.slice();
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const prev = out[out.length - 1];
      const dx = pts[i].x - prev.x;
      const dy = pts[i].y - prev.y;
      if (dx * dx + dy * dy >= minDist * minDist) out.push(pts[i]);
    }
    const last = pts[pts.length - 1];
    const prev = out[out.length - 1];
    if (prev.x !== last.x || prev.y !== last.y) out.push(last);
    return out;
  }

  function findItemAt(clientX, clientY, predicate) {
    /* Prefer closest center within padded hit box — more reliable for kids */
    let best = null;
    let bestDist = Infinity;
    itemEls.forEach((el, id) => {
      const meta = itemMeta.get(id);
      if (!meta) return;
      if (predicate && !predicate(id, meta, el)) return;
      if (!pointInEl(clientX, clientY, el)) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = { id, el, meta };
      }
    });
    return best;
  }

  function stagePoint(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function beginDraw(pointerId, clientX, clientY) {
    const hit = findItemAt(clientX, clientY, (id, meta) => {
      return meta.role === 'source' && !isSourceMatched(id);
    });
    if (!hit) return false;

    drawing = true;
    activePointerId = pointerId;
    drawFromId = hit.id;
    hit.el.classList.add('drawing');

    const start = centerOf(hit.el);
    const cur = stagePoint(clientX, clientY);
    points = [start, cur];

    drawSvg.innerHTML = '';
    livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    livePath.setAttribute('class', 'live-line');
    livePath.setAttribute('d', pathFromPoints(points));
    drawSvg.appendChild(livePath);
    return true;
  }

  function moveDraw(clientX, clientY) {
    if (!drawing || !livePath) return;
    const cur = stagePoint(clientX, clientY);
    points.push(cur);
    points = simplify(points, 4);
    /* keep start anchored to source center (in case of layout shift) */
    const fromEl = itemEls.get(drawFromId);
    if (fromEl) points[0] = centerOf(fromEl);
    livePath.setAttribute('d', pathFromPoints(points));
  }

  function endDraw(clientX, clientY) {
    if (!drawing) return;
    const fromId = drawFromId;
    const fromEl = itemEls.get(fromId);
    if (fromEl) fromEl.classList.remove('drawing');

    const pts = points.slice();
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
    drawSvg.innerHTML = '';

    if (!fromId || pts.length < 2) return;

    const hit = findItemAt(clientX, clientY, (id, meta) => meta.role === 'target');
    if (!hit) {
      gentleShake(fromEl);
      return;
    }

    tryConnect(fromId, hit.id, pts);
  }

  function cancelDraw() {
    if (!drawing) return;
    const fromEl = itemEls.get(drawFromId);
    if (fromEl) fromEl.classList.remove('drawing');
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
    drawSvg.innerHTML = '';
  }

  function gentleShake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 450);
  }

  function tryConnect(fromId, toId, pts) {
    const fromMeta = itemMeta.get(fromId);
    const toMeta = itemMeta.get(toId);
    const fromEl = itemEls.get(fromId);
    const toEl = itemEls.get(toId);
    if (!fromMeta || !toMeta) return;

    if (isSourceMatched(fromId)) return;
    if (targetTaken(toId)) {
      gentleShake(fromEl);
      gentleShake(toEl);
      return;
    }

    const ok = fromMeta.match === toMeta.match;
    if (!ok) {
      gentleShake(fromEl);
      gentleShake(toEl);
      return;
    }

    /* Snap endpoints to centers for a clean permanent line */
    const a = centerOf(fromEl);
    const b = centerOf(toEl);
    let finalPts = pts.slice();
    if (finalPts.length < 2) finalPts = [a, b];
    finalPts[0] = a;
    finalPts[finalPts.length - 1] = b;
    finalPts = simplify(finalPts, 6);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'conn-line');
    path.setAttribute('d', pathFromPoints(finalPts));
    linesSvg.appendChild(path);

    matched.add(fromId);
    connections.push({ fromId, toId, pathEl: path, pts: finalPts });
    fromEl.classList.add('matched');
    /* For many-to-one, also mark target with a soft check once at least one matched;
       for one-to-one mark the target too. */
    toEl.classList.add('matched');

    if (allDone()) {
      setTimeout(showCelebrate, 350);
    }
  }

  function redrawConnections() {
    connections.forEach((c) => {
      const fromEl = itemEls.get(c.fromId);
      const toEl = itemEls.get(c.toId);
      if (!fromEl || !toEl || !c.pathEl) return;
      const a = centerOf(fromEl);
      const b = centerOf(toEl);
      /* Keep middle freehand shape; only re-anchor ends */
      let pts = (c.pts || [a, b]).slice();
      if (pts.length < 2) pts = [a, b];
      pts[0] = a;
      pts[pts.length - 1] = b;
      c.pts = pts;
      c.pathEl.setAttribute('d', pathFromPoints(pts));
    });
  }

  /* —— Pointer events on stage (capture so we get move/up even off item) —— */
  stage.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    if (drawing) return;
    if (beginDraw(e.pointerId, e.clientX, e.clientY)) {
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drawing || e.pointerId !== activePointerId) return;
    moveDraw(e.clientX, e.clientY);
    e.preventDefault();
  });

  function onPointerUp(e) {
    if (!drawing || e.pointerId !== activePointerId) return;
    endDraw(e.clientX, e.clientY);
    e.preventDefault();
  }

  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', (e) => {
    if (e.pointerId === activePointerId) cancelDraw();
  });

  /* —— Navigation —— */
  document.querySelectorAll('.big-btn[data-exercise]').forEach((btn) => {
    btn.addEventListener('click', () => startExercise(btn.dataset.exercise));
  });

  btnBack.addEventListener('click', () => {
    clearBoard();
    showScreen('home');
  });

  btnAgain.addEventListener('click', () => {
    if (currentId) startExercise(currentId);
  });

  celebrateAgain.addEventListener('click', () => {
    hideCelebrate();
    if (currentId) startExercise(currentId);
  });

  celebrateHome.addEventListener('click', () => {
    hideCelebrate();
    clearBoard();
    showScreen('home');
  });

  /* —— Resize —— */
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeStage, 50);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(sizeStage, 150));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => onResize()).observe(stageWrap);
  }

  /* —— Service worker —— */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=3').catch(() => {});
    });
  }

  tryLockPortrait();
  showScreen('home');
  sizePortraitShell();
})();
