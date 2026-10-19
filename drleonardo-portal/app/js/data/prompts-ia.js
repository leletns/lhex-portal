// Banco de prompts de imagem IA — padrão editorial / quiet luxury (referência @dr.joaopedroestima).
// Estes prompts geram as FOTOS-BASE hiper-realistas dos posts e carrosséis educativos.
// Rode-os no seu gerador (Midjourney, DALL·E, etc.), baixe a imagem e solte em
// app/assets/photos/ — o corte editorial full-bleed e as tarjas do portal entram por cima.
//
// Regra de qualidade (inegociável): nada de aspecto plástico, avatar brilhante ou "cara de IA".
// As imagens devem parecer fotografia profissional de editorial médico.

export const IA_NEGATIVE =
  'plastic skin, CGI, 3d render, airbrushed, waxy, glossy avatar, over-smoothed, deformed, extra limbs, watermark, text artifacts';

export const IA_PROMPTS = [
  {
    id: 'abdomen',
    title: 'Textura de pele & contorno abdominal',
    use: 'Abdominoplastia · Diástase · Lipedefinition',
    visual: 'Close-up macro oblíquo do abdome com pele de textura natural (poros, penugem), lingerie nude canelada, luz lateral suave e sombras elegantes.',
    prompt: 'Macro fashion editorial photography of a realistic human abdomen, natural skin texture with visible pores and fine hairs, matte skin finish, wearing minimalist nude ribbed athletic wear. Soft cinematic side lighting, warm golden hour tones, luxury medical aesthetic, shot on 85mm lens, f/1.8, photorealistic, zero CGI look, 8k resolution --ar 4:5 --style raw',
  },
  {
    id: 'lipo-hd-masc',
    title: 'Lipo HD masculina (tórax)',
    use: 'Lipedefinition masculina · Ginecomastia',
    visual: 'Tronco masculino com definição atlética natural, pele real com imperfeições, iluminação dramática de estúdio (claro-escuro).',
    prompt: 'Editorial fitness photography of a realistic male athletic torso, natural skin texture, definition of linea alba and pectoral muscles without exaggeration. Neutral background, dramatic chiaroscuro lighting, high-end medical journal aesthetic, photorealistic, 85mm lens, highly detailed skin pores, no plastic CGI look --ar 4:5 --style raw',
  },
  {
    id: 'mama-anatomia',
    title: 'Cirurgia mamária & anatomia',
    use: 'Cirurgia Mamária · Mastopexia · Prótese',
    visual: 'Close de busto com top canelado preto de alta costura e linhas pontilhadas brancas discretas de marcação cirúrgica (planejamento anatômico).',
    prompt: 'Professional medical editorial photo of a realistic female chest wearing a premium black ribbed bralette. Subtle dashed white surgical planning lines overlaid with a clean technical aesthetic. Soft studio lighting, neutral minimalist background, quiet luxury vibe, photorealistic skin texture, highly detailed, 8k --ar 4:5 --style raw',
  },
  {
    id: 'proteses',
    title: 'Próteses de silicone (natureza morta)',
    use: 'Cirurgia Mamária · Tipos de prótese (infográfico de balões)',
    visual: 'Mão enluvada segurando implantes de silicone de perfis variados sobre fundo off-white, com balões de texto flutuantes minimalistas (Coesivo? Gel macio? Em forma de gota?).',
    prompt: 'Still life medical luxury photography, a gloved medical hand holding translucent silicone breast implants of different profiles against a clean off-white seamless background. Soft diffused lighting, minimalist composition with space for floating infographic labels, high-end aesthetic, photorealistic, sharp focus, 8k resolution --ar 4:5 --style raw',
  },
  {
    id: 'gluteos',
    title: 'Glúteos & contorno corporal',
    use: 'Lipedefinition · Lipoescultura · Enxerto de gordura',
    visual: 'Vista lateral/posterior de silhueta feminina em legging de compressão cinza-claro, luz natural de janela, fundo arquitetônico minimalista.',
    prompt: 'Minimalist lifestyle editorial photography of a realistic female silhouette from behind wearing high-end light gray seamless compression leggings. Bright natural window light, soft shadows, clean architectural background, luxury wellness and plastic surgery aesthetic, photorealistic, 85mm lens --ar 4:5 --style raw',
  },
];
