# Resumo do Projeto da Plataforma Digital

## 1. Visão Geral

Este documento resume o que já foi desenvolvido no backend e frontend, quais funcionalidades estão prontas, o que ainda falta implementar e quais problemas/erros estão afetando o funcionamento atual.

---

## 2. Backend (FastAPI + PostgreSQL assíncrono)

### 2.1 Arquitetura

- Framework: FastAPI.
- Banco de dados: PostgreSQL.
- Acesso ao banco: SQLAlchemy assíncrono com `asyncpg`.
- Organização de arquivos principais:
  - `main.py`: instancia o app FastAPI, configura CORS, cria tabelas no startup, define rota de health check e inclui routers.
  - `database.py`: configura engine assíncrono, sessão (`AsyncSessionLocal`), `Base` e a dependência `get_db()`.
  - `models/auth_models.py`: modelos ORM `Usuario` e `ProfissionalUbs`, usando o `Base` do `database`.
  - `routes/auth_routes.py`: rotas de autenticação, cadastro de usuário e de profissional.

### 2.2 Conexão com o banco e sessão

Arquivo: `database.py`

- Variáveis de ambiente lidas do `.env`:
  - `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
- Montagem da URL do banco (formato assíncrono):
  - `postgresql+asyncpg://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}`.
- Criação do `engine` assíncrono com `create_async_engine`.
- Criação de `AsyncSessionLocal` com `sessionmaker`, usando `AsyncSession`.
- Dependência `get_db()` (usada nas rotas) que abre uma sessão assíncrona por requisição e garante o fechamento no final.
- `Base = declarative_base()` definido aqui é usado pelos modelos para compartilhar o mesmo `metadata`.

### 2.3 Modelos ORM

Arquivo: `models/auth_models.py`

- Importa `Base` de `database` para garantir que o metadata é único.

**Modelo `Usuario`**
- Tabela: `usuarios`.
- Campos:
  - `id` (PK, autoincremento).
  - `nome` (String, obrigatório).
  - `email` (String, obrigatório, único).
  - `senha` (String, obrigatório, armazenando hash da senha).
  - `cpf` (String, obrigatório, único).
  - `ativo` (Boolean, default `True`).
  - `created_at` (DateTime com timezone, default `now`).
  - `updated_at` (DateTime com timezone, atualizado em updates).

**Modelo `ProfissionalUbs`**
- Tabela: `profissionais`.
- Campos:
  - `id` (PK, autoincremento).
  - `usuario_id` (FK para `usuarios.id`, obrigatório).
  - `cargo` (String, obrigatório).
  - `registro_profissional` (String, obrigatório, único).
  - `ativo` (Boolean, default `True`).
  - `created_at` e `updated_at` semelhantes ao modelo `Usuario`.

### 2.4 App, CORS e criação de tabelas

Arquivo: `main.py`

- Cria a instância do app: `app = FastAPI()`.
- Configuração de CORS via `CORSMiddleware`:
  - `allow_origins` incluindo `http://localhost:5173` e `http://127.0.0.1:5173` (frontend Vite).
  - `allow_methods=["*"]`, `allow_headers=["*"]`, `allow_credentials=True`.
- Evento `startup`:
  - Executa `Base.metadata.create_all` de forma assíncrona:
    ```python
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    ```
  - Garante que as tabelas `usuarios` e `profissionais` sejam criadas ao iniciar a API.
- Evento `shutdown`:
  - `await engine.dispose()` para fechar as conexões do pool.
- Rota `/health`:
  - Usa `get_db()` e executa `SELECT 1` para testar se o banco está acessível.
- Inclui o router de autenticação:
  - `from routes.auth_routes import auth_router`
  - `app.include_router(auth_router)`.

### 2.5 Rotas de autenticação e usuário

Arquivo: `routes/auth_routes.py`

- Usa `AsyncSession` e consultas com `select` (padrão assíncrono correto).
- Utiliza `passlib` com `bcrypt` para hash de senha:
  - `hash_password(raw)` e `verify_password(raw, hashed)`.

**Esquemas Pydantic**
- `UsuarioCreate`:
  - `nome`, `email`, `senha`, `cpf` com validações de tamanho e tipo.
- `UsuarioLogin`:
  - `email`, `senha`.
- `UsuarioOut`:
  - `id`, `nome`, `email`, `cpf`, `is_profissional`.
  - `orm_mode = True` para permitir conversão a partir de objetos ORM.
