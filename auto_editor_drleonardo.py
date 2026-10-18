#!/usr/bin/env python3
"""
auto_editor_drleonardo.py — Pipeline de mídia do Dr. Leonardo Valadão
=====================================================================

Baixa o acervo (Google Drive + Instagram), anonimiza os arquivos e pré-edita
os vídeos para Reels/Stories:

  * corte automático de silêncios (ffmpeg silencedetect)
  * enquadramento vertical 1080x1920 com fundo desfocado
  * legendas automáticas em português (faster-whisper, opcional)
  * tarja de gancho nos 3 primeiros segundos
  * rodapé CFM permanente (Res. CFM 2.336/2023)

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

  # 3) Edição automática
  python auto_editor_drleonardo.py process --in media --out media/editados \
      --hook "Não é gordura teimosa. Pode ser lipedema."

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
    return subprocess.run(cmd, check=True, text=True, capture_output=capture)


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
# 3) Processamento de vídeo
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
    """Escapa caminhos para uso dentro de filtros do ffmpeg (textfile=, subtitles=)."""
    return str(p).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def find_font(user_font: str | None) -> str:
    if user_font:
        return user_font
    for query in ("Plus Jakarta Sans:bold", "Inter:bold", "DejaVu Sans:bold", "Liberation Sans:bold", "sans:bold"):
        try:
            res = run(["fc-match", "-f", "%{file}", query], capture=True)
            if res.stdout and Path(res.stdout).exists():
                return res.stdout
        except (FileNotFoundError, subprocess.CalledProcessError):
            break
    for cand in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "C:/Windows/Fonts/arialbd.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if Path(cand).exists():
            return cand
    sys.exit("Fonte não encontrada. Use --font /caminho/para/fonte.ttf")


def wrap(text: str, width: int) -> str:
    words, lines, line = text.split(), [], ""
    for w in words:
        if len(line) + len(w) + 1 > width and line:
            lines.append(line)
            line = w
        else:
            line = f"{line} {w}".strip()
    if line:
        lines.append(line)
    return "\n".join(lines)


def srt_time(t: float) -> str:
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"


def transcribe(path: Path, srt: Path, model_size: str) -> bool:
    """Gera legendas curtas (até ~4 palavras por bloco) com faster-whisper. Retorna False se indisponível."""
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        log("  faster-whisper não instalado — vídeo sairá sem legendas (pip install faster-whisper)")
        return False
    try:
        import numpy as np  # dependência do faster-whisper
        # Decodifica o áudio com o próprio ffmpeg (16 kHz mono) — evita incompatibilidades de versão do PyAV.
        pcm = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vn",
                              "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], check=True, capture_output=True).stdout
        audio = np.frombuffer(pcm, dtype=np.float32)
        model = WhisperModel(model_size, device="auto", compute_type="int8")
        segments, _ = model.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True)
        blocks, cur = [], []
        for seg in segments:
            for w in seg.words or []:
                cur.append(w)
                if len(cur) >= 4 or w.word.strip().endswith((".", "?", "!", ",")):
                    blocks.append(cur)
                    cur = []
        if cur:
            blocks.append(cur)
        with srt.open("w", encoding="utf-8") as fh:
            for i, b in enumerate(blocks, 1):
                text = "".join(w.word for w in b).strip().upper()
                fh.write(f"{i}\n{srt_time(b[0].start)} --> {srt_time(b[-1].end)}\n{text}\n\n")
        return bool(blocks)
    except Exception as exc:
        log(f"  transcrição falhou ({exc.__class__.__name__}: {exc}) — seguindo sem legendas")
        return False


def process_video(src: Path, dst: Path, hook: str, args) -> None:
    duration, has_audio = ffprobe_info(src)
    if duration <= 0:
        log(f"  ignorado (duração inválida): {src.name}")
        return
    work = Path(tempfile.mkdtemp(prefix="dlv-edit-"))
    try:
        # A) corte de silêncios + enquadramento vertical com fundo desfocado
        segs = keep_segments(src, duration, args.silence_db, args.silence_min) if has_audio and not args.keep_silence else [(0.0, duration)]
        expr = "+".join(f"between(t,{a},{b})" for a, b in segs)
        kept = sum(b - a for a, b in segs)
        vf = (f"select='{expr}',setpts=N/FRAME_RATE/TB,fps=30,split[a][b];"
              f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.06[bg];"
              f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]")
        cut = work / "cut.mp4"
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-filter_complex", vf, "-map", "[v]"]
        if has_audio:
            cmd += ["-af", f"aselect='{expr}',asetpts=N/SR/TB,loudnorm=I=-16:TP=-1.5:LRA=11", "-map", "0:a:0", "-c:a", "aac", "-b:a", "160k"]
        cmd += ["-map_metadata", "-1", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", str(cut)]
        run(cmd)

        # B) legendas automáticas
        srt = work / "subs.srt"
        has_subs = has_audio and not args.no_subs and transcribe(cut, srt, args.model)

        # C) tarja de gancho (0–3 s) + rodapé CFM + legendas
        font = find_font(args.font)
        hook_file, foot_file = work / "hook.txt", work / "foot.txt"
        hook_file.write_text(wrap(hook, 22), encoding="utf-8")
        foot_file.write_text(CFM_FOOTER, encoding="utf-8")
        ff = filter_path(Path(font))
        filters = [
            f"drawtext=fontfile='{ff}':textfile='{filter_path(hook_file)}':fontsize=68:line_spacing=14:"
            f"fontcolor=0x2A2925:box=1:boxcolor=0xF4F3F0@0.94:boxborderw=34:x=(w-text_w)/2:y=230:"
            f"enable='lte(t,{args.hook_seconds})'",
            f"drawtext=fontfile='{ff}':textfile='{filter_path(foot_file)}':fontsize=24:line_spacing=8:"
            f"fontcolor=0xF4F3F0@0.92:box=1:boxcolor=0x2A2925@0.55:boxborderw=18:x=(w-text_w)/2:y=h-text_h-90",
        ]
        if has_subs:
            style = ("FontName=Plus Jakarta Sans,Fontsize=17,Bold=1,PrimaryColour=&H00F4F3F0,"
                     "OutlineColour=&H00252A2A,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=150")
            filters.append(f"subtitles='{filter_path(srt)}':force_style='{style}'")
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(cut), "-vf", ",".join(filters),
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
        cmd += ["-c:a", "copy"] if has_audio else ["-an"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        run(cmd + [str(dst)])
        log(f"  ✓ {dst.name}: {duration:.1f}s → {kept:.1f}s ({len(segs)} trechos){' · legendado' if has_subs else ''}")
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
    drive_dir = cmd_drive(args)
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
        sp.add_argument("--no-subs", action="store_true", help="não gera legendas")
        sp.add_argument("--model", default="small", help="modelo faster-whisper (tiny, base, small, medium)")
        sp.add_argument("--font", help="fonte .ttf/.otf para as tarjas")
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
