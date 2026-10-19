// Renderizadores das peças — direção EDITORIAL FULL-BLEED (capa de revista médica):
//  - cada slide é 100% fotográfico, sem "caixote" de vidro; a tipografia fica direto sobre a foto,
//    legível por vinhetas em degradê (topo/base) e color grading cinematográfico sutil;
//  - antes/depois em split edge-to-edge, separado por um fio dourado de 1px com o monograma ao centro;
//  - callouts anatômicos (fio dourado + ponto) em vez de blocos de texto;
//  - retrato do Dr. Leonardo só no slide 5 (assinatura); slides 1–4 usam ação/ambiente, cada peça única.
import { CFM_FOOTER, DOCTOR } from '../config.js';
import { esc } from './util.js';

const LOGO = 'assets/logo-leonardo-valadao-light.svg';

const PHOTO = {
  'dr-or-green': { w: 1200, h: 1500, f: [50, 26] }, 'dr-or-green-2': { w: 1200, h: 1600, f: [62, 26] },
  'dr-or-green-3': { w: 1200, h: 1600, f: [50, 26] }, 'dr-or-purple': { w: 1200, h: 1600, f: [55, 16] },
  'dr-or-light': { w: 1200, h: 1600, f: [58, 18] }, 'dr-or-light-2': { w: 1200, h: 1600, f: [55, 18] },
  'dr-suit': { w: 956, h: 1700, f: [50, 22] }, 'dr-congress': { w: 1200, h: 1500, f: [50, 24] },
  'face-green': { w: 956, h: 1700, f: [50, 24] }, 'face-blue': { w: 956, h: 1700, f: [55, 24] },
  'face-casual': { w: 956, h: 1700, f: [40, 26] },
  'dr-lipedefinition': { w: 1200, h: 1600, f: [62, 14], z: 1.12 }, 'dr-lipedefinition-2': { w: 1200, h: 1600, f: [74, 14], z: 1.12 },
  'dr-blue': { w: 1200, h: 1600, f: [52, 12], z: 1.18 }, 'dr-blue-team': { w: 1200, h: 1600, f: [62, 12], z: 1.18 },
  'op-stand': { w: 926, h: 1138, f: [60, 22] }, 'op-team-a': { w: 960, h: 1280, f: [50, 38] },
  'op-team-b': { w: 1200, h: 1667, f: [50, 40] }, 'op-team-c': { w: 997, h: 1700, f: [50, 40] },
  'op-team-wide': { w: 960, h: 1280, f: [55, 38] }, 'op-team-flowers': { w: 1200, h: 1600, f: [42, 34] },
  'op-mark-a': { w: 1200, h: 1600, f: [60, 30] }, 'op-mark-b': { w: 1200, h: 1600, f: [55, 32] },
  'op-focus-a': { w: 1200, h: 1600, f: [50, 28] }, 'op-focus-b': { w: 1200, h: 1600, f: [50, 28] },
  'op-focus-c': { w: 1200, h: 1600, f: [50, 28] }, 'op-focus-d': { w: 1200, h: 1600, f: [50, 28] },
  'op-warm-a': { w: 1200, h: 1600, f: [45, 24] }, 'op-warm-b': { w: 1200, h: 1600, f: [45, 24] },
  'op-warm-c': { w: 1200, h: 1600, f: [45, 26] }, 'op-warm-d': { w: 1200, h: 1600, f: [48, 26] },
  'op-warm-e': { w: 1200, h: 1600, f: [55, 26] }, 'op-light': { w: 1200, h: 1600, f: [45, 28] },
  'dr-gowning': { w: 956, h: 1700, f: [35, 24] },
  'hands-a': { w: 1200, h: 1600, f: [50, 50] }, 'hands-b': { w: 1200, h: 1600, f: [50, 50] },
  'room-a': { w: 1200, h: 1600, f: [50, 52] }, 'room-b': { w: 1200, h: 1600, f: [45, 52] },
  'room-c': { w: 1200, h: 1600, f: [50, 48] }, 'tray': { w: 1200, h: 1600, f: [45, 52] },
  'instruments': { w: 956, h: 1700, f: [50, 50] }, 'monitor': { w: 956, h: 1700, f: [50, 35] },
  'or-room': { w: 956, h: 1700, f: [50, 55] }, 'or-team': { w: 956, h: 1700, f: [55, 28] },
  'equipment': { w: 956, h: 1700, f: [50, 50] }, 'hospital': { w: 1200, h: 1600, f: [50, 50] },
};

