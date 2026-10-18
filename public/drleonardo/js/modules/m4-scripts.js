// Módulo 4 — 12 roteiros palavra por palavra + teleprompter de celular.
import { SCRIPTS } from '../data/scripts.js';
import { $, esc, copy, modal, store } from '../lib/util.js';

const fullText = (s) => [s.hook, ...s.body, s.cta].join('\n\n');
const words = (s) => fullText(s).split(/\s+/).length;

export function renderScripts(el) {
  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 04 · Roteiros &amp; teleprompter</span>
      <h1 class="h2">12 roteiros de gravação inéditos</h1>
      <p class="muted">Lipedema, Lipedefinition, Diástase/Abdominoplastia e Segurança Cirúrgica. Cada roteiro é o Reel de uma terça do cronograma.</p>
    </div>
  </div>
  <div class="script-list">${SCRIPTS.map((s) => `
    <button class="card script-card" data-id="${s.id}">
      <span class="n">${String(s.id).padStart(2, '0')}</span>
      <span class="tag">${esc(s.pillar)}</span>
      <b>${esc(s.title)}</b>
      <span class="tiny">${s.duration} · ${words(s)} palavras · CTA “${esc(s.keyword)}”</span>
    </button>`).join('')}</div>`;

  el.addEventListener('click', (e) => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (id) openScript(SCRIPTS.find((s) => s.id === Number(id)));
  });
}

function openScript(s) {
  const { el, close } = modal(`
    <span class="eyebrow">Roteiro ${String(s.id).padStart(2, '0')} · ${esc(s.pillar)} · ${s.duration}</span>
    <h2 class="h2" style="margin:8px 0 16px">${esc(s.title)}</h2>
    <div class="actions" style="margin-bottom:16px">
      <button class="btn primary" id="go">▶ Teleprompter</button>
      <button class="btn" id="cp">Copiar roteiro</button>
    </div>
    <div class="script-read">
      <div class="blk"><span class="label">Tarja na tela</span><p>“${esc(s.tarja)}”</p></div>
      <div class="blk"><span class="label">Gancho · 0–3 s</span><p>${esc(s.hook)}</p></div>
      <div class="blk"><span class="label">Desenvolvimento</span>${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
      <div class="blk"><span class="label">CTA (ManyChat: ${esc(s.keyword)})</span><p>${esc(s.cta)}</p></div>
      <div class="blk"><span class="label">Direção de cena</span><p class="muted" style="font-size:17px">${esc(s.direction.frame)}</p>
        <ul class="list muted small" style="margin-top:8px">${s.direction.broll.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
    </div>`, { wide: false });
  $('#go', el).addEventListener('click', () => { close(); openPrompter(s); });
  $('#cp', el).addEventListener('click', () => copy(`${s.title}\n\nTARJA: ${s.tarja}\n\n${fullText(s)}`, 'Roteiro copiado'));
}

export function openPrompter(s) {
  const root = $('#prompter');
  const cfg = { speed: 2, size: 44, mirror: false, ...store.get('prompter', {}) };
  root.hidden = false;
  document.body.classList.add('no-scroll');
  root.innerHTML = `
    <div class="pr-view" id="pr-view">
      <div class="pr-guide"></div>
      <div class="pr-text ${cfg.mirror ? 'mirror' : ''}" id="pr-text" style="--pr-size:${cfg.size}px">
        <p><span class="sec">Gancho</span>${esc(s.hook)}</p>
        ${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}
        <p><span class="sec">CTA</span>${esc(s.cta)}</p>
        <p class="sec" style="margin-top:2em">— fim —</p>
      </div>
    </div>
    <div class="pr-bar">
      <button data-a="close" aria-label="Fechar">✕</button>
      <button data-a="restart" aria-label="Recomeçar">↺</button>
      <button data-a="slower" aria-label="Mais devagar">−</button>
      <span class="meta" id="pr-speed"></span>
      <button data-a="faster" aria-label="Mais rápido">+</button>
      <button data-a="play" class="main" id="pr-play">Iniciar</button>
      <button data-a="smaller" aria-label="Fonte menor">A−</button>
      <button data-a="bigger" aria-label="Fonte maior">A+</button>
      <button data-a="mirror" aria-label="Espelhar">⇋</button>
    </div>`;

  const text = $('#pr-text'), view = $('#pr-view');
  let y = 0, playing = false, raf = 0, last = 0, wake = null;
  const meta = () => { $('#pr-speed').textContent = `Vel. ${cfg.speed.toFixed(1)}`; store.set('prompter', cfg); };
  const place = () => { text.style.transform = `translateY(${-y}px)${cfg.mirror ? ' scaleX(-1)' : ''}`; };
  const step = (t) => {
    if (!playing) return;
    const dt = last ? (t - last) / 16.67 : 1; last = t;
    y += cfg.speed * 0.9 * dt;
    const max = text.scrollHeight - view.clientHeight * 0.4;
    if (y >= max) { y = max; toggle(false); }
    place();
    raf = requestAnimationFrame(step);
  };
  const toggle = async (force) => {
    playing = force ?? !playing;
    $('#pr-play').textContent = playing ? 'Pausar' : 'Continuar';
    cancelAnimationFrame(raf); last = 0;
    if (playing) {
      try { wake = await navigator.wakeLock?.request('screen'); } catch { /* opcional */ }
      raf = requestAnimationFrame(step);
    } else { wake?.release?.(); wake = null; }
  };
  const countdown = () => new Promise((resolve) => {
    const c = document.createElement('div'); c.className = 'pr-count'; view.appendChild(c);
    let n = 3; c.textContent = n;
    const it = setInterval(() => { n--; if (n === 0) { clearInterval(it); c.remove(); resolve(); } else c.textContent = n; }, 800);
  });
  const close = () => {
    toggle(false); root.hidden = true; root.innerHTML = '';
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
  };
  const act = async (a) => {
    if (a === 'close') return close();
    if (a === 'play') { if (!playing && y === 0) await countdown(); toggle(); }
    if (a === 'restart') { y = 0; place(); toggle(false); $('#pr-play').textContent = 'Iniciar'; }
    if (a === 'slower') cfg.speed = Math.max(0.4, cfg.speed - 0.3);
    if (a === 'faster') cfg.speed = Math.min(8, cfg.speed + 0.3);
    if (a === 'smaller') cfg.size = Math.max(24, cfg.size - 4);
    if (a === 'bigger') cfg.size = Math.min(96, cfg.size + 4);
    if (a === 'mirror') cfg.mirror = !cfg.mirror;
    text.style.setProperty('--pr-size', cfg.size + 'px');
    text.classList.remove('mirror');
    place(); meta();
  };
  const onKey = (e) => {
    if (e.key === ' ') { e.preventDefault(); act('play'); }
    if (e.key === 'Escape') act('close');
    if (e.key === 'ArrowUp') act('faster');
    if (e.key === 'ArrowDown') act('slower');
  };
  root.querySelector('.pr-bar').addEventListener('click', (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) act(a); });
  view.addEventListener('click', () => toggle());
  document.addEventListener('keydown', onKey);
  meta(); place();
}