- `ProfissionalCreate`:
  - `usuario_id`, `cargo`, `registro_profissional`.

**Endpoint: `POST /auth/sign-up`**
- Recebe um `UsuarioCreate`.
- Verifica duplicidade de email:
  - `select(Usuario).filter(Usuario.email == payload.email)`.
- Verifica duplicidade de CPF.
- Cria um novo `Usuario` com senha hasheada.
- Executa `db.add(user)`, `await db.commit()`, `await db.refresh(user)`.
- Chama `enviar_confirmacao_cadastro(user.email, user.nome)` para enviar email de confirmação de cadastro.
- Retorna `UsuarioOut` com `is_profissional=False`.

**Endpoint: `POST /auth/login`**
- Recebe `UsuarioLogin`.
- Busca usuário por email usando `select(Usuario)...`.
- Verifica se a senha está correta com `verify_password`.
- Busca se há um `ProfissionalUbs` ligado ao `usuario_id` daquele usuário.
- Retorna um dicionário com:
  - `id`, `nome`, `email`, `cpf`, `is_profissional`, `message` ("Login realizado").

**Endpoint: `POST /auth/profissionais`**
- Recebe `ProfissionalCreate`.
- Verifica se o usuário existe.
- Verifica se esse usuário já é profissional.
- Verifica se o `registro_profissional` já está cadastrado.
- Cria um `ProfissionalUbs`, faz `commit`, `refresh(user)`.
- Retorna `UsuarioOut` com `is_profissional=True`.

---

## 3. Frontend (React + Vite)

### 3.1 Estrutura geral

- Vite + React configurados em `frontend-react/`.
- Arquivo principal: `frontend-react/src/App.jsx`.
- Navegação usando `react-router-dom`:
  - Rota `/` → componente `Home`.
  - Rota `/register` → componente `Register`.
- `NavBar` é exibida em todas as rotas.

### 3.2 Cliente de API

Arquivo: `frontend-react/src/api.js`

- `API_BASE`:
  - Usa `import.meta.env.VITE_API_BASE_URL` se definido.
  - Caso contrário, padrão `http://localhost:8000`.
- Função genérica `request(path, options)`:
  - Faz `fetch(API_BASE + path)`.
  - Headers com `"Content-Type": "application/json"`.
  - Converte a resposta para JSON (`res.json()`), com `catch` para quando a resposta não é JSON.
  - Se `!res.ok`, tenta extrair `data.detail` ou `data.message` e lança `Error` com a mensagem.
- Métodos expostos:
  - `api.login(payload)` → `POST /auth/login`.
  - `api.signUp(payload)` → `POST /auth/sign-up`.
  - `api.requestCode(email)` e `api.confirmCode(email, code)` → chamam endpoints `/auth/request-code` e `/auth/confirm-code` (ainda não existem no backend; são placeholders para um futuro fluxo de confirmação por código).

### 3.3 Tela de cadastro de usuário

Arquivo: `frontend-react/src/pages/Register.jsx`

- Estado local `form` com os campos:
  - `nome`, `email`, `cpf`, `senha`, `confirmarSenha`.
- Usa `validateRegister` (`frontend-react/src/utils/validation.js`) para validar os dados no frontend.
- `handleSignUp`:
  - `e.preventDefault()`.
  - Roda `validateRegister(form)`;
    - Se houver erros, pega a primeira mensagem e atualiza `status.error`.
  - Se estiver tudo ok, chama `api.signUp` com `{ nome, email, cpf, senha }`.
  - Em caso de sucesso, mostra `"Cadastro concluído! Verifique seu email."`.
  - Em caso de erro, mostra `err.message` retornada pelo backend.
- UI:
  - Formulário com labels e inputs para todos os campos.
  - Botão com estado `loading` (mostra spinner enquanto aguarda a API).
  - Exibição de mensagens de erro (`status.error`) e sucesso (`status.success`).
  - Link para tela de login (rota `/`).

---

## 4. Funcionalidades já implementadas

### 4.1 Backend

- Integração FastAPI + SQLAlchemy assíncrono + `asyncpg`.
- Modelos de dados `Usuario` e `ProfissionalUbs`, com chaves primárias, estrangeiras e restrições de unicidade.
- Criação automática de tabelas no evento `startup`.
- Middleware CORS configurado para permitir o frontend no `localhost:5173`.
- Endpoints funcionando em teoria:
  - `POST /auth/sign-up` → cadastro simples com envio de email de confirmação.
  - `POST /auth/login` → autenticação básica com indicação se o usuário é profissional.
  - `POST /auth/profissionais` → cadastro de perfil de profissional UBS.
  - `GET /health` → verificação de saúde da aplicação e do banco.

