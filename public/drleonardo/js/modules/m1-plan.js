// Módulo 1 — Apresentação executiva, engenharia 9K → 20K e funil de 4+ consultas/semana.
import { DOCTOR, GOAL, ADS, CALENDAR_START } from '../config.js';
import { $, $$, esc, num, brl, store, printMode } from '../lib/util.js';

// Premissas por cenário. Todas editáveis nos controles; servem como ponto de partida honesto.
const PRESETS = {
  conservador: { reels: 1, views: 30000, follow: 0.4, comments: 120, gate: 30, carReach: 6000, carFollow: 0.3, paid: ADS.c2Daily, cpv: 0.30, visitFollow: 10, churn: 0.6 },
  base: { reels: 2, views: 85000, follow: 0.55, comments: 350, gate: 35, carReach: 15000, carFollow: 0.4, paid: ADS.c2Daily, cpv: 0.22, visitFollow: 13, churn: 0.5 },
  agressivo: { reels: 3, views: 110000, follow: 0.6, comments: 600, gate: 40, carReach: 25000, carFollow: 0.45, paid: ADS.c2Daily, cpv: 0.18, visitFollow: 15, churn: 0.5 },
};

const CONTROLS = [
  ['reels', 'Reels por semana (calendário + trial reels)', 1, 5, 1, (v) => v],
  ['views', 'Views de não seguidores por Reel', 5000, 250000, 5000, (v) => num(v)],
  ['follow', 'Taxa de follow por view (%)', 0.1, 1.5, 0.05, (v) => num(v, 2) + '%'],
  ['comments', 'Comentários-isca por post (ManyChat)', 0, 1500, 10, (v) => num(v)],
  ['gate', 'Comentaristas que seguem p/ receber (%)', 0, 70, 1, (v) => v + '%'],
  ['carReach', 'Alcance não seguidor por carrossel', 0, 60000, 1000, (v) => num(v)],
  ['paid', 'Verba C2 visita ao perfil (R$/dia)', 0, 50, 1, (v) => brl(v)],
  ['cpv', 'Custo por visita ao perfil (R$)', 0.08, 0.8, 0.01, (v) => 'R$ ' + num(v, 2)],
  ['visitFollow', 'Visita → seguidor (%)', 3, 30, 1, (v) => v + '%'],
  ['churn', 'Perda semanal de seguidores (%)', 0, 2, 0.1, (v) => num(v, 1) + '%'],
];

const WEEKS = 12;
const START = new Date(CALENDAR_START + 'T12:00:00');
const DEADLINE = new Date(GOAL.deadline + 'T12:00:00');
const deadlineWeek = (DEADLINE - START) / (7 * 864e5);

export function simulate(p) {
  let f = GOAL.followersNow;
  const pts = [f];
  const parts = { reels: 0, manychat: 0, carrossel: 0, pago: 0, churn: 0 };
  for (let w = 1; w <= WEEKS; w++) {
    const ramp = Math.min(1, 0.55 + w * 0.15); // algoritmo "aprende" o perfil nas 2 primeiras semanas
    const reels = ramp * p.reels * p.views * (p.follow / 100);
    const car = ramp * p.carReach * (p.carFollow / 100);
    const many = 2 * p.comments * (p.gate / 100) * 0.5; // metade dos comentaristas ainda não segue
    const paid = p.paid > 0 ? (p.paid * 7 / p.cpv) * (p.visitFollow / 100) : 0;
    const churn = f * (p.churn / 100);
    parts.reels += reels; parts.carrossel += car; parts.manychat += many; parts.pago += paid; parts.churn += churn;
    f += reels + car + many + paid - churn;
    pts.push(f);
  }
  let hit = null;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i] >= GOAL.followersTarget) { hit = i - 1 + (GOAL.followersTarget - pts[i - 1]) / (pts[i] - pts[i - 1]); break; }
  }
  return { pts, parts, hit };
}

const weekDate = (w) => { const d = new Date(START); d.setDate(d.getDate() + Math.round(w * 7)); return d; };
const dLabel = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

