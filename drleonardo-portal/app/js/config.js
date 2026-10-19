// Fonte única de verdade para dados institucionais.
// Alterar aqui propaga para todas as artes, legendas, documentos e anúncios.

export const DOCTOR = {
  name: 'Dr. Leonardo Valadão',
  title: 'Cirurgião Plástico',
  handle: '@drleonardovaladao',
  clinicHandle: '@blueclinica',
  crm: 'CRM-RJ 52991821',
  rqe: 'RQE 46956',
  clinic: 'Blue Clínica',
  address: 'Av. José Silva de Azevedo Neto, 200 · Bloco 7 · Sl 107/108 · Barra da Tijuca · Rio de Janeiro – RJ · 22775-056',
  city: 'Barra da Tijuca · Rio de Janeiro',
  whatsappCirurgia: '5521995971005',
  whatsappLipedema: '5521971101000',
  instagram: 'https://www.instagram.com/drleonardovaladao/',
  site: 'https://drleonardovaladao.vercel.app',
};

export const CFM_FOOTER =
  `${DOCTOR.name} • ${DOCTOR.title} • ${DOCTOR.crm} | ${DOCTOR.rqe} • ` +
  'Imagens de caráter estritamente educativo (Res. CFM 2.336/2023). ' +
  'Resultados variam conforme o biotipo de cada paciente.';

export const SIGNATURE =
  `—\n${DOCTOR.name} · ${DOCTOR.title}\n${DOCTOR.crm} | ${DOCTOR.rqe}\n${DOCTOR.city}\n` +
  'Conteúdo educativo (Res. CFM 2.336/2023). Resultados variam conforme o biotipo de cada paciente. ' +
  'A indicação cirúrgica é individual e definida em consulta.';

// Paleta extraída de drleonardovaladao.vercel.app
export const PALETTE = {
  pedra: '#B7AFA2',
  pedraEscura: '#A9A194',
  linho: '#DCD8D2',
  linhoClaro: '#E9E6E1',
  marfim: '#F4F3F0',
  tinta: '#2A2925',
  tintaSuave: '#5B5850',
};

// Calendário editorial: Semana 1 começa na terça 20/10/2026.
export const CALENDAR_START = '2026-10-20';
export const GOAL = { followersNow: 9000, followersTarget: 20000, deadline: '2026-12-31', consultsNow: 2, consultsTarget: 4 };
export const ADS = { monthly: 1500, daily: 50, c1Daily: 35, c2Daily: 15 };