// [capa, s2(guia/half-bg), s3(guia/half-bg), s4, s5-RETRATO]
const CASE_PHOTOS = {
  1: ['op-warm-a', 'op-focus-a', 'op-mark-a', 'hands-a', 'dr-or-green'],
  2: ['op-stand', 'op-team-a', 'op-focus-b', 'op-warm-b', 'face-green'],
  3: ['op-focus-a', 'op-warm-b', 'op-light', 'monitor', 'dr-or-purple'],
  4: ['op-warm-c', 'op-mark-a', 'op-focus-c', 'room-a', 'dr-or-light'],
  5: ['op-team-flowers', 'op-warm-d', 'op-focus-c', 'or-room', 'dr-or-green-2'],
  6: ['op-mark-b', 'op-warm-e', 'op-focus-d', 'tray', 'dr-or-light-2'],
  7: ['op-focus-c', 'op-light', 'op-warm-a', 'room-b', 'dr-or-green-3'],
  8: ['dr-blue', 'op-focus-d', 'op-team-c', 'hands-b', 'face-blue'],
  9: ['op-warm-d', 'op-focus-b', 'op-mark-b', 'room-c', 'dr-or-purple'],
  10: ['op-focus-d', 'op-warm-a', 'op-focus-a', 'monitor', 'dr-or-green'],
  11: ['op-team-b', 'monitor', 'op-light', 'hospital', 'face-green'],
  12: ['op-warm-e', 'op-team-c', 'op-focus-b', 'equipment', 'dr-or-green-2'],
};
const REEL_PHOTO = { 1: 'op-warm-b', 2: 'dr-lipedefinition', 3: 'op-mark-a', 4: 'dr-gowning', 5: 'op-focus-a', 6: 'dr-lipedefinition-2', 7: 'op-warm-c', 8: 'op-light', 9: 'op-team-a', 10: 'op-focus-d', 11: 'op-warm-e', 12: 'op-team-wide' };
const HL_PHOTOS = {
  lipedefinition: { cover: 'dr-lipedefinition', screens: ['op-stand', 'op-focus-a', 'op-warm-b', 'dr-lipedefinition-2', 'op-mark-b', 'dr-or-green-2'] },
  lipedema: { cover: 'dr-or-green', screens: ['op-warm-c', 'op-light', 'monitor', 'op-focus-c', 'room-a', 'face-green'] },
};

