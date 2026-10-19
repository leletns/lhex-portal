// Renderizadores das peças visuais em tamanho real — direção "dark luxury":
// foto real do Dr. Leonardo / centro cirúrgico ao fundo, painéis de vidro escuro, acentos dourados.
// Todas as peças levam logo + rodapé CFM.
//
// Vidro sem backdrop-filter: cada painel recebe a versão desfocada da MESMA foto, alinhada pixel a pixel
// (assets/photos/blur). Assim o efeito sai idêntico no navegador, no html2canvas e no PDF.
import { CFM_FOOTER, DOCTOR } from '../config.js';
import { esc } from './util.js';

const LOGO_LIGHT = 'assets/logo-leonardo-valadao-light.svg';

// Fotos reais (somente Dr. Leonardo e ambiente hospitalar). w/h = dimensões do arquivo, f = ponto focal.
const PHOTO = {
  'dr-lipedefinition': { w: 1200, h: 1600, f: [62, 14], z: 1.12 },
  'dr-lipedefinition-2': { w: 1200, h: 1600, f: [74, 14], z: 1.12 },
  'dr-blue': { w: 1200, h: 1600, f: [52, 12], z: 1.18 },
  'dr-blue-team': { w: 1200, h: 1600, f: [62, 12], z: 1.18 },
  'dr-or-green': { w: 1200, h: 1500, f: [50, 30] },
  'dr-or-green-2': { w: 1200, h: 1600, f: [62, 38] },
  'dr-or-green-3': { w: 1200, h: 1600, f: [50, 38] },
  'dr-or-purple': { w: 1200, h: 1600, f: [55, 16], z: 1.08 },
  'dr-or-light': { w: 1200, h: 1600, f: [58, 16], z: 1.1 },
  'dr-or-light-2': { w: 1200, h: 1600, f: [55, 16], z: 1.1 },
  'dr-congress': { w: 1200, h: 1500, f: [50, 28] },
  'dr-suit': { w: 956, h: 1700, f: [50, 25] },
  'hospital': { w: 1200, h: 1600, f: [50, 50] },
  'or-team': { w: 956, h: 1700, f: [55, 28] },
  'dr-gowning': { w: 956, h: 1700, f: [35, 25] },
  'instruments': { w: 956, h: 1700, f: [50, 50] },
  'monitor': { w: 956, h: 1700, f: [50, 35] },
  'or-room': { w: 956, h: 1700, f: [50, 55] },
  'equipment': { w: 956, h: 1700, f: [50, 50] },
};

// Fotos por caso: [capa, slide 2, slide 3, slide 4, CTA]
const CASE_PHOTOS = {
  1: ['dr-blue', 'or-room', 'instruments', 'dr-or-light', 'dr-or-purple'],
  2: ['dr-lipedefinition', 'or-team', 'equipment', 'dr-or-green-2', 'dr-or-green'],
  3: ['dr-or-light', 'monitor', 'instruments', 'dr-blue', 'dr-or-green-3'],
  4: ['dr-or-light-2', 'or-room', 'dr-gowning', 'dr-or-purple', 'dr-or-light'],
  5: ['dr-lipedefinition-2', 'equipment', 'or-team', 'dr-or-green', 'dr-or-purple'],
  6: ['dr-blue-team', 'instruments', 'dr-gowning', 'dr-or-green-3', 'dr-or-light-2'],
  7: ['dr-or-purple', 'monitor', 'or-room', 'dr-or-light', 'dr-blue'],
  8: ['dr-or-green-2', 'equipment', 'or-team', 'dr-lipedefinition-2', 'dr-or-green'],
  9: ['dr-or-green-3', 'or-room', 'instruments', 'dr-or-light-2', 'dr-or-purple'],
  10: ['dr-or-green', 'monitor', 'dr-gowning', 'dr-or-purple', 'dr-or-light'],
  11: ['dr-congress', 'hospital', 'monitor', 'dr-or-green', 'dr-or-green-2'],
  12: ['dr-lipedefinition', 'equipment', 'or-team', 'dr-lipedefinition-2', 'dr-or-green-3'],
};
const REEL_PHOTO = { 1: 'dr-or-green', 2: 'dr-lipedefinition', 3: 'dr-blue', 4: 'dr-gowning', 5: 'dr-or-light', 6: 'dr-lipedefinition-2', 7: 'dr-or-purple', 8: 'dr-blue-team', 9: 'dr-or-green-2', 10: 'dr-or-light-2', 11: 'dr-or-green-3', 12: 'dr-congress' };
const HL_PHOTOS = {
  lipedefinition: { cover: 'dr-lipedefinition', screens: ['dr-lipedefinition', 'or-team', 'equipment', 'dr-lipedefinition-2', 'dr-or-green-2', 'dr-or-purple'] },
  lipedema: { cover: 'dr-or-green', screens: ['dr-or-green', 'dr-congress', 'monitor', 'dr-or-light', 'or-room', 'dr-blue'] },
};

