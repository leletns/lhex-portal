// Exportação PNG em resolução real (1080x1350 / 1080x1920) via html2canvas.
// O quadro é clonado sem escala para um palco fora da tela, garantindo pixels nativos.
import { toast } from './util.js';

async function ensureLib() {
  if (window.html2canvas) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = resolve; s.onerror = () => reject(new Error('Falha ao carregar html2canvas'));
    document.head.appendChild(s);
  });
}

export async function exportFrame(frame, filename) {
  try {
    await ensureLib();
    await document.fonts.ready;
    const w = frame.offsetWidth, h = frame.offsetHeight;
    const stage = document.getElementById('export-stage');
    const clone = frame.cloneNode(true);
    clone.style.transform = 'none';
    clone.classList.add('is-export'); // compensa o deslocamento de baseline do html2canvas
    stage.appendChild(clone);
    const canvas = await window.html2canvas(clone, { width: w, height: h, scale: 1, backgroundColor: null, useCORS: true, logging: false });
    clone.remove();
    await new Promise((resolve) => canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename.endsWith('.png') ? filename : filename + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve();
    }, 'image/png'));
    toast(`PNG ${w}×${h} baixado`);
  } catch (err) {
    console.error(err);
    toast('Não foi possível gerar o PNG — verifique a conexão');
  }
}

export async function exportAll(frames, prefix) {
  for (let i = 0; i < frames.length; i++) {
    await exportFrame(frames[i], `${prefix}-${String(i + 1).padStart(2, '0')}`);
    await new Promise((r) => setTimeout(r, 350)); // navegadores bloqueiam rajadas de download
  }
}