const CASE_SIL = { 1: 'torso', 2: 'torso', 3: 'bust', 4: 'bust', 5: 'torso', 6: 'torso', 7: 'bust', 8: 'torso', 9: 'bust', 10: 'bust' };
const CASE_PILLS = {
  1: { front: ['Linha alba', 'Plicatura de diástase', 'Transição de flancos'], side: ['Projeção glútea', 'Curva lombar'] },
  2: { front: ['Linha alba', 'Semilunares', 'Borda do peitoral'], side: ['Flancos', 'Dorso atlético'] },
  3: { front: ['Polo superior natural', 'Sulco inframamário'], side: ['Contorno lateral', 'Cintura'] },
  4: { front: ['Base mamária', 'Sulco inframamário'], side: ['Contorno lateral', 'Flancos'] },
  5: { front: ['Lipo de definição', 'Transição de flancos'], side: ['Enxerto glúteo', 'Curva lombar'] },
  6: { front: ['Plicatura dos retos', 'Cicatriz baixa'], side: ['Desenho da cintura', 'Flancos'] },
  7: { front: ['Volume mamário', 'Sulco inframamário'], side: ['Cintura', 'Abdome'] },
  8: { front: ['Exérese glandular', 'Contorno peitoral HD'], side: ['Flancos', 'Dorso'] },
  9: { front: ['Reposição da aréola', 'Polo superior'], side: ['Retirada de pele', 'Simetria'] },
  10: { front: ['Base mamária', 'Polo superior natural'], side: ['Projeção', 'Sulco inframamário'] },
};
const CASE_TECH = {
  1: 'Lipo HD + Enxerto', 2: 'Lipo HD masculina', 3: 'Lipo + Implante', 4: 'Lipo + Prótese', 5: 'Lipo HD + Enxerto',
  6: 'Abdominoplastia + Lipo', 7: 'Lipo + Prótese', 8: 'Lipo HD + Glandular', 9: 'Mastopexia + Prótese', 10: 'Mamoplastia de aumento',
};
const SIL = {
  torsoFront: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M64 36c-6 30-10 40-22 60 14 6 18 16 18 40 0 60-6 120 2 198 10 10 66 10 76 0 8-78 2-138 2-198 0-24 4-34 18-40-12-20-16-30-22-60-10 8-62 8-72 0Z"/><path d="M100 120v150" stroke-dasharray="2 7" opacity=".7"/><circle cx="100" cy="252" r="2"/><path d="M58 152c24 11 60 11 84 0" opacity=".5" stroke-dasharray="2 6"/></svg>',
  torsoSide: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M74 40c-5 42-7 74 0 116 7 42 11 72 5 122-4 34-2 60 7 92"/><path d="M74 40c32 6 47 32 44 74-2 38-19 58-15 100 4 42 24 66 18 118"/><path d="M118 196c9 7 15 20 13 40" opacity=".5"/></svg>',
  bustFront: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M58 40c-6 26-10 36-20 54 12 6 16 14 16 34 0 42-4 74 2 116 10 8 78 8 88 0 6-42 2-74 2-116 0-20 4-28 16-34-10-18-14-28-20-54-10 8-74 8-84 0Z"/><circle cx="74" cy="150" r="21" opacity=".6"/><circle cx="126" cy="150" r="21" opacity=".6"/><circle cx="74" cy="150" r="2.4"/><circle cx="126" cy="150" r="2.4"/></svg>',
  bustSide: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M72 44c-4 36-6 64 0 100 6 36 8 64 2 112-4 30-2 54 6 80"/><path d="M72 44c26 6 40 26 40 60"/><path d="M112 104c24 2 42 18 42 41 0 23-18 37-42 41" opacity=".9"/><circle cx="152" cy="145" r="2.4"/></svg>',
};

// Antes/depois encaixados localmente (só na memória da aba — nunca saem do navegador).
export const PHOTOS = new Map();
export const ART_OPTS = new Map();
export const optsFor = (key) => {
  if (!ART_OPTS.has(key)) ART_OPTS.set(key, { privacy: 'none', privacyPos: 'center', after: 'Depois' });
  return ART_OPTS.get(key);
};
export const kwLabel = (k) => ({ DEFINICAO: 'DEFINIÇÃO', SEGURANCA: 'SEGURANÇA', DIASTASE: 'DIÁSTASE' }[k] || k);

// ---------- Primitivas full-bleed ----------

function cover(name, FW, FH) {
  const p = PHOTO[name] || PHOTO['op-warm-a'];
  const s = Math.max(FW / p.w, FH / p.h) * (p.z || 1);
  const w = Math.round(p.w * s), h = Math.round(p.h * s);
  return { name, w, h, x: Math.round((FW - w) * p.f[0] / 100), y: Math.round((FH - h) * p.f[1] / 100) };
}