// Fotos de antes/depois encaixadas localmente no portal: `${postKey}:${slot}` → { src, iw, ih, zoom, x, y }.
// Ficam apenas na memória da aba — nunca são enviadas a servidor nem salvas no repositório.
export const PHOTOS = new Map();
export const ART_OPTS = new Map();
export const optsFor = (key) => {
  if (!ART_OPTS.has(key)) ART_OPTS.set(key, { band: false, after: 'Pós-operatório' });
  return ART_OPTS.get(key);
};

// Rótulo exibido da palavra-chave (o gatilho no ManyChat deve aceitar com e sem acento).
export const kwLabel = (k) => ({ DEFINICAO: 'DEFINIÇÃO', SEGURANCA: 'SEGURANÇA', DIASTASE: 'DIÁSTASE' }[k] || k);

// ---------- Primitivas ----------

// Geometria "cover" da foto no quadro — compartilhada pelo fundo e pelos painéis de vidro.
function cover(name, FW, FH) {
  const p = PHOTO[name];
  const s = Math.max(FW / p.w, FH / p.h) * (p.z || 1);
  const w = Math.round(p.w * s), h = Math.round(p.h * s);
  return { name, w, h, x: Math.round((FW - w) * p.f[0] / 100), y: Math.round((FH - h) * p.f[1] / 100) };
}

const bg = (g, shade) => `
  <div class="lx-bg" style="background-image:url('assets/photos/${g.name}.jpg');background-size:${g.w}px ${g.h}px;background-position:${g.x}px ${g.y}px"></div>
  <div class="lx-shade ${shade}"></div>`;

// Painel de vidro: posição absoluta (left/top em px) + fundo desfocado alinhado.
function glass(g, left, top, width, inner, cls = '', tint = 0.58) {
  return `<div class="lx-glass ${cls}" style="left:${left}px;top:${top}px;width:${width}px;
    background-image:linear-gradient(rgba(14,14,14,${tint}),rgba(14,14,14,${tint})),url('assets/photos/blur/${g.name}.jpg');
    background-size:auto,${g.w}px ${g.h}px;background-position:0 0,${g.x - left}px ${g.y - top}px">${inner}</div>`;
}

const head = (n, total) => `
  <div class="lx-head"><img class="lx-logo" src="${LOGO_LIGHT}" alt="">
  ${total ? `<span class="lx-count">${String(n).padStart(2, '0')} <i>/</i> ${String(total).padStart(2, '0')}</span>` : ''}</div>`;

const foot = () => `<div class="lx-foot">${esc(CFM_FOOTER)}</div>`;

const frame = (ratio, inner, cls = '') => `<div class="art lx art-${ratio} ${cls}">${inner}</div>`;

// ---------- Carrossel 1080x1350 ----------

function photoStyle(p, w, h) {
  if (!p) return '';
  const s = Math.max(w / p.iw, h / p.ih) * (p.zoom || 1);
  return `background-image:url('${p.src}');background-size:${Math.round(p.iw * s)}px ${Math.round(p.ih * s)}px;background-position:${p.x ?? 50}% ${p.y ?? 50}%;`;
}

// Slide de antes/depois — só aparece quando as fotos reais foram encaixadas no portal.
function beforeAfter(post, n, pair, g, title) {
  const o = optsFor(post.key);
  const [sa, sb] = pair;
  const A = PHOTOS.get(`${post.key}:${sa}`), B = PHOTOS.get(`${post.key}:${sb}`);
  const ph = (p, label) => `<div class="lx-ph" style="${photoStyle(p, 422, 760)}">${o.band ? '<i class="lx-band"></i>' : ''}<span class="lx-tag">${esc(label)}</span></div>`;
  const areas = post.caseData.areas || [];
  return frame('45', `${bg(g, 'shade-full')}${head(n, 5)}
    ${glass(g, 64, 170, 952, `
      <div class="lx-kicker">${esc(post.caseData.cover.kicker)} · ${esc(title)}</div>
      <div class="lx-ba">${ph(A, 'Antes')}${ph(B, o.after || 'Depois')}<span class="lx-arrow">→</span></div>
      ${areas.length ? `<div class="lx-areas"><b>Áreas tratadas</b>${areas.map((a) => `<span>${esc(a)}</span>`).join('')}</div>` : ''}`, 'pad-sm')}
    ${foot()}`);
}

