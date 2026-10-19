// Módulo 2 — Cronograma de 12 semanas (24 posts) + simulador de feed do Instagram.
import { POSTS } from '../data/calendar.js';
import { HIGHLIGHTS } from '../data/highlights.js';
import { DOCTOR } from '../config.js';
import { $, $$, esc, copy, modal, fitFrames, toast } from '../lib/util.js';
import { carouselSlides, reelCover, highlightCover, PHOTOS, optsFor } from '../lib/art.js';
import { exportFrame, exportAll } from '../lib/export.js';
import { openPrompter } from './m4-scripts.js';

const fit = (html, w, h) => `<div class="fit" data-w="${w}" data-h="${h}">${html}</div>`;
const thumb = (post) => post.kind === 'reel' ? reelCover(post, '45') : carouselSlides(post)[0];

export function renderCalendar(el) {
  const feed = [...POSTS].reverse(); // Instagram mostra o mais recente primeiro
  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 02 · Cronograma editorial</span>
      <h1 class="h2">12 semanas · 24 publicações prontas</h1>
      <p class="muted">Terças: Reel (roteiro do Módulo 4). Quintas: carrossel de 5 slides a partir dos 12 casos clínicos educativos. Toque em qualquer post.</p>
    </div>
    <div class="seg" id="mode"><button data-m="grid" class="on">Simulador de feed</button><button data-m="weeks">Semana a semana</button></div>
  </div>
  <div class="ig-shell">
    <div class="phone">
      <div class="ig-top">
        <div class="ig-user"><span>drleonardovaladao</span><span>☰</span></div>
        <div class="ig-row">
          <div class="ig-avatar"><img src="assets/dr-leonardo.jpg" alt=""></div>
          <div class="ig-stats"><div><b>+${POSTS.length}</b>posts</div><div><b>9 mil</b>seguidores</div><div><b>—</b>seguindo</div></div>
        </div>
        <div class="ig-bio"><b>${esc(DOCTOR.name)}</b>Cirurgião Plástico · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}<br>Lipedefinition · Lipedema · Abdome · Mamas<br>📍 Barra da Tijuca · ${esc(DOCTOR.clinicHandle)}<br>↓ Agende sua avaliação</div>
        <div class="ig-hl">${HIGHLIGHTS.map((h) => `<div><div class="c">${fit(highlightCover(h), 1080, 1920)}</div>${esc(h.label)}</div>`).join('')}</div>
      </div>
      <div class="ig-tabs"><span>▦</span><span>▶</span><span>☺</span></div>
      <div class="ig-grid">${feed.map((post) => `
        <div class="ig-cell" data-key="${post.key}" role="button" tabindex="0" aria-label="${esc(post.title)}">
          ${fit(thumb(post), 1080, 1350)}
          <span class="badge">${post.kind === 'reel' ? '▶' : '❐'}</span>
          <span class="date">S${post.week} · ${post.dateLabel}</span>
        </div>`).join('')}</div>
    </div>
    <div class="weeks" id="weeks">${Array.from({ length: 12 }, (_, w) => {
      const pair = POSTS.filter((p) => p.week === w + 1);
      return `<div class="week"><div class="wk"><small>Semana</small>${String(w + 1).padStart(2, '0')}</div>
        ${pair.map((p) => `<button class="post-chip" data-key="${p.key}">
          <span class="top"><span>${p.kind === 'reel' ? '▶ Reel · Terça' : '❐ Carrossel · Quinta'}</span><span>${p.dateLabel}</span></span>
          <b>${esc(p.title)}</b><span class="tag">${esc(p.pillar)}</span></button>`).join('')}</div>`;
    }).join('')}</div>
  </div>`;

  // Em telas largas, as duas visões ficam lado a lado; o seletor só alterna no celular.
  const mode = $('#mode', el);
  const apply = (m) => {
    $$('button', mode).forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    if (window.innerWidth <= 1180) {
      $('.phone', el).style.display = m === 'grid' ? '' : 'none';
      $('#weeks', el).style.display = m === 'weeks' ? '' : 'none';
    } else {
      $('.phone', el).style.display = ''; $('#weeks', el).style.display = '';
    }
    fitFrames(el);
  };
  mode.addEventListener('click', (e) => e.target.dataset.m && apply(e.target.dataset.m));
  window.addEventListener('resize', () => apply($('button.on', mode).dataset.m));
  apply('grid');

  el.addEventListener('click', (e) => {
    const k = e.target.closest('[data-key]')?.dataset.key;
    if (k) openPost(POSTS.find((p) => p.key === k));
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.key) openPost(POSTS.find((p) => p.key === e.target.dataset.key));
  });
}

function openPost(post) {
  const isReel = post.kind === 'reel';
  const { el, close } = modal(`
    <div class="detail-head">
      <div><span class="eyebrow">Semana ${post.week} · ${post.dateLabel} · ${isReel ? 'Reel' : 'Carrossel 5 slides'}</span>
      <h2 class="h2" style="margin-top:8px">${esc(post.title)}</h2></div>
      <span class="tag">${esc(post.pillar)}</span>
    </div>
    <div class="tabs" role="tablist">
      <button data-t="art" class="on">${isReel ? 'Capa do Reel' : 'Slides 1080×1350'}</button>
      ${isReel ? '<button data-t="script">Roteiro</button>' : ''}
      <button data-t="caption">Legenda</button>
      <button data-t="stories">4 Stories do dia</button>
    </div>
    <div data-pane="art"></div>
    ${isReel ? '<div data-pane="script" hidden></div>' : ''}
    <div data-pane="caption" hidden>
      <div class="actions" style="margin-bottom:12px"><button class="btn primary" id="copy-cap">Copiar legenda completa</button></div>
      <div class="caption-box">${esc(post.caption)}</div>
      <p class="tiny" style="margin-top:10px">${post.caption.length} / 2.200 caracteres · gancho, explicação técnica, CTA de comentário e assinatura CFM.</p>
    </div>
    <div data-pane="stories" hidden><div class="stories">${post.stories.map((s, i) => `
      <div class="story-card"><span class="n">${i + 1}</span><span class="t">${s.time} · ${esc(s.type)}</span><p>${esc(s.text)}</p><span class="tag">${esc(s.sticker)}</span></div>`).join('')}</div>
      <div class="actions" style="margin-top:14px"><button class="btn" id="copy-stories">Copiar roteiro dos Stories</button></div>
    </div>`, { wide: true });

  $('.tabs', el).addEventListener('click', (e) => {
    const t = e.target.dataset.t; if (!t) return;
    $$('.tabs button', el).forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    $$('[data-pane]', el).forEach((p) => { p.hidden = p.dataset.pane !== t; });
    fitFrames(el);
  });
  $('#copy-cap', el).addEventListener('click', () => copy(post.caption, 'Legenda copiada'));
  $('#copy-stories', el).addEventListener('click', () => copy(post.stories.map((s, i) => `Story ${i + 1} (${s.time}) — ${s.type}\n${s.text}\nSticker: ${s.sticker}`).join('\n\n'), 'Stories copiados'));

  if (isReel) {
    const s = post.script;
    $('[data-pane="art"]', el).innerHTML = `
      <div class="grid g2" style="align-items:start">
        <div class="slide-col" style="max-width:340px">${fit(reelCover(post), 1080, 1920)}
          <button class="btn sm" data-dl="cover">Baixar capa 1080×1920</button></div>
        <div class="slide-col" style="max-width:420px">${fit(reelCover(post, '45'), 1080, 1350)}
          <button class="btn sm" data-dl="grid">Baixar miniatura da grade 1080×1350</button>
          <p class="tiny">Tarja de gancho para os 3 primeiros segundos: “${esc(s.tarja)}”.</p></div>
      </div>`;
    $('[data-pane="script"]', el).innerHTML = `
      <div class="actions" style="margin-bottom:12px"><button class="btn primary" id="tp">Abrir no teleprompter</button></div>
      <div class="script-read card solid">
        <div class="blk" style="border:0;padding-top:0"><span class="label">Gancho · 0–3 s</span><p>${esc(s.hook)}</p></div>
        <div class="blk"><span class="label">Desenvolvimento</span>${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
        <div class="blk"><span class="label">CTA</span><p>${esc(s.cta)}</p></div>
        <div class="blk"><span class="label">Direção</span><p class="small muted" style="font:inherit">${esc(s.direction.frame)} B-roll: ${esc(s.direction.broll.join(' · '))}.</p></div>
      </div>`;
    $('#tp', el).addEventListener('click', () => { close(); openPrompter(s); });
    el.addEventListener('click', (e) => {
      const d = e.target.dataset.dl; if (!d) return;
      const frame = e.target.closest('.slide-col').querySelector('.art');
      exportFrame(frame, `reel-${String(s.id).padStart(2, '0')}-${d === 'cover' ? 'capa-1080x1920' : 'grade-1080x1350'}`);
    });
  } else {
    renderSlides(post, el);
  }
  requestAnimationFrame(() => fitFrames(el));
}

function renderSlides(post, el) {
  const pane = $('[data-pane="art"]', el);
  const c = post.caseData;
  const o = optsFor(post.key);
  const code = `caso-${String(c.id).padStart(2, '0')}`;

  const paint = () => {
    const slides = carouselSlides(post);
    $('.slides', pane).innerHTML = slides.map((s, i) => `
      <div class="slide-col">${fit(s, 1080, 1350)}<button class="btn sm" data-i="${i}">Baixar slide ${i + 1} em PNG</button></div>`).join('');
    fitFrames(pane);
  };

  const slotsFor = () => (c.guide ? [] : [['a', 'Antes · frente'], ['b', 'Depois · frente'], ['c', 'Antes · perfil/costas'], ['d', 'Depois · perfil/costas']]);

  pane.innerHTML = `
    <div class="actions" style="margin-bottom:14px">
      <button class="btn primary" id="dl-all">Baixar os 5 slides (PNG alta resolução)</button>
    </div>
    <div class="slides"></div>
    ${c.guide ? '<p class="tiny" style="margin-top:14px">Guia visual educativo — sem foto de paciente.</p>' : `
    <div class="photo-tools card solid">
      <div><span class="label">Estúdio de antes e depois · ${esc(c.cover.kicker)}</span>
      <p class="tiny" style="margin-top:4px"><b>Toque na moldura</b> "Antes" ou "Depois" no slide (ou use os campos abaixo) para escolher a foto do seu aparelho. A imagem é processada só neste navegador — não sai do celular/PC e não é salva no portal. Par <b>frente</b> → slide 2 · par <b>perfil/costas</b> → slide 3. Nunca use imagem com nome, rosto identificável ou tatuagem marcante.</p></div>
      <div class="row">
        <div><span class="label">Tarja de privacidade (CFM / Instagram)</span>
          <div class="seg" id="privacy">
            <button data-pv="none" class="${o.privacy === 'none' ? 'on' : ''}">Nenhuma</button>
            <button data-pv="top" class="${o.privacy === 'band' && o.privacyPos === 'top' ? 'on' : ''}">Topo (olhos)</button>
            <button data-pv="center" class="${o.privacy === 'band' && o.privacyPos === 'center' ? 'on' : ''}">Centro (linha mamária)</button>
          </div>
        </div>
        <div class="field" style="min-width:180px"><label for="after">Rótulo do depois</label><input class="input" id="after" value="${esc(o.after)}"></div>
      </div>
      <div class="grid g2" id="slots"></div>
    </div>`}`;

  const drawSlots = () => {
    const box = $('#slots', pane); if (!box) return;
    box.innerHTML = slotsFor().map(([name, label]) => {
      const p = PHOTOS.get(`${post.key}:${name}`);
      return `<div class="drop" data-slot="${name}">
        <span class="label">${label}</span>
        <input type="file" accept="image/*" data-file="${name}">
        <div class="range"><div class="top"><span>Zoom</span><b>${Math.round((p?.zoom || 1) * 100)}%</b></div><input type="range" min="1" max="2.5" step="0.05" value="${p?.zoom || 1}" data-adj="zoom" ${p ? '' : 'disabled'}></div>
        <div class="range"><div class="top"><span>Horizontal</span></div><input type="range" min="0" max="100" step="1" value="${p?.x ?? 50}" data-adj="x" ${p ? '' : 'disabled'}></div>
        <div class="range"><div class="top"><span>Vertical</span></div><input type="range" min="0" max="100" step="1" value="${p?.y ?? 50}" data-adj="y" ${p ? '' : 'disabled'}></div>
        ${p ? '<button class="btn sm ghost" data-clear>Remover foto</button>' : ''}
      </div>`;
    }).join('');
  };

  pane.addEventListener('change', (e) => {
    const name = e.target.dataset.file;
    if (name && e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          PHOTOS.set(`${post.key}:${name}`, { src: reader.result, iw: img.naturalWidth, ih: img.naturalHeight, zoom: 1, x: 50, y: 50 });
          drawSlots(); paint(); toast('Foto encaixada com rodapé CFM e logo');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  // Clicar numa moldura "Antes/Depois" do slide abre o seletor de fotos do slot correspondente.
  pane.addEventListener('click', (e) => {
    const slot = e.target.closest('.ba-fr[data-slot], .ba2-h[data-slot]')?.dataset.slot;
    if (slot) $(`input[data-file="${slot}"]`, pane)?.click();
    const pv = e.target.dataset.pv;
    if (pv) {
      o.privacy = pv === 'none' ? 'none' : 'band';
      if (pv !== 'none') o.privacyPos = pv;
      $$('#privacy button', pane).forEach((b) => b.classList.toggle('on', b.dataset.pv === pv));
      paint();
    }
  });
  pane.addEventListener('input', (e) => {
    const adj = e.target.dataset.adj;
    if (adj) {
      const name = e.target.closest('[data-slot]').dataset.slot;
      const p = PHOTOS.get(`${post.key}:${name}`);
      if (!p) return;
      p[adj] = Number(e.target.value);
      if (adj === 'zoom') e.target.previousElementSibling.querySelector('b').textContent = Math.round(p.zoom * 100) + '%';
      paint();
    }
    if (e.target.id === 'after') { o.after = e.target.value; paint(); }
  });
  pane.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-clear')) {
      PHOTOS.delete(`${post.key}:${e.target.closest('[data-slot]').dataset.slot}`); drawSlots(); paint();
    }
    if (e.target.dataset.i) {
      const i = Number(e.target.dataset.i);
      exportFrame($$('.slides .art', pane)[i], `${code}-slide-${i + 1}-1080x1350`);
    }
    if (e.target.id === 'dl-all') exportAll($$('.slides .art', pane), `${code}-slide`);
  });

  drawSlots();
  paint();
}