// Fundo fotográfico full-bleed: foto + grade cinematográfico + vinhetas + fio de continuidade.
const fullbg = (g, { seam = true, dark = false } = {}) => `
  <div class="lx-bg" style="background-image:url('assets/photos/${g.name}.jpg');background-size:${g.w}px ${g.h}px;background-position:${g.x}px ${g.y}px"></div>
  <div class="lx-grade"></div><div class="lx-vtop"></div><div class="lx-vbot"></div>${dark ? '<div class="lx-vdark"></div>' : ''}${seam ? '<div class="lx-seam"></div>' : ''}`;

const head = (n, total) => `
  <div class="lx-head"><img class="lx-logo" src="${LOGO}" alt="">
  ${total ? `<span class="lx-count">${String(n).padStart(2, '0')} <i>/</i> ${String(total).padStart(2, '0')}</span>` : ''}</div>`;

const foot = () => `<div class="lx-foot">${esc(CFM_FOOTER)}</div>`;
const frame = (ratio, inner, cls = '') => `<div class="art lx ed art-${ratio} ${cls}">${inner}</div>`;

// Callout anatômico: fio dourado + ponto, apontando para a figura. side 'l' | 'r'.
function calloutCol(labels, side) {
  if (!labels || !labels.length) return '';
  return `<div class="lx-callcol ${side}">${labels.slice(0, 3).map((l, i) => `
    <div class="lx-call" style="top:${30 + i * 19}%"><span class="lx-lbl">${esc(l)}</span><span class="lx-line"></span><span class="lx-dot"></span></div>`).join('')}</div>`;
}

function photoStyle(p, w, h) {
  if (!p) return '';
  const s = Math.max(w / p.iw, h / p.ih) * (p.zoom || 1);
  return `background-image:url('${p.src}');background-size:${Math.round(p.iw * s)}px ${Math.round(p.ih * s)}px;background-position:${p.x ?? 50}% ${p.y ?? 50}%;`;
}
function privacyStrip(o) {
  return o.privacy === 'band' ? `<i class="lx-band ${o.privacyPos}"><span>LEONARDO VALADÃO</span></i>` : '';
}

// ---------- Antes/depois — split edge-to-edge, fio dourado + monograma ----------
function beforeAfter(post, n, pair, view, halfBgName) {
  const c = post.caseData, o = optsFor(post.key);
  const [sa, sb] = pair;
  const A = PHOTOS.get(`${post.key}:${sa}`), B = PHOTOS.get(`${post.key}:${sb}`);
  const silKey = (CASE_SIL[c.id] || 'torso') + (view === 'front' ? 'Front' : 'Side');
  const viewLabel = view === 'front' ? 'Vista anterior' : 'Vista perfil / oblíqua';
  const g = cover(halfBgName, 540, 1350);
  const pills = (CASE_PILLS[c.id] || {})[view === 'front' ? 'front' : 'side'] || [];
  const half = (p, label, side, slot) => p
    ? `<div class="ba2-h" data-slot="${slot}" style="${photoStyle(p, 540, 1350)}">${privacyStrip(o)}<span class="ba2-tag ${side}">${esc(label)}</span></div>`
    : `<div class="ba2-h empty" data-slot="${slot}">
        <div class="lx-bg" style="background-image:url('assets/photos/${g.name}.jpg');background-size:${g.w}px ${g.h}px;background-position:${g.x}px ${g.y}px"></div>
        <div class="ba2-dark"></div><div class="ba2-sil">${SIL[silKey]}</div>
        ${calloutCol(pills, side)}<span class="ba2-view">${esc(viewLabel)}</span><span class="ba2-tag ${side}">${esc(label)}</span></div>`;
  const spec = specBlocks(c);
  return frame('45', `
    <div class="ba2">${half(A, 'Antes', 'l', sa)}${half(B, o.after || 'Depois', 'r', sb)}</div>
    <div class="ba2-div"><span class="ba2-mono"><img src="${LOGO}" alt=""></span></div>
    <div class="lx-vtop"></div><div class="lx-vbot"></div>
    <div class="lx-topbar"><span>Estudo anatômico ${String(c.id).padStart(2, '0')} — ${esc(c.pillar)}</span><img class="lx-logo sm" src="${LOGO}" alt=""><span class="lx-pag">${String(n).padStart(2, '0')} / 05</span></div>
    <div class="lx-botbar">
      <div class="lx-tpills"><span><i>Tempo</i>${esc(spec[0][1])}</span><span><i>Técnica</i>${esc(CASE_TECH[c.id] || 'Contorno')}</span><span><i>Plano</i>Multicamadas</span></div>
      ${foot()}
    </div>`, 'ba');
}

