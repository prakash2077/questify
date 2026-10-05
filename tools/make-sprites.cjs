// Draws every character and weapon in assets/sprites/.
// Run it after changing anything here:   node tools/make-sprites.cjs
//
// The drawings share parts (the cloaked body, the glowing eyes, the gradients), so
// they are assembled here and written out as plain SVG files. The app itself only
// ever loads the finished files; this script is not part of the app.
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'assets', 'sprites') + path.sep;

// ---------- Shadow soldiers: 140 x 220, standing on y = 212 ----------

const soldierDefs = `
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b2347"/>
      <stop offset="0.45" stop-color="#0b0f22"/>
      <stop offset="1" stop-color="#04050b"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8fbcff"/>
      <stop offset="0.42" stop-color="#5b7cff" stop-opacity="0.35"/>
      <stop offset="0.7" stop-color="#5b7cff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9dcff"/>
      <stop offset="0.5" stop-color="#4a5a8c"/>
      <stop offset="1" stop-color="#141a33"/>
    </linearGradient>
    <linearGradient id="aura" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#3b4fe0" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7c4dff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4"/></filter>
  </defs>`;

// Shadow rising off the figure like cold flame.
const aura = `
  <g filter="url(#soft)" fill="url(#aura)">
    <path d="M30 212 C22 170 30 120 44 86 C40 60 52 30 70 8 C88 30 100 60 96 86 C110 120 118 170 110 212 Z"/>
    <path d="M22 150 C12 120 18 96 28 78 C26 100 34 112 40 124 Z" opacity="0.8"/>
    <path d="M118 150 C128 120 122 96 112 78 C114 100 106 112 100 124 Z" opacity="0.8"/>
  </g>`;

// The cloaked body every soldier shares: shoulders, torso, a long torn cloak.
const cloak = 'M48 82 L92 82 L96 122 L103 170 L110 212 L101 203 L95 212 L87 201 L79 212 L70 202 L61 212 L53 201 L45 212 L39 203 L30 212 L37 170 L44 122 Z';
const shoulders = 'M34 92 L24 78 L38 80 C42 70 54 66 64 70 L76 70 C86 66 98 70 102 80 L116 78 L106 92 L98 98 L86 84 L54 84 L42 98 Z';
const body = (extraDetail = '') => `
  <path d="${cloak}" fill="url(#body)"/>
  <g fill="none" stroke="#1d2a5c" stroke-width="1.4" stroke-linecap="round" opacity="0.9">
    <path d="M58 86 L70 104 L82 86"/>
    <path d="M47 124 H93"/>
    <path d="M58 128 L50 200 M70 128 V198 M82 128 L90 200"/>
    ${extraDetail}
  </g>
  <path d="${shoulders}" fill="url(#body)"/>
  <path d="${cloak}" fill="none" stroke="url(#rim)" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="${shoulders}" fill="none" stroke="url(#rim)" stroke-width="1.8" stroke-linejoin="round"/>`;

// Two narrow glowing eyes, at a given height.
const eyes = (y, colour = '#cfe2ff', halo = '#5b8cff') => `
  <g>
    <g fill="${halo}" filter="url(#glow)">
      <path d="M58 ${y} L67 ${y + 3} L66 ${y + 6.5} L58 ${y + 4.5} Z"/><path d="M82 ${y} L73 ${y + 3} L74 ${y + 6.5} L82 ${y + 4.5} Z"/>
    </g>
    <g fill="${colour}">
      <path d="M59 ${y + 1} L66.5 ${y + 3.4} L66 ${y + 5.6} L59 ${y + 3.8} Z"/><path d="M81 ${y + 1} L73.5 ${y + 3.4} L74 ${y + 5.6} L81 ${y + 3.8} Z"/>
    </g>
  </g>`;

const helm = 'M70 20 C80 24 87 34 87 48 L85 62 L77 72 L70 75 L63 72 L55 62 L53 48 C53 34 60 24 70 20 Z';
const helmet = (crest) => `
  ${crest}
  <path d="${helm}" fill="url(#body)"/>
  <path d="${helm}" fill="none" stroke="url(#rim)" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M70 22 V44" stroke="#1d2a5c" stroke-width="1.4"/>`;

