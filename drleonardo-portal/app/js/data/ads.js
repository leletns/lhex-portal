// Central de tráfego — R$ 1.500/mês (R$ 50/dia), estrutura enxuta no estilo Subido:
// poucas campanhas, orçamento concentrado, criativo como principal alavanca de segmentação.
import { DOCTOR } from '../config.js';

export const CAMPAIGNS = [
  {
    id: 'c1', name: 'C1 · Consultas WhatsApp', stage: 'Fundo de funil', daily: 35,
    objective: 'Engajamento → Conversas por mensagem (WhatsApp) · alternativa: Leads no site com Pixel/CAPI',
    optimization: 'Maximizar conversas · CBO desligado (1 conjunto) · Advantage+ placements',
    audience: [
      'Local (pinos com raio de 1–2 km): Barra da Tijuca, Recreio, Jardim Oceânico, Leblon, Ipanema, Gávea, Lagoa, Jardim Botânico, Botafogo, Icaraí (Niterói)',
      'Idade 28–58 · Gênero: todos (criativo faz o filtro; homens entram via Lipo HD/ginecomastia)',
      'Público aberto (Advantage+ audience) — sem interesses de saúde (restrição Meta)',
      'Excluir: seguidores atuais + quem já enviou mensagem nos últimos 30 dias',
    ],
    rules: [
      'Não mexer nos primeiros 3 dias (fase de aprendizado)',
      'Pausar criativo com custo por conversa > R$ 45 após R$ 105 gastos (3× o diário)',
      'Escalar +20% a cada 72 h se custo por conversa < R$ 25 e agendamentos acontecendo',
      'Novo criativo a cada 14 dias para evitar fadiga (frequência > 2,5)',
    ],
    creatives: [
      {
        id: 'cr1', name: 'Criativo 1 · Lipedema — "Não é falta de esforço"', format: 'Reel 9:16 · 25–35 s (Roteiro #1 recortado)',
        visual: 'Dr. Leonardo no consultório, tarja superior "Não é gordura teimosa." Legendas grandes. Últimos 3 s: logo + CFM.',
        primary: 'Dieta, treino, drenagem… e as pernas continuam iguais?\n\nO Lipedema é uma doença do tecido gorduroso, reconhecida pela OMS, e merece uma avaliação especializada — sem julgamentos.\n\nNa consulta, o Dr. Leonardo Valadão avalia sintomas, grau e as opções de tratamento clínico e cirúrgico para o seu caso.\n\n📍 Blue Clínica · Barra da Tijuca',
        headline: 'Consulta especializada em Lipedema', description: `${DOCTOR.crm} | ${DOCTOR.rqe}`, cta: 'Enviar mensagem', destination: `wa.me/${DOCTOR.whatsappLipedema}`,
      },
      {
        id: 'cr2', name: 'Criativo 2 · Lipedefinition — "Resultado natural"', format: 'Carrossel 4:5 · 4 cards (capa + técnica + recuperação + CTA)',
        visual: 'Paleta pedra/marfim, tipografia Cormorant. Sem antes/depois em anúncio (política Meta + CFM): ilustração de zonas anatômicas.',
        primary: 'Lipo HD sem aspecto "desenhado".\n\nA Lipedefinition é o planejamento de lipoaspiração de alta definição que respeita a sua anatomia: marcação individual, transições suaves e definição na medida certa para o seu corpo.\n\nAgende sua avaliação com o Dr. Leonardo Valadão, cirurgião plástico na Barra da Tijuca.',
        headline: 'Lipedefinition · Avaliação individual', description: 'Cirurgião plástico · Barra da Tijuca', cta: 'Enviar mensagem', destination: `wa.me/${DOCTOR.whatsappCirurgia}`,
      },
      {
        id: 'cr3', name: 'Criativo 3 · Autoridade — "5 perguntas antes de operar"', format: 'Reel 9:16 · 30 s (Roteiro #4)',
        visual: 'Corredor do hospital, contagem nos dedos, texto na tela por pergunta. Encerramento com CRM/RQE em destaque.',
        primary: 'Antes de pensar em preço, faça 5 perguntas ao seu cirurgião.\n\nEspecialista com RQE? Hospital com UTI? Anestesista conversa antes? Quais exames? Quem acompanha o pós-operatório?\n\nNa Blue Clínica, cada etapa é planejada com você. Agende sua consulta.',
        headline: 'Cirurgia plástica com planejamento', description: 'Abdominoplastia · Mamas · Lipo HD', cta: 'Enviar mensagem', destination: `wa.me/${DOCTOR.whatsappCirurgia}`,
      },
    ],
  },
  {
    id: 'c2', name: 'C2 · Crescimento 20K', stage: 'Topo de funil', daily: 15,
    objective: 'Tráfego → Visitas ao perfil do Instagram',
    optimization: 'Maximizar visitas ao perfil · posicionamento: Feed + Reels do Instagram apenas',
    audience: [
      'Rio de Janeiro + Grande Niterói (raio 25 km)',
      'Mulheres e homens 24–55 · Advantage+ audience',
      'Excluir seguidores atuais',
    ],
    rules: [
      'Impulsionar somente Reels com taxa de retenção 3 s > 35% no orgânico',
      'Trocar o Reel distribuído a cada 7–10 dias',
      'Meta: custo por visita ao perfil ≤ R$ 0,25 e taxa visita→seguidor ≥ 12%',
    ],
    reels: [1, 5, 9, 2, 6],
  },
];