// Infográfico de engenharia (slide 4) — dados gerais por tipo de caso.
function specBlocks(c) {
  const hd = /HD|Lipo|defini|Lipoaspira/i.test(c.procedures.join(' '));
  const mama = c.pillar === 'Cirurgia Mamária';
  return [
    ['Tempo', hd ? '3–5 h' : mama ? '2–3,5 h' : '3–4 h'],
    ['Internação', /Abdomino|HD|Lipoabdomino/i.test(c.short) ? '1–2 diárias' : '1 diária'],
    ['Anestesia', 'Peridural + sedação'],
    ['Retorno leve', mama ? '10–15 dias' : '15–21 dias'],
  ];
}

// ---------- Carrossel 1080x1350 ----------
export function carouselSlides(post) {
  const c = post.caseData;
  const P = (CASE_PHOTOS[c.id] || CASE_PHOTOS[1]);
  const [g1, , , g4, g5] = P.map((n) => cover(n, 1080, 1350));
  const T = 5;
  const lip = c.guide === 'lipedema', cmp = c.guide === 'compare', guide = lip || cmp;

  const s1 = frame('45', `${fullbg(g1)}${head(1, T)}
    <div class="lx-cover">
      <div class="lx-kicker">${esc(c.cover.kicker)}</div>
      <h1>${c.cover.title}</h1>
      <p class="lx-sub">${esc(c.cover.sub)}</p>
      <div class="lx-swipe">Arraste <span>→</span></div>
    </div>`);

  let s2;
  if (lip) {
    const graus = [['01', 'Pele lisa, subcutâneo espessado'], ['02', 'Nódulos maiores, aspecto de "colchão"'], ['03', 'Lóbulos de gordura, contorno deformado'], ['04', 'Associado a linfedema (lipolinfedema)']];
    s2 = frame('45', `${fullbg(cover(P[1], 1080, 1350))}${head(2, T)}
      <div class="lx-block">
        <div class="lx-kicker">Classificação clínica</div>
        <h2>Os 4 <em>graus</em></h2>
        <div class="lx-rows">${graus.map(([k, v]) => `<div><b>${k}</b><span>${esc(v)}</span></div>`).join('')}</div>
      </div>`);
  } else if (cmp) {
    const rows = [['Objetivo', 'Volume + sombras anatômicas'], ['Marcação', 'Zonas musculares e camadas'], ['Transições', 'Prioridade do planejamento'], ['Aspecto', 'Contorno natural, não "desenhado"']];
    s2 = frame('45', `${fullbg(cover(P[1], 1080, 1350))}${head(2, T)}
      <div class="lx-block">
        <div class="lx-kicker">Tradicional × Lipedefinition</div>
        <h2>O que <em>muda</em></h2>
        <div class="lx-rows">${rows.map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div>
      </div>`);
  } else {
    s2 = beforeAfter(post, 2, ['a', 'b'], 'front', P[1]);
  }

  const s3 = guide
    ? frame('45', `${fullbg(cover(P[2], 1080, 1350))}${head(3, T)}
      <div class="lx-block">
        <div class="lx-kicker">${lip ? 'Como reconhecer' : 'Na prática'}</div>
        <h2>${lip ? 'Sinais <em>clínicos</em>' : 'Luz e <em>sombra</em>'}</h2>
        <div class="lx-rows slim">${c.technique.slice(0, 4).map((t, i) => `<div><b>0${i + 1}</b><span>${esc(t)}</span></div>`).join('')}</div>
      </div>`)
    : beforeAfter(post, 3, ['c', 'd'], 'side', P[2]);

  const spec = specBlocks(c);
  const s4 = frame('45', `${fullbg(g4)}${head(4, T)}
    <div class="lx-cover">
      <div class="lx-kicker">Engenharia do procedimento</div>
      <h2>${guide ? 'O que <em>planejo</em>' : 'Como <em>é planejado</em>'}</h2>
      ${guide ? '' : `<p class="lx-sub">${esc(c.indication.for.slice(0, 2).join(' · '))}.</p>`}
      <div class="lx-specrow">${spec.map(([k, v]) => `<span><i>${esc(k)}</i>${esc(v)}</span>`).join('')}</div>
    </div>`);

  const s5 = frame('45', `${fullbg(cover('dr-blue', 1080, 1350), { seam: false, dark: true })}${head(5, T)}
    <div class="lx-cover cta">
      <h1 class="lx-cta">Agende sua <em>avaliação</em></h1>
      <p class="lx-sub">${esc(DOCTOR.title)} · ${esc(DOCTOR.city)}</p>
      <div class="lx-sign"><span>${esc(DOCTOR.site.replace('https://', ''))}</span><span>Atendimento pelo link da bio</span></div>
    </div>`);

  return [s1, s2, s3, s4, s5];
}

