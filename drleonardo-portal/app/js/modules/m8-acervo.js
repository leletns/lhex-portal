// Módulo + — Acervo Oficial & Criativos de Anúncio (@drleonardovaladao).
// Vitrine dos 17 posts reais e públicos do perfil do Dr. Leonardo, renderizados
// pelo EMBED OFICIAL do Instagram (iframe), com uma camada de estratégia editável
// (campanha, semana, nota) que o Dr. ajusta na reunião. Nada é baixado/raspado:
// o conteúdo real vem ao vivo do embed; a camada de plano fica no localStorage.
import { ACERVO, acervoUrl, acervoEmbed } from '../data/acervo.js';
import { DOCTOR, ADS } from '../config.js';
import { $, $$, esc, copy, store, toast } from '../lib/util.js';

const CAMPS = {
  c1: { tag: 'C1', label: 'Conversão WhatsApp', money: ADS.c1Daily },
  c2: { tag: 'C2', label: 'Crescimento 20K', money: ADS.c2Daily },
  both: { tag: 'C1+C2', label: 'Ambas', money: ADS.c1Daily + ADS.c2Daily },
};

export function renderAcervo(el) {
  const saved = store.get('acervo', {});
  const planOf = (it) => ({ camp: it.suggest, week: 0, note: '', ...(saved[it.code] || {}) });
  const save = (code, patch) => {
    const cur = saved[code] || {};
    saved[code] = { ...cur, ...patch };
    store.set('acervo', saved);
  };

  const weekOpts = (sel) => ['<option value="0">— semana</option>']
    .concat(Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${sel === i + 1 ? ' selected' : ''}>Semana ${i + 1}</option>`))
    .join('');

  const campSeg = (code, cur) => Object.entries(CAMPS).map(([k, c]) =>
    `<button class="seg-b${cur === k ? ' on' : ''}" data-camp="${k}" data-code="${code}" title="${esc(c.label)}">${c.tag}</button>`).join('');

  const card = (it) => {
    const p = planOf(it);
    const badge = it.kind === 'reel' ? `Reel ${String(it.n).padStart(2, '0')}` : `Post ${String(it.n - 9).padStart(2, '0')}`;
    return `<article class="acv-card" data-code="${it.code}">
      <header class="acv-top">
        <span class="acv-badge ${it.kind}">${badge}</span>
        <a class="acv-ext" href="${acervoUrl(it)}" target="_blank" rel="noopener">abrir no Instagram ↗</a>
      </header>
      <div class="acv-embed fit-embed">
        <iframe data-src="${acervoEmbed(it)}" title="${esc(badge)} — ${esc(DOCTOR.handle)}"
          loading="lazy" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen></iframe>
        <div class="acv-skel"><span>Carregando embed oficial…</span></div>
      </div>
      <div class="acv-ctrl">
        <div class="seg" role="group" aria-label="Campanha">${campSeg(it.code, p.camp)}</div>
        <select class="acv-week" data-code="${it.code}" aria-label="Semana do cronograma">${weekOpts(p.week)}</select>
      </div>
      <input class="acv-note" data-code="${it.code}" value="${esc(p.note)}" maxlength="80"
        placeholder="Tema/procedimento (confira na legenda) — opcional">
    </article>`;
  };

  const counts = () => {
    const c = { c1: 0, c2: 0, both: 0 };
    ACERVO.forEach((it) => { c[planOf(it).camp] += 1; });
    return c;
  };
  const c = counts();
  const reels = ACERVO.filter((it) => it.kind === 'reel');
  const posts = ACERVO.filter((it) => it.kind === 'post');

  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Acervo oficial · ${esc(DOCTOR.handle)}</span>
      <h1 class="h2">Acervo Oficial &amp; Criativos de Anúncio</h1>
      <p class="muted">Os 17 conteúdos reais já publicados no perfil, prontos para entrar no plano de tráfego via <b>“Usar publicação existente”</b>. O vídeo e a legenda originais aparecem ao vivo pelo embed oficial do Instagram — defina aqui a campanha e a semana de cada um.</p>
    </div>
    <div class="actions">
      <button class="btn" id="acv-plan">Copiar plano de distribuição</button>
    </div>
  </div>

  <div class="grid g4">
    <div class="card ink"><div class="kpi"><span>Acervo total</span><b>${ACERVO.length}</b></div><p class="tiny">${reels.length} Reels · ${posts.length} Posts</p></div>
    <div class="card"><div class="kpi"><span>Em C1 · Conversão</span><b id="acv-c1">${c.c1}</b></div><p class="tiny">WhatsApp · R$ ${ADS.c1Daily}/dia</p></div>
    <div class="card"><div class="kpi"><span>Em C2 · Crescimento</span><b id="acv-c2">${c.c2}</b></div><p class="tiny">Visitas ao perfil · R$ ${ADS.c2Daily}/dia</p></div>
    <div class="card"><div class="kpi"><span>Em ambas</span><b id="acv-both">${c.both}</b></div><p class="tiny">Reforço duplo</p></div>
  </div>

  <section class="section">
    <span class="eyebrow">Como usar na Central de tráfego</span>
    <h2 class="h2">Publicação existente → anúncio</h2>
    <div class="grid g2">
      <div class="card"><span class="label">C2 · Crescimento 20K (Reels)</span>
        <p class="small muted" style="margin-top:10px">No Gerenciador de Anúncios, objetivo <b>Tráfego → Visitas ao perfil</b>. No criativo, escolha <b>“Usar publicação existente”</b> e selecione o Reel. Rodízio: troque o Reel a cada 7–10 dias, priorizando os de maior retenção nos 3 s.</p>
      </div>
      <div class="card"><span class="label">C1 · Conversão WhatsApp (Carrosséis)</span>
        <p class="small muted" style="margin-top:10px">Objetivo <b>Conversas por mensagem (WhatsApp)</b>. Use os carrosséis educativos como publicação existente, com o CTA <b>“Enviar mensagem”</b> e texto pré-preenchido com o código do criativo para atribuir cada conversa no CRM.</p>
      </div>
    </div>
  </section>

  <section class="section">
    <span class="eyebrow">9 Reels · vídeos com a voz do Dr. Leonardo</span>
    <h2 class="h2">Reels oficiais</h2>
    <div class="acv-grid">${reels.map(card).join('')}</div>
  </section>

  <section class="section">
    <span class="eyebrow">8 Posts · carrosséis educativos</span>
    <h2 class="h2">Posts &amp; carrosséis oficiais</h2>
    <div class="acv-grid">${posts.map(card).join('')}</div>
  </section>

  <section class="section">
    <span class="eyebrow">Reedição de luxo dos Reels — caminho limpo</span>
    <h2 class="h2">Acabamento editorial sobre os seus masters</h2>
    <div class="card solid">
      <p class="small muted" style="margin-bottom:12px">O acabamento de luxo (assinatura dourada no topo, hook flutuante nos 3 s, color grading e rodapé CFM) é aplicado sobre os <b>arquivos originais</b> — não sobre a cópia comprimida da CDN. Exporte os seus próprios Reels pela ferramenta oficial da Meta e me entregue a pasta:</p>
      <ol class="list small muted" style="display:grid;gap:8px;margin-left:4px">
        <li>Instagram → <b>Configurações → Central de Contas</b> → <b>Suas informações e permissões → Baixar suas informações</b>.</li>
        <li>Selecione só o perfil ${esc(DOCTOR.handle)}, tipo <b>Reels/Posts</b>, intervalo que cobre os 17, formato <b>Alta qualidade</b>.</li>
        <li>Baixe o .zip, extraia os .mp4 numa pasta e me avise — aplico o acabamento editorial em cada um, mantendo a voz original normalizada a −14 LUFS.</li>
      </ol>
      <p class="tiny" style="margin-top:14px">Esse caminho mantém a qualidade máxima e respeita os Termos do Instagram (sem download automatizado da plataforma). O embed acima já serve para a reunião; a reedição entra assim que os masters chegarem.</p>
    </div>
  </section>`;

  // Lazy-load dos embeds oficiais (17 iframes custam caro se carregados de uma vez).
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((ents, obs) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const f = e.target.querySelector('iframe[data-src]');
      if (f) { f.src = f.dataset.src; f.removeAttribute('data-src'); f.addEventListener('load', () => e.target.classList.add('ready')); }
      obs.unobserve(e.target);
    });
  }, { rootMargin: '600px 0px' }) : null;
  $$('.acv-embed', el).forEach((box) => { if (io) io.observe(box); else { const f = box.querySelector('iframe[data-src]'); if (f) { f.src = f.dataset.src; box.classList.add('ready'); } } });

  const refreshCounts = () => { const n = counts(); $('#acv-c1', el).textContent = n.c1; $('#acv-c2', el).textContent = n.c2; $('#acv-both', el).textContent = n.both; };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-camp]');
    if (b) {
      save(b.dataset.code, { camp: b.dataset.camp });
      $$(`.seg-b[data-code="${b.dataset.code}"]`, el).forEach((x) => x.classList.toggle('on', x === b));
      refreshCounts();
    }
  });
  el.addEventListener('change', (e) => {
    const w = e.target.closest('.acv-week');
    if (w) save(w.dataset.code, { week: Number(w.value) });
  });
  el.addEventListener('input', (e) => {
    const n = e.target.closest('.acv-note');
    if (n) save(n.dataset.code, { note: n.value.trim() });
  });

  $('#acv-plan', el).addEventListener('click', () => {
    const lines = ['PLANO DE DISTRIBUIÇÃO — ACERVO OFICIAL (@drleonardovaladao)', ''];
    ACERVO.forEach((it) => {
      const p = planOf(it);
      const badge = it.kind === 'reel' ? `Reel ${String(it.n).padStart(2, '0')}` : `Post ${String(it.n - 9).padStart(2, '0')}`;
      lines.push(`${badge} · ${CAMPS[p.camp].tag} (${CAMPS[p.camp].label})${p.week ? ` · Semana ${p.week}` : ''}${p.note ? ` · ${p.note}` : ''}`);
      lines.push(`  ${acervoUrl(it)}`);
    });
    const n = counts();
    lines.push('', `Resumo: C1=${n.c1} · C2=${n.c2} · Ambas=${n.both}`);
    copy(lines.join('\n'), 'Plano de distribuição copiado');
  });
}
