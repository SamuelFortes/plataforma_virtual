# Plataforma Virtual de Gestão para a APS

Protótipo de uma plataforma para apoiar a gestão da Atenção Primária à Saúde (APS), com foco em integração de dados, automação de processos e suporte à decisão clínica e administrativa.

## Stack Tecnológica

### Backend
- **FastAPI** - Framework web moderno e rápido
- **PostgreSQL 16** - Banco de dados
- **SQLAlchemy 2.0** - ORM async
- **asyncpg** - Driver PostgreSQL assíncrono
- **Python 3.13**

### Frontend
- **React 18**
- **Vite** - Build tool
- **React Router** - Roteamento

## Como Rodar a Aplicação

### Pré-requisitos
- Python 3.13+
- Node.js 18+
- PostgreSQL 16+ instalado localmente

### 1. Banco de Dados (PostgreSQL)

Certifique-se de que o PostgreSQL está instalado e rodando localmente.

#### Criar o banco de dados:

```bash
psql -U postgres
CREATE DATABASE plataforma_digital;
\q
```

#### Configurar variáveis de ambiente:

Copie o arquivo `.env.example` para `.env` e configure com suas credenciais locais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=plataforma_digital
```

### 2. Backend (FastAPI)

#### Criar ambiente virtual

```bash
python -m venv venv
```

#### Ativar ambiente virtual

**Windows (PowerShell/CMD):**
```bash
venv\Scripts\activate
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

#### Instalar dependências

```bash
pip install -r requirements.txt
```

#### Rodar o servidor

```bash
uvicorn main:app --reload
```

O backend estará disponível em: **http://127.0.0.1:8000**

- API Docs (Swagger): http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/health

### 3. Frontend (React)

#### Instalar dependências

```bash
cd frontend-react
npm install
```

#### Rodar o servidor de desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: **http://localhost:5173**

## Estrutura do Projeto

```
plataforma_digital/
├── main.py                 # Entry point do FastAPI
├── database.py            # Configuração do banco de dados
├── requirements.txt       # Dependências Python
├── .env                   # Variáveis de ambiente (criar a partir do .env.example)
├── .env.example           # Template de variáveis de ambiente
├── models/               # Modelos SQLAlchemy
│   └── auth_models.py
├── routes/               # Rotas da API
│   └── auth_routes.py
└── frontend-react/       # Aplicação React
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── utils/
    └── package.json
```

## Funcionalidades Principais

- Integrar dados relevantes da rede de APS
- Automatizar processos de gestão (agenda, encaminhamentos, fluxos)
- Monitorar indicadores epidemiológicos e operacionais
- Apoiar a tomada de decisão nas Unidades Básicas de Saúde

## Objetivos do Protótipo

- Validar fluxos de gestão e visualizações úteis para equipes de APS
- Garantir rastreabilidade de dados e segurança das informações
- Facilitar o acompanhamento de metas e indicadores de saúde populacional

## Comandos Úteis

### Parar os serviços

**Backend:** `Ctrl+C` no terminal do uvicorn

**Frontend:** `Ctrl+C` no terminal do vite

### Acessar o PostgreSQL via terminal

```bash
psql -U postgres -d plataforma_digital
```

## Próximos Passos

- Mapear fontes de dados e padrões de integração (ex.: CNES, e-SUS)
- Desenhar telas iniciais para visualização de indicadores e fila de atendimentos