### 4.2 Frontend

- Navegação básica entre `Home` e `Register`.
- Tela de cadastro online, integrada ao backend.
- Validação client-side do formulário de registro.
- Tratamento de erros e mensagens de sucesso na interface.

### 4.3 Fluxo principal do cadastro

- Usuário preenche `nome`, `email`, `cpf`, `senha`, `confirmarSenha`.
- Frontend envia dados para `POST /auth/sign-up`.
- Backend:
  - Verifica duplicidade de email e CPF.
  - Hasheia a senha e salva o usuário no banco.
  - Dispara `enviar_confirmacao_cadastro` para enviar email de confirmação.
- Frontend mostra mensagem de sucesso instruindo a conferir o email.

---

## 5. Pendências e bugs conhecidos

### 5.1 API “crachando” / Erros de conexão com o banco

- Depois de ativar a criação de tabelas no `startup`, a aplicação tenta abrir conexão com o Postgres assim que inicia.
- Se o banco **não estiver acessível**, a API pode falhar na inicialização ou logo na primeira requisição.
- Possíveis causas:
  - Serviço do PostgreSQL local não está rodando.
  - Nome do banco (`DB_NAME`) usado na URL não existe de fato.
  - Usuário/senha (`DB_USER`, `DB_PASSWORD`) não batem com o que foi configurado no banco.
  - `DB_HOST`/`DB_PORT` incorretos (por exemplo, diferença entre `localhost` e `127.0.0.1`).
- Consequência:
  - A API cai ("crasha") ao tentar criar as tabelas ou ao atender requisições.
  - O frontend recebe erros do tipo `NetworkError` / "Failed to fetch".

### 5.2 Erros CORS vs. erro real de rede

- A configuração de CORS em `main.py` está correta para permitir o frontend de `localhost:5173`.
- No navegador, às vezes aparece erro de CORS ou `NetworkError`, mas o problema real é:
  - A API não está respondendo (porque não subiu corretamente ou caiu por erro de banco).
- Portanto, o foco para corrigir esse problema é garantir que o banco esteja acessível e que a API esteja saudável, não a configuração de CORS.

### 5.3 Placeholders de confirmação por código

- Em `api.js` existem métodos:
  - `api.requestCode(email)` → chama `/auth/request-code`.
  - `api.confirmCode(email, code)` → chama `/auth/confirm-code`.
- Esses endpoints **não** estão implementados no backend.
- Atualmente, a tela de cadastro não usa esses métodos, então isso não quebra o fluxo principal, mas fica como pendência se quisermos um fluxo de confirmação de email por código no futuro.

### 5.4 Warnings e melhorias futuras

- Pydantic:
  - Aviso sobre `orm_mode` estar deprecado; a nova opção é `from_attributes = True` na `Config` do schema.
  - Não impede o funcionamento, apenas uma melhoria de compatibilidade futura.
- Envio de email:
  - `enviar_confirmacao_cadastro` é chamado de forma síncrona dentro de um endpoint assíncrono.
  - Se o servidor de email estiver lento, isso pode tornar a requisição mais demorada.
  - Futuro: mover o envio de email para tarefa em background (por exemplo, usando `BackgroundTasks` do FastAPI).

---

## 6. Resumo das próximas ações recomendadas

1. **Garantir que o PostgreSQL está rodando localmente**
   - Iniciar o serviço do PostgreSQL no seu sistema.
   - Confirmar que o banco `DB_NAME` existe (criar se necessário).

2. **Configurar o `.env`**
   - Copiar `.env.example` para `.env`.
   - Checar `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
   - Ajustar de acordo com suas credenciais locais do PostgreSQL.

3. **Reiniciar a API e testar `/health`**
   - Rodar `uvicorn main:app --reload`.
   - Acessar `http://localhost:8000/health` para garantir que a API e o banco estão "ok".

4. **Testar o fluxo de cadastro pelo frontend**
   - Acessar a rota `/register` do frontend.
   - Preencher o formulário e verificar se o usuário é criado sem erros.

5. (Opcional, futuro) Implementar fluxo de confirmação por código
   - Criar endpoints `/auth/request-code` e `/auth/confirm-code` no backend.
   - Ajustar o frontend para usar esse fluxo caso seja desejado.
