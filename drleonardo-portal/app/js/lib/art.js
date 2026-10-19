// Renderizadores das peças visuais em tamanho real — direção "dark luxury":
// foto real do Dr. Leonardo / centro cirúrgico ao fundo, painéis de vidro escuro, acentos dourados.
// Regras de direção de arte:
//  - o RETRATO (rosto sorrindo) do Dr. Leonardo só aparece no slide 5 (assinatura) e em capas de vídeo falado;
//  - slides 1–4, capas de Reel e destaques usam ações/ambiente (operando, mesa, aparelhos, sala, instrumental);
//  - cada carrossel, capa de Reel e destaque tem composição visual única.
//  - os slides de antes/depois (2 e 3) usam o Frame Anatômico Editorial (fundo escuro + grid + selo + pílulas + silhueta).
//
// Vidro sem backdrop-filter: cada painel recebe a versão desfocada da MESMA foto, alinhada pixel a pixel
// (assets/photos/blur). Assim o efeito sai idêntico no navegador, no html2canvas e no PDF.
import { CFM_FOOTER, DOCTOR } from '../config.js';
import { esc } from './util.js';

const LOGO_LIGHT = 'assets/logo-leonardo-valadao-light.svg';

// Fotos reais (somente Dr. Leonardo e ambiente hospitalar). w/h = dimensões do arquivo, f = ponto focal %, z = zoom.
const PHOTO = {
  // retratos (rosto) — slide 5 / assinatura
  'dr-or-green': { w: 1200, h: 1500, f: [50, 30] }, 'dr-or-green-2': { w: 1200, h: 1600, f: [62, 30] },
  'dr-or-green-3': { w: 1200, h: 1600, f: [50, 30] }, 'dr-or-purple': { w: 1200, h: 1600, f: [55, 18] },
  'dr-or-light': { w: 1200, h: 1600, f: [58, 20] }, 'dr-or-light-2': { w: 1200, h: 1600, f: [55, 20] },
  'dr-suit': { w: 956, h: 1700, f: [50, 25] }, 'dr-congress': { w: 1200, h: 1500, f: [50, 26] },
  'face-green': { w: 956, h: 1700, f: [50, 26] }, 'face-blue': { w: 956, h: 1700, f: [55, 26] },
  'face-casual': { w: 956, h: 1700, f: [40, 28] },
  // ação: operando (perfil/olhar baixo, sem retrato frontal)
  'dr-lipedefinition': { w: 1200, h: 1600, f: [62, 14], z: 1.12 }, 'dr-lipedefinition-2': { w: 1200, h: 1600, f: [74, 14], z: 1.12 },
  'dr-blue': { w: 1200, h: 1600, f: [52, 12], z: 1.18 }, 'dr-blue-team': { w: 1200, h: 1600, f: [62, 12], z: 1.18 },
  'op-stand': { w: 926, h: 1138, f: [60, 24] }, 'op-team-a': { w: 960, h: 1280, f: [50, 40] },
  'op-team-b': { w: 1200, h: 1667, f: [50, 42] }, 'op-team-c': { w: 997, h: 1700, f: [50, 42] },
  'op-team-wide': { w: 960, h: 1280, f: [55, 40] }, 'op-team-flowers': { w: 1200, h: 1600, f: [42, 36] },
  'op-mark-a': { w: 1200, h: 1600, f: [60, 32] }, 'op-mark-b': { w: 1200, h: 1600, f: [55, 34] },
  'op-focus-a': { w: 1200, h: 1600, f: [50, 30] }, 'op-focus-b': { w: 1200, h: 1600, f: [50, 30] },
  'op-focus-c': { w: 1200, h: 1600, f: [50, 30] }, 'op-focus-d': { w: 1200, h: 1600, f: [50, 30] },
  'op-warm-a': { w: 1200, h: 1600, f: [45, 26] }, 'op-warm-b': { w: 1200, h: 1600, f: [45, 26] },
  'op-warm-c': { w: 1200, h: 1600, f: [45, 28] }, 'op-warm-d': { w: 1200, h: 1600, f: [48, 28] },
  'op-warm-e': { w: 1200, h: 1600, f: [55, 28] }, 'op-light': { w: 1200, h: 1600, f: [45, 30] },
  'dr-gowning': { w: 956, h: 1700, f: [35, 25] },
  // ambiente: salas, instrumental, aparelhos, mãos
  'hands-a': { w: 1200, h: 1600, f: [50, 50] }, 'hands-b': { w: 1200, h: 1600, f: [50, 50] },
  'room-a': { w: 1200, h: 1600, f: [50, 52] }, 'room-b': { w: 1200, h: 1600, f: [45, 52] },
  'room-c': { w: 1200, h: 1600, f: [50, 48] }, 'tray': { w: 1200, h: 1600, f: [45, 52] },
  'instruments': { w: 956, h: 1700, f: [50, 50] }, 'monitor': { w: 956, h: 1700, f: [50, 35] },
  'or-room': { w: 956, h: 1700, f: [50, 55] }, 'or-team': { w: 956, h: 1700, f: [55, 28] },
  'equipment': { w: 956, h: 1700, f: [50, 50] }, 'hospital': { w: 1200, h: 1600, f: [50, 50] },
};

