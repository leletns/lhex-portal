// Módulo 6 — CRM comercial com Human-in-the-Loop, orçamento hospitalar e documentos timbrados.
// Tudo fica no navegador (localStorage). Nenhum dado de paciente é enviado a servidor.
import { PROCEDURES, HOSPITALS, EXTRAS, STAGES, SEED_LEADS, DOCS } from '../data/erp.js';
import { DOCTOR } from '../config.js';
import { $, $$, esc, brl, store, toast, modal, printMode } from '../lib/util.js';

const today = () => new Date().toLocaleDateString('pt-BR');
const mins = (t) => Math.floor((Date.now() - t) / 60000);
const ago = (t) => { const m = mins(t); return m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h` : `${Math.floor(m / 1440)} d`; };

export function letter({ title, patient, date, procedure, body }) {
  return `<article class="letter">
    <header>
      <img src="assets/logo-leonardo-valadao.svg" alt="${esc(DOCTOR.name)}">
      <div class="reg">${esc(DOCTOR.title.toUpperCase())}<br>${esc(DOCTOR.crm)} · ${esc(DOCTOR.rqe)}</div>
    </header>
    <h1>${esc(title)}</h1>
    <div class="meta">
      <span><b>Paciente:</b> <span contenteditable="true">${esc(patient || '________________________')}</span></span>
      <span><b>Data:</b> ${esc(date)}</span>
      ${procedure ? `<span><b>Procedimento:</b> ${esc(procedure)}</span>` : ''}
    </div>
    ${body}
    <div class="sign"><i></i><b>${esc(DOCTOR.name)}</b><span>${esc(DOCTOR.title)} · ${esc(DOCTOR.crm)} · ${esc(DOCTOR.rqe)}</span></div>
    <footer>${esc(DOCTOR.clinic)} · ${esc(DOCTOR.address)}<br>WhatsApp (21) 99597-1005 · ${esc(DOCTOR.handle)}</footer>
  </article>`;
}

function printLetter(container) {
  const doc = $('#print-doc');
  doc.innerHTML = container.querySelector('.letter').outerHTML;
  $$('[contenteditable]', doc).forEach((n) => n.removeAttribute('contenteditable'));
  printMode('doc');
}

export function renderErp(el) {
  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo 06 · ERP cirúrgico</span>
      <h1 class="h2">CRM, orçamento &amp; pré/pós-operatório</h1>
      <p class="muted">Demonstração funcional — dados salvos apenas neste navegador.</p>
    </div>
    <div class="seg" id="erp-tabs"><button data-t="crm" class="on">CRM WhatsApp</button><button data-t="budget">Orçamento</button><button data-t="docs">Documentos</button></div>
  </div>
  <div data-tab="crm"></div>
  <div data-tab="budget" hidden></div>
  <div data-tab="docs" hidden></div>`;

  $('#erp-tabs', el).addEventListener('click', (e) => {
    const t = e.target.dataset.t; if (!t) return;
    $$('#erp-tabs button', el).forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    $$('[data-tab]', el).forEach((p) => { p.hidden = p.dataset.tab !== t; });
  });

  crm($('[data-tab="crm"]', el));
  budget($('[data-tab="budget"]', el));
  docs($('[data-tab="docs"]', el));
}

