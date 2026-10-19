// Acervo Oficial (@drleonardovaladao) — 17 publicações reais e públicas do próprio
// perfil do Dr. Leonardo, informadas por ele para uso no plano de tráfego.
//
// IMPORTANTE (sigilo + conformidade):
//  * Só guardamos o SHORTCODE público de cada post. Nada de mídia é baixado ou
//    copiado aqui — o conteúdo é exibido pelo EMBED OFICIAL do Instagram
//    (iframe /embed/captioned/), exatamente como o próprio Instagram permite
//    incorporar posts públicos em outros sites.
//  * Não afirmamos aqui o tema/procedimento de cada post (isso seria suposição):
//    a legenda e o vídeo reais aparecem ao vivo no embed. A camada de estratégia
//    (campanha, semana, nota) é preenchida/ajustada pelo Dr. na reunião e fica
//    salva no navegador (localStorage), nunca no servidor.
//
// `suggest` é apenas um ponto de partida editável:
//   c2 → Reels na Campanha 02 (Crescimento 20K, R$ 15/dia, "Usar publicação existente").
//   c1 → Carrosséis educativos na Campanha 01 (Conversão WhatsApp, R$ 35/dia).

export const ACERVO = [
  // ——— 9 Reels (vídeos com a voz do Dr. Leonardo) ———
  { n: 1, kind: 'reel', code: 'DJIEcqzuqEh', suggest: 'c2' },
  { n: 2, kind: 'reel', code: 'DIPVSUSOrOu', suggest: 'c2' },
  { n: 3, kind: 'reel', code: 'DHLwr3Auutm', suggest: 'c2' },
  { n: 4, kind: 'reel', code: 'DFbNn80Sth2', suggest: 'c2' },
  { n: 5, kind: 'reel', code: 'DEDtDN-SK7U', suggest: 'c2' },
  { n: 6, kind: 'reel', code: 'DDxyqfOOn5V', suggest: 'c2' },
  { n: 7, kind: 'reel', code: 'C_TJADvuRq7', suggest: 'c2' },
  { n: 8, kind: 'reel', code: 'C7ZPIM5uWpL', suggest: 'c2' },
  { n: 9, kind: 'reel', code: 'Cy1lHq9OyXa', suggest: 'c2' },
  // ——— 8 Posts / Carrosséis educativos ———
  { n: 10, kind: 'post', code: 'DITxtf2uY9Y', suggest: 'c1' },
  { n: 11, kind: 'post', code: 'DF_OeohSTcF', suggest: 'c1' },
  { n: 12, kind: 'post', code: 'DC9lB8guEyn', suggest: 'c1' },
  { n: 13, kind: 'post', code: 'DCC8DVLyNL8', suggest: 'c1' },
  { n: 14, kind: 'post', code: 'C85dLqquOK_', suggest: 'c1' },
  { n: 15, kind: 'post', code: 'C8IfIqAuDYT', suggest: 'c1' },
  { n: 16, kind: 'post', code: 'C7h79uwOgDA', suggest: 'c1' },
  { n: 17, kind: 'post', code: 'C698oEsOszE', suggest: 'c1' },
];

// URL canônica do post (abre no Instagram, em nova aba).
export const acervoUrl = (it) =>
  `https://www.instagram.com/${it.kind === 'reel' ? 'reel' : 'p'}/${it.code}/`;

// Embed OFICIAL com legenda (iframe sancionado pelo Instagram para posts públicos).
export const acervoEmbed = (it) =>
  `https://www.instagram.com/${it.kind === 'reel' ? 'reel' : 'p'}/${it.code}/embed/captioned/`;
