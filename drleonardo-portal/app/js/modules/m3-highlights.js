// Módulo 3 — Estúdio de Destaques: capas 1080x1920 + 6 telas estratégicas por destaque.
import { HIGHLIGHTS } from '../data/highlights.js';
import { $$, esc, fitFrames } from '../lib/util.js';
import { highlightCover, highlightScreen } from '../lib/art.js';
import { exportFrame, exportAll } from '../lib/export.js';

const fit = (html) => `<div class="fit" data-w="1080" data-h="1920">${html}</div>`;

export function renderHighlights(el) {
  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 03 · Estúdio de destaques</span>
      <h1 class="h2">Lipedefinition &amp; Lipedema</h1>
      <p class="muted">Capa minimalista + sequência de 6 Stories que conduz da dúvida ao agendamento. Publique as telas em ordem e salve-as no destaque correspondente.</p>
    </div>
  </div>
  ${HIGHLIGHTS.map((h) => `
    <section class="section" data-h="${h.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:18px">
        <div><span class="eyebrow">Destaque</span><h2 class="h2" style="margin-top:6px">${esc(h.label)}</h2></div>
        <button class="btn primary" data-all="${h.id}">Baixar capa + 6 telas (PNG)</button>
      </div>
      <div class="hl-grid">
        <div class="slide-col">${fit(highlightCover(h))}<button class="btn sm" data-dl="${h.id}:cover">Capa 1080×1920</button></div>
        ${h.screens.map((s, i) => `<div class="slide-col">${fit(highlightScreen(h, s, i))}<button class="btn sm" data-dl="${h.id}:${i}">Tela ${i + 1}</button></div>`).join('')}
      </div>
    </section>`).join('')}
  <p class="tiny" style="margin-top:28px">Na tela 6, adicione o sticker de link oficial do Instagram apontando para o WhatsApp — links clicáveis só funcionam via sticker nativo.</p>`;

  el.addEventListener('click', (e) => {
    const dl = e.target.dataset.dl;
    if (dl) {
      const [id, which] = dl.split(':');
      exportFrame(e.target.closest('.slide-col').querySelector('.art'), `destaque-${id}-${which === 'cover' ? 'capa' : 'tela-' + (Number(which) + 1)}-1080x1920`);
    }
    const all = e.target.dataset.all;
    if (all) exportAll($$(`[data-h="${all}"] .art`, el), `destaque-${all}`);
  });
  requestAnimationFrame(() => fitFrames(el));
}
