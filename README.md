# Plano editorial · Dr. Leonardo Valadão

Página de aprovação do plano de Instagram (26/out/2026 – 25/fev/2027).

- O Dr. Leonardo abre o link e toca em **Aprovar** / **Quer editar** em cada post, e **Vou gravar** / **Quer mudar** nas pautas. Não precisa de login.
- As decisões ficam no Supabase (projeto `plano-leo`, tabelas `decisoes` e `eventos`), gravadas só pelas funções RPC protegidas por token.
- A aba **Recebidos** só aparece para quem abre o link com a chave da dona (`?k=...`). A chave fica salva no navegador depois do primeiro acesso.

Site estático: `index.html` + `img/` + `vid/`. Sem build.
