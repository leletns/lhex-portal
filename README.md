# lhex-portal
## Portal Executivo & Estúdio — Dr. Leonardo Valadão

Aplicação estática (HTML + CSS + ES modules, sem etapa de build) em `public/drleonardo/`.
Publicada junto com o site na Vercel em **`/drleonardo/`**. Para um projeto Vercel próprio,
basta apontar o *Root Directory* para `public/drleonardo` (framework: Other, sem build command).

Rodar localmente: `cd public && python3 -m http.server 8080` → http://localhost:8080/drleonardo/

| Módulo | Rota | O que faz |
|---|---|---|
| 01 Plano 20K | `#plano` | Diagnóstico, simulador 9K→20K, funil de consultas, roadmap, KPIs · **Exportar PDF Executivo** |
| 02 Cronograma | `#cronograma` | Simulador de feed com 24 posts (12 Reels + 12 carrosséis), slides 1080×1350 em PNG, encaixe de foto local, legenda e 4 Stories por dia |
| 03 Destaques | `#destaques` | Capas 1080×1920 + 6 telas para *Lipedefinition* e *Lipedema* |
| 04 Teleprompter | `#roteiros` | 12 roteiros palavra por palavra + teleprompter de celular (velocidade, fonte, espelho, wake lock) |
| 05 Meta & Google | `#ads` | C1 (R$ 35/dia) e C2 (R$ 15/dia), 3 criativos com “Aprovar anúncio”, script de negativação do Google Ads |
| 06 CRM & ERP | `#erp` | Kanban de leads com Human-in-the-Loop, orçamento hospitalar comparativo e documentos timbrados |
| + Automação | `#midia` | Documentação do `auto_editor_drleonardo.py` |

**Dados institucionais** (CRM, RQE, endereço, WhatsApp, rodapé CFM) ficam em um único lugar:
`public/drleonardo/js/config.js`.

**Sigilo médico (Res. CFM 2.336/2023):** nenhuma foto, nome ou ID de pasta de paciente é versionado.
As fotos encaixadas nos slides são lidas só no navegador. O acervo baixado pelo script vai para
`media/` (no `.gitignore`).

### Pipeline de mídia

```bash
pip install -r requirements-media.txt        # + ffmpeg no sistema
export DRIVE_ROOT_ID="<id da pasta raiz>"
python auto_editor_drleonardo.py drive --out media
python auto_editor_drleonardo.py instagram --cookies cookies.txt
python auto_editor_drleonardo.py process --in media --out media/editados
```