function chart(p) {
  const W = 760, H = 320, L = 52, R = 18, T = 18, B = 34;
  const sims = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, simulate(v).pts]));
  const cur = simulate(p).pts;
  const maxY = Math.max(24000, ...cur, ...sims.agressivo) * 1.04;
  const x = (i) => L + (i / WEEKS) * (W - L - R);
  const y = (v) => T + (1 - (v - 8000) / (maxY - 8000)) * (H - T - B);
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const ticks = [10000, 15000, 20000, 25000, 30000, 35000, 40000].filter((v) => v < maxY);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Projeção de seguidores por semana">
    <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2925" stop-opacity=".16"/><stop offset="1" stop-color="#2A2925" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((v) => `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v / 1000}K</text>`).join('')}
    ${Array.from({ length: WEEKS + 1 }, (_, i) => i % 2 === 0 ? `<text class="axis" x="${x(i)}" y="${H - 10}" text-anchor="middle">${dLabel(weekDate(i))}</text>` : '').join('')}
    <line class="target" x1="${L}" x2="${W - R}" y1="${y(GOAL.followersTarget)}" y2="${y(GOAL.followersTarget)}"/>
    <text class="lbl" x="${W - R}" y="${y(GOAL.followersTarget) - 7}" text-anchor="end">Meta 20K</text>
    <line class="deadline" x1="${x(deadlineWeek)}" x2="${x(deadlineWeek)}" y1="${T}" y2="${H - B}"/>
    <text class="lbl" x="${x(deadlineWeek) - 6}" y="${T + 10}" text-anchor="end">Virada 2027</text>
    ${['conservador', 'agressivo'].map((k) => `<path class="alt" d="${path(sims[k])}"/>`).join('')}
    <path class="area" d="${path(cur)}L${x(WEEKS)},${H - B}L${x(0)},${H - B}Z"/>
    <path class="main-l" d="${path(cur)}"/>
    <circle cx="${x(WEEKS)}" cy="${y(cur[WEEKS])}" r="5" fill="#2A2925"/>
    <text class="lbl" x="${x(WEEKS) - 8}" y="${y(cur[WEEKS]) - 10}" text-anchor="end">${num(cur[WEEKS] / 1000, 1)}K</text>
  </svg>`;
}

function funnelCalc(f) {
  const conv = (f.budget * 7) / f.cpc;
  const qual = conv * (f.qual / 100);
  const booked = qual * (f.book / 100);
  const paidConsults = booked * (f.show / 100);
  const total = paidConsults + f.organic;
  const surgeriesMonth = total * 4.3 * (f.close / 100);
  return { conv, qual, booked, paidConsults, total, surgeriesMonth, revenue: surgeriesMonth * f.ticket, cost: f.budget * 30 };
}

export function renderPlan(el) {
  let p = { ...PRESETS.base, ...store.get('plan', {}) };
  let preset = store.get('planPreset', 'base');
  let f = { budget: ADS.c1Daily, cpc: 22, qual: 55, book: 45, show: 85, organic: GOAL.consultsNow, close: 35, ticket: 25000, ...store.get('funnel', {}) };

  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 01 · Apresentação executiva</span>
      <h1 class="h2">Plano 20K &amp; motor comercial</h1>
      <p class="meeting">Reunião estratégica · segunda, 19/10 · 14h</p>
    </div>
    <div class="actions">
      <button class="btn primary" id="pdf">Exportar PDF Executivo</button>
    </div>
  </div>

  <div class="hero-exec">
    <div class="hero-copy card solid">
      <div>
        <span class="eyebrow">${esc(DOCTOR.title)} · ${esc(DOCTOR.city)}</span>
        <h2 class="h-display" style="margin:14px 0 18px">De <em>9 mil</em> a 20 mil seguidores qualificados — e o dobro de consultas.</h2>
        <p class="lead">Um sistema de 12 semanas que transforma autoridade técnica em demanda: conteúdo educativo de Lipedema e Lipedefinition para crescer, ManyChat para capturar, tráfego pago enxuto para converter e um CRM com decisão humana na hora de agendar e cobrar.</p>
      </div>
      <div class="grid g4">
        <div class="kpi"><span>Seguidores hoje</span><b>~9K</b></div>
        <div class="kpi"><span>Meta virada 2027</span><b>20K</b></div>
        <div class="kpi"><span>Consultas / semana</span><b>2 <small>→ 4+</small></b></div>
        <div class="kpi"><span>Tráfego / mês</span><b>${brl(ADS.monthly)}</b></div>
      </div>
    </div>
    <figure class="portrait">
      <img src="assets/dr-leonardo.jpg" alt="Dr. Leonardo Valadão">
      <figcaption>${esc(DOCTOR.name)} · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)}</figcaption>
    </figure>
  </div>

  <section class="section">
    <span class="eyebrow">01 · Diagnóstico</span>
    <h2 class="h2">Onde o perfil está hoje</h2>
    <div class="grid g3">
      <div class="card"><h3 class="h3">Ativos fortes</h3><ul class="list muted">
        <li>Especialista com RQE e atuação em hospital — autoridade verificável</li>
        <li>Nicho de alta demanda e baixa concorrência qualificada: Lipedema</li>
        <li>Acervo real de casos (12 linhas de procedimento) e mídias de bastidor</li>
        <li>Identidade visual sóbria já definida (pedra, linho, tinta)</li></ul></div>
      <div class="card"><h3 class="h3">Gargalos</h3><ul class="list muted">
        <li>Sem cadência fixa: o algoritmo não sabe quando entregar o perfil</li>
        <li>Conteúdo sem mecanismo de captura (comentário → direct → WhatsApp)</li>
        <li>Destaques não conduzem a decisão de agendar</li>
        <li>Lead do WhatsApp sem SLA e sem etapa formal de agenda + pagamento</li></ul></div>
      <div class="card ink"><h3 class="h3">A tese</h3><p class="muted">Lipedema gera alcance (dor real, identificação imediata, alto compartilhamento). Lipedefinition e cirurgia mamária geram ticket. Segurança cirúrgica gera confiança. O calendário alterna os três, e cada post tem um CTA de comentário que alimenta o ManyChat e o CRM.</p></div>
    </div>
    <p class="tiny" style="margin-top:12px">Diagnóstico qualitativo a partir dos dados fornecidos. Validar com Instagram Insights (últimos 90 dias) na reunião: alcance de não seguidores, retenção 3 s dos Reels e visitas ao perfil.</p>
  </section>

  <section class="section page">
    <span class="eyebrow">02 · Engenharia 9K → 20K</span>
    <h2 class="h2">A matemática do crescimento</h2>
    <div class="grid g2" style="align-items:start">
      <div class="card solid">
        <div class="controls" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <div class="seg" id="presets">${Object.keys(PRESETS).map((k) => `<button data-p="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
        </div>
        <div id="chart"></div>
        <div class="grid g3" id="growth-kpis" style="margin-top:16px"></div>
        <p class="tiny" style="margin-top:12px">Linha contínua = cenário atual. Tracejadas = conservador e agressivo. Rampa de entrega de 2 semanas aplicada.</p>
      </div>
      <div class="card controls"><div class="grid" id="ctrls" style="gap:16px"></div></div>
    </div>
    <div class="grid g4" id="levers" style="margin-top:16px"></div>
    <div class="grid g3" style="margin-top:16px">
      <div class="card"><span class="tag ink">Alavanca 1</span><h3 class="h3" style="margin-top:12px">Reels virais de Lipedema</h3><p class="muted small">1 Reel fixo na terça (roteiros do Módulo 4) + 1 "trial reel" exibido só para não seguidores. Gancho nos primeiros 2 s, legenda grande, CTA de comentário.</p></div>
      <div class="card"><span class="tag ink">Alavanca 2</span><h3 class="h3" style="margin-top:12px">Iscas de comentário ManyChat</h3><p class="muted small">Toda peça termina com "Comente LIPEDEMA / DEFINIÇÃO / MAMA…". O ManyChat responde no direct com o guia e pede o follow para liberar o material — cada comentário vira seguidor e lead.</p></div>
      <div class="card"><span class="tag ink">Alavanca 3</span><h3 class="h3" style="margin-top:12px">Tráfego de visita ao perfil</h3><p class="muted small">R$ 15/dia distribuindo apenas Reels já validados no orgânico (retenção 3 s &gt; 35%). Custo-alvo ≤ R$ 0,25 por visita.</p></div>
    </div>
  </section>

  <section class="section page">
    <span class="eyebrow">03 · Funil comercial</span>
    <h2 class="h2">De 2 para 4+ consultas fechadas por semana</h2>
    <div class="grid g2" style="align-items:start">
      <div class="card solid"><div class="funnel" id="funnel"></div><div class="grid g3" id="funnel-kpis" style="margin-top:20px"></div></div>
      <div class="card controls"><div class="grid" id="fctrls" style="gap:16px"></div></div>
    </div>
  </section>

  <section class="section">
    <span class="eyebrow">04 · Roadmap</span>
    <h2 class="h2">12 semanas, três fases</h2>
    <div class="timeline">
      <div class="card"><span class="tiny">Semanas 1–4 · 20/10 → 13/11</span><h3 class="h3">Fundação</h3><ul class="list muted small"><li>Destaques Lipedefinition e Lipedema no ar</li><li>ManyChat com 6 palavras-chave</li><li>C1 rodando com 3 criativos</li><li>CRM com SLA de 5 min</li></ul></div>
      <div class="card"><span class="tiny">Semanas 5–8 · 17/11 → 11/12</span><h3 class="h3">Tração</h3><ul class="list muted small"><li>Escala +20% no criativo campeão</li><li>Trial reels 2×/semana</li><li>Collab com fisioterapeuta / nutricionista de lipedema</li><li>Revisão do roteiro de atendimento</li></ul></div>
      <div class="card"><span class="tiny">Semanas 9–12 · 15/12 → 08/01</span><h3 class="h3">Aceleração</h3><ul class="list muted small"><li>Reels de maior retenção na C2</li><li>Live de perguntas sobre lipedema</li><li>Campanha de agenda de janeiro</li><li>Relatório final 20K e plano 2027</li></ul></div>
    </div>
  </section>

  <section class="section">
    <span class="eyebrow">05 · Governança</span>
    <h2 class="h2">KPIs semanais da reunião de segunda</h2>
    <div class="card solid table-wrap"><table class="t">
      <thead><tr><th>Indicador</th><th>Fonte</th><th class="num">Meta semanal</th></tr></thead>
      <tbody>
        <tr><td>Novos seguidores líquidos</td><td>Instagram Insights</td><td class="num">≥ 1.000</td></tr>
        <tr><td>Retenção 3 s dos Reels</td><td>Insights do Reel</td><td class="num">≥ 35%</td></tr>
        <tr><td>Comentários-isca (ManyChat)</td><td>ManyChat</td><td class="num">≥ 500</td></tr>
        <tr><td>Conversas WhatsApp (C1)</td><td>Gerenciador de Anúncios</td><td class="num">≥ 11</td></tr>
        <tr><td>Custo por conversa</td><td>Gerenciador de Anúncios</td><td class="num">≤ R$ 25</td></tr>
        <tr><td>Tempo de 1ª resposta</td><td>CRM (Módulo 6)</td><td class="num">≤ 5 min</td></tr>
        <tr><td>Consultas pagas agendadas</td><td>CRM (Módulo 6)</td><td class="num">≥ 4</td></tr>
      </tbody></table></div>
    <p class="tiny" style="margin-top:16px">${esc(DOCTOR.name)} · ${esc(DOCTOR.crm)} | ${esc(DOCTOR.rqe)} · Projeções são estimativas baseadas em premissas editáveis e não constituem garantia de resultado. Toda comunicação segue a Res. CFM 2.336/2023.</p>
  </section>`;

  const ctrls = $('#ctrls', el);
  ctrls.innerHTML = CONTROLS.map(([k, label, min, max, step]) => `
    <div class="range"><div class="top"><span>${label}</span><b data-out="${k}"></b></div>
    <input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"></div>`).join('');

  const FCTRLS = [
    ['budget', 'Verba C1 (R$/dia)', 10, 100, 1, (v) => brl(v)],
    ['cpc', 'Custo por conversa WhatsApp (R$)', 8, 60, 1, (v) => brl(v)],
    ['qual', 'Conversas qualificadas (%)', 20, 90, 1, (v) => v + '%'],
    ['book', 'Qualificadas que agendam e pagam (%)', 10, 80, 1, (v) => v + '%'],
    ['show', 'Comparecimento (%)', 50, 100, 1, (v) => v + '%'],
    ['organic', 'Consultas orgânicas/indicação por semana', 0, 10, 0.5, (v) => num(v, 1)],
    ['close', 'Consulta → cirurgia (%)', 10, 70, 1, (v) => v + '%'],
    ['ticket', 'Ticket médio cirúrgico (hipótese)', 8000, 80000, 1000, (v) => brl(v)],
  ];
  $('#fctrls', el).innerHTML = FCTRLS.map(([k, label, min, max, step]) => `
    <div class="range"><div class="top"><span>${label}</span><b data-fout="${k}"></b></div>
    <input type="range" data-f="${k}" min="${min}" max="${max}" step="${step}"></div>`).join('');

  function draw() {
    $$('[data-k]', el).forEach((i) => { i.value = p[i.dataset.k]; });
    CONTROLS.forEach(([k, , , , , fmt]) => { $(`[data-out="${k}"]`, el).textContent = fmt(p[k]); });
    $$('#presets button', el).forEach((b) => b.classList.toggle('on', b.dataset.p === preset));
    $('#chart', el).innerHTML = chart(p);
    const { pts, parts, hit } = simulate(p);
    const atDeadline = pts[Math.floor(deadlineWeek)] + (pts[Math.ceil(deadlineWeek)] - pts[Math.floor(deadlineWeek)]) * (deadlineWeek % 1);
    $('#growth-kpis', el).innerHTML = `
      <div class="kpi"><span>Em 31/12</span><b>${num(atDeadline / 1000, 1)}K</b></div>
      <div class="kpi"><span>Ganho / semana</span><b>${num((pts[WEEKS] - pts[0]) / WEEKS)}</b></div>
      <div class="kpi"><span>20K atingido</span><b style="font-size:30px">${hit == null ? 'após 12 sem.' : dLabel(weekDate(hit))}</b></div>`;
    const total = parts.reels + parts.manychat + parts.carrossel + parts.pago;
    $('#levers', el).innerHTML = [
      ['Reels', parts.reels], ['ManyChat', parts.manychat], ['Carrosséis', parts.carrossel], ['Tráfego C2', parts.pago],
    ].map(([n, v]) => `<div class="card"><div class="kpi"><span>${n}</span><b>+${num(v)}</b></div><p class="tiny">${num((v / total) * 100)}% do crescimento bruto em 12 semanas</p></div>`).join('');

    $$('[data-f]', el).forEach((i) => { i.value = f[i.dataset.f]; });
    FCTRLS.forEach(([k, , , , , fmt]) => { $(`[data-fout="${k}"]`, el).textContent = fmt(f[k]); });
    const r = funnelCalc(f);
    const steps = [['Conversas / semana', r.conv], ['Qualificadas', r.qual], ['Agendam + pagam', r.booked], ['Comparecem (pago)', r.paidConsults], ['Total c/ orgânico', r.total]];
    const mx = Math.max(...steps.map((s) => s[1]), 1);
    $('#funnel', el).innerHTML = steps.map(([n, v]) => `<div class="stp"><span>${n}</span><div class="bar"><i style="width:${(v / mx) * 100}%"></i></div><span class="val">${num(v, 1)}</span></div>`).join('');
    $('#funnel-kpis', el).innerHTML = `
      <div class="kpi"><span>Consultas / semana</span><b>${num(r.total, 1)}</b><span class="tiny">${r.total >= GOAL.consultsTarget ? 'meta 4+ atingida' : 'abaixo da meta 4+'}</span></div>
      <div class="kpi"><span>Cirurgias / mês</span><b>${num(r.surgeriesMonth, 1)}</b></div>
      <div class="kpi"><span>Receita / verba C1</span><b>${num(r.revenue / r.cost, 0)}×</b><span class="tiny">${brl(r.revenue)} / ${brl(r.cost)}</span></div>`;
  }

  el.addEventListener('input', (e) => {
    const k = e.target.dataset.k, fk = e.target.dataset.f;
    if (k) { p[k] = Number(e.target.value); preset = 'custom'; store.set('plan', p); store.set('planPreset', preset); }
    if (fk) { f[fk] = Number(e.target.value); store.set('funnel', f); }
    if (k || fk) draw();
  });
  $('#presets', el).addEventListener('click', (e) => {
    const k = e.target.dataset.p; if (!k) return;
    preset = k; p = { ...PRESETS[k] }; store.set('plan', p); store.set('planPreset', k); draw();
  });
  $('#pdf', el).addEventListener('click', () => printMode('exec'));
  draw();
}
