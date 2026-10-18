// Roteador por hash + inicialização preguiçosa de cada módulo.
import { $, $$, fitFrames } from './lib/util.js';
import { DOCTOR } from './config.js';
import { renderPlan } from './modules/m1-plan.js';
import { renderCalendar } from './modules/m2-calendar.js';
import { renderHighlights } from './modules/m3-highlights.js';
import { renderScripts } from './modules/m4-scripts.js';
import { renderAds } from './modules/m5-ads.js';
import { renderErp } from './modules/m6-erp.js';
import { renderMedia } from './modules/m7-media.js';

const ROUTES = {
  plano: renderPlan,
  cronograma: renderCalendar,
  destaques: renderHighlights,
  roteiros: renderScripts,
  ads: renderAds,
  erp: renderErp,
  midia: renderMedia,
};
const rendered = new Set();

function go() {
  const route = (location.hash.slice(1) || 'plano').split('/')[0];
  const name = ROUTES[route] ? route : 'plano';
  $$('.view').forEach((v) => v.classList.toggle('on', v.dataset.view === name));
  $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.route === name));
  const view = $(`#view-${name}`);
  if (!rendered.has(name)) {
    ROUTES[name](view);
    rendered.add(name);
  }
  requestAnimationFrame(() => fitFrames(view));
  window.scrollTo(0, 0);
}

$('#rail-crm').textContent = `${DOCTOR.crm} · ${DOCTOR.rqe}`;
window.addEventListener('hashchange', go);
let t;
window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => fitFrames(document), 120); });
document.fonts?.ready.then(() => fitFrames(document));
go();
