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

Como o Login da Google exige HTTPS e a correspondência exata de domínios, você deve configurar o seu ambiente local para usar o domínio de desenvolvimento (`duckdns.org`) com um certificado de segurança válido. **Cada desenvolvedor deve realizar este processo em sua própria máquina.**

1.  **Configurar o Arquivo Hosts (Windows):**
    * Abra o **Bloco de Notas** como Administrador.
    * Abra o arquivo: `C:\Windows\System32\drivers\etc\hosts`.
    * Adicione a seguinte linha no final do arquivo (Não apague outras configurações existentes):
      ```text
      127.0.0.1   plataforma-virtual-local.duckdns.org
      ```
    * Salve o arquivo e rode `ipconfig /flushdns` no PowerShell para limpar o cache.

2.  **Gerar Certificados SSL Locais:**
    * Com o `mkcert` instalado na sua máquina, abra o terminal na pasta raiz do projeto.
    * Instale a autoridade certificadora na sua máquina (clique em "Sim" se o Windows perguntar):
      ```powershell
      mkcert -install
      ```
    * Gere os certificados direcionando-os para dentro da pasta do frontend:
      ```powershell
      cd frontend-react
      mkcert plataforma-virtual-local.duckdns.org localhost 127.0.0.1
      ```
    * *Nota:* O arquivo `.gitignore` já está configurado para ignorar os arquivos `*.pem`, garantindo que chaves privadas não subam para o repositório.

3.  **Ajustar as Variáveis de Ambiente (`.env`):**
    Certifique-se de que o seu `.env` do backend possua as URLs corretas utilizando `https://` e o domínio virtual:
    ```env
    FRONTEND_URL=[https://plataforma-virtual-local.duckdns.org:5173](https://plataforma-virtual-local.duckdns.org:5173)
    BACKEND_URL=[https://plataforma-virtual-local.duckdns.org:8000](https://plataforma-virtual-local.duckdns.org:8000)
    GOOGLE_REDIRECT_URI=[https://plataforma-virtual-local.duckdns.org:5173/api/auth/google/callback](https://plataforma-virtual-local.duckdns.org:5173/api/auth/google/callback)
    ```

4.  **Inicie o servidor de desenvolvimento:**
    Na pasta `frontend-react`, execute:
    ```bash
    npm run dev
    ```
    > **Atenção:** Para testar o login corretamente, acesse a aplicação **exclusivamente** pela URL segura: `https://plataforma-virtual-local.duckdns.org:5173/` (Não utilize `localhost`).

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