// Composição única por caso: [capa, s2(guia), s3(guia), s4, s5-RETRATO]. Slides 2/3 cirúrgicos usam o frame editorial.
const CASE_PHOTOS = {
  1: ['op-warm-a', 'room-a', 'tray', 'hands-a', 'dr-or-green'],
  2: ['op-stand', 'op-team-a', 'op-focus-b', 'equipment', 'face-green'],
  3: ['op-focus-a', 'room-b', 'op-warm-b', 'monitor', 'dr-or-purple'],
  4: ['op-warm-c', 'room-c', 'op-mark-a', 'room-a', 'dr-or-light'],
  5: ['op-team-flowers', 'op-warm-d', 'op-focus-c', 'or-room', 'dr-or-green-2'],
  6: ['op-mark-b', 'op-team-b', 'op-warm-e', 'tray', 'dr-or-light-2'],
  7: ['op-focus-c', 'op-light', 'room-b', 'room-b', 'dr-or-green-3'],
  8: ['dr-blue', 'op-focus-d', 'op-team-c', 'hands-b', 'face-blue'],
  9: ['op-warm-d', 'room-c', 'op-mark-a', 'room-c', 'dr-or-purple'],
  10: ['op-focus-d', 'op-warm-a', 'op-team-wide', 'monitor', 'dr-or-green'],
  11: ['op-team-b', 'monitor', 'op-light', 'hospital', 'face-green'],
  12: ['op-warm-e', 'op-team-c', 'op-focus-b', 'equipment', 'dr-or-green-2'],
};
const REEL_PHOTO = { 1: 'op-warm-b', 2: 'dr-lipedefinition', 3: 'op-mark-a', 4: 'dr-gowning', 5: 'op-focus-a', 6: 'dr-lipedefinition-2', 7: 'op-warm-c', 8: 'op-light', 9: 'op-team-a', 10: 'op-focus-d', 11: 'op-warm-e', 12: 'op-team-wide' };
const HL_PHOTOS = {
  lipedefinition: { cover: 'dr-lipedefinition', screens: ['op-stand', 'op-focus-a', 'op-warm-b', 'dr-lipedefinition-2', 'op-mark-b', 'dr-or-green-2'] },
  lipedema: { cover: 'dr-or-green', screens: ['op-warm-c', 'op-light', 'monitor', 'op-focus-c', 'room-a', 'face-green'] },
};

