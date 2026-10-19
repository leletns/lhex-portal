# Portal Executivo & Estúdio — Dr. Leonardo Valadão

Projeto **independente** do site da L.H.E.X. (não é publicado em lhexsystems.com).
Aplicação estática (HTML + CSS + ES modules, sem etapa de build) na pasta `app/`.

## Deploy na Vercel (projeto separado)

1. Vercel → **Add New… → Project** → importe o repositório `lhex-portal`.
2. **Root Directory:** `drleonardo-portal` · Framework Preset: **Other**.
3. Deploy. O `vercel.json` já define `app/` como saída, sem build, e marca o portal como `noindex`.

Rodar localmente: `cd drleonardo-portal/app && python3 -m http.server 8080` → http://localhost:8080

## Módulos

| Módulo | Rota | O que faz |
|---|---|---|
| 01 Plano 20K | `#plano` | Diagnóstico, simulador 9K→20K, funil de consultas, roadmap, KPIs · **Exportar PDF Executivo** |
| 02 Cronograma | `#cronograma` | Simulador de feed com 24 posts (12 Reels + 12 carrosséis), slides 1080×1350 em PNG, encaixe de foto local, legenda e 4 Stories por dia |
| 03 Destaques | `#destaques` | Capas 1080×1920 + 6 telas para *Lipedefinition* e *Lipedema* |
| 04 Teleprompter | `#roteiros` | 12 roteiros palavra por palavra + teleprompter de celular |
| 05 Meta & Google | `#ads` | C1 (R$ 35/dia) e C2 (R$ 15/dia), 3 criativos com “Aprovar anúncio”, script de negativação do Google Ads |
| 06 CRM & ERP | `#erp` | Kanban de leads com Human-in-the-Loop, orçamento hospitalar e documentos timbrados |
| + Automação | `#midia` | Documentação do `auto_editor_drleonardo.py` |

Dados institucionais (CRM, RQE, endereço, WhatsApp, rodapé CFM): `app/js/config.js`.

## Direção de arte (v2 · dark luxury)

- Todas as peças (carrosséis, capas de Reel, destaques) usam **fotos reais do Dr. Leonardo e do centro cirúrgico**
  (`app/assets/photos/`, sem pacientes) com painéis de vidro escuro e acentos dourados.
- O vidro não depende de `backdrop-filter`: cada painel recebe a versão desfocada da mesma foto
  (`app/assets/photos/blur/`), alinhada pixel a pixel — o resultado é igual no navegador, no PNG e no PDF.
- Fontes **estáticas** auto-hospedadas (`app/assets/fonts/`, licença OFL). Fontes variáveis do Google eram
  embutidas no PDF como "Type 3", o que fazia palavras aparecerem grudadas em alguns leitores.
- **Antes e depois:** fotos de pacientes nunca são versionadas. No portal, em Cronograma → carrossel, o par
  "frente" vira o slide 2 e o par "perfil/costas" vira o slide 3 (processado só no navegador).

**Sigilo médico (Res. CFM 2.336/2023):** nenhuma foto, nome ou ID de pasta de paciente é versionado.
Fotos encaixadas nos slides são lidas só no navegador. O acervo baixado pelo script vai para `media/` (no `.gitignore`).

## Pipeline de mídia

```bash
cd drleonardo-portal
pip install -r requirements-media.txt        # + ffmpeg no sistema
export DRIVE_ROOT_ID="<id da pasta raiz>"
python auto_editor_drleonardo.py drive --out media
python auto_editor_drleonardo.py instagram --cookies cookies.txt
python auto_editor_drleonardo.py montage reels/bastidores-seguranca.json   # Reels a partir de roteiro
python auto_editor_drleonardo.py process --in media/instagram --out media/editados --subs   # gera .srt p/ revisão
```

- `montage`: cenas de vídeo/foto + tarjas de vidro escuro definidas em `reels/*.json` (sem legenda automática).
  Os roteiros esperam os clipes de bastidor em `media/bastidores/` (fora do git).
- `process`: só legenda vídeo com fala real (validação de confiança e ritmo de fala); o `.srt` fica para revisão e
  só é queimado com `--burn-subs`. B-roll com ruído ambiente nunca recebe legenda.