const arm = (side) => {
  const m = side === 'left' ? (x) => 140 - x : (x) => x;
  return `<path d="M${m(98)} 90 L${m(108)} 104 L${m(106)} 132 L${m(98)} 136 L${m(96)} 110 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.2"/>`;
};

const soldier = (parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 220" width="140" height="220">
${soldierDefs}
${aura}
${parts}
</svg>
`;

// Swordsman: a greatsword held point-down in both hands, a swept-back plume.
fs.writeFileSync(out + 'soldier-swordsman.svg', soldier(`
  ${body()}
  ${arm('left')}${arm('right')}
  ${helmet('<path d="M70 20 C74 6 90 2 104 8 C92 12 86 20 84 32 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.4"/>')}
  ${eyes(46)}
  <!-- greatsword -->
  <path d="M65 118 L75 118 L74 196 L70 208 L66 196 Z" fill="url(#steel)"/>
  <path d="M70 122 V198" stroke="#9fd0ff" stroke-width="1.6" filter="url(#glow)"/>
  <path d="M70 122 V198" stroke="#e4f1ff" stroke-width="0.7"/>
  <path d="M50 112 L90 112 L86 119 L54 119 Z" fill="#2b3766" stroke="url(#rim)" stroke-width="1.2"/>
  <rect x="67" y="96" width="6" height="17" fill="#141a33"/>
  <circle cx="70" cy="94" r="4" fill="#2b3766" stroke="url(#rim)" stroke-width="1.2"/>
  <path d="M56 104 L84 104 L86 114 L54 114 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.2"/>
`));

// Archer: a deep hood instead of a helm, a tall longbow, arrows over the shoulder.
fs.writeFileSync(out + 'soldier-archer.svg', soldier(`
  <!-- arrows -->
  <g stroke="#3a4a80" stroke-width="2" stroke-linecap="round"><path d="M92 86 L112 44"/><path d="M96 88 L120 52"/><path d="M88 84 L104 40"/></g>
  <g fill="#9fd0ff"><path d="M112 44 l-1 -9 l6 6 z"/><path d="M120 52 l0 -9 l6 7 z"/><path d="M104 40 l-2 -9 l7 5 z"/></g>
  ${body()}
  ${arm('right')}
  <!-- hood -->
  <path d="M70 14 C88 20 96 40 92 66 L84 80 L70 84 L56 80 L48 66 C44 40 52 20 70 14 Z" fill="url(#body)"/>
  <path d="M70 14 C88 20 96 40 92 66 L84 80 L70 84 L56 80 L48 66 C44 40 52 20 70 14 Z" fill="none" stroke="url(#rim)" stroke-width="1.8"/>
  <path d="M70 30 C80 34 84 46 82 62 L76 72 L70 74 L64 72 L58 62 C56 46 60 34 70 30 Z" fill="#03040a"/>
  ${eyes(50)}
  <!-- longbow -->
  <path d="M30 22 C10 70 10 150 30 200" fill="none" stroke="#04050b" stroke-width="7" stroke-linecap="round"/>
  <path d="M30 22 C10 70 10 150 30 200" fill="none" stroke="url(#steel)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M30 22 L30 200" stroke="#9fd0ff" stroke-width="1" opacity="0.8"/>
  <path d="M42 90 L32 104 L24 116 L32 128 L44 110 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.2"/>
`));

// Mage: a tall pointed cowl, a staff crowned with a violet crystal.
fs.writeFileSync(out + 'soldier-mage.svg', soldier(`
  ${body('<path d="M64 140 l6 -8 l6 8 l-6 8 z"/>')}
  ${arm('left')}
  <!-- cowl -->
  <path d="M66 0 C80 16 94 40 92 66 L84 80 L70 84 L56 80 L48 66 C46 42 56 22 66 0 Z" fill="url(#body)"/>
  <path d="M66 0 C80 16 94 40 92 66 L84 80 L70 84 L56 80 L48 66 C46 42 56 22 66 0 Z" fill="none" stroke="url(#rim)" stroke-width="1.8"/>
  <path d="M70 32 C80 36 84 48 82 62 L76 72 L70 74 L64 72 L58 62 C56 48 60 36 70 32 Z" fill="#03040a"/>
  ${eyes(50, '#ecdcff', '#a06bff')}
  <!-- staff -->
  <path d="M112 36 L110 212" stroke="#04050b" stroke-width="7" stroke-linecap="round"/>
  <path d="M112 36 L110 212" stroke="url(#steel)" stroke-width="3" stroke-linecap="round"/>
  <path d="M102 40 C100 26 106 18 112 14 C118 18 124 26 122 40" fill="none" stroke="url(#steel)" stroke-width="3" stroke-linecap="round"/>
  <path d="M112 10 L119 24 L112 38 L105 24 Z" fill="#a06bff" filter="url(#glow)"/>
  <path d="M112 12 L118 24 L112 36 L106 24 Z" fill="#e3d2ff"/>
  <path d="M112 12 L112 36 M106 24 H118" stroke="#a06bff" stroke-width="0.8"/>
  <path d="M100 96 L110 108 L116 124 L108 132 L98 114 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.2"/>
`));

// Knight: horned helm, a tall lance, a kite shield bearing the System diamond.
fs.writeFileSync(out + 'soldier-knight.svg', soldier(`
  <!-- lance -->
  <path d="M114 28 L112 212" stroke="#04050b" stroke-width="7" stroke-linecap="round"/>
  <path d="M114 28 L112 212" stroke="url(#steel)" stroke-width="3" stroke-linecap="round"/>
  <path d="M114 0 L121 30 L114 38 L107 30 Z" fill="url(#steel)"/>
  <path d="M114 4 V34" stroke="#e4f1ff" stroke-width="0.8"/>
  ${body()}
  ${arm('right')}
  ${helmet(`
  <path d="M56 40 C40 36 34 20 40 4 C44 18 52 24 60 28 Z" fill="url(#body)" stroke="url(#rim)" stroke-width="1.4"/>
  <path d="M84 40 C100 36 106 20 100 4 C96 18 88 24 80 28 Z" fill="url(#body)" stroke="#5b7cff" stroke-opacity="0.25" stroke-width="1.4"/>`)}
  ${eyes(46)}
  <!-- kite shield -->
  <path d="M12 96 L60 96 L60 140 C60 164 48 184 36 196 C24 184 12 164 12 140 Z" fill="url(#body)"/>
  <path d="M12 96 L60 96 L60 140 C60 164 48 184 36 196 C24 184 12 164 12 140 Z" fill="none" stroke="url(#steel)" stroke-width="2.4"/>
  <path d="M36 114 L48 132 L36 150 L24 132 Z" fill="#5b8cff" filter="url(#glow)"/>
  <path d="M36 116 L47 132 L36 148 L25 132 Z" fill="#0b0f22" stroke="#9fd0ff" stroke-width="1.6"/>
`));

// ---------- Weapons planted in the ground: 60 x 170 ----------

const weapon = (parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 170" width="60" height="170">
  <defs>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9dcff"/>
      <stop offset="0.5" stop-color="#4a5a8c"/>
      <stop offset="1" stop-color="#141a33"/>
    </linearGradient>
    <linearGradient id="haft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a6aa0"/>
      <stop offset="1" stop-color="#0b0f22"/>
    </linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
${parts}
  <!-- where it meets the ground -->
  <ellipse cx="30" cy="164" rx="16" ry="3.5" fill="#000" opacity="0.7"/>
</svg>
`;

fs.writeFileSync(out + 'weapon-sword.svg', weapon(`
  <circle cx="30" cy="10" r="5" fill="#2b3766" stroke="#8fbcff" stroke-width="1.2"/>
  <rect x="27" y="14" width="6" height="26" fill="#141a33"/>
  <path d="M8 40 L52 40 L48 48 L12 48 Z" fill="#2b3766" stroke="#8fbcff" stroke-width="1.2"/>
  <path d="M24 48 L36 48 L35 164 L25 164 Z" fill="url(#steel)"/>
  <path d="M30 52 V160" stroke="#9fd0ff" stroke-width="1.8" filter="url(#glow)"/>
  <path d="M30 52 V160" stroke="#e4f1ff" stroke-width="0.7"/>
`));

fs.writeFileSync(out + 'weapon-spear.svg', weapon(`
  <path d="M30 44 V164" stroke="#04050b" stroke-width="7" stroke-linecap="round"/>
  <path d="M30 44 V164" stroke="url(#haft)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M30 2 L39 34 L30 48 L21 34 Z" fill="url(#steel)"/>
  <path d="M30 6 V44" stroke="#e4f1ff" stroke-width="0.8"/>
  <!-- torn pennant -->
  <path d="M32 54 C44 52 52 58 56 54 L52 66 L56 76 C48 74 42 80 32 78 Z" fill="#3b4fe0" opacity="0.75"/>
  <path d="M32 54 C44 52 52 58 56 54" fill="none" stroke="#8fbcff" stroke-width="1"/>
`));

fs.writeFileSync(out + 'weapon-axe.svg', weapon(`
  <defs>
    <linearGradient id="edgeR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#141a33"/><stop offset="0.6" stop-color="#4a5a8c"/><stop offset="1" stop-color="#c9dcff"/></linearGradient>
    <linearGradient id="edgeL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#141a33"/><stop offset="0.6" stop-color="#3a4878"/><stop offset="1" stop-color="#8fa6dd"/></linearGradient>
  </defs>
  <path d="M30 10 V164" stroke="#04050b" stroke-width="7" stroke-linecap="round"/>
  <path d="M30 10 V164" stroke="url(#haft)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M32 20 C42 12 54 14 57 32 C54 50 42 52 32 44 Z" fill="url(#edgeR)"/>
  <path d="M28 20 C18 12 6 14 3 32 C6 50 18 52 28 44 Z" fill="url(#edgeL)"/>
  <path d="M57 32 C54 50 42 52 32 44" fill="none" stroke="#9fd0ff" stroke-width="1.6" filter="url(#glow)"/>
  <path d="M26 16 H34 V48 H26 Z" fill="#2b3766" stroke="#8fbcff" stroke-width="1"/>
  <path d="M30 2 L35 12 L30 18 L25 12 Z" fill="url(#steel)"/>
`));

// ---------- Demons: 260 x 240 busts that rise out of the dark ----------

const demon = (parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 240" width="260" height="240">
  <defs>
    <linearGradient id="hide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a0a10"/>
      <stop offset="0.5" stop-color="#16040a"/>
      <stop offset="1" stop-color="#050102"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff5a4a"/>
      <stop offset="0.5" stop-color="#b3121f" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#b3121f" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="rise"><rect width="260" height="240" fill="url(#fade)"/></mask>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <g mask="url(#rise)">
${parts}
  </g>
</svg>
`;

const demonEyes = (y, spread) => `
    <g fill="#ff2a2a" filter="url(#glow)">
      <path d="M${130 - spread - 16} ${y} L${130 - spread + 10} ${y + 9} L${130 - spread + 6} ${y + 15} L${130 - spread - 14} ${y + 7} Z"/>
      <path d="M${130 + spread + 16} ${y} L${130 + spread - 10} ${y + 9} L${130 + spread - 6} ${y + 15} L${130 + spread + 14} ${y + 7} Z"/>
    </g>
    <g fill="#ffd9c2">
      <path d="M${130 - spread - 12} ${y + 3} L${130 - spread + 7} ${y + 9.5} L${130 - spread + 5} ${y + 12.5} L${130 - spread - 11} ${y + 6.5} Z"/>
      <path d="M${130 + spread + 12} ${y + 3} L${130 + spread - 7} ${y + 9.5} L${130 + spread - 5} ${y + 12.5} L${130 + spread + 11} ${y + 6.5} Z"/>
    </g>`;

// Brute: a heavy horned head sunk between spiked shoulders.
const bruteShape = 'M130 52 C152 52 168 66 172 88 L176 112 C196 112 226 122 244 150 L260 240 L0 240 L16 150 C34 122 64 112 84 112 L88 88 C92 66 108 52 130 52 Z';
fs.writeFileSync(out + 'demon-brute.svg', demon(`
    <path d="M96 78 C60 74 36 50 34 10 C48 38 72 52 104 58 Z" fill="url(#hide)" stroke="url(#rim)" stroke-width="2"/>
    <path d="M164 78 C200 74 224 50 226 10 C212 38 188 52 156 58 Z" fill="url(#hide)" stroke="url(#rim)" stroke-width="2"/>
    <path d="M16 150 L4 118 L34 134 L44 104 L62 124 Z" fill="url(#hide)" stroke="url(#rim)" stroke-width="2"/>
    <path d="M244 150 L256 118 L226 134 L216 104 L198 124 Z" fill="url(#hide)" stroke="url(#rim)" stroke-width="2"/>
    <path d="${bruteShape}" fill="url(#hide)"/>
    <path d="${bruteShape}" fill="none" stroke="url(#rim)" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M100 86 L130 96 L160 86" fill="none" stroke="#050102" stroke-width="6" stroke-linecap="round"/>
    ${demonEyes(88, 22)}
    <!-- embers glowing behind clenched teeth -->
    <path d="M108 124 l7 6 l7 -6 l8 6 l8 -6 l7 6 l7 -6" fill="none" stroke="#ff6a3c" stroke-width="2.2" stroke-linejoin="round" filter="url(#glow)"/>
    <path d="M108 124 l7 6 l7 -6 l8 6 l8 -6 l7 6 l7 -6" fill="none" stroke="#ffb38a" stroke-width="1" stroke-linejoin="round" opacity="0.8"/>
`));

// Fiend: a narrow skull crowned with antlers, on a long neck.
const fiendShape = 'M130 46 C146 46 158 58 160 76 L158 100 L148 122 L152 140 C176 144 206 158 224 186 L236 240 L24 240 L36 186 C54 158 84 144 108 140 L112 122 L102 100 L100 76 C102 58 114 46 130 46 Z';
fs.writeFileSync(out + 'demon-imp.svg', demon(`
    <g fill="url(#hide)" stroke="url(#rim)" stroke-width="2" stroke-linejoin="round">
      <path d="M112 60 C96 44 92 24 96 2 C102 20 110 30 122 40 Z"/>
      <path d="M104 62 C82 56 66 40 62 16 C74 32 88 40 108 48 Z"/>
      <path d="M100 70 C76 72 56 62 44 42 C60 54 78 56 100 58 Z"/>
      <path d="M148 60 C164 44 168 24 164 2 C158 20 150 30 138 40 Z"/>
      <path d="M156 62 C178 56 194 40 198 16 C186 32 172 40 152 48 Z"/>
      <path d="M160 70 C184 72 204 62 216 42 C200 54 182 56 160 58 Z"/>
    </g>
    <path d="${fiendShape}" fill="url(#hide)"/>
    <path d="${fiendShape}" fill="none" stroke="url(#rim)" stroke-width="2.4" stroke-linejoin="round"/>
    ${demonEyes(78, 12)}
    <path d="M130 96 L126 108 L134 108 Z" fill="#050102"/>
    <path d="M116 118 l5 5 l4.5 -5 l4.5 5 l4.5 -5 l4.5 5 l5 -5" fill="none" stroke="#ff6a3c" stroke-width="1.8" stroke-linejoin="round" filter="url(#glow)"/>
    <!-- cracks of fire in the chest -->
    <g fill="none" stroke="#ff4a2a" stroke-linecap="round" filter="url(#glow)" opacity="0.8">
      <path d="M130 156 L124 176 L134 190 L128 212" stroke-width="2.4"/>
      <path d="M124 176 L108 184 M134 190 L150 196" stroke-width="1.8"/>
    </g>
`));

console.log('sprites written');