export function carouselSlides(post) {
  const c = post.caseData;
  const [p1, p2, p3, p4, p5] = (CASE_PHOTOS[c.id] || CASE_PHOTOS[1]).map((n) => cover(n, 1080, 1350));
  const T = 5;
  const lip = c.guide === 'lipedema', cmp = c.guide === 'compare';
  const hasA = PHOTOS.has(`${post.key}:a`) && PHOTOS.has(`${post.key}:b`);
  const hasB = PHOTOS.has(`${post.key}:c`) && PHOTOS.has(`${post.key}:d`);

  const s1 = frame('45', `${bg(p1, 'shade-cover')}${head(1, T)}
    <div class="lx-cover">
      <div class="lx-kicker">${esc(c.cover.kicker)}</div>
      <h1>${c.cover.title}</h1>
      <p class="lx-sub">${esc(c.cover.sub)}</p>
      <div class="lx-swipe">Arraste <span>→</span></div>
    </div>${foot()}`);

  let s2;
  if (hasA) s2 = beforeAfter(post, 2, ['a', 'b'], p2, 'Frente');
  else if (lip) {
    const graus = [
      ['Grau 1', 'Pele lisa, subcutâneo espessado com pequenos nódulos.'],
      ['Grau 2', 'Pele irregular, nódulos maiores, aspecto de "colchão".'],
      ['Grau 3', 'Lóbulos de gordura e deformidade do contorno.'],
      ['Grau 4', 'Lipedema associado a linfedema (lipolinfedema).'],
    ];
    s2 = frame('45', `${bg(p2, 'shade-full')}${head(2, T)}
      ${glass(p2, 64, 190, 952, `<div class="lx-kicker">Classificação clínica</div><h2>Os 4 graus do <em>lipedema</em></h2>
        <div class="lx-grades">${graus.map(([g, d], i) => `<div><span class="lx-num">0${i + 1}</span><b>${g}</b><p>${d}</p></div>`).join('')}</div>
        <p class="lx-note">Diagnóstico e classificação são feitos em consulta, pelo exame físico.</p>`)}
      ${foot()}`);
  } else if (cmp) {
    const rows = [['Objetivo', 'Reduzir volume', 'Volume + sombras anatômicas'], ['Marcação', 'Áreas de gordura', 'Zonas musculares e camadas'], ['Camadas', 'Principalmente profunda', 'Profunda e superficial'], ['Transições', 'Pouco trabalhadas', 'Prioridade do planejamento'], ['Aspecto final', 'Mais magro', 'Contorno natural e definido']];
    s2 = frame('45', `${bg(p2, 'shade-full')}${head(2, T)}
      ${glass(p2, 64, 190, 952, `<div class="lx-kicker">Comparativo técnico</div><h2>Tradicional <em>×</em> Lipedefinition</h2>
        <table class="lx-cmp"><thead><tr><th></th><th>Lipo tradicional</th><th>Lipedefinition</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`)}
      ${foot()}`);
  } else {
    s2 = frame('45', `${bg(p2, 'shade-full')}${head(2, T)}
      ${glass(p2, 64, 200, 952, `<div class="lx-kicker">O caso</div><h2>${esc(c.hook)}</h2>
        <p class="lx-body">${esc(c.explain)}</p>
        <div class="lx-chips">${c.procedures.map((p) => `<span>${esc(p)}</span>`).join('')}</div>`)}
      ${foot()}`);
  }

  const s3 = hasB ? beforeAfter(post, 3, ['c', 'd'], p3, 'Perfil') : frame('45', `${bg(p3, 'shade-full')}${head(3, T)}
    ${glass(p3, 64, 230, 952, `<div class="lx-kicker">${lip ? 'Como reconhecer' : cmp ? 'Na prática' : 'Engenharia cirúrgica'}</div>
      <h2>${lip ? 'Sinais <em>clínicos</em>' : cmp ? 'O que <em>muda</em>' : 'A <em>técnica</em>'}</h2>
      <ol class="lx-steps">${c.technique.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`)}
    ${foot()}`);

  const s4 = frame('45', `${bg(p4, 'shade-full')}${head(4, T)}
    ${glass(p4, 64, 190, 952, `<div class="lx-kicker">${lip ? 'Tratamento' : 'Indicação & recuperação'}</div>
      <h2>${lip ? 'Clínico <em>e</em> cirúrgico' : 'Para quem <em>é indicado</em>'}</h2>
      <div class="lx-cols">
        <div><h3>${lip ? 'Base do tratamento' : 'Indicado para'}</h3><ul>${c.indication.for.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div><h3>${lip ? 'Quando operar' : 'Recuperação média'}</h3><ul>${c.indication.recovery.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </div>
      <p class="lx-note">Informações gerais. Indicação e recuperação são individuais.</p>`)}
    ${foot()}`);

  const s5 = frame('45', `${bg(p5, 'shade-cta')}${head(5, T)}
    ${glass(p5, 64, 790, 952, `
      <div class="lx-kicker">Material completo no direct</div>
      <h2 class="lx-cta">Comente <em>${esc(kwLabel(c.keyword))}</em></h2>
      <div class="lx-sign"><b>${esc(DOCTOR.name)}</b><span>${esc(DOCTOR.title)} · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}</span><span>${esc(DOCTOR.handle)} · ${esc(DOCTOR.city)}</span></div>`, 'pad-sm')}
    ${foot()}`);

  return [s1, s2, s3, s4, s5];
}

// ---------- Reel: capa 1080x1920 e miniatura de grade 1080x1350 ----------

export function reelCover(post, ratio = '916') {
  const s = post.script;
  const FH = ratio === '916' ? 1920 : 1350;
  const g = cover(REEL_PHOTO[s.id] || 'dr-or-green', 1080, FH);
  const top = ratio === '916' ? 1060 : 690;
  return frame(ratio, `${bg(g, 'shade-cover')}${head(0, 0)}
    ${glass(g, 64, top, 952, `
      <div class="lx-kicker">Reel ${String(s.id).padStart(2, '0')} · ${esc(s.pillar)}</div>
      <h1 class="lx-tarja">${esc(s.tarja)}</h1>
      <div class="lx-play"><span>▶</span>Assista até o final</div>`, 'pad-sm')}
    ${foot()}`, 'reel');
}

// ---------- Destaques 1080x1920 ----------

const ICONS = {
  contour: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M42 14c6 18 4 30-4 46s-8 30 2 46"/><path d="M78 14c-6 18-4 30 4 46s8 30-2 46"/><path d="M60 26v68" stroke-dasharray="3 6"/></svg>',
  legs: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M36 12c-6 16-7 32-4 48 2 14 4 30 2 48"/><path d="M84 12c6 16 7 32 4 48-2 14-4 30-2 48"/><path d="M34 44c16 7 36 7 52 0" stroke-dasharray="3 6"/><path d="M52 108l8-34 8 34"/></svg>',
};

export function highlightCover(h) {
  const g = cover(HL_PHOTOS[h.id].cover, 1080, 1920);
  return frame('916', `<div class="lx-bg lx-bg-blur" style="background-image:url('assets/photos/blur/${g.name}.jpg');background-size:${g.w}px ${g.h}px;background-position:${g.x}px ${g.y}px"></div>
    <div class="lx-shade shade-deep"></div>
    <div class="lx-hl"><div class="lx-ring">${ICONS[h.icon]}</div><div class="lx-hl-label">${esc(h.label)}</div></div>`, 'hl-cover');
}

export function highlightScreen(h, s, i) {
  const g = cover(HL_PHOTOS[h.id].screens[i] || HL_PHOTOS[h.id].cover, 1080, 1920);
  return frame('916', `${bg(g, s.cta ? 'shade-cta' : 'shade-story')}${head(i + 1, h.screens.length)}
    ${glass(g, 64, s.cta ? 1000 : 1040, 952, `
      <div class="lx-hl-mini">${ICONS[h.icon]}<span>${esc(h.label)}</span></div>
      <div class="lx-kicker">${esc(s.kicker)}</div>
      <h1 class="lx-story">${s.title}</h1>
      <p class="lx-body">${esc(s.body)}</p>
      ${s.cta ? '<div class="lx-sticker">Toque no link · WhatsApp da equipe</div>' : ''}`, 'pad-sm')}
    ${foot()}`, 'story');
}
