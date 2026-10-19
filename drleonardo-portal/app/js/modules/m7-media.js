// Módulo bônus — documentação do pipeline de mídia (auto_editor_drleonardo.py).
import { esc, copy } from '../lib/util.js';

const STEPS = [
  ['Instalar dependências', 'pip install -r requirements-media.txt   # gdown, yt-dlp, Pillow, pillow-heif, faster-whisper\n# ffmpeg: brew install ffmpeg (Mac) · sudo apt install ffmpeg (Linux)'],
  ['Baixar o acervo do Drive (anonimizado)', 'export DRIVE_ROOT_ID="<ID da pasta raiz do Drive>"\npython auto_editor_drleonardo.py drive --out media'],
  ['Baixar Reels do Instagram', 'python auto_editor_drleonardo.py instagram --cookies cookies.txt --out media'],
  ['Montar os 8 Reels com som (roteiros em reels/*.json)', 'for r in reels/*.json; do python auto_editor_drleonardo.py montage "$r"; done\n# trilha ambiente + whoosh gerados por FFmpeg (nenhum Reel mudo)'],
  ['Vídeos falados: legenda só depois de revisada', '# 1) gera o .srt para revisão (vídeos sem fala real são recusados)\npython auto_editor_drleonardo.py process --in media/instagram --out media/editados --subs\n# 2) depois de conferir o .srt, queima a legenda aprovada\npython auto_editor_drleonardo.py process --in media/instagram --out media/editados --burn-subs --overwrite'],
  ['Tudo de uma vez', 'python auto_editor_drleonardo.py all --out media'],
];

export function renderMedia(el) {
  el.innerHTML = `
  <div class="vhead">
    <div>
      <span class="eyebrow">Módulo bônus · Automação de vídeo &amp; Drive</span>
      <h1 class="h2">auto_editor_drleonardo.py</h1>
      <p class="muted">Pipeline local para baixar o acervo, anonimizar e pré-editar os vídeos verticais com corte de silêncios, legendas automáticas, tarja de gancho e rodapé CFM.</p>
    </div>
  </div>
  <div class="grid g3">
    <div class="card"><span class="tag ink">1 · Drive</span><h3 class="h3" style="margin-top:12px">Download anonimizado</h3><p class="muted small">Baixa a pasta raiz via gdown e renomeia tudo para <span class="mono">caso-NN/0001.jpg</span>. O nome do paciente nunca entra no nome do arquivo, no log ou nos metadados (EXIF removido).</p></div>
    <div class="card"><span class="tag ink">2 · Instagram</span><h3 class="h3" style="margin-top:12px">Reels do perfil</h3><p class="muted small">yt-dlp com cookies da sessão logada (o Instagram exige login). Salva em <span class="mono">media/instagram</span> para reaproveitar cortes.</p></div>
    <div class="card"><span class="tag ink">3 · Edição</span><h3 class="h3" style="margin-top:12px">Montagem dark luxury</h3><p class="muted small">Reels montados a partir de roteiro: cenas reais, tarjas de vidro escuro com desfoque do vídeo por baixo, logo, rodapé CFM e barra de progresso. Legenda automática só em vídeo falado, com validação de fala e revisão humana do .srt — B-roll nunca é legendado.</p></div>
  </div>
  <section class="section">
    <span class="eyebrow">Passo a passo</span>
    <h2 class="h2">Como rodar no seu computador</h2>
    <div class="grid" style="gap:12px">${STEPS.map(([t, c], i) => `
      <div class="card solid"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px"><b>${i + 1}. ${esc(t)}</b><button class="btn sm" data-c="${i}">Copiar</button></div><pre class="code" style="max-height:none">${esc(c)}</pre></div>`).join('')}</div>
  </section>
  <section class="section">
    <div class="card ink"><h3 class="h3">Sigilo médico</h3><p class="muted small">Os arquivos baixados ficam em <span class="mono">media/</span>, que está no .gitignore — nunca vão para o repositório nem para o deploy. O ID da pasta do Drive é lido de variável de ambiente, não fica no código. Antes de publicar qualquer foto, confira se não há rosto, tatuagem ou elemento que identifique o paciente.</p></div>
  </section>`;
  el.addEventListener('click', (e) => { const i = e.target.dataset.c; if (i != null) copy(STEPS[i][1], 'Comando copiado'); });
}
