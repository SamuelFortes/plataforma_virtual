# Plataforma Virtual - Gestão de UBS

Este projeto é uma plataforma para gestão e diagnóstico de Unidades Básicas de Saúde (UBS), permitindo a coleta de dados situacionais, solicitações profissionais e agendamentos.

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento em sua máquina.

### 📋 Pré-requisitos

Antes de começar, você precisará ter instalado:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js (LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [mkcert](https://github.com/FiloSottile/mkcert/releases) (para gerar certificados locais HTTPS)

---

### 🔧 1. Clonar o repositório

```bash
git clone https://github.com/cocaioo/plataforma_virtual.git
cd plataforma_virtual
```

---

### 🔧 2. Configuração do Backend (API)

O backend é construído com FastAPI e utiliza PostgreSQL (Supabase) como banco de dados.

1. **Crie e ative um ambiente virtual:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / Mac:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Crie o arquivo `.env`** na raiz do projeto (veja a seção 3.4 abaixo para o conteúdo completo).

4. **Inicialize o banco de dados:**
   ```bash
   python -m scripts.creates.create_tables
   ```
   Este comando cria as tabelas e insere os serviços padrão.

5. **Execute as migrations do Alembic** (necessário para aplicar mudanças de esquema):
   ```bash
   alembic upgrade head
   ```

6. **Inicie o servidor:**
   ```bash
   uvicorn main:app --reload
   ```
   A API estará disponível em `http://localhost:8000`.
   Documentação interativa (Swagger): `http://localhost:8000/docs`.

---

### 💻 3. Configuração do Frontend (React)

O frontend é construído com React + Vite.

1. **Navegue até a pasta do frontend:**
   ```bash
   cd frontend-react
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

---

### 🔐 4. Configuração de Login Social (Google OAuth no Localhost)

O Google exige HTTPS e domínio exato correspondente ao cadastrado no Google Cloud Console. A solução adotada é usar o domínio `plataforma-virtual-local.duckdns.org` apontando para `127.0.0.1` com um certificado local gerado pelo `mkcert`. **Cada desenvolvedor deve realizar este processo em sua própria máquina.**

> Os passos 4.1 e 4.2 exigem um terminal com **privilégios de Administrador**.

#### 4.1. Instalar o mkcert (terminal como Administrador)

Via **winget** (recomendado — já vem no Windows 10/11):
```powershell
winget install FiloSottile.mkcert
```

Ou via **Chocolatey** (se já tiver instalado):
```powershell
choco install mkcert -y
```

> Para instalar o Chocolatey: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`

> Após instalar, feche e reabra o terminal de Administrador antes de continuar.

#### 4.2. Configurar o arquivo Hosts e instalar a CA (terminal como Administrador)

```powershell
# Adiciona o domínio local apontando para 127.0.0.1
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1`tplataforma-virtual-local.duckdns.org"

# Limpa o cache DNS
ipconfig /flushdns

# Instala a autoridade certificadora do mkcert no store do Windows
# (Chrome e Edge passarão a confiar nos certificados gerados)
mkcert -install
```

#### 4.3. Gerar os certificados SSL (terminal normal, na raiz do projeto)

```powershell
cd frontend-react
mkcert plataforma-virtual-local.duckdns.org localhost 127.0.0.1
```

Isso cria dois arquivos dentro de `frontend-react/`:
- `plataforma-virtual-local.duckdns.org+2.pem` (certificado)
- `plataforma-virtual-local.duckdns.org+2-key.pem` (chave privada)

O `vite.config.js` já está configurado para ler esses arquivos automaticamente. O `.gitignore` impede que eles subam para o repositório.

#### 4.4. Criar o arquivo `.env` na raiz do projeto

Crie o arquivo `.env` com o conteúdo abaixo. Os valores marcados com `SOLICITAR` devem ser obtidos com outro membro da equipe ou no painel do Render/Supabase:

```env
# Banco de dados PostgreSQL (Supabase) — solicite ao responsável pelo projeto
DATABASE_URL=SOLICITAR
DB_HOST=SOLICITAR
DB_NAME=postgres
DB_PASSWORD=SOLICITAR
DB_PORT=6543
DB_USER=SOLICITAR

# Google OAuth — solicite os valores ao responsável pelo projeto
GOOGLE_CLIENT_ID=SOLICITAR
GOOGLE_CLIENT_SECRET=SOLICITAR

# JWT — gere uma chave segura com: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=gere-uma-chave-segura-aqui
JWT_EXPIRE_MINUTES=60

# URLs (manter exatamente assim para o ambiente local com DuckDNS)
BACKEND_URL=http://localhost:8000
FRONTEND_URL=https://plataforma-virtual-local.duckdns.org:5173

# URI de callback registrada no Google Cloud Console
# Roteada pelo proxy do Vite — não é necessário SSL direto no backend
GOOGLE_REDIRECT_URI=https://plataforma-virtual-local.duckdns.org:5173/api/auth/google/callback

PYTHONPATH=.
```

#### 4.5. Iniciar backend e frontend

```powershell
# Terminal 1 — Backend (na raiz do projeto, com o venv ativado)
uvicorn main:app --reload

# Terminal 2 — Frontend (na pasta frontend-react)
cd frontend-react
npm run dev
```

Acesse a aplicação **exclusivamente** pela URL segura:
```
https://plataforma-virtual-local.duckdns.org:5173/
```

> Não use `https://localhost:5173/` para testar o login com Google — o Google só aceita o domínio exato cadastrado no Cloud Console.

#### Como o fluxo OAuth funciona localmente

```
1. Usuário clica em "Entrar com Google"
2. Backend redireciona para accounts.google.com com redirect_uri = :5173/api/auth/google/callback
3. Google autentica e redireciona de volta para :5173/api/auth/google/callback
4. Vite intercepta /api/* e faz proxy para http://localhost:8000/api/auth/google/callback
5. Backend troca o código por token, busca dados do usuário e redireciona para :5173/auth/callback?token=...
6. Frontend armazena o token e redireciona para a home
```

O backend permanece em HTTP puro — apenas o Vite dev server expõe HTTPS.

---

### 📦 5. Build de Produção (Opcional)

Se desejar rodar o projeto de forma integrada (FastAPI servindo o frontend já compilado):

1. **Gere o build do frontend:**
   ```bash
   cd frontend-react
   npm run build
   ```
2. **O FastAPI servirá os arquivos estáticos:**
   Certifique-se de que a pasta `frontend-react/dist` existe. O backend servirá o app na rota raiz `/`.

---

## 🔑 Primeiro Acesso e Usuário Gestor

Por padrão, novos usuários registrados via interface recebem a role `USER`. Para acessar as funcionalidades de gestão, é necessário um usuário com role `GESTOR`.

### Opção A: Usando o script automatizado (Recomendado)

Este script cria um usuário administrador padrão ou promove um usuário existente (caso você já tenha se registrado pelo frontend com o mesmo e-mail).

Execute na raiz do projeto (com o venv ativado):
```bash
python -m scripts.creates.create_admin
```

As credenciais criadas serão:
| Campo | Valor |
|-------|-------|
| **E-mail** | `admin@example.com` |
| **Senha** | `Password123` |
| **Role** | `GESTOR` |

### Opção B: Promovendo um usuário existente manualmente

Caso já tenha um usuário cadastrado e queira promovê-lo a GESTOR diretamente no banco:

```sql
UPDATE usuarios SET role = 'GESTOR' WHERE email = 'seu@email.com';
```

Execute via painel do Supabase (SQL Editor) ou via `psql`.

---

## 🌐 Acesso de outros desenvolvedores ao ambiente de homologação

O domínio `plataforma-virtual-local.duckdns.org` aponta para o IP público da máquina que está rodando o servidor. Para que outros desenvolvedores acessem a aplicação:

- **Quem roda o servidor** precisa realizar a configuração do arquivo Hosts (passo 4.2) — pois em sua própria máquina o NAT loopback geralmente não funciona.
- **Quem acessa remotamente** (pela internet) não precisa configurar nada, desde que o roteador tenha **port forwarding** da porta `5173` apontando para a máquina que executa o Vite.
- **Quem está na mesma rede local** pode acessar diretamente pelo IP local da máquina (ex: `https://192.168.X.X:5173`), aceitando o aviso de certificado no navegador.