// Silhueta editorial por caso (anterior/perfil) + pílulas técnicas específicas da anatomia.
const CASE_SIL = { 1: 'torso', 2: 'torso', 3: 'bust', 4: 'bust', 5: 'torso', 6: 'torso', 7: 'bust', 8: 'torso', 9: 'bust', 10: 'bust' };
const CASE_PILLS = {
  1: { front: ['Plicatura de diástase', 'Definição da linha alba', 'Transição de flancos'], side: ['Projeção glútea', 'Curva lombar'] },
  2: { front: ['Definição da linha alba', 'Semilunares', 'Borda do peitoral'], side: ['Flancos', 'Dorso atlético'] },
  3: { front: ['Projeção de polo superior', 'Sulco inframamário'], side: ['Contorno lateral', 'Cintura'] },
  4: { front: ['Dimensionamento por base', 'Sulco inframamário'], side: ['Contorno lateral', 'Flancos'] },
  5: { front: ['Lipoaspiração de definição', 'Transição de flancos'], side: ['Enxerto glúteo', 'Curva lombar'] },
  6: { front: ['Plicatura dos retos', 'Retirada de pele'], side: ['Desenho da cintura', 'Flancos'] },
  7: { front: ['Volume mamário', 'Sulco inframamário'], side: ['Cintura', 'Abdome'] },
  8: { front: ['Exérese glandular', 'Contorno peitoral HD'], side: ['Flancos', 'Dorso'] },
  9: { front: ['Reposição da aréola', 'Preenchimento do polo'], side: ['Retirada de pele', 'Simetria'] },
  10: { front: ['Base mamária', 'Preenchimento do polo'], side: ['Projeção', 'Sulco inframamário'] },
};
const SIL = {
  torsoFront: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M64 36c-6 30-10 40-22 60 14 6 18 16 18 40 0 60-6 120 2 198 10 10 66 10 76 0 8-78 2-138 2-198 0-24 4-34 18-40-12-20-16-30-22-60-10 8-62 8-72 0Z"/><path d="M100 120v150" stroke-dasharray="2 7" opacity=".7"/><circle cx="100" cy="252" r="2.2"/><path d="M58 152c24 11 60 11 84 0" opacity=".5" stroke-dasharray="2 6"/></svg>',
  torsoSide: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M74 40c-5 42-7 74 0 116 7 42 11 72 5 122-4 34-2 60 7 92"/><path d="M74 40c32 6 47 32 44 74-2 38-19 58-15 100 4 42 24 66 18 118"/><path d="M118 196c9 7 15 20 13 40" opacity=".5"/><path d="M78 150c18 8 34 8 40 2" opacity=".4" stroke-dasharray="2 6"/></svg>',
  bustFront: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M58 40c-6 26-10 36-20 54 12 6 16 14 16 34 0 42-4 74 2 116 10 8 78 8 88 0 6-42 2-74 2-116 0-20 4-28 16-34-10-18-14-28-20-54-10 8-74 8-84 0Z"/><circle cx="74" cy="150" r="21" opacity=".6"/><circle cx="126" cy="150" r="21" opacity=".6"/><circle cx="74" cy="150" r="3"/><circle cx="126" cy="150" r="3"/></svg>',
  bustSide: '<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M72 44c-4 36-6 64 0 100 6 36 8 64 2 112-4 30-2 54 6 80"/><path d="M72 44c26 6 40 26 40 60"/><path d="M112 104c24 2 42 18 42 41 0 23-18 37-42 41" opacity=".9"/><path d="M112 186c6 6 10 16 8 32" opacity=".5"/><circle cx="152" cy="145" r="3"/></svg>',
};

// Fotos de antes/depois encaixadas localmente no portal: `${postKey}:${slot}` → { src, iw, ih, zoom, x, y }.
// Ficam apenas na memória da aba — nunca são enviadas a servidor nem salvas no repositório.
export const PHOTOS = new Map();
export const ART_OPTS = new Map();
export const optsFor = (key) => {
  if (!ART_OPTS.has(key)) ART_OPTS.set(key, { privacy: 'none', privacyPos: 'center', after: 'Pós-operatório' });
  return ART_OPTS.get(key);
};

