// Renderizadores das peças visuais em tamanho real. Todas levam logo + rodapé CFM.
import { CFM_FOOTER, DOCTOR } from '../config.js';
import { esc } from './util.js';

const LOGO_DARK = 'assets/logo-leonardo-valadao.svg';
const LOGO_LIGHT = 'assets/logo-leonardo-valadao-light.svg';

// Fotos encaixadas localmente: chave `${postKey}:${slot}` → { src, iw, ih, zoom, x, y }.
// Ficam apenas na memória da aba — nunca são enviadas a servidor.
export const PHOTOS = new Map();

// Rótulo exibido da palavra-chave (o gatilho no ManyChat deve aceitar com e sem acento).
export const kwLabel = (k) => ({ DEFINICAO: 'DEFINIÇÃO', SEGURANCA: 'SEGURANÇA', DIASTASE: 'DIÁSTASE' }[k] || k);
export const ART_OPTS = new Map(); // `${postKey}` → { layout: 'split'|'single', band: bool, after: 'texto' }

export const optsFor = (key) => {
  if (!ART_OPTS.has(key)) ART_OPTS.set(key, { layout: 'split', band: false, after: 'Pós-operatório' });
  return ART_OPTS.get(key);
};

const head = (n, total, light) => `
  <div class="art-head">
    <img class="art-logo" src="${light ? LOGO_LIGHT : LOGO_DARK}" alt="">
    ${total ? `<span class="art-count">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>` : ''}
  </div>`;

const foot = () => `<div class="art-foot">${esc(CFM_FOOTER)}</div>`;

function photoStyle(p, w, h) {
  if (!p) return '';
  const cover = Math.max(w / p.iw, h / p.ih) * (p.zoom || 1);
  return `background-image:url('${p.src}');background-size:${Math.round(p.iw * cover)}px ${Math.round(p.ih * cover)}px;background-position:${p.x ?? 50}% ${p.y ?? 50}%;`;
}

function slot(key, name, label, w, h, band) {
  const p = PHOTOS.get(`${key}:${name}`);
  return `<div class="ph ${p ? 'has' : ''}" style="width:${w}px;height:${h}px;${photoStyle(p, w, h)}">
      ${p ? '' : `<div class="ph-empty"><span>＋</span>Encaixe a foto<br><b>${esc(label)}</b></div>`}
      ${band && p ? '<div class="ph-band"></div>' : ''}
      <div class="ph-tag"><span>${esc(label)}</span></div>
    </div>`;
}

// ---------- Carrossel 1080x1350 ----------