// ---------- Reel: capa 1080x1920 / grade 1080x1350 ----------
export function reelCover(post, ratio = '916') {
  const s = post.script;
  const FH = ratio === '916' ? 1920 : 1350;
  const g = cover(REEL_PHOTO[s.id] || 'op-warm-a', 1080, FH);
  return frame(ratio, `${fullbg(g, { seam: false })}${head(0, 0)}
    <div class="lx-reelc">
      <div class="lx-kicker">Reel ${String(s.id).padStart(2, '0')} · ${esc(s.pillar)}</div>
      <h1 class="lx-tarja">${esc(s.tarja)}</h1>
      <div class="lx-play"><span>▶</span>Assista até o final</div>
    </div>`, 'reel');
}

// ---------- Destaques 1080x1920 ----------
const ICONS = {
  contour: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M42 14c6 18 4 30-4 46s-8 30 2 46"/><path d="M78 14c-6 18-4 30 4 46s8 30-2 46"/><path d="M60 26v68" stroke-dasharray="3 6"/></svg>',
  legs: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M36 12c-6 16-7 32-4 48 2 14 4 30 2 48"/><path d="M84 12c6 16 7 32 4 48-2 14-4 30-2 48"/><path d="M34 44c16 7 36 7 52 0" stroke-dasharray="3 6"/><path d="M52 108l8-34 8 34"/></svg>',
};
export function highlightCover(h) {
  const g = cover(HL_PHOTOS[h.id].cover, 1080, 1920);
  return frame('916', `${fullbg(g, { seam: false })}
    <div class="lx-hl"><div class="lx-ring">${ICONS[h.icon]}</div><div class="lx-hl-label">${esc(h.label)}</div></div>`, 'hl-cover');
}
export function highlightScreen(h, s, i) {
  const g = cover(HL_PHOTOS[h.id].screens[i] || HL_PHOTOS[h.id].cover, 1080, 1920);
  return frame('916', `${fullbg(g, { seam: false })}${head(i + 1, h.screens.length)}
    <div class="lx-cover story">
      <div class="lx-hl-mini">${ICONS[h.icon]}<span>${esc(h.label)}</span></div>
      <div class="lx-kicker">${esc(s.kicker)}</div>
      <h1>${s.title}</h1>
      <p class="lx-sub">${esc(s.body)}</p>
      ${s.cta ? '<div class="lx-swipe">Toque no link · WhatsApp</div>' : ''}
    </div>`, 'story');
}
