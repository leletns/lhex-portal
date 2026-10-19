// ERP cirúrgico — dados demonstrativos. TODOS os valores são referências editáveis na tela
// (salvos apenas no navegador) e devem ser confirmados com a cotação oficial de cada hospital.

export const PROCEDURES = [
  { id: 'lipohd', name: 'Lipedefinition (Lipo HD)', hours: 4, stay: 1, surgeon: 22000, materials: 1800 },
  { id: 'lipo', name: 'Lipoaspiração / Lipoescultura', hours: 3, stay: 1, surgeon: 16000, materials: 1500 },
  { id: 'abdomino', name: 'Abdominoplastia', hours: 3.5, stay: 1, surgeon: 18000, materials: 1500 },
  { id: 'lipoabdomino', name: 'LipoAbdominoplastia HD', hours: 5, stay: 2, surgeon: 28000, materials: 2200 },
  { id: 'Lipedema', name: 'Cirurgia de Lipedema (poupadora linfática)', hours: 4, stay: 1, surgeon: 24000, materials: 2000 },
  { id: 'protese', name: 'Mamoplastia de aumento (prótese)', hours: 2, stay: 1, surgeon: 14000, materials: 600, implant: 6500 },
  { id: 'mastopexia', name: 'Mastopexia', hours: 3, stay: 1, surgeon: 16000, materials: 800 },
  { id: 'mastoprotese', name: 'Mastopexia com prótese', hours: 3.5, stay: 1, surgeon: 20000, materials: 800, implant: 6500 },
  { id: 'gluteo', name: 'Enxerto de gordura glútea', hours: 1.5, stay: 0, surgeon: 8000, materials: 600 },
  { id: 'gineco', name: 'Ginecomastia', hours: 2, stay: 0, surgeon: 12000, materials: 600 },
];

// Hora de sala, diária e taxas — valores ilustrativos para simulação.
export const HOSPITALS = [
  { id: 'barrador', name: "Hospital Barra D'Or", area: 'Barra da Tijuca', room: 2400, daily: 3200, fees: 1800 },
  { id: 'copastar', name: 'Hospital Copa Star', area: 'Copacabana', room: 3200, daily: 4500, fees: 2400 },
  { id: 'samaritanobarra', name: 'Hospital Samaritano Barra', area: 'Barra da Tijuca', room: 2600, daily: 3400, fees: 2000 },
  { id: 'saojose', name: 'Casa de Saúde São José', area: 'Humaitá', room: 2500, daily: 3300, fees: 1900 },
  { id: 'chn', name: 'Complexo Hospitalar de Niterói', area: 'Niterói', room: 2000, daily: 2700, fees: 1500 },
];

export const EXTRAS = { anesthesiaPerHour: 1300, anesthesiaBase: 1500, garment: 650, drainage: 1200, labExams: 900 };

export const STAGES = [
  { id: 'novo', label: 'Novo lead' },
  { id: 'conversa', label: 'Em conversa' },
  { id: 'qualificado', label: 'Qualificado' },
  { id: 'agenda', label: 'Agenda + pagamento', hitl: true },
  { id: 'agendado', label: 'Consulta agendada' },
  { id: 'fechado', label: 'Cirurgia fechada' },
];