export const kwLabel = (k) => ({ DEFINICAO: 'DEFINIÇÃO', SEGURANCA: 'SEGURANÇA', DIASTASE: 'DIÁSTASE' }[k] || k);

// ---------- Primitivas ----------

function cover(name, FW, FH) {
  const p = PHOTO[name] || PHOTO['op-warm-a'];
  const s = Math.max(FW / p.w, FH / p.h) * (p.z || 1);
  const w = Math.round(p.w * s), h = Math.round(p.h * s);
  return { name, w, h, x: Math.round((FW - w) * p.f[0] / 100), y: Math.round((FH - h) * p.f[1] / 100) };
}

const bg = (g, shade) => `
  <div class="lx-bg" style="background-image:url('assets/photos/${g.name}.jpg');background-size:${g.w}px ${g.h}px;background-position:${g.x}px ${g.y}px"></div>
  <div class="lx-shade ${shade}"></div>`;

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

function photoStyle(p, w, h) {
  if (!p) return '';
  const s = Math.max(w / p.iw, h / p.ih) * (p.zoom || 1);
  return `background-image:url('${p.src}');background-size:${Math.round(p.iw * s)}px ${Math.round(p.ih * s)}px;background-position:${p.x ?? 50}% ${p.y ?? 50}%;`;
}

// Tarja de privacidade (CFM/Instagram): barra escura com borda dourada e micro-assinatura. Exporta no PNG/PDF.
function privacyStrip(o) {
  if (o.privacy !== 'band') return '';
  return `<i class="lx-band ${o.privacyPos}"><span>LEONARDO VALADÃO</span></i>`;
}

// ---------- Carrossel 1080x1350 ----------

// Frame Anatômico Editorial — slides 2 e 3 (antes/depois). Fundo escuro + grid + duas molduras douradas
// + selo de vidro central + pílulas técnicas + silhueta vetorial enquanto a foto não é encaixada.
function beforeAfter(post, n, pair, view) {
  const c = post.caseData, o = optsFor(post.key);
  const [sa, sb] = pair;
  const A = PHOTOS.get(`${post.key}:${sa}`), B = PHOTOS.get(`${post.key}:${sb}`);
  const silKey = (CASE_SIL[c.id] || 'torso') + (view === 'front' ? 'Front' : 'Side');
  const sil = SIL[silKey];
  const viewLabel = view === 'front' ? 'Vista anterior' : 'Vista perfil / oblíqua';
  const pills = (CASE_PILLS[c.id] || {})[view === 'front' ? 'front' : 'side'] || [];
  const fr = (p, label, slot) => p
    ? `<div class="ba-fr" data-slot="${slot}" style="${photoStyle(p, 452, 812)}">${privacyStrip(o)}<span class="ba-tag">${esc(label)}</span></div>`
    : `<div class="ba-fr empty" data-slot="${slot}"><div class="ba-glow"></div><div class="ba-sil">${sil}</div><span class="ba-view">${esc(viewLabel)}</span><span class="ba-tag">${esc(label)}</span></div>`;
  return frame('45', `<div class="lx-grid"></div><div class="lx-gridglow"></div>${head(n, 5)}
    <div class="ba-wrap">
      <div class="lx-kicker gold">${esc(c.cover.kicker)} · Antes e depois</div>
      <div class="ba-stage">
        ${fr(A, 'Antes', sa)}
        <div class="ba-seal"><img src="${LOGO_LIGHT}" alt=""><span class="ba-cmp">↔</span></div>
        ${fr(B, o.after || 'Depois', sb)}
      </div>
      ${pills.length ? `<div class="ba-pills">${pills.map((p, i) => `<span>${String(i + 1).padStart(2, '0')} • ${esc(p)}</span>`).join('')}</div>` : ''}
    </div>
    ${foot()}`, 'editorial');
}