// ---------------- CRM ----------------
function crm(root) {
  let leads = store.get('leads', null) || SEED_LEADS;
  const save = () => store.set('leads', leads);

  const card = (l) => {
    const late = l.stage === 'novo' && mins(l.createdAt) > 5;
    const i = STAGES.findIndex((s) => s.id === l.stage);
    return `<div class="lead-card" data-id="${l.id}">
      <div class="row" style="justify-content:space-between"><b>${esc(l.name)}</b><span class="tiny">${ago(l.createdAt)}</span></div>
      <div class="row"><span class="tag">${esc(l.interest)}</span>${late ? `<span class="tag warn">SLA 5 min estourado</span>` : ''}${l.hitlSentAt ? '<span class="tag ok">Agenda enviada</span>' : ''}</div>
      <span class="tiny">${esc(l.origin)}</span>
      ${l.note ? `<span class="note">${esc(l.note)}</span>` : ''}
      <div class="ops">
        <button class="btn sm ghost" data-mv="-1" ${i === 0 ? 'disabled' : ''} aria-label="Voltar etapa">←</button>
        ${l.stage === 'agenda'
          ? `<button class="btn sm primary" data-hitl>${l.hitlSentAt ? 'Confirmar pagamento' : 'Passar agenda + valor'}</button>`
          : `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(l.phone)}">WhatsApp</a>`}
        <button class="btn sm ghost" data-mv="1" ${i === STAGES.length - 1 ? 'disabled' : ''} aria-label="Avançar etapa">→</button>
      </div>
    </div>`;
  };

  const draw = () => {
    const week = leads.filter((l) => Date.now() - l.createdAt < 7 * 864e5).length;
    const booked = leads.filter((l) => ['agendado', 'fechado'].includes(l.stage)).length;
    const late = leads.filter((l) => l.stage === 'novo' && mins(l.createdAt) > 5).length;
    root.innerHTML = `
      <div class="grid g4" style="margin-bottom:18px">
        <div class="card"><div class="kpi"><span>Leads (7 dias)</span><b>${week}</b></div></div>
        <div class="card"><div class="kpi"><span>Consultas agendadas</span><b>${booked}</b></div></div>
        <div class="card"><div class="kpi"><span>Aguardando humano</span><b>${leads.filter((l) => l.stage === 'agenda').length}</b></div></div>
        <div class="card ${late ? 'ink' : ''}"><div class="kpi"><span>SLA estourado</span><b>${late}</b></div></div>
      </div>
      <div class="kanban">${STAGES.map((s) => `
        <div class="col ${s.hitl ? 'hitl' : ''}">
          <div class="col-h"><span>${esc(s.label)}${s.hitl ? ' · humano' : ''}</span><span>${leads.filter((l) => l.stage === s.id).length}</span></div>
          ${leads.filter((l) => l.stage === s.id).map(card).join('') || '<span class="tiny" style="padding:4px">—</span>'}
        </div>`).join('')}</div>
      <details class="card solid" style="margin-top:18px">
        <summary style="cursor:pointer;font-weight:600">＋ Novo lead do WhatsApp</summary>
        <form id="new-lead" class="grid g3" style="margin-top:16px">
          <div class="field"><label>Nome</label><input class="input" name="name" required></div>
          <div class="field"><label>WhatsApp (DDI+DDD)</label><input class="input" name="phone" inputmode="tel" placeholder="5521999999999" required></div>
          <div class="field"><label>Interesse</label><select class="input" name="interest">${PROCEDURES.map((p) => `<option>${esc(p.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Origem</label><select class="input" name="origin"><option>Meta C1 · Criativo 1</option><option>Meta C1 · Criativo 2</option><option>Meta C1 · Criativo 3</option><option>ManyChat</option><option>Orgânico</option><option>Indicação</option><option>Google Ads</option></select></div>
          <div class="field" style="grid-column:span 2"><label>Observação</label><input class="input" name="note"></div>
          <div><button class="btn primary">Adicionar lead</button> <button type="button" class="btn ghost" id="reset">Restaurar demo</button></div>
        </form>
      </details>`;
  };

  root.addEventListener('click', (e) => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    const l = leads.find((x) => x.id === id);
    if (e.target.dataset.mv && l) {
      const i = STAGES.findIndex((s) => s.id === l.stage) + Number(e.target.dataset.mv);
      const next = STAGES[i];
      if (!next) return;
      // Passar de "agenda" para "agendado" exige confirmação humana do pagamento.
      if (l.stage === 'agenda' && next.id === 'agendado') return hitl(l);
      l.stage = next.id; save(); draw();
      if (next.hitl) { toast('Etapa sensível: a IA pausa e um humano assume'); hitl(l); }
    }
    if (e.target.hasAttribute('data-hitl') && l) hitl(l);
    if (e.target.id === 'reset') { leads = SEED_LEADS.map((x) => ({ ...x })); save(); draw(); toast('Demo restaurada'); }
  });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    leads.unshift({ id: 'l' + Date.now(), ...f, phone: f.phone.replace(/\D/g, ''), stage: 'novo', createdAt: Date.now() });
    save(); draw(); toast('Lead adicionado · responda em até 5 min');
  });

  function hitl(l) {
    const paying = Boolean(l.hitlSentAt);
    const { el, close } = modal(`
      <span class="eyebrow">Human-in-the-Loop</span>
      <h2 class="h2" style="margin:8px 0 6px">${paying ? 'Confirmar pagamento da consulta' : 'Passar agenda e cobrar a consulta'}</h2>
      <p class="muted small" style="margin-bottom:16px">${esc(l.name)} · ${esc(l.interest)}. A automação não envia horários nem valores sozinha — esta etapa exige uma pessoa da equipe.</p>
      ${paying ? `
        <div class="hitl-box">
          <label class="check"><input type="checkbox" data-req> Conferi o comprovante / baixa do pagamento no extrato ou na maquininha</label>
          <label class="check"><input type="checkbox" data-req> O horário está bloqueado na agenda oficial do consultório</label>
        </div>
        <div class="actions" style="margin-top:16px"><button class="btn primary" id="ok" disabled>Confirmar → Consulta agendada</button></div>`
      : `
        <div class="grid" style="gap:12px">
          <div class="field"><label>Horários disponíveis (da agenda oficial)</label><textarea class="input" id="slots" placeholder="Ex.: Ter 21/10 às 15h · Qui 23/10 às 10h"></textarea></div>
          <div class="grid g2">
            <div class="field"><label>Valor da consulta</label><input class="input" id="fee" placeholder="R$ ___"></div>
            <div class="field"><label>Forma de pagamento</label><select class="input" id="pay"><option>Pix</option><option>Link de pagamento (cartão)</option><option>Na recepção, com sinal via Pix</option></select></div>
          </div>
          <div class="field"><label>Mensagem sugerida (edite antes de enviar)</label><textarea class="input" id="msg" style="min-height:150px"></textarea></div>
          <div class="hitl-box">
            <label class="check"><input type="checkbox" data-req> Conferi os horários na agenda oficial agora</label>
            <label class="check"><input type="checkbox" data-req> Conferi o valor e a forma de pagamento com a política atual</label>
            <label class="check"><input type="checkbox" data-req> A mensagem não promete resultado nem oferece desconto (Res. CFM 2.336/2023)</label>
          </div>
        </div>
        <div class="actions" style="margin-top:16px"><button class="btn primary" id="ok" disabled>Enviar pelo WhatsApp</button></div>`}`);

    const reqs = $$('[data-req]', el);
    const ok = $('#ok', el);
    const msg = $('#msg', el);
    const compose = () => {
      if (!msg) return;
      msg.value = `Olá, ${l.name.replace(' (demo)', '')}! Aqui é da equipe do ${DOCTOR.name}. 😊\n\n` +
        `Para a sua consulta de avaliação (${l.interest}), temos estes horários na ${DOCTOR.clinic}, Barra da Tijuca:\n${$('#slots', el).value || '[horários]'}\n\n` +
        `O valor da consulta é ${$('#fee', el).value || '[valor]'}, com pagamento via ${$('#pay', el).value}, para confirmar o seu horário.\n\nQual opção fica melhor para você?`;
    };
    const check = () => { ok.disabled = !reqs.every((r) => r.checked) || (msg && (!$('#slots', el).value.trim() || !$('#fee', el).value.trim())); };
    el.addEventListener('input', (e) => { if (msg && e.target !== msg) compose(); check(); });
    el.addEventListener('change', check);
    compose(); check();

    ok.addEventListener('click', () => {
      if (paying) {
        l.stage = 'agendado'; l.note = (l.note ? l.note + ' · ' : '') + `Pago e confirmado em ${today()}`;
        toast('Consulta confirmada');
      } else {
        l.hitlSentAt = Date.now();
        window.open(`https://wa.me/${l.phone}?text=${encodeURIComponent(msg.value)}`, '_blank', 'noopener');
        toast('Agenda enviada · aguardando pagamento');
      }
      save(); draw(); close();
    });
  }

  draw();
  setInterval(() => { if (!root.hidden && !root.closest('[hidden]') && document.visibilityState === 'visible' && !$('#new-lead input:focus', root)) draw(); }, 60000);
}