// Leads fictícios para demonstração (nenhum dado real de paciente).
export const SEED_LEADS = [
  { id: 'l1', name: 'Mariana (demo)', phone: '5521900000001', interest: 'Lipedema', origin: 'Meta C1 · Criativo 1', stage: 'novo', note: 'Perguntou se a consulta avalia o grau do Lipedema.', createdAt: Date.now() - 1000 * 60 * 18 },
  { id: 'l2', name: 'Rafael (demo)', phone: '5521900000002', interest: 'Lipo HD masculina', origin: 'Orgânico · Reel #11', stage: 'conversa', note: 'Treina 5×/semana, quer definição de abdome.', createdAt: Date.now() - 1000 * 60 * 60 * 3 },
  { id: 'l3', name: 'Juliana (demo)', phone: '5521900000003', interest: 'Abdominoplastia', origin: 'ManyChat · DIASTASE', stage: 'qualificado', note: 'Pós-gestação há 2 anos, autoteste positivo.', createdAt: Date.now() - 1000 * 60 * 60 * 26 },
  { id: 'l4', name: 'Patrícia (demo)', phone: '5521900000004', interest: 'Mastopexia com prótese', origin: 'Indicação', stage: 'agenda', note: 'Prefere sábado pela manhã.', createdAt: Date.now() - 1000 * 60 * 60 * 30 },
  { id: 'l5', name: 'Camila (demo)', phone: '5521900000005', interest: 'Lipedefinition', origin: 'Meta C1 · Criativo 2', stage: 'agendado', note: 'Consulta 23/10 às 10h.', createdAt: Date.now() - 1000 * 60 * 60 * 72 },
];

export const DOCS = {
  preop: {
    title: 'Orientações Pré-Operatórias',
    items: [
      'Suspender o tabagismo (cigarro, vape, narguilé) pelo menos 30 dias antes e 30 dias após a cirurgia.',
      'Suspender anticoncepcional hormonal e reposição hormonal conforme orientação médica individual (em geral, 30 dias antes).',
      'Não utilizar AAS, anti-inflamatórios, vitamina E, ginkgo biloba, ômega-3 ou chás emagrecedores nos 15 dias que antecedem a cirurgia, salvo orientação contrária.',
      'Realizar todos os exames solicitados e a avaliação de risco cirúrgico; trazer os resultados na consulta pré-operatória.',
      'Jejum absoluto (inclusive água) de 8 horas antes do horário da cirurgia, ou conforme orientação do anestesista.',
      'Banho com sabonete neutro na noite anterior e na manhã da cirurgia. Não aplicar cremes, óleos ou maquiagem.',
      'Retirar esmalte em gel, unhas postiças, joias e piercings.',
      'Levar a cinta/malha e o sutiã cirúrgico indicados no dia da internação.',
      'Organizar acompanhante adulto para as primeiras 48 horas após a alta.',
      'Informar à equipe qualquer sintoma gripal, febre ou alteração de saúde na semana da cirurgia.',
    ],
  },
  postop: {
    title: 'Orientações Pós-Operatórias',
    items: [
      'Caminhar em casa desde o primeiro dia, várias vezes ao dia, e movimentar os pés quando estiver deitada(o) — prevenção de trombose.',
      'Usar a cinta/malha compressiva 24 horas por dia, retirando apenas para o banho, pelo período orientado.',
      'Manter os curativos limpos e secos. Banho liberado conforme orientação na alta.',
      'Hidratação: no mínimo 2 litros de água por dia. Alimentação leve, rica em proteínas, sem excesso de sal.',
      'Não dirigir, não carregar peso e não realizar esforço físico até liberação médica.',
      'Drenagem linfática com profissional indicada pela equipe, a partir da data orientada.',
      'Proteger as cicatrizes do sol por, no mínimo, 6 meses.',
      'Comparecer a todos os retornos agendados.',
      'Procurar a equipe imediatamente em caso de: febre acima de 38 °C, falta de ar, dor no peito, dor ou inchaço assimétrico em uma das pernas, sangramento ativo ou secreção com odor.',
    ],
  },
  // Modelo editável — a prescrição final é responsabilidade exclusiva do médico assistente.
  rx: {
    title: 'Receituário',
    items: [
      'Uso oral — Dipirona 1 g: 1 comprimido de 6/6 horas se dor ou febre.',
      'Uso oral — Paracetamol 750 mg: 1 comprimido de 8/8 horas se dor persistente (intercalar com dipirona).',
      'Uso oral — Ondansetrona 8 mg: 1 comprimido de 8/8 horas se náusea.',
      'Uso oral — Cefalexina 500 mg: 1 comprimido de 6/6 horas por __ dias (conforme indicação).',
      'Uso subcutâneo — Profilaxia de TEV: medicação e dose conforme estratificação de risco individual (Caprini).',
    ],
  },
};