export const ADS_COMPLIANCE = [
  'Sem antes/depois em anúncios pagos — antes/depois só no feed orgânico, educativo e com rodapé CFM',
  'Sem preço, desconto, parcelamento ou "promoção" (Res. CFM 2.336/2023)',
  'Sem perguntas que afirmem atributos pessoais ("Você tem Lipedema?") — política de anúncios da Meta',
  'Sem superlativos ("o melhor", "o único") e sem promessa de resultado',
  'CRM e RQE visíveis em todo criativo',
];

export const GOOGLE_NEGATIVE_SCRIPT = `/**
 * Negativação automática — Dr. Leonardo Valadão (Google Ads Scripts)
 * Cole em: Google Ads → Ferramentas → Ações em massa → Scripts → (+) Novo script.
 * Agende para rodar DIARIAMENTE. Primeira execução: use "Visualizar" para conferir.
 *
 * O que faz:
 *  1. Cria (ou reutiliza) a lista compartilhada de palavras negativas abaixo.
 *  2. Garante a lista anexada a todas as campanhas de Pesquisa ativas.
 *  3. Lê os termos de pesquisa dos últimos N dias e negativa automaticamente:
 *     - termos que contêm padrões irrelevantes (grátis, SUS, curso, emprego…)
 *     - termos com cliques e gasto acima do limite e ZERO conversões.
 *  4. Envia um e-mail com o resumo do que foi negativado.
 */
var CONFIG = {
  LIST_NAME: 'DrLeonardo · Negativas automáticas',
  EMAIL: '', // ex.: 'contato@clinica.com.br' — vazio = não envia e-mail
  LOOKBACK: 'LAST_30_DAYS',
  MIN_CLICKS_NO_CONV: 6,     // termo com >= 6 cliques e 0 conversões
  MIN_COST_NO_CONV: 60,      // ...ou gasto >= R$ 60 e 0 conversões
  DRY_RUN: false,            // true = só registra no log, não aplica
  // Padrões negativados sempre que aparecerem no termo (correspondência de frase)
  BLOCKED_PATTERNS: [
    'gratis', 'grátis', 'gratuito', 'gratuita', 'sus', 'pelo sus', 'mutirão', 'mutirao',
    'curso', 'pós graduação', 'pos graduacao', 'residência', 'residencia', 'faculdade',
    'emprego', 'vaga', 'vagas', 'salário', 'salario', 'concurso', 'estágio', 'estagio',
    'barato', 'barata', 'mais barato', 'promoção', 'promocao', 'desconto', 'parcelado em',
    'caseiro', 'caseira', 'remédio para', 'remedio para', 'chá', 'cha para', 'pomada',
    'antes e depois famosas', 'deu errado', 'morte', 'morreu', 'processo', 'erro médico',
    'veterinário', 'veterinario', 'cachorro', 'gato', 'tatuagem', 'harmonização', 'botox',
    'são paulo', 'sao paulo', 'bh', 'belo horizonte', 'curitiba', 'brasília', 'brasilia',
    'turquia', 'colômbia', 'colombia', 'pdf', 'artigo', 'tcc', 'cid', 'sintomas em homens'
  ],
  // Negativas fixas de base (exatas ou de frase)
  SEED_NEGATIVES: [
    '"plano de saúde"', '"pelo plano"', '"hospital público"', '"cirurgia gratuita"',
    '"lipo de papada"', '"lipo enzimática"', '"criolipólise"', '"lipo sem corte"',
    '"massagem modeladora"', '"drenagem linfática preço"', '"curso de lipo"'
  ]
};

function main() {
  var list = getOrCreateList_(CONFIG.LIST_NAME);
  var existing = existingNegatives_(list);
  var added = [];

  CONFIG.SEED_NEGATIVES.forEach(function (kw) { addNegative_(list, kw, existing, added, 'base'); });
  attachToSearchCampaigns_(list);

  var query =
    'SELECT search_term_view.search_term, metrics.clicks, metrics.cost_micros, metrics.conversions ' +
    'FROM search_term_view WHERE segments.date DURING ' + CONFIG.LOOKBACK +
    ' AND campaign.advertising_channel_type = "SEARCH"';
  var rows = AdsApp.search(query);

  while (rows.hasNext()) {
    var row = rows.next();
    var term = String(row.searchTermView.searchTerm || '').toLowerCase().trim();
    if (!term) continue;
    var clicks = Number(row.metrics.clicks || 0);
    var cost = Number(row.metrics.costMicros || 0) / 1e6;
    var conv = Number(row.metrics.conversions || 0);

    var pattern = matchPattern_(term);
    if (pattern) {
      addNegative_(list, '"' + pattern + '"', existing, added, 'padrão: ' + pattern);
    } else if (conv === 0 && (clicks >= CONFIG.MIN_CLICKS_NO_CONV || cost >= CONFIG.MIN_COST_NO_CONV)) {
      addNegative_(list, '[' + term + ']', existing, added, clicks + ' cliques · R$ ' + cost.toFixed(2) + ' · 0 conv.');
    }
  }

  Logger.log('Negativas adicionadas: ' + added.length);
  added.forEach(function (a) { Logger.log(' + ' + a.kw + '  (' + a.reason + ')'); });
  if (CONFIG.EMAIL && added.length) {
    MailApp.sendEmail(CONFIG.EMAIL, '[Google Ads] ' + added.length + ' novas negativas — Dr. Leonardo',
      added.map(function (a) { return a.kw + ' — ' + a.reason; }).join('\\n'));
  }
}

function matchPattern_(term) {
  var padded = ' ' + term + ' ';
  for (var i = 0; i < CONFIG.BLOCKED_PATTERNS.length; i++) {
    var p = CONFIG.BLOCKED_PATTERNS[i];
    if (padded.indexOf(' ' + p + ' ') !== -1) return p;
  }
  return null;
}

function getOrCreateList_(name) {
  var it = AdsApp.negativeKeywordLists().withCondition("shared_set.name = '" + name + "'").get();
  if (it.hasNext()) return it.next();
  return AdsApp.newNegativeKeywordListBuilder().withName(name).build().getResult();
}

function existingNegatives_(list) {
  var set = {};
  var it = list.negativeKeywords().get();
  while (it.hasNext()) set[it.next().getText().toLowerCase()] = true;
  return set;
}

function addNegative_(list, kw, existing, added, reason) {
  var key = kw.toLowerCase();
  if (existing[key]) return;
  existing[key] = true;
  added.push({ kw: kw, reason: reason });
  if (!CONFIG.DRY_RUN) list.addNegativeKeyword(kw);
}

function attachToSearchCampaigns_(list) {
  var campaigns = AdsApp.campaigns().withCondition("campaign.status = 'ENABLED'").get();
  while (campaigns.hasNext()) {
    var c = campaigns.next();
    var attached = false;
    var lists = c.negativeKeywordLists().get();
    while (lists.hasNext()) { if (lists.next().getName() === list.getName()) { attached = true; break; } }
    if (!attached && !CONFIG.DRY_RUN) c.addNegativeKeywordList(list);
  }
}
`;
