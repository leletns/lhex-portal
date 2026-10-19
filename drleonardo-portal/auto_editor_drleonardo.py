#!/usr/bin/env python3
"""
auto_editor_drleonardo.py — Pipeline de mídia do Dr. Leonardo Valadão
=====================================================================

Baixa o acervo (Google Drive + Instagram), anonimiza os arquivos e produz Reels
com a direção de arte do portal (dark luxury):

  * montage — monta Reels de estudo de caso / bastidor / posicionamento a partir de um
    roteiro JSON: cenas de vídeo e foto (Ken Burns), transições, tarjas de vidro escuro
    com desfoque real do vídeo por baixo, logo, rodapé CFM e barra de progresso dourada
  * process — vídeos em que o Dr. Leonardo FALA: corte de silêncios + tarja de gancho.
    Legenda automática só com --subs e somente se houver fala confiável; o .srt fica para
    revisão humana e só é queimado com --burn-subs. B-roll (ruído ambiente) nunca é legendado.

SIGILO MÉDICO
-------------
* O nome do paciente NUNCA aparece no nome do arquivo, no log nem no manifesto:
  as pastas viram "caso-NN" (quando mapeadas) ou "caso-auto-NN__procedimento".
* Metadados EXIF/QuickTime são removidos (GPS, aparelho, data).
* O ID da pasta do Drive é lido da variável DRIVE_ROOT_ID ou de um JSON local
  (drive_cases.local.json) que está no .gitignore — não fica no código.
* A pasta de saída padrão (media/) também está no .gitignore.

USO
---
  pip install -r requirements-media.txt      # + ffmpeg instalado no sistema

  # 1) Drive — pasta raiz inteira (anonimizada por procedimento)
  export DRIVE_ROOT_ID="<id da pasta raiz>"
  python auto_editor_drleonardo.py drive --out media

  #    ...ou casos mapeados manualmente (copie drive_cases.example.json)
  python auto_editor_drleonardo.py drive --cases drive_cases.local.json --out media

  #    só bastidores (mídias de hospital), só vídeos, no máximo 10 arquivos
  python auto_editor_drleonardo.py drive --include bastidores --videos-only --limit 10

  # 2) Instagram — requer cookies da sessão logada (extensão "Get cookies.txt")
  python auto_editor_drleonardo.py instagram --cookies cookies.txt --limit 30

  # 3) Reels montados a partir de roteiro (veja reels/*.json)
  python auto_editor_drleonardo.py montage reels/bastidores-seguranca.json

  # 4) Vídeos falados: gera o .srt para revisão, depois queima a legenda aprovada
  python auto_editor_drleonardo.py process --in media/instagram --out media/editados --subs
  python auto_editor_drleonardo.py process --in media/instagram --out media/editados --burn-subs --overwrite

  # Tudo de uma vez
  python auto_editor_drleonardo.py all --out media --cookies cookies.txt

Rode `python auto_editor_drleonardo.py <comando> -h` para todas as opções.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from dataclasses import dataclass
from pathlib import Path

# --------------------------------------------------------------------------- #
# Identidade e conformidade
# --------------------------------------------------------------------------- #
DOCTOR = "Dr. Leonardo Valadão"
CRM = "CRM-RJ 52991821"
RQE = "RQE 46956"
CFM_FOOTER = (
    f"{DOCTOR} • Cirurgião Plástico • {CRM} | {RQE}\n"
    "Imagens de caráter estritamente educativo (Res. CFM 2.336/2023).\n"
    "Resultados variam conforme o biotipo de cada paciente."
)

# Tarjas de gancho dos 12 roteiros (Módulo 4 do portal). Usadas em rodízio
# quando nenhuma tarja específica é informada.
DEFAULT_HOOKS = [
    "Não é gordura teimosa. Pode ser lipedema.",
    "Lipo HD sem cara de \"tanquinho desenhado\".",
    "Fez de tudo e a barriga não volta? Pode ser diástase.",
    "5 perguntas que podem salvar a sua cirurgia.",
    "Fechar a boca não resolve lipedema. Entenda.",
    "Lipo tradicional ou Lipedefinition? 3 diferenças.",
    "Abdominoplastia: como é a recuperação de verdade.",
    "Trombose após cirurgia: como a gente previne.",
    "Cirurgia de lipedema não é lipo comum.",
    "Prótese, mastopexia ou as duas? Entenda.",
    "Peitoral que não define com treino? Pode ser ginecomastia.",
    "Seu cirurgião é especialista? Confira em 30s.",
]

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
VIDEO_EXT = {".mov", ".mp4", ".m4v", ".avi", ".mkv"}
W, H = 1080, 1920

# Pastas de bastidores (prefixo usado no Drive) — não são casos de pacientes.
BACKSTAGE_PREFIXES = ("AAA", "AAB")


def log(msg: str) -> None:
    print(f"[auto-editor] {msg}", flush=True)


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:60] or "item"


def require(binary: str) -> str:
    path = shutil.which(binary)
    if not path:
        sys.exit(f"Erro: '{binary}' não encontrado no PATH. Instale o ffmpeg (inclui ffprobe).")
    return path


def run(cmd: list[str], capture: bool = False) -> subprocess.CompletedProcess:
    res = subprocess.run(cmd, text=True, capture_output=True)
    if res.returncode:
        sys.stderr.write(res.stderr[-2000:])
        raise subprocess.CalledProcessError(res.returncode, cmd[:1], res.stdout, res.stderr)
    return res


# --------------------------------------------------------------------------- #
# 1) Google Drive
# --------------------------------------------------------------------------- #
def procedure_label(folder_name: str) -> str:
    """'Fulana - Lipo + Prótese' -> 'Lipo + Prótese'. O trecho antes do hífen (nome) é descartado."""
    parts = re.split(r"\s+-\s+", folder_name, maxsplit=1)
    return parts[1] if len(parts) == 2 else "sem-procedimento"


def anonymize_image(src: Path, dst: Path) -> Path:
    """Remove EXIF (GPS, aparelho, data) e corrige orientação. HEIC vira JPG quando possível."""
    try:
        from PIL import Image, ImageOps
        try:
            import pillow_heif  # type: ignore
            pillow_heif.register_heif_opener()
        except ImportError:
            pass
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if dst.suffix.lower() in {".heic", ".heif"}:
                dst = dst.with_suffix(".jpg")
            if dst.suffix.lower() in {".jpg", ".jpeg"} and im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            # Salvar sem o parâmetro exif= descarta todos os metadados originais.
            if dst.suffix.lower() in {".jpg", ".jpeg"}:
                im.save(dst, quality=92)
            else:
                im.save(dst)
        src.unlink(missing_ok=True)
        return dst
    except Exception as exc:  # Pillow ausente ou formato não suportado: mantém o arquivo
        log(f"  aviso: não foi possível limpar EXIF de {dst.name} ({exc.__class__.__name__}); mantendo original")
        shutil.move(src, dst)
        return dst


def anonymize_video(src: Path, dst: Path) -> Path:
    """Copia o stream sem reencodar, descartando metadados de localização/aparelho."""
    if shutil.which("ffmpeg"):
        try:
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
                 "-map", "0", "-map_metadata", "-1", "-c", "copy", str(dst)])
            src.unlink(missing_ok=True)
            return dst
        except subprocess.CalledProcessError:
            pass
    shutil.move(src, dst)
    return dst


@dataclass
class DriveItem:
    file_id: str
    case: str
    ext: str


def list_drive(folder_id: str):
    import gdown  # type: ignore
    files = gdown.download_folder(id=folder_id, skip_download=True, quiet=True) or []
    return files


def plan_root(root_id: str, include: str) -> list[DriveItem]:
    """Lista a pasta raiz e atribui códigos anônimos por subpasta (ordem alfabética estável)."""
    files = list_drive(root_id)
    folders = sorted({f.path.split("/")[0] for f in files if "/" in f.path})
    codes: dict[str, str] = {}
    n = 0
    for name in folders:
        if name.startswith(BACKSTAGE_PREFIXES):
            codes[name] = "bastidores" if name.startswith("AAA") else "bastidores-avulsas"
        else:
            n += 1
            codes[name] = f"caso-auto-{n:02d}__{slug(procedure_label(name))}"
    items = []
    for f in files:
        top = f.path.split("/")[0] if "/" in f.path else "raiz"
        case = codes.get(top, "raiz")
        is_backstage = case.startswith("bastidores")
        if include == "bastidores" and not is_backstage:
            continue
        if include == "casos" and is_backstage:
            continue
        items.append(DriveItem(f.id, case, Path(f.path).suffix.lower()))
    return items


def plan_cases(cases_file: Path) -> list[DriveItem]:
    """JSON local: {"caso-01": ["<folderId>", ...], "bastidores": ["<folderId>"]}."""
    mapping = json.loads(cases_file.read_text(encoding="utf-8"))
    items = []
    for case, ids in mapping.items():
        if case.startswith("_"):
            continue
        for fid in ids if isinstance(ids, list) else [ids]:
            if not fid or "COLE" in fid:
                continue
            log(f"listando {case}…")
            for f in list_drive(fid):
                items.append(DriveItem(f.id, case, Path(f.path).suffix.lower()))
    return items


def cmd_drive(args) -> Path:
    import gdown  # type: ignore
    out = Path(args.out).resolve()
    if args.cases:
        items = plan_cases(Path(args.cases))
    else:
        root = args.root or os.environ.get("DRIVE_ROOT_ID")
        if not root:
            sys.exit("Informe --root, a variável DRIVE_ROOT_ID ou --cases drive_cases.local.json")
        items = plan_root(root, args.include)

    if args.videos_only:
        items = [i for i in items if i.ext in VIDEO_EXT]
    items = [i for i in items if i.ext in IMAGE_EXT | VIDEO_EXT]
    if args.limit:
        items = items[: args.limit]

    log(f"{len(items)} arquivos selecionados → {out}")
    counters: dict[str, int] = {}
    manifest: dict[str, dict[str, int]] = {}
    tmp = Path(tempfile.mkdtemp(prefix="dlv-drive-"))
    for it in items:
        kind = "videos" if it.ext in VIDEO_EXT else "fotos"
        key = f"{it.case}/{kind}"
        counters[key] = counters.get(key, 0) + 1
        dst_dir = out / "drive" / it.case / kind
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / f"{counters[key]:04d}{it.ext}"
        if dst.exists() or dst.with_suffix(".jpg").exists():
            continue
        raw = tmp / f"raw{it.ext}"
        try:
            gdown.download(id=it.file_id, output=str(raw), quiet=True)
        except Exception as exc:
            log(f"  falha ao baixar um arquivo de {it.case} ({exc.__class__.__name__}) — seguindo")
            continue
        final = anonymize_video(raw, dst) if kind == "videos" else anonymize_image(raw, dst)
        manifest.setdefault(it.case, {}).setdefault(kind, 0)
        manifest[it.case][kind] += 1
        log(f"  {it.case}/{kind}/{final.name}")
    shutil.rmtree(tmp, ignore_errors=True)
    (out / "drive").mkdir(parents=True, exist_ok=True)
    (out / "drive" / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    log("manifesto salvo (somente contagens, sem nomes): " + str(out / "drive" / "manifest.json"))
    return out / "drive"


# --------------------------------------------------------------------------- #
# 2) Instagram
# --------------------------------------------------------------------------- #
def cmd_instagram(args) -> Path:
    try:
        import yt_dlp  # type: ignore
    except ImportError:
        sys.exit("Instale o yt-dlp: pip install yt-dlp")
    out = Path(args.out).resolve() / "instagram"
    out.mkdir(parents=True, exist_ok=True)
    opts = {
        "outtmpl": str(out / "%(upload_date)s-%(id)s.%(ext)s"),
        "format": "mp4/bestvideo*+bestaudio/best",
        "merge_output_format": "mp4",
        "ignoreerrors": True,
        "quiet": False,
        "noplaylist": False,
    }
    if args.limit:
        opts["playlistend"] = args.limit
    if args.cookies:
        opts["cookiefile"] = args.cookies
    elif args.browser:
        opts["cookiesfrombrowser"] = (args.browser,)
    url = f"https://www.instagram.com/{args.profile}/reels/"
    log(f"baixando Reels de @{args.profile} → {out}")
    with yt_dlp.YoutubeDL(opts) as ydl:
        code = ydl.download([url])
    if code:
        log("O Instagram costuma exigir login. Exporte os cookies da sessão (cookies.txt) e use --cookies, "
            "ou baixe Reels individuais: python -m yt_dlp --cookies cookies.txt <url-do-reel>")
    return out


# --------------------------------------------------------------------------- #
# 3) Design das tarjas — vidro escuro (sem caixa branca), fontes da marca
# --------------------------------------------------------------------------- #
ASSETS = Path(__file__).resolve().parent / "app" / "assets"
GOLD = (200, 169, 106, 255)
IVORY = (244, 243, 240, 255)
IVORY_SOFT = (244, 243, 240, 215)
PANEL_X, PANEL_W, PAD = 64, 952, 44
FADE = 0.35


def brand_font(name: str, size: int):
    from PIL import ImageFont
    path = ASSETS / "fonts" / f"{name}.ttf"
    if not path.exists():
        sys.exit(f"Fonte não encontrada: {path} (rode a partir da pasta drleonardo-portal)")
    return ImageFont.truetype(str(path), size)


def text_tracked(draw, x: float, y: float, text: str, font, fill, tracking: float) -> None:
    """Pillow não tem letter-spacing: desenha caractere a caractere (kickers em caixa alta)."""
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def wrap_px(draw, text: str, font, max_w: int) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


@dataclass
class Card:
    start: float
    end: float
    kicker: str = ""
    title: str = ""
    accent: str = ""   # linha em itálico dourado (ex.: palavra-chave do CTA)
    body: str = ""
    pos: str = "bottom"  # bottom | center | top


def render_card(card: Card, work: Path, idx: int) -> tuple[Path, Path, int, int, int, int]:
    """Gera o painel (PNG RGBA 1080x1920) e a máscara arredondada usada para desfocar o vídeo por baixo."""
    from PIL import Image, ImageDraw
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    inner = PANEL_W - 2 * PAD
    f_kick = brand_font("PlusJakartaSans-700", 24)
    f_title = brand_font("CormorantGaramond-500", 74 if len(card.title) < 70 else 64)
    f_acc = brand_font("CormorantGaramond-500i", 84)
    f_body = brand_font("PlusJakartaSans-400", 31)
    title_lines = wrap_px(probe, card.title, f_title, inner) if card.title else []
    acc_lines = wrap_px(probe, card.accent, f_acc, inner) if card.accent else []
    body_lines = wrap_px(probe, card.body, f_body, inner) if card.body else []
    lh_t, lh_a, lh_b = int(f_title.size * 1.06), int(f_acc.size * 1.02), int(f_body.size * 1.45)
    h = PAD + (46 if card.kicker else 0) + lh_t * len(title_lines) + lh_a * len(acc_lines)
    h += (22 + lh_b * len(body_lines)) if body_lines else 0
    h += PAD - 6
    h += h % 2  # yuv420p exige dimensões pares no recorte desfocado
    y = {"top": 300, "center": (H - h) // 2}.get(card.pos, H - 230 - h)
    y -= y % 2

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((PANEL_X, y, PANEL_X + PANEL_W, y + h), radius=34, fill=(14, 14, 14, 178),
                        outline=(244, 243, 240, 46), width=2)
    cy = y + PAD
    if card.kicker:
        text_tracked(d, PANEL_X + PAD, cy, card.kicker.upper(), f_kick, GOLD, 5.5)
        cy += 46
    for line in title_lines:
        d.text((PANEL_X + PAD, cy - 6), line, font=f_title, fill=IVORY)
        cy += lh_t
    for line in acc_lines:
        d.text((PANEL_X + PAD, cy - 6), line, font=f_acc, fill=(217, 190, 134, 255))
        cy += lh_a
    if body_lines:
        cy += 22
        for line in body_lines:
            d.text((PANEL_X + PAD, cy), line, font=f_body, fill=IVORY_SOFT)
            cy += lh_b
    card_png = work / f"card{idx:02d}.png"
    img.save(card_png)
    mask = Image.new("L", (PANEL_W, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, PANEL_W - 1, h - 1), radius=34, fill=255)
    mask_png = work / f"mask{idx:02d}.png"
    mask.save(mask_png)
    return card_png, mask_png, PANEL_X, y, PANEL_W, h


def render_chrome(work: Path) -> Path:
    """Camada fixa: degradês de leitura, logo no topo e rodapé CFM."""
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i in range(300):  # degradê superior
        d.line([(0, i), (W, i)], fill=(10, 10, 10, int(120 * (1 - i / 300))))
    for i in range(520):  # degradê inferior
        d.line([(0, H - i), (W, H - i)], fill=(10, 10, 10, int(170 * (1 - i / 520))))
    logo_path = ASSETS / "logo-leonardo-valadao-light.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        logo = logo.resize((340, int(logo.height * 340 / logo.width)))
        img.alpha_composite(logo, (72, 78))
    f = brand_font("PlusJakartaSans-400", 21)
    y = H - 150
    d.line([(72, y), (W - 72, y)], fill=(200, 169, 106, 120), width=1)
    for k, line in enumerate(CFM_FOOTER.split("\n")):
        d.text((72, y + 16 + k * 30), line, font=f, fill=(244, 243, 240, 190))
    out = work / "chrome.png"
    img.save(out)
    return out


# --------------------------------------------------------------------------- #
# 4) Montagem de Reels (estudo de caso / bastidor / posicionamento)
# --------------------------------------------------------------------------- #
def normalize_segment(seg: dict, base: Path, out: Path) -> float:
    """Converte foto (Ken Burns) ou trecho de vídeo em 1080x1920/30fps, sem áudio, com tratamento de cor."""
    src = (base / seg["src"]).resolve() if not os.path.isabs(seg["src"]) else Path(seg["src"])
    dur = float(seg.get("dur", 3.0))
    fx, fy = seg.get("focus", [0.5, 0.4])
    grade = "eq=contrast=1.06:saturation=0.9:brightness=-0.015,vignette=PI/5"
    if src.suffix.lower() in IMAGE_EXT:
        frames = int(dur * 30)
        zoom = f"min(1+0.10*on/{frames},1.10)" if seg.get("motion", "in") == "in" else f"max(1.10-0.10*on/{frames},1)"
        vf = (f"scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840:(iw-2160)*{fx}:(ih-3840)*{fy},"
              f"zoompan=z='{zoom}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s={W}x{H}:fps=30,{grade},format=yuv420p")
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30", "-loop", "1", "-t", f"{dur}", "-i", str(src),
               "-vf", vf, "-frames:v", str(frames)]
    else:
        vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})*{fx}:(ih-{H})*{fy},"
              f"fps=30,{grade},format=yuv420p")
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(seg.get("start", 0)), "-t", f"{dur}",
               "-i", str(src), "-vf", vf, "-an"]
    run(cmd + ["-c:v", "libx264", "-preset", "veryfast", "-crf", "16", str(out)])
    real, _ = ffprobe_info(out)  # duração efetiva (o trecho de origem pode ser mais curto que o pedido)
    return real or dur


def xfade_concat(parts: list[Path], durs: list[float], out: Path, fade: float = 0.4) -> float:
    if len(parts) == 1:
        shutil.copy(parts[0], out)
        return durs[0]
    inputs, chain, offset, prev = [], [], 0.0, "[0:v]"
    for p in parts:
        inputs += ["-i", str(p)]
    for i in range(1, len(parts)):
        offset += durs[i - 1] - fade
        label = f"[x{i}]"
        chain.append(f"{prev}[{i}:v]xfade=transition=fade:duration={fade}:offset={offset:.3f}{label}")
        prev = label
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(chain),
         "-map", prev, "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", str(out)])
    return sum(durs) - fade * (len(parts) - 1)


def build_ambient(work: Path, total: float, cues: list[float]) -> Path:
    """Trilha ambiente sofisticada (pad quente/deep chord) + whoosh suave em cada troca de cena.
    Gerada 100% via FFmpeg — nenhum arquivo externo. Substitui o vídeo mudo."""
    pad, whoosh, out = work / "pad.wav", work / "whoosh.wav", work / "audio.wav"
    fade = min(2.5, total / 3)
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "lavfi", "-i", f"sine=frequency=110:duration={total}",       # A2
         "-f", "lavfi", "-i", f"sine=frequency=164.81:duration={total}",     # E3
         "-f", "lavfi", "-i", f"sine=frequency=220:duration={total}",        # A3
         "-f", "lavfi", "-i", f"sine=frequency=277.18:duration={total}",     # C#4 (acorde maior suave)
         "-filter_complex",
         "[0][1][2][3]amix=inputs=4:normalize=0,tremolo=f=0.12:d=0.4,lowpass=f=820,"
         f"aecho=0.8:0.88:70|150:0.3|0.2,volume=0.16,afade=t=in:d={fade:.2f},afade=t=out:st={max(0, total - fade):.2f}:d={fade:.2f}[a]",
         "-map", "[a]", str(pad)])
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=0.8:amplitude=0.7",
         "-af", "bandpass=f=1500:width_type=h:w=1800,afade=t=in:d=0.4,afade=t=out:st=0.4:d=0.4,volume=0.20",
         "-ar", "44100", str(whoosh)])
    cues = [c for c in cues if c > 0.1]
    inputs, fc, labels = ["-i", str(pad)], [], ["[0:a]"]
    for i, t in enumerate(cues):
        inputs += ["-i", str(whoosh)]
        ms = int(t * 1000)
        fc.append(f"[{i + 1}:a]adelay={ms}|{ms}[w{i}]")
        labels.append(f"[w{i}]")
    fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,alimiter=limit=0.9[a]")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
         "-filter_complex", ";".join(fc), "-map", "[a]", "-ar", "44100", "-ac", "2", str(out)])
    return out


def apply_design(base_video: Path, cards: list[Card], out: Path, total: float, work: Path,
                 keep_audio: bool = False, audio_path: Path | None = None) -> None:
    """Sobrepõe as tarjas de vidro (desfoque real do vídeo por baixo + painel escuro), logo, rodapé e barra de progresso."""
    chrome = render_chrome(work)
    inputs = ["-i", str(base_video), "-loop", "1", "-t", f"{total}", "-i", str(chrome)]
    graph, cur, n = [], "[0:v]", 2
    for i, card in enumerate(cards):
        card_png, mask_png, x, y, w, h = render_card(card, work, i)
        inputs += ["-loop", "1", "-t", f"{total}", "-i", str(card_png), "-loop", "1", "-t", f"{total}", "-i", str(mask_png)]
        ci, mi = n, n + 1
        n += 2
        s, e = card.start, card.end
        slide = f"if(lt(t,{s}),40,if(lt(t,{s}+0.5),40*(1-(t-{s})/0.5),0))"
        fades = f"fade=t=in:st={s}:d={FADE}:alpha=1,fade=t=out:st={max(s, e - FADE)}:d={FADE}:alpha=1"
        graph += [
            f"{cur}split[a{i}][b{i}]",
            f"[b{i}]crop={w}:{h}:{x}:{y},boxblur=26:2,eq=brightness=-0.05,format=rgba[bc{i}]",
            f"[{mi}:v]format=gray[mk{i}]",
            f"[bc{i}][mk{i}]alphamerge,{fades}[bl{i}]",
            f"[a{i}][bl{i}]overlay=x={x}:y='{y}+{slide}':eval=frame[o{i}]",
            f"[{ci}:v]format=rgba,{fades}[c{i}]",
            f"[o{i}][c{i}]overlay=x=0:y='{slide}':eval=frame[v{i}]",
        ]
        cur = f"[v{i}]"
    graph.append(f"{cur}[1:v]overlay=0:0,drawbox=x=0:y=0:w='iw*t/{total:.3f}':h=6:color=0xC8A96A@0.95:t=fill,format=yuv420p[vout]")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs]
    if keep_audio:  # vídeo falado: preserva a voz original do Dr. Leonardo
        cmd += ["-filter_complex", ";".join(graph), "-map", "[vout]", "-map", "0:a?", "-c:a", "aac", "-b:a", "160k"]
    else:  # vídeo visual: trilha ambiente + whoosh gerados por FFmpeg (nunca mudo)
        audio = audio_path or build_ambient(work, total, [c.start for c in cards])
        cmd += ["-i", str(audio),
                "-filter_complex", ";".join(graph), "-map", "[vout]", "-map", f"{n}:a", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-movflags", "+faststart", str(out)]
    run(cmd)


def cmd_montage(args) -> None:
    """Monta um Reel a partir de um roteiro JSON (segmentos de vídeo/foto + tarjas).

    Formato:
      {"out": "reel.mp4",
       "segments": [{"src": "clip.mov", "start": 1.0, "dur": 3.0, "focus": [0.5, 0.3]},
                    {"src": "foto.jpg", "dur": 3.5, "motion": "in"}],
       "cards": [{"start": 0.3, "end": 3.4, "kicker": "Bastidores", "title": "…", "body": "…", "pos": "bottom"}]}
    Nenhuma legenda automática é gerada: o texto vem do roteiro aprovado.
    """
    require("ffmpeg")
    spec_path = Path(args.spec).resolve()
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    out = Path(args.out or spec.get("out", spec_path.with_suffix(".mp4").name))
    if not out.is_absolute():
        out = spec_path.parent / out
    work = Path(tempfile.mkdtemp(prefix="dlv-montage-"))
    try:
        parts, durs = [], []
        for i, seg in enumerate(spec["segments"]):
            p = work / f"seg{i:02d}.mp4"
            durs.append(normalize_segment(seg, spec_path.parent, p))
            parts.append(p)
        base = work / "base.mp4"
        total = xfade_concat(parts, durs, base, float(spec.get("fade", 0.4)))
        cards = [Card(**c) for c in spec.get("cards", [])]
        out.parent.mkdir(parents=True, exist_ok=True)
        apply_design(base, cards, out, total, work)
        log(f"✓ {out.name}: {total:.1f}s · {len(parts)} cenas · {len(cards)} tarjas")
    finally:
        shutil.rmtree(work, ignore_errors=True)


# --------------------------------------------------------------------------- #
# 5) Processamento de vídeos falados (corte de silêncio + legenda revisada)
# --------------------------------------------------------------------------- #
def ffprobe_info(path: Path) -> tuple[float, bool]:
    res = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type",
               "-of", "json", str(path)], capture=True)
    data = json.loads(res.stdout)
    duration = float(data.get("format", {}).get("duration", 0) or 0)
    has_audio = any(s.get("codec_type") == "audio" for s in data.get("streams", []))
    return duration, has_audio


def keep_segments(path: Path, duration: float, noise_db: float, min_silence: float,
                  pad: float = 0.08, min_keep: float = 0.25) -> list[tuple[float, float]]:
    """Detecta silêncios e devolve os trechos com fala a manter."""
    res = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn",
         "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"],
        text=True, capture_output=True)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", res.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", res.stderr)]
    silences = list(zip(starts, ends + [duration] * (len(starts) - len(ends))))
    segs, cursor = [], 0.0
    for s, e in silences:
        a, b = cursor, min(duration, s + pad)
        if b - a >= min_keep:
            segs.append((round(a, 3), round(b, 3)))
        cursor = max(cursor, e - pad)
    if duration - cursor >= min_keep:
        segs.append((round(cursor, 3), round(duration, 3)))
    return segs or [(0.0, duration)]


def filter_path(p: Path) -> str:
    """Escapa caminhos para uso dentro de filtros do ffmpeg (subtitles=)."""
    return str(p).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def srt_time(t: float) -> str:
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"


def transcribe_for_review(path: Path, srt: Path, model_size: str) -> tuple[bool, str]:
    """Transcreve e VALIDA se há fala real. Vídeo de B-roll (só ruído ambiente) é recusado.

    Critérios: probabilidade de silêncio baixa, confiança média alta e ritmo de fala humano.
    O SRT é salvo para revisão humana — nada é queimado no vídeo sem aprovação (--burn-subs).
    """
    try:
        from faster_whisper import WhisperModel  # type: ignore
        import numpy as np
    except ImportError:
        return False, "faster-whisper não instalado (pip install faster-whisper)"
    pcm = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vn",
                          "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], check=True, capture_output=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    duration = len(audio) / 16000 or 1
    model = WhisperModel(model_size, device="auto", compute_type="int8")
    segments, _ = model.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True)
    good = [s for s in segments if s.no_speech_prob < 0.4 and s.avg_logprob > -0.7 and s.compression_ratio < 2.2]
    words = [w for s in good for w in (s.words or [])]
    speech = sum(s.end - s.start for s in good)
    rate = len(words) / speech if speech else 0
    if len(words) < 8 or speech / duration < 0.35 or not 1.2 <= rate <= 4.8:
        return False, f"sem fala confiável (fala {speech:.1f}s de {duration:.1f}s, {len(words)} palavras) — legenda descartada"
    blocks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 4 or w.word.strip().endswith((".", "?", "!", ",")):
            blocks.append(cur)
            cur = []
    if cur:
        blocks.append(cur)
    with srt.open("w", encoding="utf-8") as fh:
        for i, b in enumerate(blocks, 1):
            fh.write(f"{i}\n{srt_time(b[0].start)} --> {srt_time(b[-1].end)}\n{''.join(w.word for w in b).strip()}\n\n")
    return True, f"{len(words)} palavras em {speech:.1f}s — revise {srt.name} antes de queimar"


def process_video(src: Path, dst: Path, hook: str, args) -> None:
    duration, has_audio = ffprobe_info(src)
    if duration <= 0:
        log(f"  ignorado (duração inválida): {src.name}")
        return
    work = Path(tempfile.mkdtemp(prefix="dlv-edit-"))
    try:
        srt = dst.with_suffix(".srt")
        speech_ok = False
        if has_audio and (args.subs or args.burn_subs) and not srt.exists():
            speech_ok, msg = transcribe_for_review(src, srt, args.model)
            log(f"  legenda: {msg}")
        elif srt.exists():
            speech_ok = True

        # Corte de silêncio só faz sentido em vídeo falado; B-roll fica inteiro.
        segs = keep_segments(src, duration, args.silence_db, args.silence_min) if speech_ok and not args.keep_silence else [(0.0, duration)]
        expr = "+".join(f"between(t,{a},{b})" for a, b in segs)
        kept = sum(b - a for a, b in segs)
        vf = (f"select='{expr}',setpts=N/FRAME_RATE/TB,fps=30,split[a][b];"
              f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.06[bg];"
              f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]")
        cut = work / "cut.mp4"
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-filter_complex", vf, "-map", "[v]"]
        if has_audio and speech_ok:
            cmd += ["-af", f"aselect='{expr}',asetpts=N/SR/TB,loudnorm=I=-16:TP=-1.5:LRA=11", "-map", "0:a:0", "-c:a", "aac", "-b:a", "160k"]
        else:
            cmd += ["-an"]  # ruído ambiente/vozes de terceiros não vão para o Reel
        cmd += ["-map_metadata", "-1", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", str(cut)]
        run(cmd)

        if args.burn_subs and srt.exists():  # somente depois de revisado por uma pessoa
            subbed = work / "subbed.mp4"
            style = ("FontName=Plus Jakarta Sans,Fontsize=15,Bold=1,PrimaryColour=&H00F4F3F0,"
                     "OutlineColour=&H000F0F0F,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=110")
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(cut), "-vf",
                 f"subtitles='{filter_path(srt)}':fontsdir='{filter_path(ASSETS / 'fonts')}':force_style='{style}'",
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "copy", str(subbed)])
            cut = subbed

        total = kept if speech_ok else duration
        cards = [Card(start=0.2, end=min(args.hook_seconds, total - 0.1), kicker=args.kicker, title=hook, pos="top")]
        dst.parent.mkdir(parents=True, exist_ok=True)
        apply_design(cut, cards, dst, total, work, keep_audio=has_audio and speech_ok)
        log(f"  ✓ {dst.name}: {duration:.1f}s → {total:.1f}s{' · legendado' if args.burn_subs and srt.exists() else ''}")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def cmd_process(args) -> None:
    require("ffmpeg")
    require("ffprobe")
    src_root, out = Path(args.input).resolve(), Path(args.out).resolve()
    hooks_map = json.loads(Path(args.hooks_json).read_text(encoding="utf-8")) if args.hooks_json else {}
    videos = sorted(p for p in src_root.rglob("*") if p.suffix.lower() in VIDEO_EXT and out not in p.parents)
    if args.limit:
        videos = videos[: args.limit]
    log(f"{len(videos)} vídeos para editar → {out}")
    for i, v in enumerate(videos):
        rel = v.relative_to(src_root)
        hook = hooks_map.get(v.stem) or args.hook or DEFAULT_HOOKS[i % len(DEFAULT_HOOKS)]
        dst = out / rel.parent / f"{v.stem}-editado.mp4"
        if dst.exists() and not args.overwrite:
            log(f"  já existe: {dst.relative_to(out)}")
            continue
        log(f"editando {rel}…")
        try:
            process_video(v, dst, hook, args)
        except subprocess.CalledProcessError as exc:
            log(f"  erro no ffmpeg ({exc.returncode}) — arquivo ignorado")


def cmd_all(args) -> None:
    cmd_drive(args)
    if args.cookies or args.browser:
        cmd_instagram(args)
    args.input = str(Path(args.out))
    args.out = str(Path(args.out) / "editados")
    cmd_process(args)
    log(f"concluído. Vídeos editados em {args.out}")


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Pipeline de mídia — Dr. Leonardo Valadão",
                                formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__.split("USO")[1])
    sub = p.add_subparsers(dest="cmd", required=True)

    def drive_opts(sp):
        sp.add_argument("--root", help="ID da pasta raiz do Drive (ou variável DRIVE_ROOT_ID)")
        sp.add_argument("--cases", help="JSON local mapeando caso → IDs de pasta (veja drive_cases.example.json)")
        sp.add_argument("--include", choices=["todos", "bastidores", "casos"], default="todos")
        sp.add_argument("--videos-only", action="store_true", help="baixa apenas vídeos")
        sp.add_argument("--limit", type=int, default=0, help="máximo de arquivos")

    def ig_opts(sp):
        sp.add_argument("--profile", default="drleonardovaladao")
        sp.add_argument("--cookies", help="cookies.txt exportado do navegador logado no Instagram")
        sp.add_argument("--browser", help="ler cookies direto do navegador (chrome, safari, firefox…)")

    def proc_opts(sp):
        sp.add_argument("--hook", help="tarja de gancho para todos os vídeos")
        sp.add_argument("--hooks-json", help='JSON {"nome-do-arquivo": "tarja"}')
        sp.add_argument("--hook-seconds", type=float, default=3.0)
        sp.add_argument("--silence-db", type=float, default=-32.0, help="limiar de silêncio em dB (padrão -32)")
        sp.add_argument("--silence-min", type=float, default=0.45, help="duração mínima do silêncio em s")
        sp.add_argument("--keep-silence", action="store_true", help="não corta silêncios")
        sp.add_argument("--subs", action="store_true", help="transcreve vídeos falados e salva .srt para revisão")
        sp.add_argument("--burn-subs", action="store_true", help="queima o .srt revisado ao lado do vídeo")
        sp.add_argument("--kicker", default="Dr. Leonardo Valadão", help="linha dourada acima da tarja")
        sp.add_argument("--model", default="small", help="modelo faster-whisper (tiny, base, small, medium)")
        sp.add_argument("--overwrite", action="store_true")

    d = sub.add_parser("drive", help="baixa e anonimiza o acervo do Google Drive")
    drive_opts(d)
    d.add_argument("--out", default="media")
    d.set_defaults(func=cmd_drive)

    i = sub.add_parser("instagram", help="baixa os Reels do perfil com yt-dlp")
    ig_opts(i)
    i.add_argument("--limit", type=int, default=0)
    i.add_argument("--out", default="media")
    i.set_defaults(func=cmd_instagram)

    pr = sub.add_parser("process", help="corta silêncios, legenda e aplica tarja + rodapé CFM")
    pr.add_argument("--in", dest="input", default="media")
    pr.add_argument("--out", default="media/editados")
    pr.add_argument("--limit", type=int, default=0)
    proc_opts(pr)
    pr.set_defaults(func=cmd_process)

    m = sub.add_parser("montage", help="monta um Reel a partir de um roteiro JSON (sem legenda automática)")
    m.add_argument("spec", help="arquivo JSON com segmentos e tarjas")
    m.add_argument("--out", help="arquivo de saída (padrão: campo 'out' do JSON)")
    m.set_defaults(func=cmd_montage)

    a = sub.add_parser("all", help="drive + instagram (se houver cookies) + process")
    drive_opts(a)
    ig_opts(a)
    proc_opts(a)
    a.add_argument("--out", default="media")
    a.set_defaults(func=cmd_all)
    return p


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