// ---------------- Orçamento ----------------
function budget(root) {
  const refs = store.get('erpRefs', null) || { procedures: PROCEDURES, hospitals: HOSPITALS, extras: EXTRAS };
  const sel = new Set(store.get('budgetSel', ['lipohd']));
  let chosen = store.get('budgetHospital', refs.hospitals[0].id);
  let patient = '';

  const calc = (h) => {
    const procs = refs.procedures.filter((p) => sel.has(p.id));
    if (!procs.length) return null;
    const hours = procs.reduce((a, p) => a + Number(p.hours), 0) * (procs.length > 1 ? 0.9 : 1);
    const stay = Math.max(...procs.map((p) => Number(p.stay)), hours > 4 ? 1 : 0);
    const x = refs.extras;
    const lines = [
      ['Honorários médicos (equipe cirúrgica)', procs.reduce((a, p) => a + Number(p.surgeon), 0)],
      [`Anestesia (${hours.toFixed(1)} h)`, Number(x.anesthesiaBase) + hours * Number(x.anesthesiaPerHour)],
      [`Hospital · sala cirúrgica (${hours.toFixed(1)} h)`, hours * Number(h.room)],
      [`Hospital · diárias (${stay})`, stay * Number(h.daily)],
      ['Hospital · taxas e materiais', Number(h.fees) + procs.reduce((a, p) => a + Number(p.materials), 0)],
      ['Implantes', procs.reduce((a, p) => a + Number(p.implant || 0), 0)],
      ['Exames pré-operatórios', Number(x.labExams)],
      ['Malha/cinta + drenagens', Number(x.garment) + Number(x.drainage)],
    ].filter((l) => l[1] > 0);
    return { procs, hours, stay, lines, total: lines.reduce((a, l) => a + l[1], 0) };
  };

  const draw = () => {
    const results = refs.hospitals.map((h) => ({ h, r: calc(h) }));
    const min = Math.min(...results.map((x) => x.r?.total ?? Infinity));
    const pick = results.find((x) => x.h.id === chosen) || results[0];
    root.innerHTML = `
      <div class="grid g2" style="align-items:start">
        <div class="card solid">
          <span class="label">1 · Procedimentos</span>
          <div class="grid" style="gap:10px;margin:12px 0 20px">${refs.procedures.map((p) => `<label class="check"><input type="checkbox" data-proc="${p.id}" ${sel.has(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('')}</div>
          <div class="field"><label>Paciente (opcional · não é salvo)</label><input class="input" id="pt" value="${esc(patient)}"></div>
        </div>
        <div class="card solid">
          <span class="label">2 · Cotação por hospital</span>
          <div class="table-wrap" style="margin-top:8px"><table class="t">
            <thead><tr><th></th><th>Hospital</th><th class="num">Total estimado</th></tr></thead>
            <tbody>${results.map(({ h, r }) => `<tr class="${r && r.total === min ? 'best' : ''}">
              <td><input type="radio" name="hosp" value="${h.id}" ${h.id === pick.h.id ? 'checked' : ''} aria-label="${esc(h.name)}"></td>
              <td>${esc(h.name)}<br><span class="tiny">${esc(h.area)}</span></td>
              <td class="num">${r ? brl(r.total) : '—'}</td></tr>`).join('')}</tbody></table></div>
          <p class="tiny" style="margin-top:10px">Valores de referência para simulação — confirme a cotação oficial do hospital e da equipe de anestesia antes de enviar ao paciente.</p>
        </div>
      </div>
      <div class="actions" style="margin:20px 0 14px"><button class="btn primary" id="print-budget" ${pick.r ? '' : 'disabled'}>Imprimir / PDF timbrado</button></div>
      <div class="doc-preview" id="budget-doc">${pick.r ? letter({
        title: 'Orçamento Cirúrgico', patient, date: today(), procedure: pick.r.procs.map((p) => p.name).join(' + '),
        body: `<p class="small" style="margin-bottom:10px">Local: <b>${esc(pick.h.name)}</b> (${esc(pick.h.area)}) · Tempo cirúrgico estimado ${pick.r.hours.toFixed(1)} h · ${pick.r.stay} diária(s).</p>
          <table class="t"><tbody>${pick.r.lines.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${brl(v)}</td></tr>`).join('')}
          <tr><td><b>Total estimado</b></td><td class="num"><b>${brl(pick.r.total)}</b></td></tr></tbody></table>
          <p class="small muted" style="margin-top:18px" contenteditable="true">Orçamento válido por 30 dias. Valores hospitalares sujeitos à confirmação do hospital na data do agendamento. Não inclui eventuais intercorrências, exames adicionais ou prolongamento de internação. A indicação cirúrgica foi definida em consulta, considerando as características individuais do(a) paciente.</p>`,
      }) : '<p class="muted" style="padding:30px">Selecione ao menos um procedimento.</p>'}</div>
      <details class="card" style="margin-top:20px">
        <summary style="cursor:pointer;font-weight:600">Editar valores de referência (hospitais, honorários, anestesia)</summary>
        <div class="table-wrap" style="margin-top:14px"><table class="t"><thead><tr><th>Hospital</th><th class="num">Hora sala</th><th class="num">Diária</th><th class="num">Taxas</th></tr></thead>
          <tbody>${refs.hospitals.map((h, i) => `<tr><td>${esc(h.name)}</td>${['room', 'daily', 'fees'].map((k) => `<td><input class="input" type="number" data-ref="hospitals:${i}:${k}" value="${h[k]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="table-wrap" style="margin-top:14px"><table class="t"><thead><tr><th>Procedimento</th><th class="num">Horas</th><th class="num">Diárias</th><th class="num">Honorários</th><th class="num">Materiais</th><th class="num">Implante</th></tr></thead>
          <tbody>${refs.procedures.map((p, i) => `<tr><td>${esc(p.name)}</td>${['hours', 'stay', 'surgeon', 'materials', 'implant'].map((k) => `<td><input class="input" type="number" step="0.5" data-ref="procedures:${i}:${k}" value="${p[k] ?? 0}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="grid g4" style="margin-top:14px">${Object.entries({ anesthesiaBase: 'Anestesia base', anesthesiaPerHour: 'Anestesia / hora', garment: 'Malha/cinta', drainage: 'Drenagens', labExams: 'Exames' }).map(([k, n]) => `<div class="field"><label>${n}</label><input class="input" type="number" data-ref="extras::${k}" value="${refs.extras[k]}"></div>`).join('')}</div>
        <div class="actions" style="margin-top:14px"><button class="btn ghost" id="reset-refs">Restaurar valores padrão</button></div>
      </details>`;
  };

  root.addEventListener('change', (e) => {
    const p = e.target.dataset.proc;
    if (p) { e.target.checked ? sel.add(p) : sel.delete(p); store.set('budgetSel', [...sel]); draw(); }
    if (e.target.name === 'hosp') { chosen = e.target.value; store.set('budgetHospital', chosen); draw(); }
    const ref = e.target.dataset.ref;
    if (ref) {
      const [group, i, k] = ref.split(':');
      if (group === 'extras') refs.extras[k] = Number(e.target.value);
      else refs[group][Number(i)][k] = Number(e.target.value);
      store.set('erpRefs', refs); draw();
    }
  });
  root.addEventListener('input', (e) => { if (e.target.id === 'pt') { patient = e.target.value; const n = $('#budget-doc .meta [contenteditable]', root); if (n) n.textContent = patient || '________________________'; } });
  root.addEventListener('click', (e) => {
    if (e.target.id === 'print-budget') printLetter($('#budget-doc', root));
    if (e.target.id === 'reset-refs') { store.set('erpRefs', null); location.reload(); }
  });
  draw();
}

// ---------------- Documentos ----------------
function docs(root) {
  let type = 'preop';
  root.innerHTML = `
    <div class="card solid" style="margin-bottom:18px">
      <div class="grid g4" style="align-items:end">
        <div class="field"><label>Documento</label><select class="input" id="dtype"><option value="preop">Orientações pré-operatórias</option><option value="postop">Orientações pós-operatórias</option><option value="rx">Receituário (modelo)</option></select></div>
        <div class="field"><label>Paciente</label><input class="input" id="dpt" placeholder="Nome completo"></div>
        <div class="field"><label>Procedimento</label><select class="input" id="dproc"><option value="">—</option>${PROCEDURES.map((p) => `<option>${esc(p.name)}</option>`).join('')}</select></div>
        <div><button class="btn primary" id="dprint">Gerar PDF timbrado</button></div>
      </div>
      <p class="tiny" style="margin-top:12px">Todos os itens são editáveis direto no documento (toque para editar). O receituário é um modelo: posologia e indicação são definidas e conferidas pelo médico antes de assinar.</p>
    </div>
    <div class="doc-preview" id="doc-out"></div>`;

  const draw = () => {
    const d = DOCS[type];
    $('#doc-out', root).innerHTML = letter({
      title: d.title, patient: $('#dpt', root).value, date: today(), procedure: $('#dproc', root).value,
      body: `<ol contenteditable="true">${d.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>
        ${type === 'rx' ? '<p class="tiny" style="margin-top:20px">Modelo editável. Prescrição sujeita à avaliação e assinatura do médico assistente.</p>' : '<p class="small muted" style="margin-top:20px" contenteditable="true">Em caso de dúvida ou qualquer sinal de alerta, entre em contato imediatamente com a equipe pelo WhatsApp.</p>'}`,
    });
  };
  root.addEventListener('change', (e) => { if (e.target.id === 'dtype') type = e.target.value; if (['dtype', 'dproc'].includes(e.target.id)) draw(); });
  root.addEventListener('input', (e) => { if (e.target.id === 'dpt') { const n = $('#doc-out .meta [contenteditable]', root); if (n) n.textContent = e.target.value || '________________________'; } });
  root.addEventListener('click', (e) => { if (e.target.id === 'dprint') printLetter($('#doc-out', root)); });
  draw();
}
