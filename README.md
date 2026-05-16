# Plataforma Virtual - Gestão de UBS

Este projeto é uma plataforma para gestão e diagnóstico de Unidades Básicas de Saúde (UBS), permitindo a coleta de dados situacionais, solicitações profissionais e agendamentos.

Nota: README atualizado para registrar estabilidade da branch atual e configurações de ambiente de desenvolvimento seguro.

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento em sua máquina.

### 📋 Pré-requisitos

Antes de começar, você precisará ter instalado:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js (LTS)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [mkcert](https://github.com/FiloSottile/mkcert/releases) (Para gerar certificados locais HTTPS)

---

### 🔧 1. Configuração do Backend (API)

O backend é construído com FastAPI e utiliza SQLite por padrão para desenvolvimento local.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/cocaioo/plataforma_virtual.git](https://github.com/cocaioo/plataforma_virtual.git)
    cd plataforma_virtual
    ```

2.  **Crie e ative um ambiente virtual:**
    * **Windows (PowerShell):**
      ```powershell
      python -m venv venv
      .\venv\Scripts\Activate.ps1
      ```
    * **Linux / Mac:**
      ```bash
      python3 -m venv venv
      source venv/bin/activate
      ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Inicialize o Banco de Dados:**
    Este comando criará o arquivo `dev.db` (SQLite) e populará as tabelas iniciais.
    ```bash
    python -m scripts.creates.create_tables
    ```

5.  **Inicie o servidor:**
    ```bash
    uvicorn main:app --reload
    ```
    A API estará disponível em `http://localhost:8000`.
    Você pode acessar a documentação interativa (Swagger) em `http://localhost:8000/docs`.

---

### 💻 2. Configuração do Frontend (React)

O frontend é construído com React + Vite.

1.  **Navegue até a pasta do frontend:**
    ```bash
    cd frontend-react
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

---

### 🔐 3. Configuração de Login Social (Google OAuth no Localhost)

O Google exige HTTPS e domínio exato correspondente ao cadastrado no Google Cloud Console. A solução adotada é usar o domínio `plataforma-virtual-local.duckdns.org` apontando para `127.0.0.1` com um certificado local gerado pelo `mkcert`. **Cada desenvolvedor deve realizar este processo em sua própria máquina.**

> Os passos 3.1 e 3.2 exigem um terminal com **privilégios de Administrador**.

#### 3.1. Instalar o mkcert (terminal como Administrador)

Via **winget** (já vem instalado no Windows 10/11 — recomendado):
```powershell
winget install FiloSottile.mkcert
```

Ou via **Chocolatey** (se já tiver instalado):
```powershell
choco install mkcert -y
```

> Para instalar o Chocolatey: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`

> Após instalar, feche e reabra o terminal de Administrador antes de continuar.

#### 3.2. Configurar o arquivo Hosts e instalar a CA (terminal como Administrador)

```powershell
# Adiciona o domínio local apontando para 127.0.0.1
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1`tplataforma-virtual-local.duckdns.org"

# Limpa o cache DNS
ipconfig /flushdns

# Instala a autoridade certificadora do mkcert no store do Windows
# (o Chrome e o Edge passarão a confiar nos certificados gerados)
mkcert -install
```

#### 3.3. Gerar os certificados SSL (terminal normal, na raiz do projeto)

```powershell
cd frontend-react
mkcert plataforma-virtual-local.duckdns.org localhost 127.0.0.1
```

Isso cria dois arquivos dentro de `frontend-react/`:
- `plataforma-virtual-local.duckdns.org+2.pem` (certificado)
- `plataforma-virtual-local.duckdns.org+2-key.pem` (chave privada)

O `vite.config.js` já está configurado para ler esses arquivos. O `.gitignore` impede que eles subam para o repositório.

#### 3.4. Criar o arquivo `.env` na raiz do projeto

Crie o arquivo `.env` com o conteúdo abaixo. As credenciais do Google (`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`) devem ser obtidas com outro membro da equipe ou no painel do Render:

```env
# Google OAuth — solicite os valores ao responsável pelo projeto
GOOGLE_CLIENT_ID=COLE_AQUI_SEU_CLIENT_ID
GOOGLE_CLIENT_SECRET=COLE_AQUI_SEU_CLIENT_SECRET

# JWT
JWT_SECRET_KEY=gere-uma-chave-segura-com-python-secrets-token-hex-32
JWT_EXPIRE_MINUTES=60

# URLs
# O backend continua em HTTP internamente; o Vite faz proxy de /api → localhost:8000
BACKEND_URL=http://localhost:8000
FRONTEND_URL=https://plataforma-virtual-local.duckdns.org:5173

# URI de callback registrada no Google Cloud Console
# Roteada pelo proxy do Vite — não é necessário SSL no backend
GOOGLE_REDIRECT_URI=https://plataforma-virtual-local.duckdns.org:5173/api/auth/google/callback
```

> Para gerar um `JWT_SECRET_KEY` seguro, rode: `python -c "import secrets; print(secrets.token_hex(32))"`

#### 3.5. Iniciar backend e frontend

```powershell
# Terminal 1 — Backend (na raiz do projeto, com o venv ativado)
uvicorn main:app --reload

# Terminal 2 — Frontend
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

### 📦 4. Build de Produção (Opcional)

Se desejar rodar o projeto de forma integrada (o servidor FastAPI servindo o frontend já compilado):

1.  **Gere o build do frontend:**
    ```bash
    cd frontend-react
    npm run build
    ```
2.  **O FastAPI servirá os arquivos estáticos:**
    Certifique-se de que a pasta `frontend-react/dist` existe. O backend irá servir o app na rota raiz `/`.

---

## 🔑 Primeiro Acesso e Usuário Gestor

Por padrão, novos usuários registrados via interface recebem a role `USER`. Para acessar as funcionalidades de gestão, é necessário um usuário com role `GESTOR`. Existem duas formas de obter este acesso em ambiente de desenvolvimento:

### Opção A: Usando o script automatizado (Recomendado)
Este script cria um usuário administrador padrão ou promove um usuário existente (caso você já tenha se registrado pelo frontend).

1. Execute o script na raiz do projeto:
   ```bash
    python -m scripts.creates.create_admin