export function carouselSlides(post) {
  const c = post.caseData;
  const key = post.key;
  const o = optsFor(key);
  const T = 5;
  const isGuide = Boolean(c.guide);

  const coverTheme = ['t-stone', 't-dark', 't-ivory'][c.id % 3];
  const s1 = `<div class="art art-45 ${coverTheme}">${head(1, T, coverTheme === 't-dark')}
      <div class="art-body cover">
        <div class="kicker">${esc(c.cover.kicker)}</div>
        <h1>${c.cover.title}</h1>
        <p class="sub">${esc(c.cover.sub)}</p>
        <div class="swipe">Arraste <span>→</span></div>
      </div>${foot()}</div>`;

  let s2;
  if (c.guide === 'lipedema') {
    const graus = [
      ['Grau 1', 'Pele lisa, tecido subcutâneo espessado com pequenos nódulos.'],
      ['Grau 2', 'Pele irregular, nódulos maiores, aspecto de "colchão".'],
      ['Grau 3', 'Lóbulos de gordura e deformidade do contorno, sobretudo em coxas e joelhos.'],
      ['Grau 4', 'Lipedema associado a linfedema (lipolinfedema).'],
    ];
    s2 = `<div class="art art-45 t-ivory">${head(2, T)}
      <div class="art-body">
        <div class="kicker">Classificação clínica</div>
        <h2>Os 4 graus do <em>lipedema</em></h2>
        <div class="grades">${graus.map(([g, d], i) => `<div class="grade"><div class="g-bar"><i style="height:${30 + i * 22}%"></i></div><b>${g}</b><p>${d}</p></div>`).join('')}</div>
        <p class="note">O diagnóstico e a classificação são feitos em consulta, pelo exame físico.</p>
      </div>${foot()}</div>`;
  } else if (c.guide === 'compare') {
    const rows = [
      ['Objetivo', 'Reduzir volume', 'Volume + sombras anatômicas'],
      ['Marcação', 'Áreas de gordura', 'Zonas musculares e camadas'],
      ['Camadas', 'Principalmente profunda', 'Profunda e superficial'],
      ['Transições', 'Pouco trabalhadas', 'Prioridade do planejamento'],
      ['Aspecto final', 'Mais magro', 'Contorno natural e definido'],
    ];
    s2 = `<div class="art art-45 t-ivory">${head(2, T)}
      <div class="art-body">
        <div class="kicker">Comparativo técnico</div>
        <h2>Tradicional <em>×</em> Lipedefinition</h2>
        <table class="cmp"><thead><tr><th></th><th>Lipo tradicional</th><th>Lipedefinition</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
      </div>${foot()}</div>`;
  } else {
    const photos = o.layout === 'single'
      ? slot(key, 'single', 'Antes e depois', 960, 830, o.band)
      : slot(key, 'a', 'Antes', 472, 830, o.band) + slot(key, 'b', esc(o.after || 'Depois'), 472, 830, o.band);
    s2 = `<div class="art art-45 t-ivory">${head(2, T)}
      <div class="art-body ba">
        <div class="ba-top"><div class="kicker">${esc(c.cover.kicker)}</div><div class="ba-proc">${esc(c.procedures.join(' · '))}</div></div>
        <div class="ba-photos ${o.layout}">${photos}</div>
      </div>${foot()}</div>`;
  }

  const s3 = `<div class="art art-45 t-linen">${head(3, T)}
      <div class="art-body">
        <div class="kicker">${isGuide ? (c.guide === 'lipedema' ? 'Como reconhecer' : 'Na prática') : 'O planejamento'}</div>
        <h2>${c.guide === 'lipedema' ? 'Sinais <em>clínicos</em>' : c.guide === 'compare' ? 'O que <em>muda</em>' : 'A <em>técnica</em>'}</h2>
        <ol class="steps">${c.technique.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      </div>${foot()}</div>`;

  const s4 = `<div class="art art-45 t-ivory">${head(4, T)}
      <div class="art-body">
        <div class="kicker">${isGuide ? 'Tratamento' : 'Indicação & recuperação'}</div>
        <h2>${c.guide === 'lipedema' ? 'Clínico <em>e</em> cirúrgico' : 'Para quem <em>é indicado</em>'}</h2>
        <div class="cols">
          <div><h3>${c.guide === 'lipedema' ? 'Base do tratamento' : 'Indicado para'}</h3><ul>${c.indication.for.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div><h3>${c.guide === 'lipedema' ? 'Quando operar' : 'Recuperação média'}</h3><ul>${c.indication.recovery.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        </div>
        <p class="note">Informações gerais. A indicação e o tempo de recuperação são individuais.</p>
      </div>${foot()}</div>`;

  const s5 = `<div class="art art-45 t-stone">${head(5, T)}
      <div class="art-body cta">
        <div class="kicker">Material completo</div>
        <h2>Comente<br><em>${esc(kwLabel(c.keyword))}</em></h2>
        <p class="sub">e receba o guia no seu direct.</p>
        <div class="doc-card">
          <img src="assets/dr-leonardo.jpg" alt="">
          <div><b>${esc(DOCTOR.name)}</b><span>${esc(DOCTOR.title)} · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}</span><span>${esc(DOCTOR.handle)} · ${esc(DOCTOR.city)}</span></div>
        </div>
      </div>${foot()}</div>`;

  return [s1, s2, s3, s4, s5];
}

// ---------- Reel: capa 1080x1920 e miniatura de grade 1080x1350 ----------

export function reelCover(post, ratio = '916') {
  const s = post.script;
  return `<div class="art art-${ratio} t-dark reel">${head(0, 0, true)}
      <div class="art-body cover">
        <div class="kicker">Reel #${String(s.id).padStart(2, '0')} · ${esc(s.pillar)}</div>
        <h1>${esc(s.tarja)}</h1>
        <div class="play">▶</div>
      </div>${foot()}</div>`;
}

// ---------- Destaques 1080x1920 ----------

const ICONS = {
  contour: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M42 14c6 18 4 30-4 46s-8 30 2 46"/><path d="M78 14c-6 18-4 30 4 46s8 30-2 46"/><path d="M60 26v68" stroke-dasharray="3 6"/></svg>',
  legs: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M36 12c-6 16-7 32-4 48 2 14 4 30 2 48"/><path d="M84 12c6 16 7 32 4 48-2 14-4 30-2 48"/><path d="M34 44c16 7 36 7 52 0" stroke-dasharray="3 6"/><path d="M52 108l8-34 8 34"/></svg>',
};

export function highlightCover(h) {
  return `<div class="art art-916 t-stone hl-cover">
      <div class="hl-ring">${ICONS[h.icon]}</div>
      <div class="hl-label">${esc(h.label)}</div>
    </div>`;
}

export function highlightScreen(h, s, i) {
  const theme = s.cta ? 't-dark' : i % 2 ? 't-linen' : 't-ivory';
  return `<div class="art art-916 ${theme} story">${head(i + 1, h.screens.length, s.cta)}
      <div class="art-body">
        <div class="hl-mini">${ICONS[h.icon]}<span>${esc(h.label)}</span></div>
        <div class="kicker">${esc(s.kicker)}</div>
        <h1>${s.title}</h1>
        <p class="sub">${esc(s.body)}</p>
        ${s.cta ? '<div class="sticker-slot">Posicione aqui o sticker de link do WhatsApp</div>' : ''}
      </div>${foot()}</div>`;
}
