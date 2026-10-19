// Módulo 5 — Central Meta Ads & Google (R$ 1.500/mês).
import { CAMPAIGNS, ADS_COMPLIANCE, GOOGLE_NEGATIVE_SCRIPT } from '../data/ads.js';
import { SCRIPTS } from '../data/scripts.js';
import { ADS, DOCTOR } from '../config.js';
import { $, esc, brl, copy, store, toast } from '../lib/util.js';

export function renderAds(el) {
  const approvals = store.get('approvals', {});
  const [c1, c2] = CAMPAIGNS;

  const creative = (cr) => {
    const ok = approvals[cr.id];
    const [line1, ...rest] = cr.name.split('—');
    return `<div class="card solid ad" data-cr="${cr.id}">
      <div class="ad-head"><img src="assets/dr-leonardo.jpg" alt=""><div><b>drleonardovaladao</b><span class="tiny">Patrocinado</span></div></div>
      <div class="ad-text">${esc(cr.primary)}</div>
      <div class="ad-media"><span class="fmt">${esc(cr.format)}</span><h4>${esc(line1.replace(/Criativo \d · /, ''))}<br><em>${esc(rest.join('—').replace(/"/g, ''))}</em></h4><span class="crm">${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}</span></div>
      <div class="ad-cta"><div><span class="tiny">${esc(cr.destination)}</span><b>${esc(cr.headline)}</b><span class="tiny">${esc(cr.description)}</span></div><span class="btn sm">${esc(cr.cta)}</span></div>
      <div class="ad-foot">
        <span class="tiny"><b>Visual:</b> ${esc(cr.visual)}</span>
        <div class="actions">
          <button class="btn sm ${ok ? 'ok' : 'primary'}" data-approve="${cr.id}">${ok ? '✓ Aprovado' : 'Aprovar anúncio'}</button>
          <button class="btn sm" data-copy="${cr.id}">Copiar textos</button>
        </div>
        ${ok ? `<span class="tiny">Aprovado em ${new Date(ok).toLocaleString('pt-BR')}</span>` : ''}
      </div>
    </div>`;
  };

  const campCard = (c) => `<div class="card">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div><span class="tag">${esc(c.stage)}</span><h3 class="h3" style="margin-top:10px">${esc(c.name)}</h3></div>
        <div class="kpi" style="text-align:right"><span>Diário</span><b>${brl(c.daily)}</b></div>
      </div>
      <p class="small" style="margin:12px 0 4px"><b>Objetivo:</b> ${esc(c.objective)}</p>
      <p class="small muted"><b>Otimização:</b> ${esc(c.optimization)}</p>
      <div class="grid g2" style="margin-top:16px">
        <div><span class="label">Segmentação</span><ul class="list small muted" style="margin-top:8px">${c.audience.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
        <div><span class="label">Regras de otimização</span><ul class="list small muted" style="margin-top:8px">${c.rules.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
      </div>
    </div>`;

  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 05 · Central de tráfego</span>
      <h1 class="h2">Meta Ads &amp; Google · ${brl(ADS.monthly)}/mês</h1>
      <p class="muted">Estrutura enxuta (método Subido): duas campanhas, orçamento concentrado e o criativo fazendo a segmentação. Pronta para subir amanhã.</p>
    </div>
    <div class="actions"><button class="btn" id="brief">Copiar briefing completo</button></div>
  </div>

  <div class="grid g4">
    <div class="card ink"><div class="kpi"><span>Verba diária</span><b>${brl(ADS.daily)}</b></div></div>
    <div class="card"><div class="kpi"><span>C1 · Consultas</span><b>${brl(ADS.c1Daily)}</b></div><p class="tiny">${Math.round((ADS.c1Daily / ADS.daily) * 100)}% · ${brl(ADS.c1Daily * 30)}/mês</p></div>
    <div class="card"><div class="kpi"><span>C2 · 20K</span><b>${brl(ADS.c2Daily)}</b></div><p class="tiny">${Math.round((ADS.c2Daily / ADS.daily) * 100)}% · ${brl(ADS.c2Daily * 30)}/mês</p></div>
    <div class="card"><div class="kpi"><span>Criativos aprovados</span><b id="appr-count">0/3</b></div></div>
  </div>

  <section class="section">
    <span class="eyebrow">Campanha 1 · Fundo de funil</span>
    <h2 class="h2">Consultas via WhatsApp</h2>
    <div class="camp">${campCard(c1)}
      <div class="card"><span class="label">Conformidade (CFM + Meta)</span><ul class="list small muted" style="margin-top:10px">${ADS_COMPLIANCE.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      <p class="tiny" style="margin-top:14px">Rastreio: mensagem pré-preenchida com código do criativo (ex.: “Olá! Vim do anúncio LPD1”) para atribuir cada conversa no CRM.</p></div>
    </div>
    <h3 class="h3" style="margin:28px 0 14px">3 criativos campeões</h3>
    <div class="creatives">${c1.creatives.map(creative).join('')}</div>
  </section>

  <section class="section">
    <span class="eyebrow">Campanha 2 · Topo de funil</span>
    <h2 class="h2">Crescimento 20K · visita ao perfil</h2>
    <div class="camp">${campCard(c2)}
      <div class="card"><span class="label">Reels na distribuição (ordem de rodízio)</span>
        <ol style="margin:12px 0 0 18px;display:grid;gap:10px">${c2.reels.map((id) => { const s = SCRIPTS.find((x) => x.id === id); return `<li><b>${esc(s.title)}</b><br><span class="tiny">${esc(s.pillar)} · tarja: “${esc(s.tarja)}”</span></li>`; }).join('')}</ol>
      </div>
    </div>
  </section>

  <section class="section">
    <span class="eyebrow">Google Ads</span>
    <h2 class="h2">Script de negativação automática</h2>
    <div class="card solid">
      <p class="muted small" style="margin-bottom:14px">Para a campanha de Pesquisa (ex.: “cirurgia lipedema rj”, “lipo hd barra da tijuca”, “abdominoplastia barra”). Cria a lista compartilhada, anexa às campanhas e negativa diariamente termos irrelevantes ou sem conversão.</p>
      <div class="actions" style="margin-bottom:14px"><button class="btn primary" id="copy-script">Copiar script</button></div>
      <pre class="code">${esc(GOOGLE_NEGATIVE_SCRIPT)}</pre>
    </div>
  </section>`;

  const count = () => { $('#appr-count', el).textContent = `${c1.creatives.filter((c) => approvals[c.id]).length}/3`; };
  count();

  el.addEventListener('click', (e) => {
    const ap = e.target.dataset.approve;
    if (ap) {
      if (approvals[ap]) delete approvals[ap]; else approvals[ap] = Date.now();
      store.set('approvals', approvals);
      const cr = c1.creatives.find((c) => c.id === ap);
      e.target.closest('.ad').outerHTML = creative(cr);
      count();
      toast(approvals[ap] ? 'Anúncio aprovado para subir' : 'Aprovação removida');
    }
    const cp = e.target.dataset.copy;
    if (cp) {
      const cr = c1.creatives.find((c) => c.id === cp);
      copy(`TEXTO PRINCIPAL:\n${cr.primary}\n\nTÍTULO: ${cr.headline}\nDESCRIÇÃO: ${cr.description}\nCTA: ${cr.cta}\nDESTINO: ${cr.destination}`, 'Textos do anúncio copiados');
    }
  });
  $('#copy-script', el).addEventListener('click', () => copy(GOOGLE_NEGATIVE_SCRIPT, 'Script copiado'));
  $('#brief', el).addEventListener('click', () => {
    const txt = CAMPAIGNS.map((c) => [
      `${c.name} — ${brl(c.daily)}/dia`, `Objetivo: ${c.objective}`, `Otimização: ${c.optimization}`,
      'Segmentação:', ...c.audience.map((a) => `- ${a}`), 'Regras:', ...c.rules.map((a) => `- ${a}`),
      ...(c.creatives || []).map((cr) => `\n[${cr.name}] ${approvals[cr.id] ? '(APROVADO)' : '(pendente)'}\n${cr.primary}\nTítulo: ${cr.headline} · CTA: ${cr.cta}`),
    ].join('\n')).join('\n\n———\n\n');
    copy(txt, 'Briefing copiado');
  });
}
