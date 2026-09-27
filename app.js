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
    /* Cute kid-hand: warm skin, soft outline, rounded fingers.
       Worksheet style: 1=thumb, 2=thumb+index, 3=thumb+index+middle.
       Ring+pinky stay tucked as a soft fist knuckle so counts read clearly. */
    const skin = '#FFBE98';
    const outline = '#D4896A';
    const blush = '#F4A88A';
    const sw = 2.2;
    /* shared fist/palm — chubby rounded mitt */
    const palm = `
      <ellipse cx="54" cy="78" rx="28" ry="24" fill="${skin}" stroke="${outline}" stroke-width="${sw}"/>
      <ellipse cx="42" cy="70" rx="7" ry="4.5" fill="#fff" opacity=".28"/>
      <ellipse cx="62" cy="86" rx="10" ry="6" fill="${blush}" opacity=".35"/>`;
    /* tucked ring + pinky knuckles (always visible, never count) */
    const tucked = `
      <path d="M68 62 Q74 58 76 64 Q74 72 68 70 Z" fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>
      <path d="M76 66 Q82 62 84 68 Q82 76 76 74 Z" fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    /* thumb always up — short chubby capsule, angled left */
    const thumb = `
      <path d="M36 62
               C28 54 24 40 28 28
               C30 20 38 16 44 22
               C50 28 50 44 46 58
               C44 62 40 64 36 62 Z"
            fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>
      <ellipse cx="34" cy="34" rx="3.5" ry="5" fill="#fff" opacity=".22"/>`;
    /* index — tall rounded finger */
    const index = fingers >= 2 ? `
      <path d="M48 58
               C46 40 46 22 50 12
               C52 6 60 6 62 14
               C64 26 62 44 58 58
               C56 62 50 62 48 58 Z"
            fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>
      <ellipse cx="54" cy="18" rx="3" ry="4.5" fill="#fff" opacity=".22"/>` : '';
    /* middle — slightly taller, to the right of index */
    const middle = fingers >= 3 ? `
      <path d="M60 60
               C60 42 62 24 66 14
               C68 8 76 8 78 16
               C80 28 78 46 74 60
               C72 64 62 64 60 60 Z"
            fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>
      <ellipse cx="70" cy="20" rx="3" ry="4.5" fill="#fff" opacity=".22"/>` : '';
    /* when only thumb: show two soft curled fingertips so it still looks like a hand */
    const curledRest = fingers === 1 ? `
      <path d="M50 58 Q52 48 58 50 Q60 58 54 62 Q50 62 50 58 Z" fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>
      <path d="M58 60 Q62 50 68 52 Q70 60 64 64 Q58 64 58 60 Z" fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>` : (
      fingers === 2 ? `
      <path d="M60 60 Q64 50 70 52 Q72 60 66 64 Q60 64 60 60 Z" fill="${skin}" stroke="${outline}" stroke-width="${sw}" stroke-linejoin="round"/>` : ''
    );
    return `
      <svg viewBox="0 0 100 110" aria-hidden="true">
        ${palm}
        ${tucked}
        ${curledRest}
        ${middle}${index}${thumb}
      </svg>`;
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
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <path d="M18 28 Q45 48 72 28" fill="none" stroke="#E63946" stroke-width="14" stroke-linecap="round"/>
        <path d="M60 32 Q68 55 58 72" fill="none" stroke="#FFD60A" stroke-width="10" stroke-linecap="round"/>
        <path d="M66 36 Q74 58 72 74" fill="none" stroke="#E63946" stroke-width="10" stroke-linecap="round"/>
        <path d="M54 68 L50 78 M58 70 L56 80 M62 72 L66 80 M70 70 L74 78" stroke="#FFD60A" stroke-width="2"/>
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
    return `
      <svg viewBox="0 0 90 80" aria-hidden="true">
        <ellipse cx="45" cy="32" rx="28" ry="16" fill="#94A3B8"/>
        <circle cx="28" cy="34" r="14" fill="#94A3B8"/>
        <circle cx="58" cy="30" r="16" fill="#64748B"/>
        <circle cx="42" cy="24" r="14" fill="#CBD5E1"/>
        <line x1="30" y1="52" x2="26" y2="70" stroke="#4361EE" stroke-width="4" stroke-linecap="round"/>
        <line x1="45" y1="54" x2="42" y2="72" stroke="#4361EE" stroke-width="4" stroke-linecap="round"/>
        <line x1="60" y1="52" x2="58" y2="68" stroke="#4361EE" stroke-width="4" stroke-linecap="round"/>
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
    return `
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <g stroke="#89C2D9" stroke-width="4" stroke-linecap="round">
          <line x1="40" y1="10" x2="40" y2="70"/>
          <line x1="14" y1="25" x2="66" y2="55"/>
          <line x1="14" y1="55" x2="66" y2="25"/>
          <line x1="40" y1="22" x2="30" y2="16"/>
          <line x1="40" y1="22" x2="50" y2="16"/>
          <line x1="40" y1="58" x2="30" y2="64"/>
          <line x1="40" y1="58" x2="50" y2="64"/>
        </g>
        <circle cx="40" cy="40" r="6" fill="#E0F2FE" stroke="#4361EE" stroke-width="2"/>
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
      hint: 'Welche Kleidung passt zum Wetter? Verbinde!',
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
        { id: 'pw_red',    match: 'red',    svg: () => pinwheelSvg(COLORS.red),    x: 0.14, y: 0.78, w: 0.18, aspect: 1.35 },
        { id: 'pw_blue',   match: 'blue',   svg: () => pinwheelSvg(COLORS.blue),   x: 0.38, y: 0.78, w: 0.18, aspect: 1.35 },
        { id: 'pw_green',  match: 'green',  svg: () => pinwheelSvg(COLORS.green),  x: 0.62, y: 0.78, w: 0.18, aspect: 1.35 },
        { id: 'pw_yellow', match: 'yellow', svg: () => pinwheelSvg(COLORS.yellow), x: 0.86, y: 0.78, w: 0.18, aspect: 1.35 },
      ],
      targets: [
        { id: 'pp_yellow', match: 'yellow', svg: () => paperSquareSvg(COLORS.yellow), x: 0.14, y: 0.22, w: 0.18, aspect: 1.0 },
        { id: 'pp_red',    match: 'red',    svg: () => paperSquareSvg(COLORS.red),    x: 0.38, y: 0.22, w: 0.18, aspect: 1.0 },
        { id: 'pp_blue',   match: 'blue',   svg: () => paperSquareSvg(COLORS.blue),   x: 0.62, y: 0.22, w: 0.18, aspect: 1.0 },
        { id: 'pp_green',  match: 'green',  svg: () => paperSquareSvg(COLORS.green),  x: 0.86, y: 0.22, w: 0.18, aspect: 1.0 },
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

  function nextUnfinishedId(fromId) {
    const order = MENU_ORDER.filter((id) => EXERCISES[id]);
    if (!order.length) return null;
    const start = Math.max(0, order.indexOf(fromId));
    /* Prefer next unfinished after current, wrapping around */
    for (let i = 1; i <= order.length; i++) {
      const id = order[(start + i) % order.length];
      if (!completedExercises.has(id)) return id;
    }
    /* All done — wrap to first in menu */
    return order[0];
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
        sources: withShuffledSlots(base.sources),
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

    /* Fresh shuffled layout every open / Nochmal — match ids stay correct */
    exercise = {
      title: base.title,
      hint: base.hint,
      mode: base.mode,
      sources: withShuffledSlots(base.sources),
      targets: withShuffledSlots(base.targets),
      mascot: base.mascot ? Object.assign({}, base.mascot) : null,
    };
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
    board.className = 'meadow-board';
    circleDrawMode = true;
    circleMarks.clear();
    linesSvg.style.display = '';
    drawSvg.style.display = '';
    ex.sources.forEach((s) => {
      const el = makeItem(s, 'source');
      el.classList.add('flower-item');
      el.setAttribute('aria-label', 'Blume');
      el.dataset.color = s.match;
    });
    placeMascot(ex);
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
    if (exercise && exercise.mode === 'circle-draw') {
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
    if (exercise && exercise.mode === 'circle-draw') {
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
    const nextId = nextUnfinishedId(currentId);
    if (nextId) startExercise(nextId);
  });

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
      navigator.serviceWorker.register('./sw.js?v=21').catch(() => {});
    });
  }

  tryLockPortrait();
  showScreen('home');
  sizePortraitShell();
})();