export function carouselSlides(post) {
  const c = post.caseData;
  const [p1, p2, p3, p4, p5] = (CASE_PHOTOS[c.id] || CASE_PHOTOS[1]).map((n) => cover(n, 1080, 1350));
  const T = 5;
  const lip = c.guide === 'lipedema', cmp = c.guide === 'compare', guide = lip || cmp;

  const s1 = frame('45', `${bg(p1, 'shade-cover')}${head(1, T)}
    <div class="lx-cover">
      <div class="lx-kicker">${esc(c.cover.kicker)}</div>
      <h1>${c.cover.title}</h1>
      <p class="lx-sub">${esc(c.cover.sub)}</p>
      <div class="lx-swipe">Arraste <span>→</span></div>
    </div>${foot()}`);

  let s2;
  if (lip) {
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
    s2 = beforeAfter(post, 2, ['a', 'b'], 'front');
  }

  const s3 = guide
    ? frame('45', `${bg(p3, 'shade-full')}${head(3, T)}
      ${glass(p3, 64, 230, 952, `<div class="lx-kicker">${lip ? 'Como reconhecer' : 'Na prática'}</div>
        <h2>${lip ? 'Sinais <em>clínicos</em>' : 'O que <em>muda</em>'}</h2>
        <ol class="lx-steps">${c.technique.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`)}
      ${foot()}`)
    : beforeAfter(post, 3, ['c', 'd'], 'side');

  const s4 = frame('45', `${bg(p4, 'shade-full')}${head(4, T)}
    ${glass(p4, 64, 190, 952, `<div class="lx-kicker">${lip ? 'Tratamento' : 'Engenharia do procedimento'}</div>
      <h2>${lip ? 'Clínico <em>e</em> cirúrgico' : 'Como <em>é planejado</em>'}</h2>
      ${guide ? '' : `<div class="lx-spec">${specBlocks(c).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`}
      <div class="lx-cols">
        <div><h3>${lip ? 'Base do tratamento' : 'Indicado para'}</h3><ul>${c.indication.for.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div><h3>${lip ? 'Quando operar' : 'Recuperação média'}</h3><ul>${c.indication.recovery.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </div>
      <p class="lx-note">Informações gerais. Indicação e recuperação são individuais.</p>`)}
    ${foot()}`);

  const s5 = frame('45', `${bg(p5, 'shade-cta')}${head(5, T)}
    ${glass(p5, 64, 760, 952, `
      <div class="lx-kicker">Material completo no direct</div>
      <h2 class="lx-cta">Comente <em>${esc(kwLabel(c.keyword))}</em></h2>
      <div class="lx-sign"><b>${esc(DOCTOR.name)}</b><span>${esc(DOCTOR.title)} · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}</span><span>${esc(DOCTOR.handle)} · ${esc(DOCTOR.site.replace('https://', ''))}</span></div>`, 'pad-sm')}
    ${foot()}`);

  return [s1, s2, s3, s4, s5];
}

// Infográfico "engenharia do procedimento" (slide 4) — dados gerais por tipo de caso.
function specBlocks(c) {
  const hd = /HD|Lipo|definição|Lipoaspiração/i.test(c.procedures.join(' '));
  const mama = c.pillar === 'Cirurgia Mamária';
  return [
    ['Tempo cirúrgico', hd ? '3 a 5 h' : mama ? '2 a 3,5 h' : '3 a 4 h'],
    ['Internação', /Abdomino|HD|Lipoabdomino/i.test(c.short) ? '1 a 2 diárias' : '1 diária'],
    ['Anestesia', 'Peridural + sedação'],
    ['Retorno leve', mama ? '10–15 dias' : '15–21 dias'],
  ];
}

// ---------- Reel: capa 1080x1920 e miniatura de grade 1080x1350 ----------

export function reelCover(post, ratio = '916') {
  const s = post.script;
  const FH = ratio === '916' ? 1920 : 1350;
  const g = cover(REEL_PHOTO[s.id] || 'op-warm-a', 1080, FH);
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
