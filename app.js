/**
 * Zuordnen — finger-draw matching for iPad (kids)
 * Primary interaction: paint a visible line from source → target.
 * Correct = green line; drawing/wrong = black line vanishes + shake.
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
    purple: '#9B5DE5',
    sky: '#89C2D9',
    cream: '#FFF3E0',
    navy: '#1B3A4B',
  };

  /* —— Soft "Bing" on correct match (Web Audio, no asset file) —— */
  let audioCtx = null;

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playCorrectBing() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    /* Two soft sine partials — short pleasant chime */
    const notes = [
      { f: 880, g: 0.12, d: 0.18 },
      { f: 1320, g: 0.07, d: 0.22 },
    ];
    notes.forEach(({ f, g, d }, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      const start = t0 + i * 0.02;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(g, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + d + 0.02);
    });
  }

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
    /* Basket body painted in the matching candy hue so kids can match by color */
    return `
      <svg viewBox="0 0 100 90" aria-hidden="true">
        <path d="M28 28 Q50 8 72 28" fill="none" stroke="${labelColor}" stroke-width="6" stroke-linecap="round"/>
        <path d="M12 38 Q14 78 50 82 Q86 78 88 38 Z" fill="${labelColor}" stroke="rgba(0,0,0,.28)" stroke-width="3"/>
        <path d="M20 48 H80 M22 58 H78 M26 68 H74" stroke="rgba(0,0,0,.22)" stroke-width="2"/>
        <ellipse cx="50" cy="40" rx="30" ry="7" fill="rgba(255,255,255,.28)"/>
        <g transform="translate(50,54) scale(0.5)">
          <polygon points="-28,0 -18,-10 -18,10" fill="#fff" opacity=".85"/>
          <ellipse cx="0" cy="0" rx="18" ry="12" fill="#fff" opacity=".85"/>
          <polygon points="28,0 18,-10 18,10" fill="#fff" opacity=".85"/>
          <ellipse cx="-4" cy="-4" rx="6" ry="4" fill="${labelColor}" opacity=".55"/>
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

  /* Farm animals */
  function cowSvg() {
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <ellipse cx="45" cy="48" rx="28" ry="20" fill="#F5F5F5" stroke="#94A3B8" stroke-width="2"/>
        <ellipse cx="32" cy="42" rx="7" ry="6" fill="#334155"/>
        <ellipse cx="55" cy="52" rx="6" ry="5" fill="#334155"/>
        <ellipse cx="68" cy="40" rx="5" ry="4" fill="#334155"/>
        <circle cx="22" cy="38" r="14" fill="#F5F5F5" stroke="#94A3B8" stroke-width="2"/>
        <ellipse cx="12" cy="36" rx="5" ry="3.5" fill="#FFB4A2"/>
        <circle cx="18" cy="34" r="2" fill="#222"/>
        <circle cx="26" cy="34" r="2" fill="#222"/>
        <path d="M14 28 L10 18 M18 26 L20 16" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
        <rect x="30" y="64" width="6" height="12" rx="2" fill="#64748B"/>
        <rect x="54" y="64" width="6" height="12" rx="2" fill="#64748B"/>
      </svg>`;
  }

  function pigSvg() {
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <ellipse cx="48" cy="48" rx="26" ry="18" fill="#FFB4A2"/>
        <circle cx="24" cy="42" r="14" fill="#FFB4A2"/>
        <ellipse cx="14" cy="44" rx="7" ry="5" fill="#E8897A"/>
        <circle cx="12" cy="43" r="1.5" fill="#944"/>
        <circle cx="16" cy="43" r="1.5" fill="#944"/>
        <circle cx="20" cy="38" r="2" fill="#222"/>
        <circle cx="28" cy="38" r="2" fill="#222"/>
        <ellipse cx="22" cy="28" rx="4" ry="6" fill="#FFB4A2"/>
        <ellipse cx="32" cy="28" rx="4" ry="6" fill="#FFB4A2"/>
        <path d="M72 48 Q82 42 78 56" fill="none" stroke="#E8897A" stroke-width="4" stroke-linecap="round"/>
        <rect x="34" y="62" width="6" height="12" rx="2" fill="#E8897A"/>
        <rect x="52" y="62" width="6" height="12" rx="2" fill="#E8897A"/>
      </svg>`;
  }

  function chickenSvg() {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <ellipse cx="42" cy="48" rx="22" ry="18" fill="#FFF8E7" stroke="#E2C97E" stroke-width="2"/>
        <circle cx="28" cy="36" r="12" fill="#FFF8E7" stroke="#E2C97E" stroke-width="2"/>
        <polygon points="16,36 6,34 16,40" fill="#FF8C42"/>
        <circle cx="24" cy="34" r="2.2" fill="#222"/>
        <path d="M26 22 Q30 12 34 22 Q38 12 42 24" fill="#E63946"/>
        <path d="M58 42 Q72 36 68 52 Q60 56 58 48" fill="#FF8C42"/>
        <line x1="36" y1="64" x2="32" y2="76" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
        <line x1="46" y1="64" x2="50" y2="76" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
  }

  function horseSvg() {
    return `
      <svg viewBox="0 0 100 90" aria-hidden="true">
        <ellipse cx="55" cy="55" rx="26" ry="18" fill="#C4A574"/>
        <path d="M32 48 L22 22 L18 14 Q14 10 20 12 L28 28 L40 46" fill="#C4A574"/>
        <ellipse cx="16" cy="14" rx="9" ry="6" fill="#A67C52"/>
        <circle cx="12" cy="12" r="2" fill="#222"/>
        <path d="M24 8 Q30 -2 36 12 Q28 10 24 8" fill="#5C4033"/>
        <path d="M20 6 L16 0 M26 4 L28 -2" stroke="#5C4033" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M78 52 Q94 42 90 68 Q80 70 78 58" fill="#5C4033"/>
        <rect x="42" y="68" width="6" height="16" rx="2" fill="#8B6914"/>
        <rect x="60" y="68" width="6" height="16" rx="2" fill="#8B6914"/>
        <circle cx="48" cy="52" r="3" fill="#8B5E3C"/>
        <circle cx="58" cy="56" r="3" fill="#8B5E3C"/>
      </svg>`;
  }

  function barnAnimalIcon(kind) {
    /* Larger animal figure visible in the doorway */
    const wrap = (inner) => `<g transform="translate(45,66) scale(0.72)">${inner}</g>`;
    if (kind === 'cow') {
      return wrap(`
        <ellipse cx="2" cy="4" rx="16" ry="11" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1"/>
        <circle cx="-12" cy="-2" r="8" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1"/>
        <ellipse cx="-18" cy="-1" rx="3.5" ry="2.5" fill="#FFB4A2"/>
        <ellipse cx="-4" cy="0" rx="4" ry="3" fill="#334155"/>
        <circle cx="-14" cy="-4" r="1.2" fill="#222"/>
      `);
    }
    if (kind === 'pig') {
      return wrap(`
        <ellipse cx="2" cy="4" rx="15" ry="10" fill="#FFB4A2"/>
        <circle cx="-12" cy="0" r="8" fill="#FFB4A2"/>
        <ellipse cx="-18" cy="1" rx="4" ry="3" fill="#E8897A"/>
        <circle cx="-20" cy="0" r="1" fill="#944"/>
        <circle cx="-16" cy="0" r="1" fill="#944"/>
        <circle cx="-14" cy="-3" r="1.2" fill="#222"/>
      `);
    }
    if (kind === 'chicken') {
      return wrap(`
        <ellipse cx="2" cy="4" rx="13" ry="10" fill="#FFF8E7" stroke="#E2C97E" stroke-width="1"/>
        <circle cx="-8" cy="-2" r="7" fill="#FFF8E7" stroke="#E2C97E" stroke-width="1"/>
        <polygon points="-14,-2 -22,-4 -14,2" fill="#FF8C42"/>
        <path d="M-8,-10 Q-4,-16 0,-8" fill="#E63946"/>
        <circle cx="-10" cy="-3" r="1.2" fill="#222"/>
      `);
    }
    return wrap(`
      <ellipse cx="4" cy="4" rx="14" ry="9" fill="#C4A574"/>
      <path d="M-8,0 L-18,-12 L-16,-16 Q-12,-18 -10,-14 L0,0" fill="#C4A574"/>
      <ellipse cx="-18" cy="-14" rx="5" ry="3.5" fill="#A67C52"/>
      <path d="M-12,-18 Q-6,-26 0,-14" fill="#5C4033"/>
      <circle cx="-20" cy="-15" r="1.1" fill="#222"/>
    `);
  }

  function barnSvg(accent, animal) {
    return `
      <svg viewBox="0 0 90 90" aria-hidden="true">
        <polygon points="8,40 45,8 82,40" fill="${accent}"/>
        <rect x="14" y="40" width="62" height="42" fill="#F5E6D3" stroke="#8B5E3C" stroke-width="2"/>
        <rect x="30" y="50" width="30" height="32" rx="2" fill="#FFF8F0" stroke="#8B5E3C" stroke-width="2"/>
        ${barnAnimalIcon(animal)}
      </svg>`;
  }

  /* Shapes */
  function shapeCircle(fill, stroke) {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="30" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="3"/>
        <ellipse cx="30" cy="30" rx="10" ry="7" fill="#fff" opacity=".3"/>
      </svg>`;
  }

  function shapeTriangle(fill, stroke) {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <polygon points="40,10 70,68 10,68" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="40,22 55,55 25,55" fill="#fff" opacity=".2"/>
      </svg>`;
  }

  function shapeStar(fill, stroke) {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <polygon points="40,6 48,30 74,30 53,46 61,70 40,54 19,70 27,46 6,30 32,30"
          fill="${fill}" stroke="${stroke || 'none'}" stroke-width="2" stroke-linejoin="round"/>
      </svg>`;
  }

  function shapeSquare(fill, stroke) {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <rect x="12" y="12" width="56" height="56" rx="6" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="3"/>
        <rect x="20" y="20" width="20" height="14" rx="3" fill="#fff" opacity=".25"/>
      </svg>`;
  }

  function shapeSlot(kind) {
    const stroke = '#94A3B8';
    const fill = '#F1F5F9';
    if (kind === 'circle') return shapeCircle(fill, stroke);
    if (kind === 'triangle') return shapeTriangle(fill, stroke);
    if (kind === 'star') return shapeStar(fill, stroke);
    return shapeSquare(fill, stroke);
  }

  /* Socks */
  function sockSvg(main, pattern) {
    let decor = '';
    if (pattern === 'stripes') {
      decor = `
        <path d="M28 28 H52" stroke="#fff" stroke-width="3.5" opacity=".7"/>
        <path d="M26 36 H54" stroke="#fff" stroke-width="3.5" opacity=".7"/>
        <path d="M28 44 H52" stroke="#fff" stroke-width="3.5" opacity=".7"/>`;
    } else if (pattern === 'dots') {
      decor = `
        <circle cx="34" cy="30" r="3.5" fill="#fff" opacity=".75"/>
        <circle cx="46" cy="38" r="3.5" fill="#fff" opacity=".75"/>
        <circle cx="36" cy="46" r="3.5" fill="#fff" opacity=".75"/>
        <circle cx="48" cy="28" r="3" fill="#fff" opacity=".6"/>`;
    } else if (pattern === 'zigzag') {
      decor = `
        <path d="M26 32 L34 26 L42 34 L50 26 L56 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>
        <path d="M26 44 L34 38 L42 46 L50 38 L56 44" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
    } else {
      /* hearts */
      decor = `
        <path d="M36 34 C36 30 30 30 30 34 C30 38 36 42 36 42 C36 42 42 38 42 34 C42 30 36 30 36 34Z" fill="#fff" opacity=".8"/>
        <path d="M48 48 C48 45 44 45 44 48 C44 51 48 54 48 54 C48 54 52 51 52 48 C52 45 48 45 48 48Z" fill="#fff" opacity=".7"/>`;
    }
    return `
      <svg viewBox="0 0 80 100" aria-hidden="true">
        <path d="M28 12 H52 Q58 12 58 20 V48 Q58 58 68 68 Q74 74 70 82 Q64 90 52 88 L30 86 Q20 84 20 74 V20 Q20 12 28 12Z"
          fill="${main}" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
        <rect x="26" y="10" width="28" height="10" rx="4" fill="${main}" stroke="rgba(0,0,0,.1)" stroke-width="1"/>
        <rect x="28" y="12" width="24" height="5" rx="2" fill="#fff" opacity=".35"/>
        ${decor}
      </svg>`;
  }

  /* Numbers / dots */
  function dotsSvg(n, color) {
    const positions = {
      2: [[30, 30], [50, 50]],
      3: [[40, 22], [24, 52], [56, 52]],
      4: [[28, 28], [52, 28], [28, 52], [52, 52]],
      5: [[40, 18], [22, 36], [58, 36], [28, 58], [52, 58]],
    };
    const pts = positions[n] || positions[2];
    const circles = pts.map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="11" fill="${color}"/>`
    ).join('');
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <rect x="4" y="4" width="72" height="72" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3"/>
        ${circles}
      </svg>`;
  }

  function numeralSvg(n, color) {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="${color}"/>
        <text x="40" y="52" text-anchor="middle" font-size="42" font-weight="800"
          font-family="system-ui,sans-serif" fill="#fff">${n}</text>
      </svg>`;
  }


  /* Sailboats + hands (Eins, zwei oder drei) */
  function sailboatOne(sail) {
    return `
      <g>
        <ellipse cx="40" cy="62" rx="28" ry="8" fill="#89C2D9" opacity=".35"/>
        <path d="M14 58 Q40 72 66 58 L60 52 Q40 58 20 52 Z" fill="#8B5E3C"/>
        <rect x="38" y="22" width="3.5" height="34" fill="#5C4033"/>
        <polygon points="42,24 62,40 42,44" fill="${sail}"/>
        <ellipse cx="48" cy="32" rx="4" ry="3" fill="#fff" opacity=".28"/>
      </g>`;
  }

  function sailboatsCardSvg(count, sail) {
    let boats = '';
    if (count === 1) {
      boats = `<g transform="translate(10,8) scale(0.95)">${sailboatOne(sail)}</g>`;
    } else if (count === 2) {
      boats = `
        <g transform="translate(-6,18) scale(0.62)">${sailboatOne(sail)}</g>
        <g transform="translate(36,18) scale(0.62)">${sailboatOne(sail)}</g>`;
    } else {
      boats = `
        <g transform="translate(8,2) scale(0.5)">${sailboatOne(sail)}</g>
        <g transform="translate(40,2) scale(0.5)">${sailboatOne(sail)}</g>
        <g transform="translate(24,34) scale(0.5)">${sailboatOne(sail)}</g>`;
    }
    return `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="4" y="4" width="92" height="92" rx="16" fill="#FFF8F0" stroke="#E2E8F0" stroke-width="3"/>
        ${boats}
      </svg>`;
  }

  function handSvg(fingers) {
    /* Cute sticker-style counting hands (PNG): 1=thumb, 2=thumb+index, 3=thumb+index+middle */
    const n = Math.max(1, Math.min(3, fingers | 0));
    return `<img class="hand-sticker" src="icons/hands/hand-${n}.png" alt="" draggable="false" width="512" height="512"/>`;
  }

  /* Count-fill motifs (Zählen bis 3) */
  function bookSvg() {
    return `
      <svg viewBox="0 0 80 90" aria-hidden="true">
        <rect x="18" y="12" width="48" height="64" rx="3" fill="#E63946"/>
        <rect x="14" y="12" width="10" height="64" rx="2" fill="#FFD60A"/>
        <rect x="28" y="28" width="28" height="18" rx="3" fill="#52B788"/>
        <rect x="32" y="32" width="20" height="3" fill="#fff" opacity=".7"/>
        <rect x="32" y="38" width="14" height="3" fill="#fff" opacity=".55"/>
        <path d="M18 12 L22 8 H66 L62 12" fill="#C1121F"/>
      </svg>`;
  }

  function toyBoatSvg() {
    return `
      <svg viewBox="0 0 90 70" aria-hidden="true">
        <ellipse cx="45" cy="58" rx="32" ry="7" fill="#89C2D9" opacity=".4"/>
        <path d="M12 48 Q45 62 78 48 L70 38 H20 Z" fill="#FFD60A"/>
        <rect x="34" y="22" width="22" height="18" rx="3" fill="#E63946"/>
        <circle cx="45" cy="32" r="4" fill="#4361EE"/>
        <rect x="42" y="10" width="6" height="14" rx="2" fill="#52B788"/>
        <ellipse cx="45" cy="10" rx="5" ry="3" fill="#2EC4B6"/>
      </svg>`;
  }

  function marbleSvg() {
    return `
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="22" fill="#4361EE"/>
        <path d="M14 28 Q30 10 46 26 Q40 40 28 44 Q16 40 14 28Z" fill="#52B788" opacity=".85"/>
        <path d="M18 36 Q34 22 44 38" fill="none" stroke="#FFD60A" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="22" cy="20" rx="7" ry="4" fill="#fff" opacity=".35"/>
      </svg>`;
  }

  function duckSvg() {
    return `
      <svg viewBox="0 0 80 70" aria-hidden="true">
        <ellipse cx="40" cy="42" rx="24" ry="16" fill="#FFD60A"/>
        <circle cx="58" cy="28" r="14" fill="#FFD60A"/>
        <circle cx="62" cy="26" r="2.2" fill="#222"/>
        <path d="M70 28 Q84 26 78 34 Q72 36 70 32Z" fill="#FF8C42"/>
        <ellipse cx="28" cy="40" rx="6" ry="4" fill="#FFE66D"/>
        <path d="M30 56 Q34 64 38 56 M42 56 Q46 64 50 56" fill="none" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
  }

  function countObjectsSvg(kind, count) {
    const one = {
      book: bookSvg,
      boat: toyBoatSvg,
      marble: marbleSvg,
      duck: duckSvg,
    }[kind];
    if (!one) return '';
    if (count === 1) {
      return `<div class="count-objs count-objs-1">${one()}</div>`;
    }
    if (count === 2) {
      return `<div class="count-objs count-objs-2">${one()}${one()}</div>`;
    }
    return `<div class="count-objs count-objs-3">${one()}${one()}${one()}</div>`;
  }

  /* Weather / clothing */
  function raincoatSvg() {
    return `
      <svg viewBox="0 0 80 95" aria-hidden="true">
        <!-- hood -->
        <path d="M24 28 Q40 8 56 28" fill="#3A56D4"/>
        <ellipse cx="40" cy="30" rx="18" ry="10" fill="#89C2D9" opacity=".45"/>
        <!-- body -->
        <path d="M18 32 L22 78 Q40 86 58 78 L62 32 Q40 38 18 32Z" fill="#4361EE"/>
        <path d="M40 36 L40 78" stroke="#1B3A4B" stroke-width="2" opacity=".35"/>
        <circle cx="34" cy="48" r="3.5" fill="#FFD60A"/>
        <circle cx="34" cy="60" r="3.5" fill="#FFD60A"/>
        <!-- sleeves -->
        <path d="M18 36 L6 58 Q10 62 16 56 L22 40Z" fill="#3A56D4"/>
        <path d="M62 36 L74 58 Q70 62 64 56 L58 40Z" fill="#3A56D4"/>
      </svg>`;
  }

  function sunhatSvg() {
    return `
      <svg viewBox="0 0 90 70" aria-hidden="true">
        <ellipse cx="45" cy="48" rx="40" ry="12" fill="#FFD60A"/>
        <ellipse cx="45" cy="36" rx="22" ry="16" fill="#FFE66D"/>
        <ellipse cx="45" cy="42" rx="22" ry="6" fill="#FF8C42"/>
        <ellipse cx="38" cy="30" rx="6" ry="3" fill="#fff" opacity=".35"/>
      </svg>`;
  }

  function scarfSvg() {
    /* Icy light-blue scarf — matches snowflake color for easy matching */
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <path d="M18 28 Q45 48 72 28" fill="none" stroke="#89C2D9" stroke-width="14" stroke-linecap="round"/>
        <path d="M60 32 Q68 55 58 72" fill="none" stroke="#E0F2FE" stroke-width="10" stroke-linecap="round"/>
        <path d="M66 36 Q74 58 72 74" fill="none" stroke="#89C2D9" stroke-width="10" stroke-linecap="round"/>
        <path d="M54 68 L50 78 M58 70 L56 80 M62 72 L66 80 M70 70 L74 78" stroke="#4361EE" stroke-width="2"/>
      </svg>`;
  }

  function swimSvg() {
    return `
      <svg viewBox="0 0 90 70" aria-hidden="true">
        <path d="M12 18 H78 Q82 18 82 24 V36 Q82 52 56 58 L45 40 L34 58 Q8 52 8 36 V24 Q8 18 12 18Z" fill="#2EC4B6"/>
        <rect x="12" y="18" width="66" height="12" rx="3" fill="#1A9E94"/>
        <path d="M20 36 H70 M20 44 H66" stroke="#fff" stroke-width="3" opacity=".45"/>
        <circle cx="30" cy="24" r="3.5" fill="#FFD60A"/>
        <circle cx="45" cy="24" r="3.5" fill="#FF6B9D"/>
        <circle cx="60" cy="24" r="3.5" fill="#FFD60A"/>
      </svg>`;
  }

  function rainCloudSvg() {
    /* Blue rain cloud — matches blue raincoat for color matching */
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <ellipse cx="45" cy="32" rx="28" ry="16" fill="#4361EE"/>
        <circle cx="28" cy="34" r="14" fill="#5B7CFF"/>
        <circle cx="58" cy="30" r="16" fill="#3A56D4"/>
        <circle cx="42" cy="24" r="14" fill="#7B93FF"/>
        <line x1="30" y1="52" x2="26" y2="70" stroke="#89C2D9" stroke-width="4" stroke-linecap="round"/>
        <line x1="45" y1="54" x2="42" y2="72" stroke="#89C2D9" stroke-width="4" stroke-linecap="round"/>
        <line x1="60" y1="52" x2="58" y2="68" stroke="#89C2D9" stroke-width="4" stroke-linecap="round"/>
      </svg>`;
  }

  function sunSvg() {
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="16" fill="#FFD60A"/>
        <g stroke="#FF8C42" stroke-width="4" stroke-linecap="round">
          <line x1="40" y1="8" x2="40" y2="18"/>
          <line x1="40" y1="62" x2="40" y2="72"/>
          <line x1="8" y1="40" x2="18" y2="40"/>
          <line x1="62" y1="40" x2="72" y2="40"/>
          <line x1="16" y1="16" x2="24" y2="24"/>
          <line x1="56" y1="56" x2="64" y2="64"/>
          <line x1="16" y1="64" x2="24" y2="56"/>
          <line x1="56" y1="24" x2="64" y2="16"/>
        </g>
        <circle cx="34" cy="36" r="2" fill="#222"/>
        <circle cx="46" cy="36" r="2" fill="#222"/>
        <path d="M34 46 Q40 52 46 46" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  function snowflakeSvg() {
    /* Icy light-blue snowflake — matches blue scarf */
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <g stroke="#89C2D9" stroke-width="5" stroke-linecap="round">
          <line x1="40" y1="10" x2="40" y2="70"/>
          <line x1="14" y1="25" x2="66" y2="55"/>
          <line x1="14" y1="55" x2="66" y2="25"/>
          <line x1="40" y1="22" x2="30" y2="16"/>
          <line x1="40" y1="22" x2="50" y2="16"/>
          <line x1="40" y1="58" x2="30" y2="64"/>
          <line x1="40" y1="58" x2="50" y2="64"/>
        </g>
        <circle cx="40" cy="40" r="8" fill="#E0F2FE" stroke="#89C2D9" stroke-width="3"/>
      </svg>`;
  }

  function wavesSvg() {
    return `
      <svg viewBox="0 0 90 70" aria-hidden="true">
        <rect x="4" y="4" width="82" height="62" rx="12" fill="#E0F7FA"/>
        <path d="M8 28 Q20 18 32 28 Q44 38 56 28 Q68 18 82 28" fill="none" stroke="#2EC4B6" stroke-width="5" stroke-linecap="round"/>
        <path d="M8 44 Q20 34 32 44 Q44 54 56 44 Q68 34 82 44" fill="none" stroke="#4361EE" stroke-width="5" stroke-linecap="round"/>
        <circle cx="70" cy="16" r="8" fill="#FFD60A"/>
      </svg>`;
  }

  /* —— Exercise definitions —— */

  function pinwheelSvg(color) {
    /* Classic 4-blade pinwheel on a stick — cute, kid-friendly */
    const c = color || COLORS.red;
    return `
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="40" y1="52" x2="40" y2="102" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="40" cy="104" rx="7" ry="2.5" fill="rgba(0,0,0,.12)"/>
        <!-- four curved blades -->
        <path d="M40 40 Q58 18 70 32 Q62 48 40 40 Z" fill="${c}"/>
        <path d="M40 40 Q62 58 48 72 Q32 64 40 40 Z" fill="${c}" opacity=".92"/>
        <path d="M40 40 Q22 62 10 48 Q18 32 40 40 Z" fill="${c}" opacity=".88"/>
        <path d="M40 40 Q18 22 32 8 Q48 16 40 40 Z" fill="${c}" opacity=".95"/>
        <!-- blade highlights -->
        <path d="M44 36 Q56 24 62 32" fill="none" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
        <path d="M36 36 Q24 24 20 30" fill="none" stroke="#fff" stroke-width="2" opacity=".28" stroke-linecap="round"/>
        <!-- center pin -->
        <circle cx="40" cy="40" r="7" fill="#FF8C42"/>
        <circle cx="40" cy="40" r="3.5" fill="#FFD60A"/>
        <circle cx="38" cy="38" r="1.4" fill="#fff" opacity=".55"/>
      </svg>`;
  }

  function paperSquareSvg(color) {
    /* Colored folding paper with dotted diagonal crease lines */
    const c = color || COLORS.yellow;
    return `
      <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="8" width="74" height="74" rx="7" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="2.5"/>
        <rect x="14" y="14" width="30" height="18" rx="3" fill="#fff" opacity=".28"/>
        <line x1="16" y1="16" x2="74" y2="74" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/>
        <line x1="74" y1="16" x2="16" y2="74" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/>
        <circle cx="45" cy="45" r="3.2" fill="rgba(0,0,0,.22)"/>
      </svg>`;
  }

  function flowerSvg(petal) {
    const p = petal || COLORS.blue;
    /* 6 petals + yellow center + stem/leaves */
    const petals = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = 40 + Math.cos(a) * 16;
      const y = 34 + Math.sin(a) * 16;
      petals.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="8" fill="${p}" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
    }
    return `
      <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="40" y1="48" x2="40" y2="92" stroke="#3A9B6A" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="28" cy="74" rx="11" ry="5.5" fill="#52B788" transform="rotate(-40 28 74)"/>
        <ellipse cx="52" cy="74" rx="11" ry="5.5" fill="#52B788" transform="rotate(40 52 74)"/>
        ${petals.join('\n        ')}
        <circle cx="40" cy="34" r="11" fill="#FFD60A"/>
        <circle cx="36" cy="30" r="3" fill="#fff" opacity=".45"/>
      </svg>`;
  }

  /* —— New puzzles: Stifte, Blumen/Vasen, Segelboote, Herbst-Pilze —— */
  function pencilSvg(color) {
    const c = color || COLORS.red;
    return `
      <svg viewBox="0 0 48 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="14" y="6" width="20" height="14" rx="4" fill="#FF6B9D" stroke="#2D3436" stroke-width="2.2"/>
        <rect x="14" y="18" width="20" height="6" fill="#CBD5E1" stroke="#2D3436" stroke-width="2"/>
        <rect x="14" y="22" width="20" height="68" fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
        <rect x="18" y="28" width="4" height="56" fill="#fff" opacity=".28"/>
        <polygon points="14,90 34,90 24,114" fill="#F5D0A9" stroke="#2D3436" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="18,102 30,102 24,114" fill="${c}"/>
        <line x1="20" y1="94" x2="28" y2="94" stroke="#2D3436" stroke-width="1.2" opacity=".35"/>
      </svg>`;
  }

  function frogMatchSvg() {
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="50" cy="58" rx="34" ry="24" fill="#52B788" stroke="#2D3436" stroke-width="2.4"/>
        <circle cx="28" cy="28" r="14" fill="#52B788" stroke="#2D3436" stroke-width="2.4"/>
        <circle cx="72" cy="28" r="14" fill="#52B788" stroke="#2D3436" stroke-width="2.4"/>
        <circle cx="28" cy="28" r="7" fill="#fff"/>
        <circle cx="72" cy="28" r="7" fill="#fff"/>
        <circle cx="30" cy="29" r="3.2" fill="#2D3436"/>
        <circle cx="74" cy="29" r="3.2" fill="#2D3436"/>
        <path d="M36 62 Q50 74 64 62" fill="none" stroke="#2D3436" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="22" cy="70" rx="8" ry="5" fill="#3A9B6A" stroke="#2D3436" stroke-width="1.6"/>
        <ellipse cx="78" cy="70" rx="8" ry="5" fill="#3A9B6A" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="42" cy="52" r="3" fill="#FFD60A" opacity=".7"/>
        <circle cx="58" cy="54" r="2.5" fill="#FFD60A" opacity=".55"/>
      </svg>`;
  }

  function colorFlowerSvg(color) {
    const c = color || COLORS.blue;
    return `
      <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="45" y1="52" x2="45" y2="92" stroke="#3A9B6A" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="34" cy="78" rx="10" ry="5" fill="#52B788" transform="rotate(-35 34 78)"/>
        <ellipse cx="56" cy="78" rx="10" ry="5" fill="#52B788" transform="rotate(35 56 78)"/>
        <circle cx="45" cy="22" r="14" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <circle cx="28" cy="34" r="13" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <circle cx="62" cy="34" r="13" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <circle cx="34" cy="48" r="12" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <circle cx="56" cy="48" r="12" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <circle cx="45" cy="36" r="11" fill="#FFD60A" stroke="#2D3436" stroke-width="2"/>
        <circle cx="41" cy="32" r="3" fill="#fff" opacity=".5"/>
      </svg>`;
  }

  function crescentMoonSvg() {
    return `
      <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M52 12 A34 34 0 1 0 52 78 A26 26 0 1 1 52 12 Z" fill="#FFD60A" stroke="#2D3436" stroke-width="2.4"/>
        <circle cx="58" cy="36" r="3.2" fill="#2D3436"/>
        <path d="M52 52 Q60 58 68 50" fill="none" stroke="#2D3436" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="48" cy="28" r="4" fill="#fff" opacity=".35"/>
        <circle cx="62" cy="60" r="3" fill="#FF8C42" opacity=".55"/>
      </svg>`;
  }

  function heartMatchSvg(color) {
    const c = color || COLORS.red;
    return `
      <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M45 78 C20 58 10 40 22 26 C30 16 42 20 45 30 C48 20 60 16 68 26 C80 40 70 58 45 78 Z"
              fill="${c}" stroke="#2D3436" stroke-width="2.4" stroke-linejoin="round"/>
        <ellipse cx="34" cy="34" rx="7" ry="4.5" fill="#fff" opacity=".35" transform="rotate(-30 34 34)"/>
      </svg>`;
  }

  function tulipBouquetSvg(color) {
    const c = color || COLORS.purple;
    function tulip(tx, ty, s) {
      return `<g transform="translate(${tx},${ty}) scale(${s})">
        <line x1="20" y1="28" x2="20" y2="70" stroke="#3A9B6A" stroke-width="4" stroke-linecap="round"/>
        <path d="M8 32 Q20 8 32 32 Q28 48 20 52 Q12 48 8 32 Z" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <path d="M14 28 Q20 18 26 28" fill="none" stroke="#fff" stroke-width="1.6" opacity=".4"/>
      </g>`;
    }
    return `
      <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${tulip(8, 8, 1)}
        ${tulip(36, 0, 1.05)}
        ${tulip(58, 10, 0.95)}
        <ellipse cx="50" cy="92" rx="28" ry="10" fill="#52B788" stroke="#2D3436" stroke-width="2"/>
        <path d="M30 88 Q50 78 70 88" fill="none" stroke="#3A9B6A" stroke-width="2"/>
      </svg>`;
  }

  function stripedVaseSvg(color) {
    const c = color || COLORS.red;
    return `
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 18 H58 L54 28 Q70 42 66 78 Q62 100 40 102 Q18 100 14 78 Q10 42 26 28 Z"
              fill="#fff" stroke="#2D3436" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M24 34 H56" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
        <path d="M20 48 H60" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
        <path d="M18 62 H62" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
        <path d="M20 76 H60" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
        <path d="M24 88 H56" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="40" cy="18" rx="20" ry="6" fill="${c}" stroke="#2D3436" stroke-width="2"/>
        <ellipse cx="32" cy="40" rx="4" ry="10" fill="#fff" opacity=".35"/>
      </svg>`;
  }

  function pairSailboatSvg(sailTop) {
    const top = sailTop || COLORS.green;
    return `
      <svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="55" cy="86" rx="40" ry="8" fill="#89C2D9" opacity=".45"/>
        <path d="M18 78 Q55 92 92 78 L84 68 H26 Z" fill="#8B5E3C" stroke="#2D3436" stroke-width="2.2" stroke-linejoin="round"/>
        <rect x="52" y="18" width="4.5" height="52" rx="1.5" fill="#5C4033" stroke="#2D3436" stroke-width="1.4"/>
        <!-- lower main sail (red) -->
        <polygon points="57,42 86,62 57,68" fill="#E63946" stroke="#2D3436" stroke-width="2" stroke-linejoin="round"/>
        <!-- top-left sail segment (match color) -->
        <polygon points="57,20 57,44 30,40" fill="${top}" stroke="#2D3436" stroke-width="2" stroke-linejoin="round"/>
        <!-- jib yellow/red -->
        <polygon points="52,28 52,66 22,58" fill="#FFD60A" stroke="#2D3436" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="52,48 52,66 28,60" fill="#E63946" opacity=".85"/>
        <ellipse cx="68" cy="50" rx="4" ry="3" fill="#fff" opacity=".3"/>
      </svg>`;
  }

  function autumnLeafSvg(color, rot, kind) {
    const c = color || COLORS.orange;
    const r = rot == null ? 0 : rot;
    const k = kind || 0;
    let leaf;
    if (k === 1) {
      leaf = `<path d="M40 18 C58 22 70 40 62 58 C54 74 40 82 40 82 C40 82 26 74 18 58 C10 40 22 22 40 18 Z"
                fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
              <path d="M40 22 L40 78 M40 40 Q28 48 24 58 M40 40 Q52 48 56 58 M40 55 Q30 62 28 70 M40 55 Q50 62 52 70"
                fill="none" stroke="#5C4033" stroke-width="1.4" opacity=".55"/>`;
    } else if (k === 2) {
      leaf = `<ellipse cx="40" cy="48" rx="22" ry="32" fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
              <path d="M40 18 L40 78 M40 40 Q26 50 22 62 M40 40 Q54 50 58 62"
                fill="none" stroke="#5C4033" stroke-width="1.4" opacity=".5"/>`;
    } else {
      leaf = `<path d="M40 14 C48 20 72 28 68 48 C64 66 48 78 40 86 C32 78 16 66 12 48 C8 28 32 20 40 14 Z"
                fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
              <path d="M40 18 L40 82 M40 36 Q24 44 20 56 M40 36 Q56 44 60 56 M40 52 Q28 58 26 68 M40 52 Q52 58 54 68"
                fill="none" stroke="#5C4033" stroke-width="1.35" opacity=".55"/>`;
    }
    return `
      <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 40 50)">${leaf}
        <line x1="40" y1="82" x2="40" y2="96" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  function mushroomSvg(rot) {
    const r = rot == null ? 0 : rot;
    return `
      <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 45 55)">
          <rect x="34" y="52" width="22" height="36" rx="8" fill="#C4A574" stroke="#2D3436" stroke-width="2.2"/>
          <ellipse cx="45" cy="78" rx="14" ry="5" fill="#A67C52" opacity=".45"/>
          <path d="M12 52 Q14 22 45 18 Q76 22 78 52 Z" fill="#8B5E3C" stroke="#2D3436" stroke-width="2.4"/>
          <ellipse cx="45" cy="52" rx="34" ry="10" fill="#A67C52" stroke="#2D3436" stroke-width="2"/>
          <circle cx="28" cy="40" r="5" fill="#F5D0A9"/>
          <circle cx="48" cy="32" r="6" fill="#F5D0A9"/>
          <circle cx="64" cy="42" r="4.5" fill="#F5D0A9"/>
          <circle cx="38" cy="46" r="3.5" fill="#F5D0A9" opacity=".85"/>
        </g>
      </svg>`;
  }



  /* —— Obstkörbe / Geburtstagsschatten / Schmetterlinge —— */
  function bananaSvg() {
    return `
      <svg viewBox="0 0 90 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 58 C18 40 28 18 48 16 C62 14 74 24 78 38 C70 28 56 24 46 28 C34 34 28 48 30 62 Z"
              fill="#FFD60A" stroke="#2D3436" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M30 62 C36 68 48 70 58 64 C64 60 68 54 70 48"
              fill="none" stroke="#E0B000" stroke-width="3" stroke-linecap="round" opacity=".55"/>
        <ellipse cx="52" cy="28" rx="6" ry="3" fill="#fff" opacity=".35"/>
        <path d="M48 14 Q50 8 54 10" fill="none" stroke="#8B5E3C" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
  }

  function redAppleSvg() {
    return `
      <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 28 C22 28 14 44 16 58 C18 74 30 82 40 82 C50 82 62 74 64 58 C66 44 58 28 40 28 Z"
              fill="#E63946" stroke="#2D3436" stroke-width="2.2"/>
        <path d="M40 28 C34 40 28 44 24 46" fill="none" stroke="#C1121F" stroke-width="2" opacity=".35"/>
        <ellipse cx="30" cy="48" rx="7" ry="10" fill="#fff" opacity=".28"/>
        <path d="M40 28 Q42 16 48 12" fill="none" stroke="#5C4033" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="54" cy="18" rx="8" ry="4.5" fill="#52B788" stroke="#2D3436" stroke-width="1.4" transform="rotate(25 54 18)"/>
      </svg>`;
  }

  function greenPearSvg() {
    return `
      <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 18 C48 18 54 28 52 40 C50 50 56 58 56 68 C56 82 48 90 40 90 C32 90 24 82 24 68 C24 58 30 50 28 40 C26 28 32 18 40 18 Z"
              fill="#52B788" stroke="#2D3436" stroke-width="2.2"/>
        <ellipse cx="32" cy="52" rx="6" ry="10" fill="#fff" opacity=".28"/>
        <path d="M40 18 Q38 8 42 6" fill="none" stroke="#5C4033" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="50" cy="12" rx="7" ry="4" fill="#3A9B6A" stroke="#2D3436" stroke-width="1.3" transform="rotate(20 50 12)"/>
        <circle cx="46" cy="62" r="2.2" fill="#3A9B6A" opacity=".45"/>
        <circle cx="36" cy="70" r="1.8" fill="#3A9B6A" opacity=".4"/>
      </svg>`;
  }

  function fruitIconMini(kind) {
    if (kind === 'banana') {
      return `<g transform="translate(50,52) scale(0.42)">
        <path d="M22 58 C18 40 28 18 48 16 C62 14 74 24 78 38 C70 28 56 24 46 28 C34 34 28 48 30 62 Z" fill="#FFD60A"/>
      </g>`;
    }
    if (kind === 'apple') {
      return `<g transform="translate(50,50) scale(0.38)">
        <path d="M40 28 C22 28 14 44 16 58 C18 74 30 82 40 82 C50 82 62 74 64 58 C66 44 58 28 40 28 Z" fill="#E63946"/>
        <ellipse cx="54" cy="18" rx="8" ry="4.5" fill="#52B788"/>
      </g>`;
    }
    return `<g transform="translate(50,48) scale(0.36)">
      <path d="M40 18 C48 18 54 28 52 40 C50 50 56 58 56 68 C56 82 48 90 40 90 C32 90 24 82 24 68 C24 58 30 50 28 40 C26 28 32 18 40 18 Z" fill="#52B788"/>
    </g>`;
  }

  function fruitBasketSvg(kind) {
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M28 28 Q50 8 72 28" fill="none" stroke="#C4A574" stroke-width="6" stroke-linecap="round"/>
        <path d="M12 38 Q14 78 50 82 Q86 78 88 38 Z" fill="#E8C99B" stroke="#2D3436" stroke-width="2.4"/>
        <path d="M20 48 H80 M22 58 H78 M26 68 H74" stroke="#8B5E3C" stroke-width="2" opacity=".35"/>
        <ellipse cx="50" cy="40" rx="30" ry="7" fill="rgba(255,255,255,.35)"/>
        ${fruitIconMini(kind)}
      </svg>`;
  }

  function birthdayBalloonSvg(asSilhouette) {
    const fill = asSilhouette ? '#94A3B8' : '#FFD60A';
    const stroke = asSilhouette ? '#64748B' : '#2D3436';
    const highlight = asSilhouette ? 'none' : '#fff';
    return `
      <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="40" cy="42" rx="26" ry="32" fill="${fill}" stroke="${stroke}" stroke-width="2.4"/>
        <path d="M40 74 L46 82 L34 82 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>
        <path d="M40 82 Q48 92 36 102 Q28 108 40 110" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
        ${asSilhouette ? '' : '<ellipse cx="30" cy="32" rx="8" ry="12" fill="#fff" opacity=".35"/>'}
        ${asSilhouette ? '' : '<circle cx="48" cy="48" r="4" fill="#FF8C42" opacity=".55"/>'}
      </svg>`;
  }

  function birthdayCakeSvg(asSilhouette) {
    const top = asSilhouette ? '#94A3B8' : '#FFB4C8';
    const mid = asSilhouette ? '#7B8A9A' : '#FFEAA7';
    const base = asSilhouette ? '#64748B' : '#E8C99B';
    const stroke = asSilhouette ? '#64748B' : '#2D3436';
    const flame = asSilhouette ? '#94A3B8' : '#FF8C42';
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="46" y="12" width="8" height="18" rx="2" fill="${asSilhouette ? '#94A3B8' : '#FFF'}" stroke="${stroke}" stroke-width="1.6"/>
        <ellipse cx="50" cy="12" rx="6" ry="8" fill="${flame}" stroke="${stroke}" stroke-width="1.4"/>
        <rect x="18" y="30" width="64" height="22" rx="6" fill="${top}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="14" y="50" width="72" height="24" rx="6" fill="${mid}" stroke="${stroke}" stroke-width="2.2"/>
        <rect x="10" y="72" width="80" height="18" rx="6" fill="${base}" stroke="${stroke}" stroke-width="2.2"/>
        ${asSilhouette ? '' : `
        <circle cx="30" cy="41" r="3.5" fill="#E63946"/>
        <circle cx="50" cy="41" r="3.5" fill="#4361EE"/>
        <circle cx="70" cy="41" r="3.5" fill="#52B788"/>
        <path d="M20 62 Q35 54 50 62 Q65 70 80 62" fill="none" stroke="#E84393" stroke-width="3" stroke-linecap="round"/>
        `}
      </svg>`;
  }

  function giftBoxSvg(asSilhouette) {
    const box = asSilhouette ? '#94A3B8' : '#4361EE';
    const lid = asSilhouette ? '#7B8A9A' : '#5B7CFF';
    const ribbon = asSilhouette ? '#64748B' : '#E63946';
    const stroke = asSilhouette ? '#64748B' : '#2D3436';
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="42" width="68" height="46" rx="6" fill="${box}" stroke="${stroke}" stroke-width="2.4"/>
        <rect x="12" y="30" width="76" height="18" rx="5" fill="${lid}" stroke="${stroke}" stroke-width="2.4"/>
        <rect x="44" y="30" width="12" height="58" fill="${ribbon}" opacity=".95"/>
        <rect x="16" y="48" width="68" height="10" fill="${ribbon}" opacity=".95"/>
        <path d="M50 30 Q38 10 28 22 Q34 34 50 30" fill="${ribbon}" stroke="${stroke}" stroke-width="1.6"/>
        <path d="M50 30 Q62 10 72 22 Q66 34 50 30" fill="${ribbon}" stroke="${stroke}" stroke-width="1.6"/>
        ${asSilhouette ? '' : '<ellipse cx="30" cy="56" rx="6" ry="4" fill="#fff" opacity=".25"/>'}
      </svg>`;
  }

  function birthdayBouquetSvg(asSilhouette) {
    if (asSilhouette) {
      return `
        <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <line x1="28" y1="36" x2="40" y2="78" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
          <line x1="50" y1="28" x2="50" y2="78" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
          <line x1="72" y1="36" x2="60" y2="78" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
          <path d="M18 38 Q30 12 42 38 Q38 52 30 56 Q22 52 18 38 Z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
          <path d="M38 30 Q50 6 62 30 Q58 46 50 50 Q42 46 38 30 Z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
          <path d="M58 38 Q70 14 82 38 Q78 52 70 56 Q62 52 58 38 Z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
          <ellipse cx="50" cy="92" rx="28" ry="10" fill="#7B8A9A" stroke="#64748B" stroke-width="2"/>
        </svg>`;
    }
    return tulipBouquetSvg(COLORS.pink);
  }

  function butterflySvg(wingColor) {
    const c = wingColor || COLORS.green;
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="28" cy="32" rx="20" ry="26" fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
        <ellipse cx="72" cy="32" rx="20" ry="26" fill="${c}" stroke="#2D3436" stroke-width="2.2"/>
        <ellipse cx="30" cy="62" rx="14" ry="16" fill="${c}" stroke="#2D3436" stroke-width="2" opacity=".92"/>
        <ellipse cx="70" cy="62" rx="14" ry="16" fill="${c}" stroke="#2D3436" stroke-width="2" opacity=".92"/>
        <ellipse cx="50" cy="48" rx="8" ry="22" fill="#2D3436"/>
        <circle cx="50" cy="28" r="6" fill="#2D3436"/>
        <path d="M46 22 Q40 8 34 12" fill="none" stroke="#2D3436" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M54 22 Q60 8 66 12" fill="none" stroke="#2D3436" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="22" cy="28" r="5" fill="#FFD60A" opacity=".75"/>
        <circle cx="78" cy="28" r="5" fill="#FFD60A" opacity=".75"/>
        <circle cx="28" cy="58" r="3.5" fill="#fff" opacity=".4"/>
        <circle cx="72" cy="58" r="3.5" fill="#fff" opacity=".4"/>
      </svg>`;
  }

  function matchFlowerSvg(petal) {
    return flowerSvg(petal);
  }

  function patternCandySvg(style) {
    /* Decorative wrapped candy; style picks fill + pattern for odd-one-out rows */
    let body = '#FF8C42';
    let wrap = '#FF8C42';
    let decor = '';
    if (style === 'orange-plain') {
      body = '#FF8C42'; wrap = '#E76F3C';
      decor = '<ellipse cx="36" cy="20" rx="8" ry="5" fill="#fff" opacity=".3"/>';
    } else if (style === 'orange-purple-stripe') {
      body = '#FF8C42'; wrap = '#9B5DE5';
      decor = `
        <path d="M22 16 L58 32" stroke="#9B5DE5" stroke-width="4" stroke-linecap="round"/>
        <path d="M20 24 L56 40" stroke="#9B5DE5" stroke-width="4" stroke-linecap="round"/>
        <path d="M24 32 L60 48" stroke="#9B5DE5" stroke-width="4" stroke-linecap="round"/>`;
    } else if (style === 'blue-polka') {
      body = '#89C2D9'; wrap = '#5FA8C9';
      decor = `
        <circle cx="30" cy="18" r="3.5" fill="#1B3A4B"/>
        <circle cx="44" cy="28" r="3.5" fill="#1B3A4B"/>
        <circle cx="34" cy="34" r="3" fill="#1B3A4B"/>
        <circle cx="50" cy="18" r="3" fill="#1B3A4B"/>`;
    } else if (style === 'blue-polka-invert') {
      body = '#1B3A4B'; wrap = '#0F2740';
      decor = `
        <circle cx="30" cy="18" r="3.5" fill="#89C2D9"/>
        <circle cx="44" cy="28" r="3.5" fill="#89C2D9"/>
        <circle cx="34" cy="34" r="3" fill="#89C2D9"/>
        <circle cx="50" cy="18" r="3" fill="#89C2D9"/>`;
    } else if (style === 'lime') {
      body = '#B7E63A'; wrap = '#8BC34A';
      decor = '<ellipse cx="36" cy="20" rx="8" ry="5" fill="#fff" opacity=".3"/>';
    } else if (style === 'dark-green') {
      body = '#1B7A4A'; wrap = '#145C38';
      decor = '<ellipse cx="36" cy="20" rx="8" ry="5" fill="#fff" opacity=".18"/>';
    }
    return `
      <svg viewBox="0 0 80 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polygon points="4,24 16,10 16,38" fill="${wrap}"/>
        <ellipse cx="40" cy="24" rx="24" ry="16" fill="${body}" stroke="#2D3436" stroke-width="1.6"/>
        <polygon points="76,24 64,10 64,38" fill="${wrap}"/>
        ${decor}
      </svg>`;
  }


  function carrotSvg(rot) {
    const r = rot == null ? -25 : rot;
    return `
      <svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 40 62)">
          <!-- pointed/tapered carrot: wide shoulders, sharp tip -->
          <path d="M40 24
                   C52 26 57 34 56 48
                   C55 66 50 86 42 108
                   Q40 116 38 108
                   C30 86 25 66 24 48
                   C23 34 28 26 40 24 Z"
                fill="#FF8C42" stroke="#E76F3C" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M35 36 Q37 62 35 88 M45 38 Q43 64 45 90 M40 42 Q41 70 40 100"
                fill="none" stroke="#E76F3C" stroke-width="1.35" opacity=".5" stroke-linecap="round"/>
          <path d="M40 24 Q31 12 24 5 Q34 14 38 22" fill="#3A9B6A" stroke="#2D6A4F" stroke-width="1"/>
          <path d="M40 24 Q40 8 43 2 Q43 14 41 22" fill="#52B788" stroke="#2D6A4F" stroke-width="1"/>
          <path d="M40 24 Q49 12 56 6 Q48 16 42 22" fill="#3A9B6A" stroke="#2D6A4F" stroke-width="1"/>
          <ellipse cx="33" cy="42" rx="3.5" ry="9" fill="#fff" opacity=".22" transform="rotate(-10 33 42)"/>
        </g>
      </svg>`;
  }

  function orangeFruitSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="40" cy="42" r="26" fill="#FF8C42" stroke="#E76F3C" stroke-width="2"/>
        <circle cx="40" cy="42" r="20" fill="none" stroke="#E76F3C" stroke-width="1" opacity=".35"/>
        <ellipse cx="30" cy="34" rx="8" ry="5" fill="#fff" opacity=".28"/>
        <path d="M40 16 Q42 10 48 8" fill="none" stroke="#3A9B6A" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="50" cy="10" rx="6" ry="3.5" fill="#52B788" transform="rotate(25 50 10)"/>
      </svg>`;
  }

  function pumpkinSvg() {
    return `
      <svg viewBox="0 0 90 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="40" cy="48" rx="14" ry="24" fill="#FF8C42"/>
        <ellipse cx="28" cy="48" rx="12" ry="22" fill="#F4A261"/>
        <ellipse cx="52" cy="48" rx="12" ry="22" fill="#F4A261"/>
        <ellipse cx="40" cy="48" rx="10" ry="22" fill="#FF9F5A"/>
        <path d="M40 24 Q38 12 42 8 Q46 14 44 24" fill="#3A9B6A" stroke="#2D6A4F" stroke-width="1"/>
        <ellipse cx="30" cy="40" rx="4" ry="8" fill="#fff" opacity=".2"/>
      </svg>`;
  }

  function paperPlaneSvg(flip) {
    const f = flip ? 'transform="scale(-1,1) translate(-80,0)"' : '';
    return `
      <svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g ${f}>
          <path d="M8 32 L72 12 L48 48 Z" fill="#FFB347" stroke="#E76F3C" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M8 32 L48 48 L40 36 Z" fill="#FF8C42"/>
          <path d="M8 32 L72 12 L40 36 Z" fill="#FFCC80" opacity=".95"/>
          <path d="M40 36 L48 48" stroke="#E76F3C" stroke-width="1.2"/>
        </g>
      </svg>`;
  }

  function handbagSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 28 Q22 12 40 12 Q58 12 58 28" fill="none" stroke="#E76F3C" stroke-width="5" stroke-linecap="round"/>
        <rect x="12" y="28" width="56" height="42" rx="8" fill="#FF8C42" stroke="#E76F3C" stroke-width="2"/>
        <rect x="20" y="36" width="40" height="26" rx="4" fill="#FFB347" opacity=".55"/>
        <circle cx="40" cy="42" r="4" fill="#FFD60A" stroke="#E76F3C" stroke-width="1.5"/>
        <rect x="38" y="42" width="4" height="8" rx="1" fill="#E76F3C"/>
      </svg>`;
  }

  function clutterSockSvg(rot) {
    const r = rot == null ? 15 : rot;
    return `
      <svg viewBox="0 0 70 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 35 45)">
          <path d="M28 12 H48 V48 Q48 58 58 62 Q66 66 64 74 Q62 82 50 80 Q34 76 28 66 Z" fill="#FF8C42" stroke="#E76F3C" stroke-width="1.8"/>
          <path d="M28 12 H48 V22 H28 Z" fill="#FFB347"/>
          <path d="M30 30 H46 M30 38 H46" stroke="#E76F3C" stroke-width="1.5" opacity=".4"/>
          <ellipse cx="34" cy="20" rx="3" ry="4" fill="#fff" opacity=".25"/>
        </g>
      </svg>`;
  }

  function cubeSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 28 L40 14 L64 28 L64 58 L40 72 L16 58 Z" fill="#FF8C42" stroke="#E76F3C" stroke-width="2"/>
        <path d="M16 28 L40 42 L64 28" fill="none" stroke="#E76F3C" stroke-width="1.8"/>
        <path d="M40 42 L40 72" stroke="#E76F3C" stroke-width="1.8"/>
        <path d="M16 28 L40 42 L40 72 L16 58 Z" fill="#E76F3C" opacity=".18"/>
        <circle cx="30" cy="48" r="3" fill="#FFD60A"/>
        <circle cx="48" cy="36" r="2.5" fill="#fff" opacity=".45"/>
      </svg>`;
  }

  function toyCarSvg(flip) {
    const f = flip ? 'transform="scale(-1,1) translate(-90,0)"' : '';
    return `
      <svg viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g ${f}>
          <rect x="10" y="24" width="64" height="20" rx="6" fill="#FF8C42" stroke="#E76F3C" stroke-width="1.8"/>
          <path d="M24 24 L32 12 H54 L64 24 Z" fill="#FFB347" stroke="#E76F3C" stroke-width="1.5"/>
          <rect x="34" y="14" width="14" height="8" rx="1.5" fill="#89C2D9" opacity=".85"/>
          <circle cx="26" cy="46" r="8" fill="#5C4033"/>
          <circle cx="26" cy="46" r="4" fill="#C4A574"/>
          <circle cx="58" cy="46" r="8" fill="#5C4033"/>
          <circle cx="58" cy="46" r="4" fill="#C4A574"/>
          <circle cx="70" cy="30" r="2.5" fill="#FFD60A"/>
        </g>
      </svg>`;
  }

  function buttonSvg() {
    return `
      <svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="35" cy="35" r="26" fill="#FF8C42" stroke="#E76F3C" stroke-width="2.5"/>
        <circle cx="35" cy="35" r="20" fill="none" stroke="#E76F3C" stroke-width="1.5" opacity=".4"/>
        <circle cx="28" cy="28" r="3.5" fill="#FFF3E0" stroke="#E76F3C" stroke-width="1.2"/>
        <circle cx="42" cy="28" r="3.5" fill="#FFF3E0" stroke="#E76F3C" stroke-width="1.2"/>
        <circle cx="28" cy="42" r="3.5" fill="#FFF3E0" stroke="#E76F3C" stroke-width="1.2"/>
        <circle cx="42" cy="42" r="3.5" fill="#FFF3E0" stroke="#E76F3C" stroke-width="1.2"/>
        <path d="M28 28 L42 42 M42 28 L28 42" stroke="#E76F3C" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
  }

  function sharpenerSvg() {
    return `
      <svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="12" y="18" width="56" height="38" rx="8" fill="#FF8C42" stroke="#E76F3C" stroke-width="2"/>
        <rect x="20" y="26" width="28" height="22" rx="4" fill="#FFB347"/>
        <circle cx="34" cy="37" r="7" fill="#5C4033"/>
        <circle cx="34" cy="37" r="3.5" fill="#C4A574"/>
        <rect x="52" y="28" width="10" height="18" rx="2" fill="#E76F3C"/>
        <path d="M54 30 L60 37 L54 44" fill="#FFD60A"/>
      </svg>`;
  }

  function sweaterSvg() {
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M28 22 L18 34 L8 48 L20 54 L28 42 L28 78 L72 78 L72 42 L80 54 L92 48 L82 34 L72 22
                 Q60 14 50 16 Q40 14 28 22 Z" fill="#FF8C42" stroke="#E76F3C" stroke-width="2"/>
        <path d="M34 22 Q50 30 66 22" fill="none" stroke="#3A9B6A" stroke-width="5" stroke-linecap="round"/>
        <rect x="28" y="72" width="44" height="8" rx="2" fill="#3A9B6A"/>
        <rect x="8" y="46" width="12" height="8" rx="2" fill="#3A9B6A"/>
        <rect x="80" y="46" width="12" height="8" rx="2" fill="#3A9B6A"/>
        <path d="M36 40 H64 M36 50 H64 M36 60 H64" stroke="#E76F3C" stroke-width="1.2" opacity=".35"/>
      </svg>`;
  }

  function daisyClutterSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g>
          <ellipse cx="40" cy="18" rx="8" ry="14" fill="#FFE0B2"/>
          <ellipse cx="40" cy="62" rx="8" ry="14" fill="#FFE0B2"/>
          <ellipse cx="18" cy="40" rx="14" ry="8" fill="#FFE0B2"/>
          <ellipse cx="62" cy="40" rx="14" ry="8" fill="#FFE0B2"/>
          <ellipse cx="24" cy="24" rx="11" ry="7" fill="#FFCC80" transform="rotate(-45 24 24)"/>
          <ellipse cx="56" cy="24" rx="11" ry="7" fill="#FFCC80" transform="rotate(45 56 24)"/>
          <ellipse cx="24" cy="56" rx="11" ry="7" fill="#FFCC80" transform="rotate(45 24 56)"/>
          <ellipse cx="56" cy="56" rx="11" ry="7" fill="#FFCC80" transform="rotate(-45 56 56)"/>
          <circle cx="40" cy="40" r="11" fill="#FF8C42"/>
          <circle cx="40" cy="40" r="6" fill="#FFD60A"/>
        </g>
      </svg>`;
  }

  function rabbitMascotSvg() {
    return `
      <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="50" cy="102" rx="24" ry="5" fill="rgba(0,0,0,.08)"/>
        <!-- ears -->
        <ellipse cx="32" cy="28" rx="10" ry="26" fill="#C4A574" transform="rotate(-12 32 28)"/>
        <ellipse cx="32" cy="28" rx="5" ry="16" fill="#E8C4A0" transform="rotate(-12 32 28)"/>
        <ellipse cx="68" cy="28" rx="10" ry="26" fill="#C4A574" transform="rotate(12 68 28)"/>
        <ellipse cx="68" cy="28" rx="5" ry="16" fill="#E8C4A0" transform="rotate(12 68 28)"/>
        <!-- body -->
        <ellipse cx="50" cy="78" rx="22" ry="20" fill="#C4A574"/>
        <ellipse cx="50" cy="82" rx="14" ry="12" fill="#E8C4A0"/>
        <!-- head -->
        <circle cx="50" cy="52" r="22" fill="#C4A574"/>
        <!-- glasses -->
        <circle cx="40" cy="50" r="8" fill="none" stroke="#5C4033" stroke-width="2"/>
        <circle cx="60" cy="50" r="8" fill="none" stroke="#5C4033" stroke-width="2"/>
        <line x1="48" y1="50" x2="52" y2="50" stroke="#5C4033" stroke-width="2"/>
        <circle cx="40" cy="50" r="3" fill="#222"/>
        <circle cx="60" cy="50" r="3" fill="#222"/>
        <circle cx="41.5" cy="48.5" r="1" fill="#fff"/>
        <circle cx="61.5" cy="48.5" r="1" fill="#fff"/>
        <!-- nose / mouth -->
        <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#E8897A"/>
        <path d="M46 62 Q50 66 54 62" fill="none" stroke="#5C4033" stroke-width="1.5" stroke-linecap="round"/>
        <!-- cheeks -->
        <circle cx="32" cy="58" r="4" fill="#E8897A" opacity=".35"/>
        <circle cx="68" cy="58" r="4" fill="#E8897A" opacity=".35"/>
        <!-- paw wave -->
        <ellipse cx="78" cy="70" rx="8" ry="6" fill="#C4A574" transform="rotate(-20 78 70)"/>
        <circle cx="82" cy="66" r="2.2" fill="#E8C4A0"/>
        <circle cx="86" cy="70" r="2.2" fill="#E8C4A0"/>
        <circle cx="82" cy="74" r="2.2" fill="#E8C4A0"/>
      </svg>`;
  }

  function bathDuckSvg(body, beak, faceRight) {
    /* Classic rubber duck; default faces left, flip for right-facing row */
    const b = body || COLORS.yellow;
    const k = beak || COLORS.orange;
    const flip = faceRight ? 'transform="scale(-1,1) translate(-80,0)"' : '';
    return `
      <svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g ${flip}>
          <ellipse cx="36" cy="44" rx="26" ry="17" fill="${b}"/>
          <ellipse cx="24" cy="42" rx="7" ry="5" fill="#fff" opacity=".28"/>
          <path d="M22 40 Q18 32 26 34 Q30 38 28 44Z" fill="${b}" opacity=".92"/>
          <circle cx="56" cy="30" r="15" fill="${b}"/>
          <circle cx="60" cy="27" r="2.4" fill="#222"/>
          <circle cx="61" cy="26" r="0.8" fill="#fff" opacity=".7"/>
          <path d="M68 30 Q82 26 78 36 Q72 38 68 34Z" fill="${k}"/>
          <ellipse cx="72" cy="31" rx="2.2" ry="1.4" fill="#fff" opacity=".35"/>
          <ellipse cx="30" cy="46" rx="9" ry="6" fill="${b}" stroke="rgba(0,0,0,.12)" stroke-width="1.2"/>
        </g>
      </svg>`;
  }

  function doggyInTubSvg() {
    /* Optional cute mascot: orange Doggy in a bubbly clawfoot tub */
    return `
      <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="60" cy="84" rx="40" ry="5" fill="rgba(0,0,0,.08)"/>
        <!-- tub -->
        <path d="M18 48 Q18 78 60 80 Q102 78 102 48 Z" fill="#89C2D9" stroke="#5B9BB5" stroke-width="2"/>
        <ellipse cx="60" cy="48" rx="44" ry="12" fill="#B8DCE8"/>
        <ellipse cx="22" cy="72" rx="5" ry="7" fill="#5B9BB5"/>
        <ellipse cx="98" cy="72" rx="5" ry="7" fill="#5B9BB5"/>
        <!-- suds -->
        <circle cx="36" cy="46" r="7" fill="#fff" opacity=".95"/>
        <circle cx="48" cy="42" r="9" fill="#fff"/>
        <circle cx="62" cy="44" r="8" fill="#fff" opacity=".92"/>
        <circle cx="76" cy="42" r="9" fill="#fff"/>
        <circle cx="88" cy="48" r="6" fill="#fff" opacity=".9"/>
        <!-- doggy head -->
        <circle cx="60" cy="28" r="16" fill="#FF8C42"/>
        <ellipse cx="46" cy="18" rx="6" ry="8" fill="#8B5E3C"/>
        <ellipse cx="74" cy="18" rx="6" ry="8" fill="#8B5E3C"/>
        <circle cx="54" cy="26" r="4.5" fill="#fff"/>
        <circle cx="66" cy="26" r="4.5" fill="#fff"/>
        <circle cx="55" cy="27" r="2" fill="#222"/>
        <circle cx="67" cy="27" r="2" fill="#222"/>
        <ellipse cx="60" cy="33" rx="3.5" ry="2.6" fill="#5C4033"/>
        <path d="M55 38 Q60 42 65 38" fill="none" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>
        <!-- brush -->
        <g transform="translate(78,34) rotate(25)">
          <rect x="0" y="0" width="4" height="18" rx="1.5" fill="#C4A574"/>
          <rect x="-4" y="16" width="12" height="7" rx="2" fill="#8B5E3C"/>
        </g>
        <!-- tiny boat -->
        <g transform="translate(28,50)">
          <path d="M0 8 L18 8 L14 14 L4 14 Z" fill="#FFD60A"/>
          <rect x="7" y="1" width="7" height="7" rx="1" fill="#E63946"/>
          <rect x="9" y="-4" width="2.5" height="6" fill="#E63946"/>
        </g>
        <!-- bubbles -->
        <circle cx="24" cy="30" r="3" fill="#B8DCE8" opacity=".7"/>
        <circle cx="18" cy="20" r="2" fill="#B8DCE8" opacity=".55"/>
        <circle cx="98" cy="28" r="2.5" fill="#B8DCE8" opacity=".65"/>
      </svg>`;
  }

  function doggyMascotSvg() {
    return `
      <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="45" cy="88" rx="22" ry="6" fill="rgba(0,0,0,.08)"/>
        <ellipse cx="45" cy="62" rx="20" ry="22" fill="#FF8C42"/>
        <rect x="30" y="52" width="30" height="28" rx="6" fill="#FFD60A"/>
        <text x="45" y="72" text-anchor="middle" font-size="16" font-weight="800" fill="#8B5E3C" font-family="system-ui,sans-serif">h</text>
        <circle cx="45" cy="32" r="18" fill="#FF8C42"/>
        <ellipse cx="28" cy="22" rx="7" ry="9" fill="#FF8C42"/>
        <ellipse cx="62" cy="22" rx="7" ry="9" fill="#FF8C42"/>
        <circle cx="38" cy="30" r="5" fill="#fff"/>
        <circle cx="52" cy="30" r="5" fill="#fff"/>
        <circle cx="39" cy="31" r="2.2" fill="#222"/>
        <circle cx="53" cy="31" r="2.2" fill="#222"/>
        <ellipse cx="45" cy="38" rx="4" ry="3" fill="#5C4033"/>
        <path d="M40 44 Q45 48 50 44" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round"/>
        <g transform="translate(62,58)">
          <line x1="0" y1="0" x2="8" y2="14" stroke="#3A9B6A" stroke-width="2"/>
          <circle cx="4" cy="-2" r="4" fill="#4361EE"/>
          <circle cx="10" cy="2" r="3.5" fill="#4361EE"/>
          <circle cx="2" cy="4" r="3" fill="#4361EE"/>
          <circle cx="6" cy="2" r="2.5" fill="#FFD60A"/>
        </g>
        <path d="M22 58 Q12 70 18 78 Q26 72 28 64" fill="#8B5E3C"/>
      </svg>`;
  }


  function wormSvg() {
    /* Long pink earthworm: segmented S-curve + simple face */
    return `
      <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 42
                 C18 22 34 16 46 28
                 C56 38 64 52 78 46
                 C92 40 100 24 112 30"
              fill="none" stroke="#E8899A" stroke-width="16" stroke-linecap="round"/>
        <path d="M14 42
                 C18 22 34 16 46 28
                 C56 38 64 52 78 46
                 C92 40 100 24 112 30"
              fill="none" stroke="#FFB4C4" stroke-width="12" stroke-linecap="round"/>
        <!-- segment rings (short cross-marks, not legs) -->
        <g fill="none" stroke="#E8899A" stroke-width="1.7" stroke-linecap="round" opacity=".8">
          <path d="M24 34 L26 44"/>
          <path d="M34 28 L38 40"/>
          <path d="M46 28 L48 40"/>
          <path d="M56 36 L54 48"/>
          <path d="M66 44 L64 54"/>
          <path d="M76 42 L80 52"/>
          <path d="M88 36 L94 46"/>
          <path d="M100 30 L106 40"/>
        </g>
        <path d="M22 38 C30 30 42 32 50 38 C60 46 72 50 84 44"
              fill="none" stroke="#FFE0E8" stroke-width="3.2" stroke-linecap="round" opacity=".55"/>
        <circle cx="16" cy="40" r="2.5" fill="#5C4033"/>
        <circle cx="22" cy="36" r="2.5" fill="#5C4033"/>
        <circle cx="16.7" cy="39.3" r="0.8" fill="#fff"/>
        <circle cx="22.7" cy="35.3" r="0.8" fill="#fff"/>
        <path d="M16 46 Q19.5 49.5 23.5 46" fill="none" stroke="#C45C74" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M12 34 Q10 26 14 24" fill="none" stroke="#FF8FAB" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M18 32 Q20 24 24 23" fill="none" stroke="#FF8FAB" stroke-width="2.1" stroke-linecap="round"/>
        <circle cx="14" cy="24" r="1.7" fill="#FF8FAB"/>
        <circle cx="24" cy="23" r="1.7" fill="#FF8FAB"/>
      </svg>`;
  }

  function hedgehogSvg() {
    return `
      <svg viewBox="0 0 110 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g stroke="#5C4033" stroke-width="2.2" stroke-linecap="round">
          <line x1="48" y1="38" x2="42" y2="12"/><line x1="56" y1="36" x2="56" y2="8"/>
          <line x1="64" y1="36" x2="70" y2="10"/><line x1="72" y1="40" x2="88" y2="18"/>
          <line x1="40" y1="42" x2="28" y2="22"/><line x1="78" y1="44" x2="96" y2="30"/>
          <line x1="36" y1="50" x2="18" y2="40"/><line x1="82" y1="52" x2="100" y2="48"/>
          <line x1="52" y1="32" x2="48" y2="6"/><line x1="68" y1="32" x2="76" y2="6"/>
        </g>
        <ellipse cx="58" cy="50" rx="30" ry="20" fill="#C4A574" stroke="#8B5E3C" stroke-width="2"/>
        <ellipse cx="30" cy="52" rx="14" ry="12" fill="#E8D5B5" stroke="#8B5E3C" stroke-width="1.8"/>
        <ellipse cx="18" cy="54" rx="7" ry="5" fill="#D4B896"/>
        <circle cx="24" cy="48" r="2.2" fill="#222"/>
        <circle cx="24.7" cy="47.3" r="0.7" fill="#fff"/>
        <circle cx="14" cy="54" r="1.4" fill="#5C4033"/>
        <path d="M26 58 Q30 62 34 58" fill="none" stroke="#8B5E3C" stroke-width="1.5" stroke-linecap="round"/>
        <ellipse cx="46" cy="66" rx="4" ry="3" fill="#8B5E3C"/>
        <ellipse cx="66" cy="66" rx="4" ry="3" fill="#8B5E3C"/>
      </svg>`;
  }

  function mouseFullSvg() {
    return `
      <svg viewBox="0 0 110 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M78 48 Q98 28 104 48 Q96 62 78 54" fill="none" stroke="#FF8FAB" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="52" cy="48" rx="26" ry="18" fill="#B0B8C4" stroke="#7A8494" stroke-width="2"/>
        <circle cx="28" cy="42" r="14" fill="#C5CCD6" stroke="#7A8494" stroke-width="2"/>
        <circle cx="18" cy="28" r="9" fill="#C5CCD6" stroke="#7A8494" stroke-width="1.8"/>
        <circle cx="34" cy="26" r="9" fill="#C5CCD6" stroke="#7A8494" stroke-width="1.8"/>
        <circle cx="18" cy="28" r="5" fill="#FFB4C4"/>
        <circle cx="34" cy="26" r="5" fill="#FFB4C4"/>
        <ellipse cx="16" cy="46" rx="6" ry="4" fill="#9AA3B0"/>
        <circle cx="24" cy="40" r="2.2" fill="#222"/>
        <circle cx="24.7" cy="39.3" r="0.7" fill="#fff"/>
        <path d="M12 40 L4 36 M12 44 L4 46" stroke="#7A8494" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="42" cy="62" rx="4" ry="3" fill="#7A8494"/>
        <ellipse cx="60" cy="62" rx="4" ry="3" fill="#7A8494"/>
      </svg>`;
  }

  function snailSvg() {
    return `
      <svg viewBox="0 0 110 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 58 C28 52 48 50 62 56 C72 60 78 64 82 62" fill="none" stroke="#C4A574" stroke-width="12" stroke-linecap="round"/>
        <path d="M18 58 C28 52 48 50 62 56 C72 60 78 64 82 62" fill="none" stroke="#E8D5B5" stroke-width="8" stroke-linecap="round"/>
        <circle cx="72" cy="40" r="22" fill="#FFD60A" stroke="#E0B000" stroke-width="2"/>
        <path d="M72 40 Q84 40 84 28 Q84 18 72 18 Q60 18 60 30 Q60 40 72 40 Q78 40 78 34"
              fill="none" stroke="#E0B000" stroke-width="3" stroke-linecap="round"/>
        <circle cx="72" cy="40" r="4" fill="#F4A261"/>
        <circle cx="22" cy="54" r="7" fill="#E8D5B5" stroke="#C4A574" stroke-width="1.5"/>
        <circle cx="20" cy="52" r="1.8" fill="#222"/>
        <path d="M18 48 L14 36 M24 48 L28 36" stroke="#C4A574" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="14" cy="34" r="2.5" fill="#FF8FAB"/>
        <circle cx="28" cy="34" r="2.5" fill="#FF8FAB"/>
      </svg>`;
  }


  function leafHedgehogSvg() {
    /* Maple leaf — hedgehog spines peek top-right */
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M50 92 L47 60
                 C36 66 26 74 20 82 C16 70 22 54 32 48
                 C20 46 10 40 8 28 C20 32 32 38 40 44
                 C32 30 30 16 36 6 C44 16 48 30 50 42
                 C52 30 56 16 64 6 C70 16 68 30 60 44
                 C68 38 80 32 92 28 C90 40 80 46 68 48
                 C78 54 84 70 80 82 C74 74 64 66 53 60 Z"
              fill="#E76F3C" stroke="#C45C2A" stroke-width="2"/>
        <path d="M50 92 L50 44" fill="none" stroke="#C45C2A" stroke-width="1.6"/>
        <g stroke="#5C4033" stroke-width="2" stroke-linecap="round">
          <line x1="78" y1="28" x2="90" y2="14"/>
          <line x1="74" y1="22" x2="82" y2="8"/>
          <line x1="70" y1="26" x2="78" y2="10"/>
          <line x1="82" y1="34" x2="96" y2="24"/>
        </g>
        <ellipse cx="76" cy="30" rx="8" ry="6" fill="#C4A574" stroke="#8B5E3C" stroke-width="1.2"/>
      </svg>`;
  }

  function leafSnailSvg() {
    /* Oak leaf — snail antennae peek right */
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M50 92 L48 58
                 C38 64 26 60 22 50 C30 50 38 48 44 44
                 C32 40 22 32 20 20 C30 26 40 32 48 38
                 C42 26 44 14 50 8 C56 14 58 26 52 38
                 C60 32 70 26 80 20 C78 32 68 40 56 44
                 C62 48 70 50 78 50 C74 60 62 64 52 58 Z"
              fill="#E63946" stroke="#C1121F" stroke-width="2"/>
        <path d="M50 92 L50 30" fill="none" stroke="#C1121F" stroke-width="1.5"/>
        <ellipse cx="84" cy="48" rx="7" ry="5" fill="#E8D5B5" stroke="#C4A574" stroke-width="1.2"/>
        <path d="M86 44 L90 34 M90 46 L96 38" stroke="#C4A574" stroke-width="2" stroke-linecap="round"/>
        <circle cx="90" cy="32" r="2.2" fill="#FF8FAB"/>
        <circle cx="96" cy="36" r="2.2" fill="#FF8FAB"/>
      </svg>`;
  }

  function leafWormSvg() {
    /* Serrated birch-style leaf — pink worm segment bottom-right */
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M50 94 L48 56
                 C36 60 26 52 24 40 C30 44 38 46 44 42
                 C32 36 26 24 30 12 C38 20 46 30 49 42
                 C52 30 60 20 68 12 C72 24 66 36 56 42
                 C64 46 72 44 78 40 C76 52 66 60 52 56 Z"
              fill="#E09F3E" stroke="#C47E1A" stroke-width="2"/>
        <path d="M50 94 L50 28" fill="none" stroke="#C47E1A" stroke-width="1.5"/>
        <path d="M30 24 L36 28 M34 40 L40 42 M62 24 L58 30 M66 40 L60 42"
              stroke="#C47E1A" stroke-width="1.2" opacity=".5"/>
        <path d="M72 70 C78 64 86 66 90 74 C86 80 78 78 72 70 Z" fill="#FF8FAB" stroke="#E8899A" stroke-width="1.3"/>
        <path d="M76 68 Q80 72 78 76" fill="none" stroke="#E8899A" stroke-width="1.1" opacity=".6"/>
      </svg>`;
  }

  function leafMouseSvg() {
    /* Chestnut compound leaf — mouse head + pink tail */
    return `
      <svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="55" y1="90" x2="55" y2="48" stroke="#B08968" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="55" cy="28" rx="10" ry="22" fill="#D4A373" stroke="#B08968" stroke-width="1.6"/>
        <ellipse cx="34" cy="40" rx="9" ry="20" fill="#D4A373" stroke="#B08968" stroke-width="1.6" transform="rotate(-28 34 40)"/>
        <ellipse cx="76" cy="40" rx="9" ry="20" fill="#D4A373" stroke="#B08968" stroke-width="1.6" transform="rotate(28 76 40)"/>
        <ellipse cx="24" cy="56" rx="8" ry="18" fill="#D4A373" stroke="#B08968" stroke-width="1.6" transform="rotate(-48 24 56)"/>
        <ellipse cx="86" cy="56" rx="8" ry="18" fill="#D4A373" stroke="#B08968" stroke-width="1.6" transform="rotate(48 86 56)"/>
        <circle cx="78" cy="72" r="10" fill="#B0B8C4" stroke="#7A8494" stroke-width="1.5"/>
        <circle cx="72" cy="64" r="5.5" fill="#C5CCD6" stroke="#7A8494" stroke-width="1.2"/>
        <circle cx="84" cy="64" r="5.5" fill="#C5CCD6" stroke="#7A8494" stroke-width="1.2"/>
        <circle cx="72" cy="64" r="2.8" fill="#FFB4C4"/>
        <circle cx="84" cy="64" r="2.8" fill="#FFB4C4"/>
        <circle cx="76" cy="72" r="1.6" fill="#222"/>
        <circle cx="82" cy="72" r="1.6" fill="#222"/>
        <path d="M88 78 Q102 70 106 82" fill="none" stroke="#FF8FAB" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
  }




  /* —— Doggys Fußbälle (Suchbild / circle-draw) —— */
  function soccerBallSvg() {
    /* Classic B/W football (truncated-icosahedron panels), kids-clear */
    return `
      <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle fill="#FFFFFF" cx="18" cy="18" r="17.2" stroke="#1E293B" stroke-width="1.4"/>
        <path d="M18 11c-.552 0-1-.448-1-1V3c0-.552.448-1 1-1s1 .448 1 1v7c0 .552-.448 1-1 1zm-6.583 4.5c-.1 0-.202-.015-.302-.047l-8.041-2.542c-.527-.167-.819-.728-.652-1.255.166-.527.73-.818 1.255-.652l8.042 2.542c.527.167.819.729.652 1.255-.136.426-.53.699-.954.699zm13.625-.291c-.434 0-.833-.285-.96-.722-.154-.531.151-1.085.682-1.239l6.75-1.958c.531-.153 1.085.153 1.238.682.154.531-.151 1.085-.682 1.239l-6.75 1.958c-.092.027-.186.04-.278.04zm2.001 14.958c-.306 0-.606-.14-.803-.403l-5.459-7.333c-.33-.442-.238-1.069.205-1.399.442-.331 1.069-.238 1.399.205l5.459 7.333c.33.442.238 1.069-.205 1.399-.179.134-.389.198-.596.198zm-18.294-.083c-.197 0-.395-.058-.57-.179-.454-.316-.565-.938-.25-1.392l5.125-7.375c.315-.454.938-.566 1.392-.251.454.315.565.939.25 1.392l-5.125 7.375c-.194.281-.506.43-.822.43zM3.5 27.062c-.44 0-.844-.293-.965-.738L.347 18.262c-.145-.533.17-1.082.704-1.227.535-.141 1.083.171 1.227.704l2.188 8.062c.145.533-.17 1.082-.704 1.226-.088.025-.176.035-.262.035zM22 34h-9c-.552 0-1-.447-1-1s.448-1 1-1h9c.553 0 1 .447 1 1s-.447 1-1 1zm10.126-6.875c-.079 0-.16-.009-.24-.029-.536-.132-.864-.674-.731-1.21l2.125-8.625c.133-.536.679-.862 1.21-.732.536.132.864.674.731 1.211l-2.125 8.625c-.113.455-.521.76-.97.76zM30.312 7.688c-.17 0-.342-.043-.5-.134L22.25 3.179c-.478-.277-.642-.888-.364-1.367.275-.478.886-.643 1.366-.365l7.562 4.375c.478.277.642.888.364 1.367-.185.32-.521.499-.866.499zm-24.811 0c-.312 0-.618-.145-.813-.417-.322-.45-.22-1.074.229-1.396l6.188-4.438c.449-.322 1.074-.219 1.396.229.322.449.219 1.074-.229 1.396L6.083 7.5c-.177.126-.38.188-.582.188z" fill="#94A3B8"/>
        <path d="M25.493 13.516l-7.208-5.083c-.348-.245-.814-.243-1.161.006l-7.167 5.167c-.343.248-.494.684-.375 1.091l2.5 8.583c.124.426.515.72.96.72H22c.43 0 .81-.274.948-.681l2.917-8.667c.141-.419-.011-.881-.372-1.136zM1.292 19.542c.058 0 .117-.005.175-.016.294-.052.55-.233.697-.494l3.375-6c.051-.091.087-.188.108-.291L6.98 6.2c.06-.294-.016-.6-.206-.832C6.584 5.135 6.3 5 6 5h-.428C2.145 8.277 0 12.884 0 18c0 .266.028.525.04.788l.602.514c.182.156.413.24.65.24zm9.325-16.547c.106.219.313.373.553.412l6.375 1.042c.04.006.081.01.121.01.04 0 .081-.003.122-.01l6.084-1c.2-.033.38-.146.495-.314.116-.168.158-.375.118-.575l-.292-1.443C22.26.407 20.18 0 18 0c-2.425 0-4.734.486-6.845 1.356l-.521.95c-.117.213-.123.47-.017.689zm20.517 2.724l-1.504-.095c-.228-.013-.455.076-.609.249-.152.173-.218.402-.175.63l1.167 6.198c.017.086.048.148.093.224 1.492 2.504 3.152 5.301 3.381 5.782.024.084.062.079.114.151.14.195.372.142.612.142h.007c.198 0 .323.094 1.768-.753.001-.083.012-.164.012-.247 0-4.753-1.856-9.064-4.866-12.281zM14.541 33.376c.011-.199-.058-.395-.191-.544l-4.5-5c-.06-.066-.131-.122-.211-.163-5.885-3.069-5.994-3.105-6.066-3.13-.078-.025-.161-.039-.242-.039-.537 0-.695.065-1.185 2.024 2.236 4.149 6.053 7.316 10.644 8.703l1.5-1.333c.149-.132.239-.319.251-.518zm17.833-8.567c-.189-.08-.405-.078-.592.005l-6.083 2.667c-.106.046-.2.116-.274.205l-4.25 5.083c-.129.154-.19.352-.172.552.02.2.117.384.272.51.683.559 1.261 1.03 1.767 1.44 4.437-1.294 8.154-4.248 10.454-8.146l-.712-1.889c-.072-.193-.221-.347-.41-.427z" fill="#1E293B"/>
        <ellipse cx="11" cy="11" rx="4" ry="2.5" fill="#fff" opacity=".4"/>
      </svg>`;
  }

  function beachBallSvg(rot) {
    const r = rot == null ? -15 : rot;
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 40 40)">
          <circle cx="40" cy="40" r="28" fill="#FF6B9D" stroke="rgba(0,0,0,.18)" stroke-width="2.2"/>
          <path d="M12 40 A28 28 0 0 1 68 40 A28 28 0 0 1 12 40" fill="#FFD60A"/>
          <path d="M40 12 A28 28 0 0 1 40 68 A28 28 0 0 1 40 12" fill="#4361EE" opacity=".85"/>
          <path d="M16 28 Q40 40 64 28" fill="none" stroke="#52B788" stroke-width="14" stroke-linecap="round" opacity=".9"/>
          <circle cx="40" cy="40" r="5" fill="#fff" opacity=".5"/>
        </g>
        <ellipse cx="30" cy="30" rx="7" ry="4" fill="#fff" opacity=".35"/>
      </svg>`;
  }

  function playgroundBallSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="40" cy="40" r="28" fill="#FF8C42" stroke="#E76F3C" stroke-width="2.5"/>
        <path d="M40 12 Q52 40 40 68 Q28 40 40 12 Z" fill="none" stroke="#E76F3C" stroke-width="2"/>
        <path d="M14 28 Q40 36 66 28" fill="none" stroke="#E76F3C" stroke-width="2"/>
        <path d="M14 52 Q40 44 66 52" fill="none" stroke="#E76F3C" stroke-width="2"/>
        <circle cx="40" cy="40" r="4" fill="#E76F3C"/>
        <ellipse cx="30" cy="30" rx="7" ry="4" fill="#fff" opacity=".28"/>
      </svg>`;
  }

  function sheepSvg() {
    return `
      <svg viewBox="0 0 90 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="48" cy="48" rx="28" ry="22" fill="#F5F5F5" stroke="#94A3B8" stroke-width="2"/>
        <circle cx="28" cy="40" r="8" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="68" cy="40" r="8" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="48" cy="28" r="9" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="48" cy="64" r="7" fill="#F5F5F5" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="22" cy="46" r="10" fill="#FFF8E7" stroke="#E2C97E" stroke-width="1.5"/>
        <ellipse cx="14" cy="40" rx="3.5" ry="5" fill="#5C4033"/>
        <ellipse cx="18" cy="52" rx="3.5" ry="5" fill="#5C4033"/>
        <circle cx="20" cy="44" r="1.6" fill="#222"/>
        <circle cx="26" cy="44" r="1.6" fill="#222"/>
        <ellipse cx="23" cy="48" rx="2.2" ry="1.6" fill="#5C4033"/>
        <circle cx="40" cy="42" r="2.2" fill="#334155" opacity=".45"/>
        <circle cx="56" cy="50" r="2" fill="#334155" opacity=".4"/>
        <circle cx="50" cy="36" r="1.8" fill="#334155" opacity=".35"/>
        <circle cx="62" cy="44" r="1.6" fill="#334155" opacity=".4"/>
        <rect x="38" y="66" width="5" height="10" rx="2" fill="#5C4033"/>
        <rect x="52" y="66" width="5" height="10" rx="2" fill="#5C4033"/>
      </svg>`;
  }

  function elephantSvg() {
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="52" cy="52" rx="30" ry="22" fill="#B0BEC5" stroke="#2D3436" stroke-width="2.2"/>
        <circle cx="28" cy="44" r="16" fill="#B0BEC5" stroke="#2D3436" stroke-width="2.2"/>
        <path d="M18 50 Q8 68 16 78 Q22 72 24 58" fill="#90A4AE" stroke="#2D3436" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="14" cy="38" rx="5" ry="8" fill="#90A4AE" stroke="#2D3436" stroke-width="1.6"/>
        <ellipse cx="34" cy="34" rx="5" ry="8" fill="#90A4AE" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="24" cy="42" r="2.2" fill="#222"/>
        <circle cx="34" cy="42" r="2.2" fill="#222"/>
        <path d="M78 48 Q92 40 88 58 Q82 62 76 56" fill="#90A4AE" stroke="#2D3436" stroke-width="1.8"/>
        <rect x="40" y="68" width="7" height="14" rx="3" fill="#78909C" stroke="#2D3436" stroke-width="1.4"/>
        <rect x="58" y="68" width="7" height="14" rx="3" fill="#78909C" stroke="#2D3436" stroke-width="1.4"/>
        <ellipse cx="44" cy="48" rx="5" ry="3" fill="#fff" opacity=".3"/>
      </svg>`;
  }

  function lionSvg() {
    return `
      <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="50" cy="48" r="28" fill="#E17055" stroke="#2D3436" stroke-width="2.2"/>
        <circle cx="50" cy="48" r="18" fill="#F4A261" stroke="#2D3436" stroke-width="2"/>
        <circle cx="42" cy="44" r="2.4" fill="#222"/>
        <circle cx="58" cy="44" r="2.4" fill="#222"/>
        <ellipse cx="50" cy="52" rx="4" ry="3" fill="#E76F3C"/>
        <path d="M44 58 Q50 64 56 58" fill="none" stroke="#2D3436" stroke-width="2" stroke-linecap="round"/>
        <circle cx="28" cy="30" r="7" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="72" cy="30" r="7" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="24" cy="50" r="7" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="76" cy="50" r="7" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="36" cy="68" r="6" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <circle cx="64" cy="68" r="6" fill="#E17055" stroke="#2D3436" stroke-width="1.6"/>
        <ellipse cx="44" cy="40" rx="3" ry="2" fill="#fff" opacity=".35"/>
      </svg>`;
  }


  function searchDuckSvg() {
    return `
      <svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="40" cy="42" rx="24" ry="16" fill="#FFD60A"/>
        <circle cx="58" cy="28" r="14" fill="#FFD60A"/>
        <circle cx="62" cy="26" r="2.2" fill="#222"/>
        <circle cx="63" cy="25" r="0.7" fill="#fff" opacity=".7"/>
        <path d="M70 28 Q84 26 78 34 Q72 36 70 32Z" fill="#FF8C42"/>
        <ellipse cx="28" cy="40" rx="6" ry="4" fill="#FFE66D"/>
        <path d="M30 56 Q34 64 38 56 M42 56 Q46 64 50 56" fill="none" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
  }

  function wateringCanSvg() {
    return `
      <svg viewBox="0 0 90 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 30 H58 L62 62 H18 Z" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
        <path d="M58 34 Q78 28 82 42 Q78 48 62 46" fill="none" stroke="#2D6A4F" stroke-width="5" stroke-linecap="round"/>
        <path d="M28 30 Q40 14 54 30" fill="none" stroke="#2D6A4F" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="40" cy="30" rx="18" ry="5" fill="#74C69D"/>
        <circle cx="82" cy="42" r="3" fill="#2D6A4F"/>
        <rect x="22" y="38" width="10" height="6" rx="1" fill="#fff" opacity=".25"/>
      </svg>`;
  }

  function shovelSvg() {
    return `
      <svg viewBox="0 0 70 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="30" y="8" width="8" height="48" rx="3" fill="#C4A574" stroke="#8B5E3C" stroke-width="1.5"/>
        <rect x="26" y="4" width="16" height="10" rx="3" fill="#8B5E3C"/>
        <path d="M18 56 H50 L46 90 Q38 98 30 90 Z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
        <path d="M24 62 H44" stroke="#CBD5E1" stroke-width="2" opacity=".6"/>
      </svg>`;
  }

  function bucketSvg() {
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22 28 H58 L54 68 H26 Z" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
        <ellipse cx="40" cy="28" rx="18" ry="6" fill="#74C69D" stroke="#2D6A4F" stroke-width="1.5"/>
        <path d="M28 28 Q40 10 52 28" fill="none" stroke="#2D6A4F" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="30" y="40" width="20" height="8" rx="2" fill="#fff" opacity=".22"/>
      </svg>`;
  }

  function flowerPotSvg() {
    return `
      <svg viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="22" width="38" height="10" rx="2" fill="#E76F3C"/>
        <path d="M20 32 H50 L46 68 H24 Z" fill="#D4693B" stroke="#B45309" stroke-width="1.5"/>
        <ellipse cx="35" cy="22" rx="20" ry="5" fill="#F4A261"/>
        <rect x="26" y="40" width="18" height="6" rx="1" fill="#fff" opacity=".2"/>
      </svg>`;
  }

  function capSvg(color) {
    const c = color || '#A3CB38';
    return `
      <svg viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="40" cy="42" rx="28" ry="16" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>
        <path d="M14 42 Q40 18 66 42" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>
        <path d="M66 40 Q84 38 86 46 Q70 52 60 48" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
        <ellipse cx="34" cy="34" rx="8" ry="4" fill="#fff" opacity=".28"/>
        <circle cx="40" cy="30" r="3" fill="#FFD60A"/>
      </svg>`;
  }

  function sunglassesSvg() {
    return `
      <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="12" y="14" width="28" height="22" rx="8" fill="#4361EE" stroke="#1E3A8A" stroke-width="2.5"/>
        <rect x="60" y="14" width="28" height="22" rx="8" fill="#4361EE" stroke="#1E3A8A" stroke-width="2.5"/>
        <path d="M40 24 H60" stroke="#1E3A8A" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M12 20 Q4 16 2 22" fill="none" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round"/>
        <path d="M88 20 Q96 16 98 22" fill="none" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round"/>
        <rect x="16" y="18" width="10" height="6" rx="2" fill="#fff" opacity=".35"/>
        <rect x="64" y="18" width="10" height="6" rx="2" fill="#fff" opacity=".35"/>
      </svg>`;
  }

  function rocksSvg() {
    return `
      <svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="28" cy="36" rx="18" ry="14" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>
        <ellipse cx="52" cy="40" rx="16" ry="12" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
        <ellipse cx="40" cy="24" rx="12" ry="10" fill="#A8B4C4" stroke="#64748B" stroke-width="1.5"/>
        <ellipse cx="22" cy="30" rx="4" ry="2.5" fill="#fff" opacity=".25"/>
      </svg>`;
  }

  function stickSvg(rot) {
    const r = rot == null ? -30 : rot;
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="rotate(${r} 40 40)">
          <path d="M18 50 Q30 28 42 22 Q55 18 64 28" fill="none" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round"/>
          <path d="M42 22 Q48 30 46 40" fill="none" stroke="#A67C52" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="64" cy="28" r="3" fill="#6B4423"/>
        </g>
      </svg>`;
  }

  function archBlockSvg() {
    return `
      <svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 58 V28 Q10 10 40 10 Q70 10 70 28 V58 H54 V30 Q54 22 40 22 Q26 22 26 30 V58 Z"
          fill="#52B788" stroke="#2D6A4F" stroke-width="2.2"/>
        <rect x="14" y="44" width="12" height="6" rx="1" fill="#fff" opacity=".25"/>
      </svg>`;
  }


  const EXERCISES = {
    bonbons: {
      title: 'Bunte Bonbons',
      hint: 'Verbinde jedes Bonbon mit dem passenden Korb!',
      mode: 'many-to-one',
      sources: [
        { id: 'c1', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.18, y: 0.14, w: 0.14, aspect: 0.65 },
        { id: 'c2', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.42, y: 0.12, w: 0.14, aspect: 0.65 },
        { id: 'c3', match: 'yellow', svg: () => candySvg(COLORS.yellow), x: 0.68, y: 0.15, w: 0.14, aspect: 0.65 },
        { id: 'c4', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.28, y: 0.32, w: 0.14, aspect: 0.65 },
        { id: 'c5', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.55, y: 0.30, w: 0.14, aspect: 0.65 },
        { id: 'c6', match: 'yellow', svg: () => candySvg(COLORS.yellow), x: 0.82, y: 0.34, w: 0.14, aspect: 0.65 },
        { id: 'c7', match: 'green',  svg: () => candySvg(COLORS.green),  x: 0.14, y: 0.48, w: 0.14, aspect: 0.65 },
        { id: 'c8', match: 'red',    svg: () => candySvg(COLORS.red),    x: 0.40, y: 0.50, w: 0.14, aspect: 0.65 },
      ],
      targets: [
        { id: 'green',  match: 'green',  svg: () => basketSvg(COLORS.green),  x: 0.20, y: 0.82, w: 0.22, aspect: 0.9 },
        { id: 'red',    match: 'red',    svg: () => basketSvg(COLORS.red),    x: 0.50, y: 0.82, w: 0.22, aspect: 0.9 },
        { id: 'yellow', match: 'yellow', svg: () => basketSvg(COLORS.yellow), x: 0.80, y: 0.82, w: 0.22, aspect: 0.9 },
      ],
    },
    schneemaenner: {
      title: 'Schneemänner',
      hint: 'Welche Mütze gehört zu welchem Schneemann? Verbinde!',
      mode: 'one-to-one',
      sources: [
        { id: 'h1', match: 'ry', svg: () => hatSvg(COLORS.red, COLORS.yellow),  x: 0.18, y: 0.16, w: 0.15, aspect: 1.05 },
        { id: 'h2', match: 'yo', svg: () => hatSvg(COLORS.yellow, COLORS.orange), x: 0.18, y: 0.39, w: 0.15, aspect: 1.05 },
        { id: 'h3', match: 'tp', svg: () => hatSvg(COLORS.teal, COLORS.pink),   x: 0.18, y: 0.62, w: 0.15, aspect: 1.05 },
        { id: 'h4', match: 'bg', svg: () => hatSvg(COLORS.blue, COLORS.green),  x: 0.18, y: 0.85, w: 0.15, aspect: 1.05 },
      ],
      targets: [
        { id: 't_tp', match: 'tp', svg: () => snowmanSvg(COLORS.teal, COLORS.pink),   x: 0.78, y: 0.16, w: 0.18, aspect: 1.15 },
        { id: 't_bg', match: 'bg', svg: () => snowmanSvg(COLORS.blue, COLORS.green),  x: 0.78, y: 0.39, w: 0.18, aspect: 1.15 },
        { id: 't_ry', match: 'ry', svg: () => snowmanSvg(COLORS.red, COLORS.yellow),  x: 0.78, y: 0.62, w: 0.18, aspect: 1.15 },
        { id: 't_yo', match: 'yo', svg: () => snowmanSvg(COLORS.yellow, COLORS.orange), x: 0.78, y: 0.85, w: 0.18, aspect: 1.15 },
      ],
    },
    tiere: {
      title: 'Tiere zum Stall',
      hint: 'Welches Tier gehört in welchen Stall? Verbinde!',
      mode: 'one-to-one',
      sources: [
        { id: 'cow', match: 'cow', svg: cowSvg, x: 0.20, y: 0.16, w: 0.20, aspect: 0.9 },
        { id: 'pig', match: 'pig', svg: pigSvg, x: 0.20, y: 0.39, w: 0.20, aspect: 0.9 },
        { id: 'chicken', match: 'chicken', svg: chickenSvg, x: 0.20, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 'horse', match: 'horse', svg: horseSvg, x: 0.20, y: 0.85, w: 0.20, aspect: 0.9 },
      ],
      targets: [
        { id: 'b_chicken', match: 'chicken', svg: () => barnSvg('#FFD60A', 'chicken'), x: 0.78, y: 0.16, w: 0.20, aspect: 1.0 },
        { id: 'b_horse', match: 'horse', svg: () => barnSvg('#C4A574', 'horse'), x: 0.78, y: 0.39, w: 0.20, aspect: 1.0 },
        { id: 'b_cow', match: 'cow', svg: () => barnSvg('#8B5E3C', 'cow'), x: 0.78, y: 0.62, w: 0.20, aspect: 1.0 },
        { id: 'b_pig', match: 'pig', svg: () => barnSvg('#FF6B9D', 'pig'), x: 0.78, y: 0.85, w: 0.20, aspect: 1.0 },
      ],
    },
    formen: {
      title: 'Formen zuordnen',
      hint: 'Lege jede Form in den passenden Schatten!',
      mode: 'one-to-one',
      sources: [
        { id: 's_circle', match: 'circle', svg: () => shapeCircle(COLORS.pink), x: 0.20, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 's_tri', match: 'triangle', svg: () => shapeTriangle(COLORS.teal), x: 0.20, y: 0.39, w: 0.18, aspect: 1.0 },
        { id: 's_star', match: 'star', svg: () => shapeStar(COLORS.yellow), x: 0.20, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 's_sq', match: 'square', svg: () => shapeSquare(COLORS.blue), x: 0.20, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
      targets: [
        { id: 't_star', match: 'star', svg: () => shapeSlot('star'), x: 0.78, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 't_sq', match: 'square', svg: () => shapeSlot('square'), x: 0.78, y: 0.39, w: 0.18, aspect: 1.0 },
        { id: 't_circle', match: 'circle', svg: () => shapeSlot('circle'), x: 0.78, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 't_tri', match: 'triangle', svg: () => shapeSlot('triangle'), x: 0.78, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
    },
    socken: {
      title: 'Socken-Paare',
      hint: 'Finde die passende Socke! Verbinde die Paare!',
      mode: 'one-to-one',
      sources: [
        { id: 'sk1', match: 'stripes', svg: () => sockSvg(COLORS.red, 'stripes'), x: 0.20, y: 0.16, w: 0.16, aspect: 1.25 },
        { id: 'sk2', match: 'dots', svg: () => sockSvg(COLORS.blue, 'dots'), x: 0.20, y: 0.39, w: 0.16, aspect: 1.25 },
        { id: 'sk3', match: 'zigzag', svg: () => sockSvg(COLORS.green, 'zigzag'), x: 0.20, y: 0.62, w: 0.16, aspect: 1.25 },
        { id: 'sk4', match: 'hearts', svg: () => sockSvg(COLORS.pink, 'hearts'), x: 0.20, y: 0.85, w: 0.16, aspect: 1.25 },
      ],
      targets: [
        { id: 'tk_zigzag', match: 'zigzag', svg: () => sockSvg(COLORS.green, 'zigzag'), x: 0.78, y: 0.16, w: 0.16, aspect: 1.25 },
        { id: 'tk_hearts', match: 'hearts', svg: () => sockSvg(COLORS.pink, 'hearts'), x: 0.78, y: 0.39, w: 0.16, aspect: 1.25 },
        { id: 'tk_stripes', match: 'stripes', svg: () => sockSvg(COLORS.red, 'stripes'), x: 0.78, y: 0.62, w: 0.16, aspect: 1.25 },
        { id: 'tk_dots', match: 'dots', svg: () => sockSvg(COLORS.blue, 'dots'), x: 0.78, y: 0.85, w: 0.16, aspect: 1.25 },
      ],
    },
    zahlen: {
      title: 'Zahlen und Mengen',
      hint: 'Wie viele Punkte? Verbinde mit der richtigen Zahl!',
      mode: 'one-to-one',
      sources: [
        { id: 'd2', match: 'n2', svg: () => dotsSvg(2, COLORS.orange), x: 0.20, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 'd5', match: 'n5', svg: () => dotsSvg(5, COLORS.purple), x: 0.20, y: 0.39, w: 0.18, aspect: 1.0 },
        { id: 'd3', match: 'n3', svg: () => dotsSvg(3, COLORS.teal), x: 0.20, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 'd4', match: 'n4', svg: () => dotsSvg(4, COLORS.pink), x: 0.20, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
      targets: [
        { id: 'n3', match: 'n3', svg: () => numeralSvg(3, COLORS.teal), x: 0.78, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 'n2', match: 'n2', svg: () => numeralSvg(2, COLORS.orange), x: 0.78, y: 0.39, w: 0.18, aspect: 1.0 },
        { id: 'n5', match: 'n5', svg: () => numeralSvg(5, COLORS.purple), x: 0.78, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 'n4', match: 'n4', svg: () => numeralSvg(4, COLORS.pink), x: 0.78, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
    },
    kleidung: {
      title: 'Kleidung zum Wetter',
      hint: 'Verbinde gleiche Farben! Gelber Hut zur Sonne, blauer Mantel zum Regen…',
      mode: 'one-to-one',
      sources: [
        { id: 'coat', match: 'rain', svg: raincoatSvg, x: 0.20, y: 0.16, w: 0.16, aspect: 1.15 },
        { id: 'hat', match: 'sun', svg: sunhatSvg, x: 0.20, y: 0.39, w: 0.18, aspect: 0.8 },
        { id: 'scarf', match: 'snow', svg: scarfSvg, x: 0.20, y: 0.62, w: 0.18, aspect: 0.9 },
        { id: 'swim', match: 'beach', svg: swimSvg, x: 0.20, y: 0.85, w: 0.16, aspect: 0.9 },
      ],
      targets: [
        { id: 'w_snow', match: 'snow', svg: snowflakeSvg, x: 0.78, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 'w_beach', match: 'beach', svg: wavesSvg, x: 0.78, y: 0.39, w: 0.18, aspect: 0.8 },
        { id: 'w_rain', match: 'rain', svg: rainCloudSvg, x: 0.78, y: 0.62, w: 0.18, aspect: 0.9 },
        { id: 'w_sun', match: 'sun', svg: sunSvg, x: 0.78, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
    },
    einsZweiDrei: {
      title: 'Eins, zwei oder drei',
      hint: 'Wie viele Schiffe? Verbinde mit den passenden Fingern!',
      mode: 'one-to-one',
      sources: [
        { id: 'b3', match: 'n3', svg: () => sailboatsCardSvg(3, COLORS.green), x: 0.20, y: 0.22, w: 0.24, aspect: 1.0 },
        { id: 'b2', match: 'n2', svg: () => sailboatsCardSvg(2, COLORS.red),   x: 0.50, y: 0.22, w: 0.24, aspect: 1.0 },
        { id: 'b1', match: 'n1', svg: () => sailboatsCardSvg(1, COLORS.blue),  x: 0.80, y: 0.22, w: 0.24, aspect: 1.0 },
      ],
      targets: [
        { id: 'h1', match: 'n1', svg: () => handSvg(1), x: 0.20, y: 0.78, w: 0.22, aspect: 1.1 },
        { id: 'h2', match: 'n2', svg: () => handSvg(2), x: 0.50, y: 0.78, w: 0.22, aspect: 1.1 },
        { id: 'h3', match: 'n3', svg: () => handSvg(3), x: 0.80, y: 0.78, w: 0.22, aspect: 1.1 },
      ],
    },
    zaehlenBis3: {
      title: 'Zählen bis 3',
      hint: 'Zähle und tippe die richtige Anzahl Kreise an!',
      mode: 'count-fill',
      rows: [
        { id: 'row-book', count: 1, kind: 'book' },
        { id: 'row-boats', count: 2, kind: 'boat' },
        { id: 'row-marbles', count: 3, kind: 'marble' },
        { id: 'row-ducks', count: 2, kind: 'duck' },
      ],
    },

    blumenwiese: {
      title: 'Blumenwiese',
      hint: 'Kreise die 5 blauen Blumen ein!',
      mode: 'circle-draw',
      targetMatch: 'blue',
      sources: [
        /* ~worksheet layout: 5 blue, 3 red, 3 yellow, 3 green */
        { id: 'f_b1', match: 'blue',   svg: () => flowerSvg(COLORS.blue),   x: 0.16, y: 0.16, w: 0.13, aspect: 1.25 },
        { id: 'f_r1', match: 'red',    svg: () => flowerSvg(COLORS.red),    x: 0.40, y: 0.14, w: 0.13, aspect: 1.25 },
        { id: 'f_b2', match: 'blue',   svg: () => flowerSvg(COLORS.blue),   x: 0.64, y: 0.16, w: 0.13, aspect: 1.25 },
        { id: 'f_g1', match: 'green',  svg: () => flowerSvg(COLORS.green),  x: 0.86, y: 0.18, w: 0.13, aspect: 1.25 },
        { id: 'f_r2', match: 'red',    svg: () => flowerSvg(COLORS.red),    x: 0.26, y: 0.36, w: 0.13, aspect: 1.25 },
        { id: 'f_y1', match: 'yellow', svg: () => flowerSvg(COLORS.yellow), x: 0.50, y: 0.38, w: 0.13, aspect: 1.25 },
        { id: 'f_g2', match: 'green',  svg: () => flowerSvg(COLORS.green),  x: 0.74, y: 0.36, w: 0.13, aspect: 1.25 },
        { id: 'f_b3', match: 'blue',   svg: () => flowerSvg(COLORS.blue),   x: 0.14, y: 0.56, w: 0.13, aspect: 1.25 },
        { id: 'f_r3', match: 'red',    svg: () => flowerSvg(COLORS.red),    x: 0.40, y: 0.54, w: 0.13, aspect: 1.25 },
        { id: 'f_b4', match: 'blue',   svg: () => flowerSvg(COLORS.blue),   x: 0.60, y: 0.56, w: 0.13, aspect: 1.25 },
        { id: 'f_y2', match: 'yellow', svg: () => flowerSvg(COLORS.yellow), x: 0.84, y: 0.54, w: 0.13, aspect: 1.25 },
        { id: 'f_b5', match: 'blue',   svg: () => flowerSvg(COLORS.blue),   x: 0.38, y: 0.76, w: 0.13, aspect: 1.25 },
        { id: 'f_g3', match: 'green',  svg: () => flowerSvg(COLORS.green),  x: 0.60, y: 0.78, w: 0.13, aspect: 1.25 },
        { id: 'f_y3', match: 'yellow', svg: () => flowerSvg(COLORS.yellow), x: 0.84, y: 0.76, w: 0.13, aspect: 1.25 },
      ],
      targets: [],
      mascot: { x: 0.14, y: 0.86, w: 0.16, aspect: 1.15 },
    },

    windraeder: {
      title: 'Bunte Windräder',
      hint: 'Welches Windrad gehört zu welchem Papier? Verbinde die gleichen Farben!',
      mode: 'one-to-one',
      sources: [
        /* Pinwheels on TOP */
        { id: 'pw_red',    match: 'red',    svg: () => pinwheelSvg(COLORS.red),    x: 0.14, y: 0.22, w: 0.18, aspect: 1.35 },
        { id: 'pw_blue',   match: 'blue',   svg: () => pinwheelSvg(COLORS.blue),   x: 0.38, y: 0.22, w: 0.18, aspect: 1.35 },
        { id: 'pw_green',  match: 'green',  svg: () => pinwheelSvg(COLORS.green),  x: 0.62, y: 0.22, w: 0.18, aspect: 1.35 },
        { id: 'pw_yellow', match: 'yellow', svg: () => pinwheelSvg(COLORS.yellow), x: 0.86, y: 0.22, w: 0.18, aspect: 1.35 },
      ],
      targets: [
        /* Paper squares on BOTTOM */
        { id: 'pp_yellow', match: 'yellow', svg: () => paperSquareSvg(COLORS.yellow), x: 0.14, y: 0.78, w: 0.18, aspect: 1.0 },
        { id: 'pp_red',    match: 'red',    svg: () => paperSquareSvg(COLORS.red),    x: 0.38, y: 0.78, w: 0.18, aspect: 1.0 },
        { id: 'pp_blue',   match: 'blue',   svg: () => paperSquareSvg(COLORS.blue),   x: 0.62, y: 0.78, w: 0.18, aspect: 1.0 },
        { id: 'pp_green',  match: 'green',  svg: () => paperSquareSvg(COLORS.green),  x: 0.86, y: 0.78, w: 0.18, aspect: 1.0 },
      ],
    },

    doggysEntchen: {
      title: 'Doggys Entchen',
      hint: 'Doggy hat von jedem Bade-Entchen genau zwei. Vergleiche und verbinde die Paare!',
      mode: 'one-to-one',
      sources: [
        /* Top row faces left (worksheet order; positions shuffle each start) */
        { id: 'dk_pink',  match: 'pink',  svg: () => bathDuckSvg(COLORS.pink, COLORS.yellow, false), x: 0.14, y: 0.30, w: 0.18, aspect: 0.9 },
        { id: 'dk_orange', match: 'orange', svg: () => bathDuckSvg(COLORS.orange, COLORS.pink, false), x: 0.38, y: 0.30, w: 0.18, aspect: 0.9 },
        { id: 'dk_yellow', match: 'yellow', svg: () => bathDuckSvg(COLORS.yellow, COLORS.orange, false), x: 0.62, y: 0.30, w: 0.18, aspect: 0.9 },
        { id: 'dk_sky', match: 'sky', svg: () => bathDuckSvg(COLORS.sky, COLORS.red, false), x: 0.86, y: 0.30, w: 0.18, aspect: 0.9 },
      ],
      targets: [
        /* Bottom row faces right */
        { id: 'tk_yellow', match: 'yellow', svg: () => bathDuckSvg(COLORS.yellow, COLORS.orange, true), x: 0.14, y: 0.78, w: 0.18, aspect: 0.9 },
        { id: 'tk_pink', match: 'pink', svg: () => bathDuckSvg(COLORS.pink, COLORS.yellow, true), x: 0.38, y: 0.78, w: 0.18, aspect: 0.9 },
        { id: 'tk_sky', match: 'sky', svg: () => bathDuckSvg(COLORS.sky, COLORS.red, true), x: 0.62, y: 0.78, w: 0.18, aspect: 0.9 },
        { id: 'tk_orange', match: 'orange', svg: () => bathDuckSvg(COLORS.orange, COLORS.pink, true), x: 0.86, y: 0.78, w: 0.18, aspect: 0.9 },
      ],
      mascot: { x: 0.50, y: 0.10, w: 0.28, aspect: 0.75, svg: doggyInTubSvg },
    },

    karotten: {
      title: 'Wo sind die Karotten?',
      hint: 'Der Hase isst am liebsten Karotten. Kreise die 5 Karotten ein!',
      mode: 'circle-draw',
      targetMatch: 'carrot',
      boardClass: 'clutter-board',
      itemClass: 'clutter-item',
      itemLabel: 'Gegenstand',
      fixedLayout: true,
      sources: [
        /* 5 carrots (targets) — pointed, larger for kids */
        { id: 'k_c1', match: 'carrot', svg: () => carrotSvg(-40), x: 0.14, y: 0.16, w: 0.16, aspect: 1.5 },
        { id: 'k_c2', match: 'carrot', svg: () => carrotSvg(-32), x: 0.82, y: 0.18, w: 0.16, aspect: 1.5 },
        { id: 'k_c3', match: 'carrot', svg: () => carrotSvg(28),  x: 0.20, y: 0.48, w: 0.16, aspect: 1.5 },
        { id: 'k_c4', match: 'carrot', svg: () => carrotSvg(-8),  x: 0.74, y: 0.50, w: 0.16, aspect: 1.5 },
        { id: 'k_c5', match: 'carrot', svg: () => carrotSvg(35),  x: 0.48, y: 0.70, w: 0.16, aspect: 1.5 },
        /* distractors (~half of previous clutter), larger */
        { id: 'k_bag1', match: 'bag', svg: () => handbagSvg(), x: 0.38, y: 0.14, w: 0.15, aspect: 1.0 },
        { id: 'k_pl1', match: 'plane', svg: () => paperPlaneSvg(false), x: 0.56, y: 0.20, w: 0.17, aspect: 0.75 },
        { id: 'k_pu1', match: 'pumpkin', svg: () => pumpkinSvg(), x: 0.90, y: 0.40, w: 0.16, aspect: 0.9 },
        { id: 'k_or1', match: 'orange', svg: () => orangeFruitSvg(), x: 0.50, y: 0.40, w: 0.14, aspect: 1.0 },
        { id: 'k_sk1', match: 'sock', svg: () => clutterSockSvg(20),  x: 0.90, y: 0.16, w: 0.13, aspect: 1.25 },
        { id: 'k_sk2', match: 'sock', svg: () => clutterSockSvg(-15), x: 0.58, y: 0.56, w: 0.13, aspect: 1.25 },
        { id: 'k_cu1', match: 'cube', svg: () => cubeSvg(), x: 0.32, y: 0.70, w: 0.14, aspect: 1.0 },
        { id: 'k_car1', match: 'car', svg: () => toyCarSvg(false), x: 0.58, y: 0.36, w: 0.17, aspect: 0.7 },
        { id: 'k_bt1', match: 'button', svg: () => buttonSvg(), x: 0.12, y: 0.34, w: 0.13, aspect: 1.0 },
        { id: 'k_sw', match: 'sweater', svg: () => sweaterSvg(), x: 0.30, y: 0.28, w: 0.19, aspect: 0.9 },
        { id: 'k_fl', match: 'flower', svg: () => daisyClutterSvg(), x: 0.82, y: 0.70, w: 0.14, aspect: 1.0 },
      ],
      targets: [],
      mascot: { x: 0.14, y: 0.88, w: 0.18, aspect: 1.1, svg: rabbitMascotSvg },
    },


    versteckteTiere: {
      title: 'Versteckte Tiere',
      hint: 'Welches Tier versteckt sich hinter welchem Blatt? Verbinde!',
      mode: 'one-to-one',
      sources: [
        { id: 'worm', match: 'worm', svg: wormSvg, x: 0.20, y: 0.16, w: 0.24, aspect: 0.58 },
        { id: 'hedgehog', match: 'hedgehog', svg: hedgehogSvg, x: 0.20, y: 0.39, w: 0.22, aspect: 0.75 },
        { id: 'mouse', match: 'mouse', svg: mouseFullSvg, x: 0.20, y: 0.62, w: 0.22, aspect: 0.75 },
        { id: 'snail', match: 'snail', svg: snailSvg, x: 0.20, y: 0.85, w: 0.22, aspect: 0.75 },
      ],
      targets: [
        /* Worksheet order (shuffled each start): maple/hedgehog, oak/snail, birch/worm, chestnut/mouse */
        { id: 'leaf_hedgehog', match: 'hedgehog', svg: leafHedgehogSvg, x: 0.78, y: 0.16, w: 0.22, aspect: 1.0 },
        { id: 'leaf_snail', match: 'snail', svg: leafSnailSvg, x: 0.78, y: 0.39, w: 0.22, aspect: 1.0 },
        { id: 'leaf_worm', match: 'worm', svg: leafWormSvg, x: 0.78, y: 0.62, w: 0.22, aspect: 1.0 },
        { id: 'leaf_mouse', match: 'mouse', svg: leafMouseSvg, x: 0.78, y: 0.85, w: 0.22, aspect: 1.0 },
      ],
    },


    doggysFussbaelle: {
      title: 'Doggys Fußbälle',
      hint: 'Doggy spielt gerne Fußball. Suche alle Fußbälle und kreise sie ein!',
      mode: 'circle-draw',
      targetMatch: 'soccer',
      boardClass: 'meadow-board',
      itemClass: 'clutter-item',
      itemLabel: 'Gegenstand',
      fixedLayout: true,
      sources: [
        /* 6 soccer balls (targets) */
        { id: 'fb_s1', match: 'soccer', svg: soccerBallSvg, x: 0.22, y: 0.18, w: 0.11, aspect: 1.0 },
        { id: 'fb_s2', match: 'soccer', svg: soccerBallSvg, x: 0.78, y: 0.16, w: 0.11, aspect: 1.0 },
        { id: 'fb_s3', match: 'soccer', svg: soccerBallSvg, x: 0.14, y: 0.42, w: 0.11, aspect: 1.0 },
        { id: 'fb_s4', match: 'soccer', svg: soccerBallSvg, x: 0.48, y: 0.46, w: 0.11, aspect: 1.0 },
        { id: 'fb_s5', match: 'soccer', svg: soccerBallSvg, x: 0.42, y: 0.72, w: 0.11, aspect: 1.0 },
        { id: 'fb_s6', match: 'soccer', svg: soccerBallSvg, x: 0.82, y: 0.70, w: 0.11, aspect: 1.0 },
        /* distractors */
        { id: 'fb_bb1', match: 'beach', svg: () => beachBallSvg(-20), x: 0.58, y: 0.18, w: 0.11, aspect: 1.0 },
        { id: 'fb_bb2', match: 'beach', svg: () => beachBallSvg(25),  x: 0.30, y: 0.58, w: 0.11, aspect: 1.0 },
        { id: 'fb_ob1', match: 'orangeball', svg: playgroundBallSvg, x: 0.66, y: 0.36, w: 0.10, aspect: 1.0 },
        { id: 'fb_ob2', match: 'orangeball', svg: playgroundBallSvg, x: 0.18, y: 0.68, w: 0.10, aspect: 1.0 },
        { id: 'fb_sh', match: 'sheep', svg: sheepSvg, x: 0.50, y: 0.32, w: 0.14, aspect: 0.9 },
        { id: 'fb_d1', match: 'duck', svg: searchDuckSvg, x: 0.34, y: 0.28, w: 0.11, aspect: 0.85 },
        { id: 'fb_d2', match: 'duck', svg: searchDuckSvg, x: 0.70, y: 0.58, w: 0.11, aspect: 0.85 },
        { id: 'fb_wc', match: 'can', svg: wateringCanSvg, x: 0.38, y: 0.12, w: 0.12, aspect: 0.9 },
        { id: 'fb_sv', match: 'shovel', svg: shovelSvg, x: 0.08, y: 0.55, w: 0.09, aspect: 1.35 },
        { id: 'fb_bk', match: 'bucket', svg: bucketSvg, x: 0.10, y: 0.78, w: 0.10, aspect: 1.0 },
        { id: 'fb_p1', match: 'pot', svg: flowerPotSvg, x: 0.90, y: 0.28, w: 0.09, aspect: 1.15 },
        { id: 'fb_p2', match: 'pot', svg: flowerPotSvg, x: 0.58, y: 0.70, w: 0.09, aspect: 1.15 },
        { id: 'fb_p3', match: 'pot', svg: flowerPotSvg, x: 0.28, y: 0.82, w: 0.09, aspect: 1.15 },
        { id: 'fb_c1', match: 'cap', svg: () => capSvg('#A3CB38'), x: 0.90, y: 0.48, w: 0.11, aspect: 0.8 },
        { id: 'fb_c2', match: 'cap', svg: () => capSvg('#A3CB38'), x: 0.58, y: 0.52, w: 0.11, aspect: 0.8 },
        { id: 'fb_c3', match: 'cap', svg: () => capSvg('#E63946'), x: 0.22, y: 0.30, w: 0.11, aspect: 0.8 },
        { id: 'fb_sg1', match: 'glasses', svg: sunglassesSvg, x: 0.86, y: 0.12, w: 0.12, aspect: 0.55 },
        { id: 'fb_sg2', match: 'glasses', svg: sunglassesSvg, x: 0.38, y: 0.48, w: 0.12, aspect: 0.55 },
        { id: 'fb_r1', match: 'rock', svg: rocksSvg, x: 0.08, y: 0.28, w: 0.11, aspect: 0.75 },
        { id: 'fb_r2', match: 'rock', svg: rocksSvg, x: 0.62, y: 0.82, w: 0.11, aspect: 0.75 },
        { id: 'fb_r3', match: 'rock', svg: rocksSvg, x: 0.90, y: 0.82, w: 0.11, aspect: 0.75 },
        { id: 'fb_st1', match: 'stick', svg: () => stickSvg(-35), x: 0.72, y: 0.26, w: 0.10, aspect: 1.0 },
        { id: 'fb_st2', match: 'stick', svg: () => stickSvg(20),  x: 0.46, y: 0.60, w: 0.10, aspect: 1.0 },
        { id: 'fb_st3', match: 'stick', svg: () => stickSvg(-10), x: 0.14, y: 0.12, w: 0.10, aspect: 1.0 },
        { id: 'fb_st4', match: 'stick', svg: () => stickSvg(40),  x: 0.74, y: 0.78, w: 0.10, aspect: 1.0 },
        { id: 'fb_a1', match: 'block', svg: archBlockSvg, x: 0.34, y: 0.40, w: 0.11, aspect: 0.85 },
        { id: 'fb_a2', match: 'block', svg: archBlockSvg, x: 0.86, y: 0.58, w: 0.11, aspect: 0.85 },
        { id: 'fb_a3', match: 'block', svg: archBlockSvg, x: 0.52, y: 0.86, w: 0.11, aspect: 0.85 },
      ],
      targets: [],
      mascot: { x: 0.12, y: 0.14, w: 0.16, aspect: 1.15 },
    },

    stifteFarben: {
      title: 'Stifte und Farben',
      hint: 'Verbinde Stift und Bild gleicher Farbe.',
      mode: 'one-to-one',
      sources: [
        { id: 'pen_red', match: 'red', svg: () => pencilSvg(COLORS.red), x: 0.20, y: 0.16, w: 0.14, aspect: 1.45 },
        { id: 'pen_green', match: 'green', svg: () => pencilSvg(COLORS.green), x: 0.20, y: 0.39, w: 0.14, aspect: 1.45 },
        { id: 'pen_blue', match: 'blue', svg: () => pencilSvg(COLORS.blue), x: 0.20, y: 0.62, w: 0.14, aspect: 1.45 },
        { id: 'pen_yellow', match: 'yellow', svg: () => pencilSvg(COLORS.yellow), x: 0.20, y: 0.85, w: 0.14, aspect: 1.45 },
      ],
      targets: [
        { id: 'img_frog', match: 'green', svg: frogMatchSvg, x: 0.78, y: 0.16, w: 0.20, aspect: 0.9 },
        { id: 'img_flower', match: 'blue', svg: () => colorFlowerSvg(COLORS.blue), x: 0.78, y: 0.39, w: 0.18, aspect: 1.1 },
        { id: 'img_moon', match: 'yellow', svg: crescentMoonSvg, x: 0.78, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 'img_heart', match: 'red', svg: () => heartMatchSvg(COLORS.red), x: 0.78, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
    },

    blumenVasen: {
      title: 'Blumen und Vasen',
      hint: 'Verbinde Blumen und Vase gleicher Farbe.',
      mode: 'one-to-one',
      sources: [
        { id: 'fl_purple', match: 'purple', svg: () => tulipBouquetSvg(COLORS.purple), x: 0.20, y: 0.16, w: 0.20, aspect: 1.1 },
        { id: 'fl_red', match: 'red', svg: () => tulipBouquetSvg(COLORS.red), x: 0.20, y: 0.39, w: 0.20, aspect: 1.1 },
        { id: 'fl_blue', match: 'blue', svg: () => tulipBouquetSvg(COLORS.blue), x: 0.20, y: 0.62, w: 0.20, aspect: 1.1 },
        { id: 'fl_yellow', match: 'yellow', svg: () => tulipBouquetSvg(COLORS.yellow), x: 0.20, y: 0.85, w: 0.20, aspect: 1.1 },
      ],
      targets: [
        { id: 'v_red', match: 'red', svg: () => stripedVaseSvg(COLORS.red), x: 0.78, y: 0.16, w: 0.16, aspect: 1.3 },
        { id: 'v_blue', match: 'blue', svg: () => stripedVaseSvg(COLORS.blue), x: 0.78, y: 0.39, w: 0.16, aspect: 1.3 },
        { id: 'v_yellow', match: 'yellow', svg: () => stripedVaseSvg(COLORS.yellow), x: 0.78, y: 0.62, w: 0.16, aspect: 1.3 },
        { id: 'v_purple', match: 'purple', svg: () => stripedVaseSvg(COLORS.purple), x: 0.78, y: 0.85, w: 0.16, aspect: 1.3 },
      ],
    },

    segelboote: {
      title: 'Segelboote',
      hint: 'Finde die gleichen Segelboote und verbinde sie.',
      mode: 'one-to-one',
      boardClass: 'ocean-board',
      sources: [
        { id: 'boat_l_green', match: 'green', svg: () => pairSailboatSvg(COLORS.green), x: 0.20, y: 0.16, w: 0.22, aspect: 0.9 },
        { id: 'boat_l_blue', match: 'blue', svg: () => pairSailboatSvg(COLORS.blue), x: 0.20, y: 0.39, w: 0.22, aspect: 0.9 },
        { id: 'boat_l_purple', match: 'purple', svg: () => pairSailboatSvg(COLORS.purple), x: 0.20, y: 0.62, w: 0.22, aspect: 0.9 },
        { id: 'boat_l_orange', match: 'orange', svg: () => pairSailboatSvg(COLORS.orange), x: 0.20, y: 0.85, w: 0.22, aspect: 0.9 },
      ],
      targets: [
        { id: 'boat_r_orange', match: 'orange', svg: () => pairSailboatSvg(COLORS.orange), x: 0.78, y: 0.16, w: 0.22, aspect: 0.9 },
        { id: 'boat_r_green', match: 'green', svg: () => pairSailboatSvg(COLORS.green), x: 0.78, y: 0.39, w: 0.22, aspect: 0.9 },
        { id: 'boat_r_purple', match: 'purple', svg: () => pairSailboatSvg(COLORS.purple), x: 0.78, y: 0.62, w: 0.22, aspect: 0.9 },
        { id: 'boat_r_blue', match: 'blue', svg: () => pairSailboatSvg(COLORS.blue), x: 0.78, y: 0.85, w: 0.22, aspect: 0.9 },
      ],
    },

    herbstPilze: {
      title: 'Herbst-Pilze',
      hint: 'Kreise alle 5 Pilze ein.',
      mode: 'circle-draw',
      targetMatch: 'mushroom',
      boardClass: 'autumn-board',
      itemClass: 'clutter-item',
      itemLabel: 'Gegenstand',
      fixedLayout: true,
      sources: [
        /* 5 mushrooms (targets) — larger for kids */
        { id: 'hp_m1', match: 'mushroom', svg: () => mushroomSvg(-12), x: 0.18, y: 0.18, w: 0.16, aspect: 1.1 },
        { id: 'hp_m2', match: 'mushroom', svg: () => mushroomSvg(10),  x: 0.78, y: 0.22, w: 0.16, aspect: 1.1 },
        { id: 'hp_m3', match: 'mushroom', svg: () => mushroomSvg(-6),  x: 0.42, y: 0.46, w: 0.16, aspect: 1.1 },
        { id: 'hp_m4', match: 'mushroom', svg: () => mushroomSvg(14),  x: 0.16, y: 0.68, w: 0.16, aspect: 1.1 },
        { id: 'hp_m5', match: 'mushroom', svg: () => mushroomSvg(-8),  x: 0.72, y: 0.70, w: 0.16, aspect: 1.1 },
        /* autumn leaves (distractors) */
        { id: 'hp_l1', match: 'leaf', svg: () => autumnLeafSvg(COLORS.red, -25, 0), x: 0.42, y: 0.14, w: 0.15, aspect: 1.2 },
        { id: 'hp_l2', match: 'leaf', svg: () => autumnLeafSvg(COLORS.orange, 20, 1), x: 0.62, y: 0.16, w: 0.15, aspect: 1.2 },
        { id: 'hp_l3', match: 'leaf', svg: () => autumnLeafSvg(COLORS.yellow, -10, 2), x: 0.88, y: 0.40, w: 0.14, aspect: 1.2 },
        { id: 'hp_l4', match: 'leaf', svg: () => autumnLeafSvg('#A67C52', 30, 0), x: 0.30, y: 0.32, w: 0.15, aspect: 1.2 },
        { id: 'hp_l5', match: 'leaf', svg: () => autumnLeafSvg(COLORS.orange, -35, 1), x: 0.58, y: 0.34, w: 0.15, aspect: 1.2 },
        { id: 'hp_l6', match: 'leaf', svg: () => autumnLeafSvg(COLORS.red, 15, 2), x: 0.12, y: 0.42, w: 0.14, aspect: 1.2 },
        { id: 'hp_l7', match: 'leaf', svg: () => autumnLeafSvg(COLORS.yellow, -20, 0), x: 0.86, y: 0.56, w: 0.15, aspect: 1.2 },
        { id: 'hp_l8', match: 'leaf', svg: () => autumnLeafSvg('#A67C52', 8, 1), x: 0.38, y: 0.64, w: 0.15, aspect: 1.2 },
        { id: 'hp_l9', match: 'leaf', svg: () => autumnLeafSvg(COLORS.orange, -15, 2), x: 0.54, y: 0.78, w: 0.15, aspect: 1.2 },
        { id: 'hp_l10', match: 'leaf', svg: () => autumnLeafSvg(COLORS.red, 25, 0), x: 0.88, y: 0.82, w: 0.14, aspect: 1.2 },
        { id: 'hp_l11', match: 'leaf', svg: () => autumnLeafSvg(COLORS.yellow, -5, 1), x: 0.28, y: 0.86, w: 0.15, aspect: 1.2 },
      ],
      targets: [],
    },

    obstkoerbe: {
      title: 'Obstkörbe',
      hint: 'Verbinde Obst und passenden Korb.',
      mode: 'many-to-one',
      sources: [
        { id: 'ban1', match: 'banana', svg: bananaSvg, x: 0.16, y: 0.12, w: 0.14, aspect: 0.85 },
        { id: 'apl1', match: 'apple',  svg: redAppleSvg, x: 0.42, y: 0.10, w: 0.13, aspect: 1.05 },
        { id: 'pear1', match: 'pear',  svg: greenPearSvg, x: 0.70, y: 0.12, w: 0.13, aspect: 1.15 },
        { id: 'ban2', match: 'banana', svg: bananaSvg, x: 0.28, y: 0.30, w: 0.14, aspect: 0.85 },
        { id: 'apl2', match: 'apple',  svg: redAppleSvg, x: 0.55, y: 0.28, w: 0.13, aspect: 1.05 },
        { id: 'pear2', match: 'pear',  svg: greenPearSvg, x: 0.82, y: 0.32, w: 0.13, aspect: 1.15 },
        { id: 'ban3', match: 'banana', svg: bananaSvg, x: 0.14, y: 0.48, w: 0.14, aspect: 0.85 },
        { id: 'apl3', match: 'apple',  svg: redAppleSvg, x: 0.40, y: 0.50, w: 0.13, aspect: 1.05 },
        { id: 'pear3', match: 'pear',  svg: greenPearSvg, x: 0.66, y: 0.48, w: 0.13, aspect: 1.15 },
      ],
      targets: [
        { id: 'bask_ban', match: 'banana', svg: () => fruitBasketSvg('banana'), x: 0.20, y: 0.84, w: 0.22, aspect: 0.9 },
        { id: 'bask_apl', match: 'apple',  svg: () => fruitBasketSvg('apple'),  x: 0.50, y: 0.84, w: 0.22, aspect: 0.9 },
        { id: 'bask_pear', match: 'pear',  svg: () => fruitBasketSvg('pear'),   x: 0.80, y: 0.84, w: 0.22, aspect: 0.9 },
      ],
    },

    geburtstagSchatten: {
      title: 'Geburtstagsschatten',
      hint: 'Verbinde Bild und Schatten.',
      mode: 'one-to-one',
      sources: [
        { id: 'gb_balloon', match: 'balloon', svg: () => birthdayBalloonSvg(false), x: 0.20, y: 0.16, w: 0.16, aspect: 1.3 },
        { id: 'gb_cake', match: 'cake', svg: () => birthdayCakeSvg(false), x: 0.20, y: 0.39, w: 0.18, aspect: 1.0 },
        { id: 'gb_gift', match: 'gift', svg: () => giftBoxSvg(false), x: 0.20, y: 0.62, w: 0.18, aspect: 1.0 },
        { id: 'gb_flowers', match: 'flowers', svg: () => birthdayBouquetSvg(false), x: 0.20, y: 0.85, w: 0.18, aspect: 1.1 },
      ],
      targets: [
        { id: 'gs_gift', match: 'gift', svg: () => giftBoxSvg(true), x: 0.78, y: 0.16, w: 0.18, aspect: 1.0 },
        { id: 'gs_flowers', match: 'flowers', svg: () => birthdayBouquetSvg(true), x: 0.78, y: 0.39, w: 0.18, aspect: 1.1 },
        { id: 'gs_balloon', match: 'balloon', svg: () => birthdayBalloonSvg(true), x: 0.78, y: 0.62, w: 0.16, aspect: 1.3 },
        { id: 'gs_cake', match: 'cake', svg: () => birthdayCakeSvg(true), x: 0.78, y: 0.85, w: 0.18, aspect: 1.0 },
      ],
    },

    schmetterlinge: {
      title: 'Schmetterlinge',
      hint: 'Verbinde Schmetterling und Blume.',
      mode: 'one-to-one',
      sources: [
        /* Worksheet pairs: green→red, blue→purple, yellow→yellow */
        { id: 'bf_green', match: 'green-red', svg: () => butterflySvg(COLORS.green), x: 0.20, y: 0.22, w: 0.20, aspect: 0.9 },
        { id: 'bf_blue', match: 'blue-purple', svg: () => butterflySvg(COLORS.blue), x: 0.20, y: 0.50, w: 0.20, aspect: 0.9 },
        { id: 'bf_yellow', match: 'yellow-yellow', svg: () => butterflySvg(COLORS.yellow), x: 0.20, y: 0.78, w: 0.20, aspect: 0.9 },
      ],
      targets: [
        { id: 'fl_purple', match: 'blue-purple', svg: () => matchFlowerSvg(COLORS.purple), x: 0.78, y: 0.22, w: 0.18, aspect: 1.2 },
        { id: 'fl_yellow', match: 'yellow-yellow', svg: () => matchFlowerSvg(COLORS.yellow), x: 0.78, y: 0.50, w: 0.18, aspect: 1.2 },
        { id: 'fl_red', match: 'green-red', svg: () => matchFlowerSvg(COLORS.red), x: 0.78, y: 0.78, w: 0.18, aspect: 1.2 },
      ],
    },

    bonbonsStreichen: {
      title: 'Bonbons',
      hint: 'Streiche in jeder Reihe das andere Bonbon durch.',
      mode: 'strike-draw',
      targetMatch: 'odd',
      boardClass: 'candy-strike-board',
      itemClass: 'candy-strike-item',
      itemLabel: 'Bonbon',
      fixedLayout: true,
      sources: [
        /* Row 1 — orange; odd = purple stripes */
        { id: 'bs_r1a', match: 'same', svg: () => patternCandySvg('orange-plain'), x: 0.14, y: 0.20, w: 0.18, aspect: 0.6 },
        { id: 'bs_r1b', match: 'odd',  svg: () => patternCandySvg('orange-purple-stripe'), x: 0.38, y: 0.20, w: 0.18, aspect: 0.6 },
        { id: 'bs_r1c', match: 'same', svg: () => patternCandySvg('orange-plain'), x: 0.62, y: 0.20, w: 0.18, aspect: 0.6 },
        { id: 'bs_r1d', match: 'same', svg: () => patternCandySvg('orange-plain'), x: 0.86, y: 0.20, w: 0.18, aspect: 0.6 },
        /* Row 2 — light-blue polka; odd = inverted dark */
        { id: 'bs_r2a', match: 'same', svg: () => patternCandySvg('blue-polka'), x: 0.14, y: 0.50, w: 0.18, aspect: 0.6 },
        { id: 'bs_r2b', match: 'same', svg: () => patternCandySvg('blue-polka'), x: 0.38, y: 0.50, w: 0.18, aspect: 0.6 },
        { id: 'bs_r2c', match: 'same', svg: () => patternCandySvg('blue-polka'), x: 0.62, y: 0.50, w: 0.18, aspect: 0.6 },
        { id: 'bs_r2d', match: 'odd',  svg: () => patternCandySvg('blue-polka-invert'), x: 0.86, y: 0.50, w: 0.18, aspect: 0.6 },
        /* Row 3 — lime; odd = solid dark green */
        { id: 'bs_r3a', match: 'odd',  svg: () => patternCandySvg('dark-green'), x: 0.14, y: 0.80, w: 0.18, aspect: 0.6 },
        { id: 'bs_r3b', match: 'same', svg: () => patternCandySvg('lime'), x: 0.38, y: 0.80, w: 0.18, aspect: 0.6 },
        { id: 'bs_r3c', match: 'same', svg: () => patternCandySvg('lime'), x: 0.62, y: 0.80, w: 0.18, aspect: 0.6 },
        { id: 'bs_r3d', match: 'same', svg: () => patternCandySvg('lime'), x: 0.86, y: 0.80, w: 0.18, aspect: 0.6 },
      ],
      targets: [],
    },

    grossUndKlein: {
      title: 'Groß und klein',
      hint: 'Kreise in jeder Reihe das größte Tier ein.',
      mode: 'circle-draw',
      targetMatch: 'large',
      boardClass: 'size-board',
      itemClass: 'size-item',
      itemLabel: 'Tier',
      fixedLayout: true,
      sources: [
        /* Row 1 — sheep: med, large, small */
        { id: 'gk_sh_m', match: 'medium', svg: sheepSvg, x: 0.18, y: 0.18, w: 0.16, aspect: 0.9 },
        { id: 'gk_sh_l', match: 'large',  svg: sheepSvg, x: 0.50, y: 0.18, w: 0.24, aspect: 0.9 },
        { id: 'gk_sh_s', match: 'small',  svg: sheepSvg, x: 0.82, y: 0.18, w: 0.11, aspect: 0.9 },
        /* Row 2 — elephants: large, small, med */
        { id: 'gk_el_l', match: 'large',  svg: elephantSvg, x: 0.18, y: 0.50, w: 0.26, aspect: 0.9 },
        { id: 'gk_el_s', match: 'small',  svg: elephantSvg, x: 0.50, y: 0.50, w: 0.12, aspect: 0.9 },
        { id: 'gk_el_m', match: 'medium', svg: elephantSvg, x: 0.82, y: 0.50, w: 0.18, aspect: 0.9 },
        /* Row 3 — lions: small, med, large */
        { id: 'gk_li_s', match: 'small',  svg: lionSvg, x: 0.18, y: 0.82, w: 0.11, aspect: 0.9 },
        { id: 'gk_li_m', match: 'medium', svg: lionSvg, x: 0.50, y: 0.82, w: 0.16, aspect: 0.9 },
        { id: 'gk_li_l', match: 'large',  svg: lionSvg, x: 0.82, y: 0.82, w: 0.24, aspect: 0.9 },
      ],
      targets: [],
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
  const celebrateNext = document.getElementById('celebrate-next');
  const celebrateAgain = document.getElementById('celebrate-again');
  const celebrateHome = document.getElementById('celebrate-home');

  /* Menu order for "Nächstes Rätsel" — matches home buttons */
  const MENU_ORDER = [
    'bonbons',
    'schneemaenner',
    'tiere',
    'formen',
    'socken',
    'zahlen',
    'kleidung',
    'einsZweiDrei',
    'zaehlenBis3',
    'blumenwiese',
    'windraeder',
    'doggysEntchen',
    'karotten',
    'versteckteTiere',
    'doggysFussbaelle',
    'stifteFarben',
    'blumenVasen',
    'segelboote',
    'herbstPilze',
    'obstkoerbe',
    'geburtstagSchatten',
    'schmetterlinge',
    'bonbonsStreichen',
    'grossUndKlein',
  ];

  /* Session-only completion (in-memory; clears when app fully reopened) */
  const completedExercises = new Set();

  let currentId = null;
  let exercise = null;
  let matched = new Set();
  let connections = [];
  let itemEls = new Map();
  let itemMeta = new Map();

  let drawing = false;
  let drawFromId = null;
  let livePath = null;
  let points = [];
  let activePointerId = null;
  let countFillState = null; /* { rows: [{id, count, filled, wasCorrect}] } */
  let circleMarks = new Map(); /* id -> { el, normR } for circle-draw */
  let circleDrawMode = false;
  let strikeMarks = new Map(); /* id -> { el, normSize } for strike-draw */
  let strikeDrawMode = false;

  function showScreen(which) {
    const home = which === 'home';
    screenHome.classList.toggle('active', home);
    screenHome.hidden = !home;
    screenPlay.classList.toggle('active', !home);
    screenPlay.hidden = home;
    if (home) {
      hideCelebrate();
      updateHomeCheckmarks();
    }
  }

  function updateHomeCheckmarks() {
    applyMenuNumbers();
    document.querySelectorAll('.big-btn[data-exercise]').forEach((btn) => {
      const id = btn.dataset.exercise;
      const done = completedExercises.has(id);
      btn.classList.toggle('done', done);
      const label = (btn.querySelector('.big-btn-label') && btn.querySelector('.big-btn-label').textContent) || id;
      btn.setAttribute('aria-label', done ? label + ' — erledigt' : label);
    });
  }

  function markExerciseComplete(id) {
    if (!id) return;
    completedExercises.add(id);
    updateHomeCheckmarks();
  }

  function pickRandomIncompleteExercise() {
    const pool = MENU_ORDER.filter((id) => EXERCISES[id] && !completedExercises.has(id));
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function showHomeToast(msg) {
    let el = document.getElementById('home-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'home-toast';
      el.className = 'home-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      const card = document.querySelector('.home-card') || document.getElementById('app');
      card.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showHomeToast._t);
    showHomeToast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function applyMenuNumbers() {
    MENU_ORDER.forEach((id, i) => {
      const btn = document.querySelector('.big-btn[data-exercise="' + id + '"]');
      if (!btn) return;
      let badge = btn.querySelector('.num-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'num-badge';
        badge.setAttribute('aria-hidden', 'true');
        btn.appendChild(badge);
      }
      badge.textContent = String(i + 1);
    });
  }

  function hideCelebrate() {
    celebrate.hidden = true;
  }

  function showCelebrate() {
    celebrate.hidden = false;
  }

  const portraitShell = document.getElementById('portrait-shell');
  const PORTRAIT_ASPECT = 3 / 4;

  function sizePortraitShell() {
    if (!portraitShell) return;
    const appEl = document.getElementById('app');
    const r = appEl.getBoundingClientRect();
    const availW = Math.max(120, r.width);
    const availH = Math.max(160, r.height);
    let w = availW;
    let h = w / PORTRAIT_ASPECT;
    if (h > availH) {
      h = availH;
      w = h * PORTRAIT_ASPECT;
    }
    portraitShell.style.width = Math.floor(w) + 'px';
    portraitShell.style.height = Math.floor(h) + 'px';
  }

  function syncLineSvgs(w, h) {
    /* Keep SVG user space = CSS pixels of the stage (critical after rotate/resize) */
    [linesSvg, drawSvg].forEach((svg) => {
      if (!svg) return;
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.style.width = w + 'px';
      svg.style.height = h + 'px';
    });
  }

  function sizeStage() {
    sizePortraitShell();
    const rect = stageWrap.getBoundingClientRect();
    const pad = 4;
    const availW = Math.max(80, rect.width - pad);
    const availH = Math.max(80, rect.height - pad);
    let w = availW;
    let h = availH;
    if (w / h > 0.95) {
      w = h * 0.92;
    }
    if (w > availW) w = availW;
    if (h > availH) h = availH;
    w = Math.floor(w);
    h = Math.floor(h);
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    syncLineSvgs(w, h);
    /* Mid-draw stroke would be in old coords — drop it */
    if (drawing) cancelDraw();
    repositionItems();
    /* After layout, rematch lines to current item centers */
    redrawConnections();
    redrawCircleMarks();
    redrawStrikeMarks();
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
      el.style.height = size * (meta.aspect || 1) + 'px';
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
    const pad = 12;
    return (
      clientX >= r.left - pad &&
      clientX <= r.right + pad &&
      clientY >= r.top - pad &&
      clientY <= r.bottom + pad
    );
  }

  function clearBoard() {
    board.innerHTML = '';
    board.className = '';
    linesSvg.innerHTML = '';
    drawSvg.innerHTML = '';
    linesSvg.style.display = '';
    drawSvg.style.display = '';
    matched.clear();
    connections = [];
    itemEls.clear();
    itemMeta.clear();
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
    countFillState = null;
    circleMarks.clear();
    circleDrawMode = false;
    strikeMarks.clear();
    strikeDrawMode = false;
  }

  function makeItem(def, kind) {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = def.id;
    el.dataset.kind = kind;
    el.dataset.match = def.match;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', kind === 'source' ? 'Objekt' : 'Ziel');
    el.innerHTML = def.svg();
    board.appendChild(el);
    itemEls.set(def.id, el);
    itemMeta.set(def.id, {
      kind: kind,
      match: def.match,
      x: def.x,
      y: def.y,
      w: def.w,
      aspect: def.aspect != null ? def.aspect : 1,
      role: kind,
    });
    return el;
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /** Copy defs and reassign x/y (and keep w/aspect) from a shuffled slot list. */
  function withShuffledSlots(defs) {
    const slots = defs.map((d) => ({ x: d.x, y: d.y, w: d.w, aspect: d.aspect }));
    shuffleInPlace(slots);
    return defs.map((d, i) => Object.assign({}, d, {
      x: slots[i].x,
      y: slots[i].y,
      w: slots[i].w != null ? slots[i].w : d.w,
      aspect: slots[i].aspect != null ? slots[i].aspect : d.aspect,
    }));
  }


  function placeMascot(ex) {
    if (!ex || !ex.mascot) return;
    const m = document.createElement('div');
    m.className = 'item mascot';
    m.setAttribute('aria-hidden', 'true');
    const svgFn = typeof ex.mascot.svg === 'function' ? ex.mascot.svg : doggyMascotSvg;
    m.innerHTML = svgFn();
    board.appendChild(m);
    const mid = '__mascot__';
    itemEls.set(mid, m);
    itemMeta.set(mid, {
      kind: 'mascot',
      match: null,
      x: ex.mascot.x,
      y: ex.mascot.y,
      w: ex.mascot.w,
      aspect: ex.mascot.aspect != null ? ex.mascot.aspect : 1,
      role: 'mascot',
    });
  }

  function startExercise(id) {
    currentId = id;
    const base = EXERCISES[id];
    if (!base) return;
    clearBoard();
    hideCelebrate();
    playTitle.textContent = base.title;
    hintEl.textContent = base.hint;

    if (base.mode === 'count-fill') {
      exercise = {
        title: base.title,
        hint: base.hint,
        mode: 'count-fill',
        rows: base.rows.map((r) => Object.assign({}, r)),
        sources: [],
        targets: [],
      };
      startCountFillBoard(exercise);
      showScreen('play');
      requestAnimationFrame(() => {
        sizeStage();
        requestAnimationFrame(sizeStage);
      });
      return;
    }

    if (base.mode === 'circle-draw') {
      exercise = {
        title: base.title,
        hint: base.hint,
        mode: 'circle-draw',
        targetMatch: base.targetMatch || 'blue',
        boardClass: base.boardClass || 'meadow-board',
        itemClass: base.itemClass || 'flower-item',
        itemLabel: base.itemLabel || 'Blume',
        sources: base.fixedLayout
          ? base.sources.map((s) => Object.assign({}, s))
          : withShuffledSlots(base.sources),
        targets: [],
        mascot: base.mascot ? Object.assign({}, base.mascot) : null,
      };
      startCircleDrawBoard(exercise);
      showScreen('play');
      requestAnimationFrame(() => {
        sizeStage();
        requestAnimationFrame(sizeStage);
      });
      return;
    }

    if (base.mode === 'strike-draw') {
      exercise = {
        title: base.title,
        hint: base.hint,
        mode: 'strike-draw',
        targetMatch: base.targetMatch || 'odd',
        boardClass: base.boardClass || 'candy-strike-board',
        itemClass: base.itemClass || 'candy-strike-item',
        itemLabel: base.itemLabel || 'Bonbon',
        sources: base.fixedLayout
          ? base.sources.map((s) => Object.assign({}, s))
          : withShuffledSlots(base.sources),
        targets: [],
        mascot: null,
      };
      startStrikeDrawBoard(exercise);
      showScreen('play');
      requestAnimationFrame(() => {
        sizeStage();
        requestAnimationFrame(sizeStage);
      });
      return;
    }

    /* Fresh shuffled layout every open / Nochmal — match ids stay correct */
    exercise = {
      title: base.title,
      hint: base.hint,
      mode: base.mode,
      boardClass: base.boardClass || '',
      sources: withShuffledSlots(base.sources),
      targets: withShuffledSlots(base.targets),
      mascot: base.mascot ? Object.assign({}, base.mascot) : null,
    };
    if (base.boardClass) board.className = base.boardClass;
    exercise.sources.forEach((s) => makeItem(s, 'source'));
    exercise.targets.forEach((t) => makeItem(t, 'target'));
    placeMascot(exercise);
    showScreen('play');
    requestAnimationFrame(() => {
      sizeStage();
      requestAnimationFrame(sizeStage);
    });
  }

  function startCountFillBoard(ex) {
    board.className = 'count-fill-board';
    linesSvg.style.display = 'none';
    drawSvg.style.display = 'none';
    countFillState = {
      rows: ex.rows.map((r) => ({
        id: r.id,
        count: r.count,
        kind: r.kind,
        filled: 0,
        wasCorrect: false,
      })),
    };
    const wrap = document.createElement('div');
    wrap.className = 'count-fill-rows';
    countFillState.rows.forEach((row, idx) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'count-fill-row';
      rowEl.dataset.rowId = row.id;
      const left = document.createElement('div');
      left.className = 'count-fill-left';
      left.innerHTML = countObjectsSvg(row.kind, row.count);
      const right = document.createElement('div');
      right.className = 'count-fill-circles';
      right.setAttribute('role', 'group');
      right.setAttribute('aria-label', 'Kreise ausmalen');
      for (let i = 0; i < 3; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'count-circle';
        btn.dataset.index = String(i);
        btn.setAttribute('aria-label', 'Kreis ' + (i + 1));
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCountCircle(idx, i, btn, rowEl);
        });
        right.appendChild(btn);
      }
      rowEl.appendChild(left);
      rowEl.appendChild(right);
      wrap.appendChild(rowEl);
    });
    board.appendChild(wrap);
  }


  function startCircleDrawBoard(ex) {
    board.className = ex.boardClass || 'meadow-board';
    circleDrawMode = true;
    circleMarks.clear();
    linesSvg.style.display = '';
    drawSvg.style.display = '';
    const itemClass = ex.itemClass || 'flower-item';
    const itemLabel = ex.itemLabel || 'Blume';
    ex.sources.forEach((s) => {
      const el = makeItem(s, 'source');
      el.classList.add(itemClass);
      el.setAttribute('aria-label', itemLabel);
      el.dataset.color = s.match;
    });
    placeMascot(ex);
  }

  function startStrikeDrawBoard(ex) {
    board.className = ex.boardClass || 'candy-strike-board';
    strikeDrawMode = true;
    circleDrawMode = false;
    strikeMarks.clear();
    linesSvg.style.display = '';
    drawSvg.style.display = '';
    const itemClass = ex.itemClass || 'candy-strike-item';
    const itemLabel = ex.itemLabel || 'Bonbon';
    ex.sources.forEach((s) => {
      const el = makeItem(s, 'source');
      el.classList.add(itemClass);
      el.setAttribute('aria-label', itemLabel);
      el.dataset.color = s.match;
    });
  }

  function pathLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function isRoughlyClosedLoop(pts) {
    if (!pts || pts.length < 10) return false;
    const len = pathLength(pts);
    if (len < 60) return false;
    const a = pts[0];
    const b = pts[pts.length - 1];
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    /* Kids: allow a fairly open gap relative to stroke length */
    return gap <= Math.max(36, len * 0.28);
  }

  function pointInPolygon(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x;
      const yi = pts[i].y;
      const xj = pts[j].x;
      const yj = pts[j].y;
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pathCentroid(pts) {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < pts.length; i++) {
      sx += pts[i].x;
      sy += pts[i].y;
    }
    const n = pts.length || 1;
    return { x: sx / n, y: sy / n };
  }

  function meanRadius(pts, c) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      s += Math.hypot(pts[i].x - c.x, pts[i].y - c.y);
    }
    return s / (pts.length || 1);
  }

  function radiusVariance(pts, c, meanR) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - c.x, pts[i].y - c.y) - meanR;
      s += d * d;
    }
    return s / (pts.length || 1);
  }

  /** Find one flower enclosed by a rough freehand circle. */
  function findEnclosedFlower(pts) {
    if (!exercise || exercise.mode !== 'circle-draw') return null;
    if (!isRoughlyClosedLoop(pts)) return null;
    const closed = pts.slice();
    /* Close polygon for containment */
    const first = closed[0];
    const last = closed[closed.length - 1];
    if (first.x !== last.x || first.y !== last.y) closed.push({ x: first.x, y: first.y });

    const c = pathCentroid(pts);
    const meanR = meanRadius(pts, c);
    if (meanR < 18) return null;
    /* Lenient circularity: stdev / mean not huge (scribbles still OK) */
    const variance = radiusVariance(pts, c, meanR);
    const stdev = Math.sqrt(variance);
    if (stdev > meanR * 0.72) return null;

    let best = null;
    let bestScore = Infinity;
    itemEls.forEach((el, id) => {
      const meta = itemMeta.get(id);
      if (!meta || meta.role === 'mascot') return;
      if (meta.role !== 'source') return;
      const center = centerOf(el);
      if (!pointInPolygon(center.x, center.y, closed)) return;
      /* Path should surround the bloom — mean radius larger than ~half flower */
      const half = Math.min(el.offsetWidth || 40, el.offsetHeight || 40) * 0.35;
      if (meanR < half * 0.85) return;
      const dist = Math.hypot(center.x - c.x, center.y - c.y);
      /* Prefer flower near loop center */
      if (dist < bestScore) {
        bestScore = dist;
        best = { id, el, meta, center, meanR };
      }
    });
    if (!best) return null;
    /* Reject if loop center is far from flower (lasso of many) */
    if (bestScore > best.meanR * 0.85) return null;
    return best;
  }

  function beginCircleDraw(pointerId, clientX, clientY) {
    drawing = true;
    activePointerId = pointerId;
    drawFromId = null;
    ensureAudio();
    const cur = stagePoint(clientX, clientY);
    points = [cur];
    drawSvg.innerHTML = '';
    livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    livePath.setAttribute('class', 'live-line');
    livePath.setAttribute('d', pathFromPoints(points));
    drawSvg.appendChild(livePath);
    return true;
  }

  function moveCircleDraw(clientX, clientY) {
    if (!drawing || !livePath) return;
    const cur = stagePoint(clientX, clientY);
    points.push(cur);
    points = simplify(points, 4);
    livePath.setAttribute('d', pathFromPoints(points));
  }

  function placeCircleMark(id, el) {
    const c = centerOf(el);
    const size = Math.max(el.offsetWidth || 40, el.offsetHeight || 40);
    const r = size * 0.52;
    const { w: sw, h: sh } = stageSize();
    let circ = circleMarks.get(id);
    if (!circ) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'circle-mark');
      linesSvg.appendChild(circle);
      circ = { el: circle, normR: r / Math.min(sw, sh || 1) };
      circleMarks.set(id, circ);
    }
    circ.el.setAttribute('cx', String(c.x));
    circ.el.setAttribute('cy', String(c.y));
    circ.el.setAttribute('r', String(r));
    circ.normR = r / Math.min(sw || 1, sh || 1);
  }

  function removeCircleMark(id) {
    const circ = circleMarks.get(id);
    if (circ && circ.el && circ.el.parentNode) circ.el.parentNode.removeChild(circ.el);
    circleMarks.delete(id);
  }

  function redrawCircleMarks() {
    if (!circleDrawMode) return;
    const { w: sw, h: sh } = stageSize();
    const base = Math.min(sw || 1, sh || 1);
    circleMarks.forEach((circ, id) => {
      const el = itemEls.get(id);
      if (!el || !circ.el) return;
      const c = centerOf(el);
      const r = (circ.normR || 0.08) * base;
      circ.el.setAttribute('cx', String(c.x));
      circ.el.setAttribute('cy', String(c.y));
      circ.el.setAttribute('r', String(r));
    });
  }

  function endCircleDraw(clientX, clientY) {
    if (!drawing) return;
    const pts = points.slice();
    if (clientX != null && clientY != null) {
      pts.push(stagePoint(clientX, clientY));
    }
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
    drawSvg.innerHTML = '';

    const hit = findEnclosedFlower(simplify(pts, 4));
    if (!hit) return;

    const isTarget = hit.meta.match === (exercise.targetMatch || 'blue');
    if (!isTarget) {
      gentleShake(hit.el);
      return;
    }

    if (matched.has(hit.id)) {
      /* Already circled — leave stuck (kids rarely need uncircle) */
      return;
    }

    matched.add(hit.id);
    hit.el.classList.add('circled');
    placeCircleMark(hit.id, hit.el);
    playCorrectBing();

    const need = exercise.sources.filter((s) => s.match === (exercise.targetMatch || 'blue'));
    const done = need.every((s) => matched.has(s.id));
    /* No wrong circles stick, so "none wrong" is automatic */
    if (done) {
      markExerciseComplete(currentId);
      setTimeout(() => {
        if (exercise && exercise.mode === 'circle-draw') showCelebrate();
      }, 350);
    }
  }

  function isRoughlyStraightStroke(pts) {
    if (!pts || pts.length < 4) return false;
    const len = pathLength(pts);
    if (len < 36) return false;
    const a = pts[0];
    const b = pts[pts.length - 1];
    const chord = Math.hypot(a.x - b.x, a.y - b.y);
    /* Straight-ish: chord ≈ path length; reject loops / scribbles */
    if (chord < Math.max(28, len * 0.68)) return false;
    /* Also reject almost-closed shapes */
    if (chord < 24 && len > 70) return false;
    return true;
  }

  function strokeHitsItem(pts, el) {
    const c = centerOf(el);
    const half = Math.max(el.offsetWidth || 40, el.offsetHeight || 40) * 0.48;
    let minDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - c.x, pts[i].y - c.y);
      if (d < minDist) minDist = d;
    }
    if (minDist > half) return false;
    const a = pts[0];
    const b = pts[pts.length - 1];
    const startDist = Math.hypot(a.x - c.x, a.y - c.y);
    const endDist = Math.hypot(b.x - c.x, b.y - c.y);
    /* Prefer a swipe that crosses through (at least one end outside-ish) */
    return startDist > half * 0.35 || endDist > half * 0.35;
  }

  function findStruckCandy(pts) {
    if (!exercise || exercise.mode !== 'strike-draw') return null;
    if (!isRoughlyStraightStroke(pts)) return null;
    let best = null;
    let bestDist = Infinity;
    itemEls.forEach((el, id) => {
      const meta = itemMeta.get(id);
      if (!meta || meta.role !== 'source') return;
      if (!strokeHitsItem(pts, el)) return;
      const c = centerOf(el);
      const mid = pts[Math.floor(pts.length / 2)];
      const d = Math.hypot(mid.x - c.x, mid.y - c.y);
      if (d < bestDist) {
        bestDist = d;
        best = { id, el, meta };
      }
    });
    return best;
  }

  function placeStrikeMark(id, el) {
    const c = centerOf(el);
    const size = Math.max(el.offsetWidth || 40, el.offsetHeight || 40) * 0.55;
    const { w: sw, h: sh } = stageSize();
    let mark = strikeMarks.get(id);
    if (!mark) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'strike-mark');
      const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      g.appendChild(l1);
      g.appendChild(l2);
      linesSvg.appendChild(g);
      mark = { el: g, l1: l1, l2: l2, normSize: size / Math.min(sw || 1, sh || 1) };
      strikeMarks.set(id, mark);
    }
    const s = size;
    mark.l1.setAttribute('x1', String(c.x - s));
    mark.l1.setAttribute('y1', String(c.y - s * 0.55));
    mark.l1.setAttribute('x2', String(c.x + s));
    mark.l1.setAttribute('y2', String(c.y + s * 0.55));
    mark.l2.setAttribute('x1', String(c.x + s));
    mark.l2.setAttribute('y1', String(c.y - s * 0.55));
    mark.l2.setAttribute('x2', String(c.x - s));
    mark.l2.setAttribute('y2', String(c.y + s * 0.55));
    mark.normSize = s / Math.min(sw || 1, sh || 1);
  }

  function redrawStrikeMarks() {
    if (!strikeDrawMode) return;
    const { w: sw, h: sh } = stageSize();
    const base = Math.min(sw || 1, sh || 1);
    strikeMarks.forEach((mark, id) => {
      const el = itemEls.get(id);
      if (!el || !mark.el) return;
      const c = centerOf(el);
      const s = (mark.normSize || 0.08) * base;
      mark.l1.setAttribute('x1', String(c.x - s));
      mark.l1.setAttribute('y1', String(c.y - s * 0.55));
      mark.l1.setAttribute('x2', String(c.x + s));
      mark.l1.setAttribute('y2', String(c.y + s * 0.55));
      mark.l2.setAttribute('x1', String(c.x + s));
      mark.l2.setAttribute('y1', String(c.y - s * 0.55));
      mark.l2.setAttribute('x2', String(c.x - s));
      mark.l2.setAttribute('y2', String(c.y + s * 0.55));
    });
  }

  function endStrikeDraw(clientX, clientY) {
    if (!drawing) return;
    const pts = points.slice();
    if (clientX != null && clientY != null) {
      pts.push(stagePoint(clientX, clientY));
    }
    drawing = false;
    drawFromId = null;
    livePath = null;
    points = [];
    activePointerId = null;
    drawSvg.innerHTML = '';

    const hit = findStruckCandy(simplify(pts, 4));
    if (!hit) return;

    const isTarget = hit.meta.match === (exercise.targetMatch || 'odd');
    if (!isTarget) {
      gentleShake(hit.el);
      return;
    }
    if (matched.has(hit.id)) return;

    matched.add(hit.id);
    hit.el.classList.add('struck');
    placeStrikeMark(hit.id, hit.el);
    playCorrectBing();

    const need = exercise.sources.filter((s) => s.match === (exercise.targetMatch || 'odd'));
    const done = need.every((s) => matched.has(s.id));
    if (done) {
      markExerciseComplete(currentId);
      setTimeout(() => {
        if (exercise && exercise.mode === 'strike-draw') showCelebrate();
      }, 350);
    }
  }

  function toggleCountCircle(rowIndex, circleIndex, btn, rowEl) {
    if (!countFillState || !exercise || exercise.mode !== 'count-fill') return;
    ensureAudio();
    const row = countFillState.rows[rowIndex];
    const filledNow = btn.classList.contains('filled');
    if (filledNow) {
      btn.classList.remove('filled');
      btn.setAttribute('aria-pressed', 'false');
      row.filled = Math.max(0, row.filled - 1);
    } else {
      btn.classList.add('filled');
      btn.setAttribute('aria-pressed', 'true');
      row.filled += 1;
    }
    const correct = row.filled === row.count;
    rowEl.classList.toggle('row-correct', correct);
    if (correct && !row.wasCorrect) {
      row.wasCorrect = true;
      playCorrectBing();
    }
    if (!correct) {
      row.wasCorrect = false;
    }
    if (countFillState.rows.every((r) => r.filled === r.count)) {
      markExerciseComplete(currentId);
      setTimeout(() => {
        if (
          exercise &&
          exercise.mode === 'count-fill' &&
          countFillState &&
          countFillState.rows.every((r) => r.filled === r.count)
        ) {
          showCelebrate();
        }
      }, 350);
    }
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
    ensureAudio(); /* unlock AudioContext on gesture (iOS) */

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

    const a = centerOf(fromEl);
    const b = centerOf(toEl);
    let finalPts = pts.slice();
    if (finalPts.length < 2) finalPts = [a, b];
    finalPts[0] = a;
    finalPts[finalPts.length - 1] = b;
    finalPts = simplify(finalPts, 6);

    const { w: sw, h: sh } = stageSize();
    const normPts = finalPts.map((pt) => ({
      x: pt.x / (sw || 1),
      y: pt.y / (sh || 1),
    }));

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'conn-line');
    path.setAttribute('d', pathFromPoints(finalPts));
    linesSvg.appendChild(path);

    matched.add(fromId);
    connections.push({ fromId, toId, pathEl: path, pts: finalPts, normPts });
    fromEl.classList.add('matched');
    toEl.classList.add('matched');
    playCorrectBing();

    if (allDone()) {
      markExerciseComplete(currentId);
      setTimeout(showCelebrate, 350);
    }
  }

  function redrawConnections() {
    const { w: sw, h: sh } = stageSize();
    connections.forEach((c) => {
      const fromEl = itemEls.get(c.fromId);
      const toEl = itemEls.get(c.toId);
      if (!fromEl || !toEl || !c.pathEl) return;
      /* Always use live element centers (getBoundingClientRect → stage space) */
      const a = centerOf(fromEl);
      const b = centerOf(toEl);
      let pts;
      if (c.normPts && c.normPts.length >= 2) {
        /* Remap freehand shape proportionally to new stage size */
        pts = c.normPts.map((pt) => ({ x: pt.x * sw, y: pt.y * sh }));
      } else {
        pts = [a, b];
      }
      pts[0] = a;
      pts[pts.length - 1] = b;
      c.pts = pts;
      /* Refresh normalized form from remapped pts so successive resizes stay stable */
      c.normPts = pts.map((pt) => ({
        x: pt.x / (sw || 1),
        y: pt.y / (sh || 1),
      }));
      c.pathEl.setAttribute('d', pathFromPoints(pts));
    });
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    if (drawing) return;
    if (exercise && exercise.mode === 'count-fill') return;
    let started = false;
    if (exercise && (exercise.mode === 'circle-draw' || exercise.mode === 'strike-draw')) {
      started = beginCircleDraw(e.pointerId, e.clientX, e.clientY);
    } else {
      started = beginDraw(e.pointerId, e.clientX, e.clientY);
    }
    if (started) {
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drawing || e.pointerId !== activePointerId) return;
    if (exercise && (exercise.mode === 'circle-draw' || exercise.mode === 'strike-draw')) {
      moveCircleDraw(e.clientX, e.clientY);
    } else {
      moveDraw(e.clientX, e.clientY);
    }
    e.preventDefault();
  });

  function onPointerUp(e) {
    if (!drawing || e.pointerId !== activePointerId) return;
    if (exercise && exercise.mode === 'circle-draw') {
      endCircleDraw(e.clientX, e.clientY);
    } else if (exercise && exercise.mode === 'strike-draw') {
      endStrikeDraw(e.clientX, e.clientY);
    } else {
      endDraw(e.clientX, e.clientY);
    }
    e.preventDefault();
  }

  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', (e) => {
    if (e.pointerId === activePointerId) cancelDraw();
  });

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

  celebrateNext.addEventListener('click', () => {
    hideCelebrate();
    const nextId = pickRandomIncompleteExercise();
    if (nextId) {
      startExercise(nextId);
    } else {
      clearBoard();
      showScreen('home');
      showHomeToast('Alle Rätsel geschafft!');
    }
  });

  const btnZufall = document.getElementById('btn-zufall');
  if (btnZufall) {
    btnZufall.addEventListener('click', () => {
      const id = pickRandomIncompleteExercise();
      if (!id) {
        showHomeToast('Alle Rätsel geschafft!');
        return;
      }
      startExercise(id);
    });
  }

  applyMenuNumbers();

  celebrateHome.addEventListener('click', () => {
    hideCelebrate();
    clearBoard();
    showScreen('home');
  });

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeStage();
      /* Second pass after layout/paint — iOS rotate settles late */
      requestAnimationFrame(() => {
        sizeStage();
        requestAnimationFrame(redrawConnections);
      });
    }, 50);
  }
  function onOrientation() {
    /* iPad fires orientationchange before final viewport size */
    sizeStage();
    setTimeout(sizeStage, 100);
    setTimeout(() => {
      sizeStage();
      redrawConnections();
    }, 300);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onOrientation);
  if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
    screen.orientation.addEventListener('change', onOrientation);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => onResize()).observe(stageWrap);
    if (portraitShell) new ResizeObserver(() => onResize()).observe(portraitShell);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=30').catch(() => {});
    });
  }

  tryLockPortrait();
  showScreen('home');
  sizePortraitShell();
})();
