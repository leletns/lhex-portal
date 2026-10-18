// Cronograma de 12 semanas: Reel na terça (roteiro N) + Carrossel de 5 slides na quinta (caso N).
import { CALENDAR_START, SIGNATURE, DOCTOR } from '../config.js';
import { SCRIPTS } from './scripts.js';
import { CASES } from './cases.js';
import { kwLabel } from '../lib/art.js';

// [roteiro, caso] por semana — temas da terça e da quinta conversam entre si.
const PAIRING = [[1, 11], [2, 5], [3, 6], [4, 1], [5, 7], [6, 12], [7, 3], [8, 4], [9, 9], [10, 10], [11, 8], [12, 2]];

const HASHTAGS = {
  'Lipedema': '#lipedema #lipedemabrasil #lipedemarj #cirurgiaplastica #barradatijuca #saudedamulher',
  'Lipedefinition': '#lipohd #lipedefinition #lipoaspiracao #contornocorporal #cirurgiaplasticarj #barradatijuca',
  'Diástase / Abdominoplastia': '#abdominoplastia #diastase #posgestacao #cirurgiaplastica #cirurgiaplasticarj #barradatijuca',
  'Segurança Cirúrgica': '#segurancadopaciente #cirurgiaplastica #cirurgiaosegura #sbcp #cirurgiaplasticarj #barradatijuca',
  'Cirurgia Mamária': '#mastopexia #protesedesilicone #mamoplastia #cirurgiaplastica #cirurgiaplasticarj #barradatijuca',
};

const QUIZ = {
  'Lipedema': { q: 'Lipedema é causado por…', opts: ['Falta de dieta', 'Doença do tecido gorduroso ✓', 'Retenção de líquido'] },
  'Lipedefinition': { q: 'Lipo HD de resultado natural depende de…', opts: ['Sulcos bem marcados', 'Respeitar a anatomia ✓', 'Tirar o máximo de gordura'] },
  'Diástase / Abdominoplastia': { q: 'Diástase se resolve com abdominal?', opts: ['Sempre', 'Nem sempre ✓', 'Nunca precisa tratar'] },
  'Segurança Cirúrgica': { q: 'Onde conferir se o cirurgião é especialista?', opts: ['Instagram', 'Site do CFM ✓', 'Google Avaliações'] },
  'Cirurgia Mamária': { q: 'Prótese corrige mama caída?', opts: ['Sim, sempre', 'Não sozinha ✓', 'Só a maior'] },
};

const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d; };
const fmt = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');

function reelCaption(s) {
  return [
    s.hook, '',
    s.body.slice(0, 3).join(' '), '',
    `💬 ${s.cta}`, '',
    'Salve para consultar depois e envie para quem precisa ouvir isso.', '',
    SIGNATURE, '',
    HASHTAGS[s.pillar],
  ].join('\n');
}

function carouselCaption(c) {
  return [
    c.hook, '',
    c.explain, '',
    'O que foi planejado neste caso educativo:',
    ...c.procedures.map((p) => `• ${p}`), '',
    `💬 Comente ${kwLabel(c.keyword)} que eu te envio o material completo no direct.`,
    `Para avaliação individual, o link do WhatsApp está na bio.`, '',
    SIGNATURE, '',
    HASHTAGS[c.pillar],
  ].join('\n');
}

function reelStories(s) {
  return [
    { time: '09h', type: 'Bastidor + enquete', text: `Bastidor do consultório. Texto: "Hoje sai vídeo novo sobre ${s.pillar.toLowerCase()}." Enquete: "Você já ouviu falar disso?" Sim / Quero entender`, sticker: 'Enquete' },
    { time: '12h', type: 'Repost do Reel', text: `Compartilhar o Reel "${s.title}" com o texto: "${s.tarja}" + sticker de seta apontando para o vídeo.`, sticker: 'Menção ao Reel' },
    { time: '17h', type: 'Caixinha de perguntas', text: `Fundo pedra liso. "Me pergunte qualquer coisa sobre ${s.pillar.toLowerCase()}. Respondo amanhã."`, sticker: 'Caixinha' },
    { time: '20h', type: 'CTA ManyChat', text: `Selfie ou print do Reel: "Quem comentou ${kwLabel(s.keyword)} já recebeu o material no direct. Ainda não comentou? Corre lá."`, sticker: 'Link para o Reel' },
  ];
}

function carouselStories(c) {
  const quiz = QUIZ[c.pillar];
  return [
    { time: '08h', type: 'Bastidor de autoridade', text: 'Vídeo curto chegando ao hospital ou no centro cirúrgico (sem pacientes visíveis). Texto: "Dia de centro cirúrgico. Segurança começa muito antes da cirurgia."', sticker: 'Localização' },
    { time: '12h', type: 'Quiz', text: `${quiz.q} — opções: ${quiz.opts.join(' / ')}`, sticker: 'Quiz' },
    { time: '16h', type: 'Repost do carrossel', text: `Compartilhar o carrossel "${c.short}" com o texto: "Arrasta até o final: o slide 4 explica para quem é indicado."`, sticker: 'Menção ao post' },
    { time: '19h', type: 'Convite à consulta', text: `Fundo marfim, foto do Dr. Leonardo. "Quer entender se esse caminho faz sentido para você? Agende sua avaliação."`, sticker: `Link WhatsApp wa.me/${c.pillar === 'Lipedema' ? DOCTOR.whatsappLipedema : DOCTOR.whatsappCirurgia}` },
  ];
}

export const POSTS = PAIRING.flatMap(([sid, cid], w) => {
  const s = SCRIPTS.find((x) => x.id === sid);
  const c = CASES.find((x) => x.id === cid);
  const tue = addDays(CALENDAR_START, w * 7);
  const thu = addDays(CALENDAR_START, w * 7 + 2);
  return [
    { key: `w${w + 1}-reel`, week: w + 1, kind: 'reel', date: tue, dateLabel: fmt(tue), title: s.title, pillar: s.pillar, script: s, caption: reelCaption(s), stories: reelStories(s) },
    { key: `w${w + 1}-carrossel`, week: w + 1, kind: 'carousel', date: thu, dateLabel: fmt(thu), title: c.short, pillar: c.pillar, caseData: c, caption: carouselCaption(c), stories: carouselStories(c) },
  ];
});
