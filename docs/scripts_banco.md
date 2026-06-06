# Scripts de Banco de Dados — Supabase

Este arquivo é o canal oficial para envio de alterações no banco de dados de produção (Supabase).

**Fluxo:**
1. O desenvolvedor implementa a mudança no código e escreve o SQL correspondente
2. Adiciona o bloco abaixo com todas as informações preenchidas
3. Abre PR normalmente — o líder do projeto roda o SQL no SQL Editor do Supabase antes ou após o merge

---

## Como adicionar um novo script

Ao adicionar um novo bloco de SQL, preencha **todos** os campos abaixo. Scripts sem essas informações serão removidos.

```markdown
### [AAAA-MM-DD] Título curto descritivo

- **Data de envio:** AAAA-MM-DD
- **Enviado por:** Nome do desenvolvedor
- **Status:** Executado / Pendente
- **Tabela(s) afetada(s):** nome_da_tabela
- **Motivo:** Por que esse script foi necessário (ex: migration não aplicada, hotfix, seed de dados)
- **Onde é usado no código:** ex: `app/api/routes/auth_routes.py` → endpoint `POST /api/usuarios`
- **Migration correspondente:** ex: `20260610_0023_descricao.py` (ou "nenhuma" se for pontual)

```sql
-- SQL aqui
```
```

---

## Pendente

### [2026-06-06] Ajuste de roles — criação do ADMIN e normalização dos perfis

- **Data de envio:** 2026-06-06
- **Enviado por:** Samuel Fortes
- **Status:** Pendente
- **Tabela(s) afetada(s):** `usuarios`
- **Motivo:** Introdução do role `ADMIN` (maior nível de acesso) e normalização dos perfis existentes: Samuel vira ADMIN, todos os não-PROFISSIONAIs viram GESTOR.
- **Onde é usado no código:** `app/utils/deps.py` → `get_current_admin_user`; `app/api/routes/auth_routes.py` → endpoints `/auth/admin/*`
- **Migration correspondente:** nenhuma (coluna `role` já é `String(20)`, valor `ADMIN` é novo mas sem DDL necessário)

```sql
UPDATE usuarios
SET role = CASE
  WHEN email = 'samuelfurtadofortes@gmail.com' THEN 'ADMIN'
  ELSE 'GESTOR'
END
WHERE role NOT IN ('PROFISSIONAL', 'ACS');
```

---

## Histórico

> Todos os scripts abaixo já foram executados no Supabase.

*(Nenhum script anterior registrado)*
