// Utilitários compartilhados: DOM, armazenamento local seguro, clipboard e toasts.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const num = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });

// localStorage pode lançar em janelas privadas / previews — sempre degradar com elegância.
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('dlv:' + key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('dlv:' + key, JSON.stringify(value)); } catch { /* sem persistência */ }
  },
};

export function toast(msg) {
  const root = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, 2600);
}

export async function copy(text, label = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* ignora */ }
    ta.remove();
  }
  toast(label + ' ✓');
}

// Modal genérico. Retorna { el, close }.
export function modal(html, { wide = false, onClose } = {}) {
  const root = $('#modal-root');
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
      <button class="modal-x" aria-label="Fechar">×</button>${html}</div>`;
  root.appendChild(wrap);
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => wrap.classList.add('in'));
  const close = () => {
    wrap.classList.remove('in');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { wrap.remove(); if (!root.children.length) document.body.classList.remove('no-scroll'); }, 220);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  $('.modal-x', wrap).addEventListener('click', close);
  return { el: $('.modal', wrap), close };
}

// Escala um quadro de tamanho real (ex.: 1080x1350) para caber na largura do contêiner.
export function fitFrames(root = document) {
  $$('.fit', root).forEach((box) => {
    const frame = box.firstElementChild;
    if (!frame) return;
    const w = Number(box.dataset.w), h = Number(box.dataset.h);
    const s = box.clientWidth / w;
    frame.style.transform = `scale(${s})`;
    box.style.height = h * s + 'px';
  });
}

// Imprime um bloco isolado (PDF executivo ou documento timbrado).
export function printMode(mode) {
  document.body.dataset.print = mode;
  const reset = () => { delete document.body.dataset.print; window.removeEventListener('afterprint', reset); };
  window.addEventListener('afterprint', reset);
  setTimeout(() => window.print(), 60);
}
