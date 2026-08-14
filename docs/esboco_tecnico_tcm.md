# Esboço Técnico da Plataforma Meu Território

---

## 1. Respostas diretas aos questionamentos

Antes do detalhamento, as respostas objetivas às quatro perguntas formuladas:

| Pergunta | Resposta |
|---|---|
| **A plataforma foi desenvolvida em JavaScript?** | Parcialmente. A *interface* (o que o usuário vê e clica no navegador) foi desenvolvida em **JavaScript**, com a biblioteca **React**. A *parte que processa e guarda os dados* foi desenvolvida em **Python**. |
| **Foi usado React Native?** | **Não.** React Native serve para criar aplicativos instaláveis em celulares (Android/iOS). A plataforma é uma **aplicação web responsiva**: roda no navegador (Chrome, Edge, Safari) e se adapta automaticamente ao tamanho da tela — computador, tablet ou celular. Não há aplicativo para baixar em loja. |
| **Qual a linguagem de programação? Python?** | **Sim, Python** é a linguagem do servidor (back end), com o framework **FastAPI**. O front end usa **JavaScript**. São, portanto, duas linguagens, cada uma na camada em que é tecnicamente mais adequada. |
| **Para o gerenciamento de dados foi selecionado o PostgreSQL ou outro?** | **PostgreSQL**, sim. É o banco de dados usado em produção, hospedado no serviço **Supabase**. Durante o desenvolvimento em máquina local, os programadores usam um banco mais simples (**SQLite**) apenas para testes, sem impacto no ambiente real. |

---

## 2. O que é a plataforma, em termos funcionais

A Plataforma é um **sistema web para gestão e diagnóstico de Unidades Básicas de Saúde (UBS)**. Ela centraliza, em um único ambiente digital, informações e processos que hoje costumam estar dispersos em planilhas, cadernos e documentos físicos.

Módulos implementados:

1. **Diagnóstico situacional da UBS** — preenchimento estruturado do perfil da unidade (população coberta, número de microáreas, famílias cadastradas, domicílios, serviços ofertados, composição da equipe, perfil do território, indicadores com metas), com **geração automática de relatório em PDF**.
2. **Mapa de problemas e intervenções** — cadastro de problemas identificados, priorização pela **matriz GUT** (Gravidade × Urgência × Tendência) com cálculo automático da pontuação, e vinculação de intervenções, objetivos, metas, responsáveis e ações com prazo e status.
3. **Gestão de equipes e microáreas** — cadastro das microáreas do território (com população, famílias, localidades e situação de cobertura) e vinculação de Agentes Comunitários de Saúde a cada microárea, com relatório próprio em PDF.
4. **Agendamentos** — marcação de consultas por profissional, visualização em calendário e bloqueio de agenda (férias, ausências).
5. **Materiais educativos** — biblioteca digital de arquivos por UBS, organizados por categoria e público-alvo.
6. **Cronograma da unidade** — agenda de eventos e atividades (sala de vacina, farmácia básica, reuniões de equipe), com suporte a recorrência diária, semanal e mensal.
7. **Suporte e feedback** — canal interno de chamados, com troca de mensagens entre usuários e gestores.
8. **Controle de acesso por perfis** — permissões distintas para Administrador, Gestor, Profissional e Usuário.

---

## 3. Arquitetura geral: uma analogia

A plataforma é dividida em três grandes partes, que se comunicam pela internet. Uma analogia com o funcionamento de uma UBS ajuda a entender:

```
   ┌────────────────────────────────────────────────────────┐
   │  FRONT END  —  "o balcão de atendimento"               │
   │  O que aparece na tela: formulários, tabelas, mapas,    │
   │  botões. Roda dentro do navegador do usuário.           │
   │  Tecnologia: JavaScript + React                         │
   └───────────────────────┬────────────────────────────────┘
                           │  pedidos e respostas pela internet
                           │  (protocolo HTTPS, formato JSON)
   ┌───────────────────────▼────────────────────────────────┐
   │  BACK END  —  "a retaguarda técnica"                    │
   │  Recebe os pedidos, verifica quem está pedindo e se     │
   │  tem permissão, aplica as regras (ex.: calcular a       │
   │  pontuação GUT, impedir dois agendamentos no mesmo      │
   │  horário), gera os PDFs e envia e-mails.                │
   │  Tecnologia: Python + FastAPI                           │
   └───────────────────────┬────────────────────────────────┘
                           │  consultas e gravações
   ┌───────────────────────▼────────────────────────────────┐
   │  BANCO DE DADOS  —  "o arquivo permanente"              │
   │  Onde tudo fica guardado de forma organizada e segura.  │
   │  Tecnologia: PostgreSQL (hospedado no Supabase)         │
   └────────────────────────────────────────────────────────┘
```

**Por que separar em camadas?** Pelo mesmo motivo pelo qual uma UBS separa recepção, consultório e arquivo: cada parte pode ser melhorada, corrigida ou substituída sem interromper as demais. Essa separação também permite que, no futuro, um aplicativo de celular nativo seja construído reaproveitando integralmente o back end já existente — sem reescrever regras nem migrar dados.

---

## 4. Front end (a interface do usuário)

| Item | Escolha técnica | Justificativa em linguagem simples |
|---|---|---|
| Linguagem | **JavaScript** | É a única linguagem que todos os navegadores executam nativamente. |
| Biblioteca de interface | **React 18** | Permite montar a tela em "peças" reutilizáveis (um card, um formulário, um calendário) e atualizar somente a parte que mudou, sem recarregar a página inteira. É o padrão de mercado mais adotado. |
| Ferramenta de build | **Vite 7** | Prepara e compacta o código para publicação; agiliza o trabalho do desenvolvedor. |
| Estilização | **Tailwind CSS 3** | Define a aparência (cores, espaçamentos, tipografia) de forma padronizada, garantindo identidade visual coerente e **responsividade** — a mesma tela funciona em celular e em computador. |
| Navegação | **React Router 6** | Controla a troca de telas dentro da aplicação. |
| Mapas | **Leaflet / react-leaflet** | Exibição de mapas para o módulo de território e microáreas. |
| Ícones | **Heroicons** | Conjunto padronizado de ícones. |

**Dimensão atual:** aproximadamente **10 mil linhas** de código de interface, distribuídas em **21 telas** e **9 componentes reutilizáveis**.


---

## 5. Back end (o servidor)

| Item | Escolha técnica | Justificativa em linguagem simples |
|---|---|---|
| Linguagem | **Python 3.12** | Linguagem de sintaxe legível, amplamente usada em saúde, pesquisa e análise de dados; facilita futuras integrações com estatística e ciência de dados. |
| Framework web | **FastAPI 0.115** | Estrutura que organiza a comunicação com o front end. Valida automaticamente todos os dados recebidos e **gera documentação interativa da API** (disponível em `/docs`). |
| Servidor de aplicação | **Uvicorn / Gunicorn** | Programas que mantêm a aplicação no ar e distribuem os atendimentos simultâneos. |
| Comunicação com o banco | **SQLAlchemy 2.0** (modo assíncrono) | Traduz as operações do sistema em comandos de banco de dados, evitando escrever SQL manualmente e reduzindo risco de falhas de segurança. |
| Controle de versão do banco | **Alembic** | Registra cada alteração na estrutura do banco em um arquivo versionado (13 alterações registradas até o momento), permitindo aplicar ou reverter mudanças de forma controlada e auditável. |
| Geração de PDF | **ReportLab 4.2** | Produz os relatórios situacionais e de microáreas em PDF diretamente no servidor, com formatação padronizada. |
| Envio de e-mail | **API Brevo** (com SMTP como alternativa) | Envio de e-mail de boas-vindas e de recuperação de senha. |
| Validação de dados | **Pydantic** | Confere se cada campo recebido tem o formato correto (CPF válido, e-mail válido, data coerente) **antes** de gravar no banco. |

**Organização interna do back end** — arquitetura em camadas, cada uma com responsabilidade única:

```
Requisição do usuário
      ↓
  Routes      → recebe o pedido, confere autenticação e permissão
      ↓
  Services    → aplica as regras de negócio (ex.: cálculo GUT, montagem do PDF)
      ↓
  Models      → representa as tabelas do banco de dados
      ↓
  Schemas     → valida os dados de entrada e formata os de saída
```

**Dimensão atual:** aproximadamente **5,5 mil linhas** de código de servidor, expondo cerca de **100 endpoints** (pontos de comunicação) organizados em 8 domínios funcionais: autenticação, diagnóstico, agendamento, materiais, cronograma, suporte/feedback, gestão de equipes e gestão de UBS.

---

## 6. Banco de dados

### Tecnologia escolhida

**PostgreSQL**, um sistema gerenciador de banco de dados relacional, de código aberto, maduro e de uso consolidado em aplicações de saúde e governo.

**Justificativa da escolha:**

- **Relacional** — os dados ficam organizados em tabelas que se relacionam entre si (uma UBS tem microáreas; cada microárea tem agentes; cada problema tem intervenções). Isso garante **integridade referencial**: o sistema não permite, por exemplo, vincular um agente a uma microárea que não existe.
- **Confiabilidade transacional** — se uma operação falhar no meio (queda de conexão, por exemplo), nada é gravado pela metade.
- **Código aberto e sem custo de licença** — relevante para o contexto de saúde pública.
- **Escalabilidade** — suporta o crescimento do número de UBS e de usuários sem necessidade de troca de tecnologia.

### Estrutura de dados

Cerca de **24 tabelas**, agrupadas por domínio:

| Domínio | Tabelas principais |
|---|---|
| Usuários e acesso | `usuarios`, `profissionais`, `cargos`, `login_attempts`, `professional_requests` |
| Diagnóstico da UBS | `ubs`, `services`, `ubs_services`, `indicators`, `professional_groups`, `territory_profiles`, `ubs_needs` |
| Problemas e intervenções | `ubs_problems`, `ubs_interventions`, `ubs_intervention_actions` |
| Território e equipes | `microareas`, `agentes_saude` |
| Agendamento | `agendamentos`, `bloqueios_agenda` |
| Materiais educativos | `educational_materials`, `educational_material_files` |
| Cronograma | `cronograma_events` |
| Suporte | `suporte_feedback`, `suporte_feedback_mensagens` |

### Isolamento entre unidades (multi-tenant)

A estrutura já prevê **separação lógica dos dados por UBS** (campo `tenant_id` e vínculo de cada registro à sua unidade). Na prática: os dados de uma UBS não se misturam com os de outra, e cada gestor acessa somente a sua unidade. Isso permite que várias unidades usem a mesma plataforma com segurança.

### Ambientes

- **Produção:** PostgreSQL hospedado no **Supabase** (serviço em nuvem que gerencia o PostgreSQL, com backup automático).
- **Desenvolvimento local:** **SQLite** — um banco em arquivo único, usado apenas para que o programador teste na própria máquina. Não guarda dado real de paciente ou de unidade.

---

## 7. Segurança e proteção de dados


| Mecanismo | Como funciona |
|---|---|
| **Senhas nunca armazenadas em texto legível** | As senhas passam por *hash* criptográfico (algoritmo PBKDF2-SHA256, via biblioteca Passlib). Nem os desenvolvedores conseguem ler a senha de um usuário. |
| **Autenticação por token JWT** | Após o login, o servidor emite um "crachá digital" assinado criptograficamente (algoritmo HS256), com **validade de 60 minutos**. Toda requisição posterior apresenta esse crachá; sem ele, o acesso é negado. |
| **Login com Google (OAuth 2.0)** | Alternativa de acesso pela conta institucional Google, sem que a plataforma tenha contato com a senha do usuário. |
| **Controle de acesso por perfil (RBAC)** | Quatro níveis — `ADMIN`, `GESTOR`, `PROFISSIONAL`, `USER`. A verificação é feita **no servidor**, a cada requisição, e não apenas escondendo botões na tela. |
| **Bloqueio após tentativas falhas** | Após **5 tentativas** de login incorretas, a conta é bloqueada por **15 minutos**, mitigando ataques de força bruta. |
| **Limitação de requisições (rate limiting)** | Rotas sensíveis (login, cadastro, recuperação de senha) aceitam no máximo **5 requisições por minuto** por origem. |
| **Registro de auditoria de acesso** | A tabela `login_attempts` registra cada tentativa de login: e-mail, endereço IP, sucesso ou falha e motivo. |
| **Comunicação criptografada (HTTPS)** | Todo o tráfego entre navegador e servidor é cifrado, tanto em produção quanto no ambiente de desenvolvimento. |
| **Token de recuperação de senha dedicado** | O link de redefinição usa um token de finalidade específica e **expiração curta (30 minutos)**, que não pode ser reaproveitado como credencial de login. |
| **Validação de dados de entrada** | Todos os dados são validados no servidor antes da gravação, incluindo validação de dígito verificador de CPF. |
| **Limite de tamanho de arquivo** | Uploads de materiais educativos limitados a **20 MB** por arquivo. |
| **Segredos fora do código** | Senhas de banco, chaves de API e chaves de assinatura ficam em variáveis de ambiente, nunca no código publicado. |
| **Exclusão lógica (*soft delete*)** | Registros de UBS são marcados como excluídos em vez de apagados fisicamente, preservando histórico para fins de auditoria. |

---

## 8. Infraestrutura e hospedagem

| Componente | Serviço |
|---|---|
| Servidor da aplicação (back end + entrega do front end) | **Render.com** |
| Banco de dados PostgreSQL | **Supabase** |
| Autenticação social | **Google Cloud (OAuth 2.0)** |
| Envio de e-mails transacionais | **Brevo** |
| Código-fonte e controle de versão | **Git / GitHub** |

**Modelo de publicação:** *deploy* contínuo — quando uma alteração aprovada é incorporada ao ramo principal do repositório, o Render publica a nova versão automaticamente. Não há instalação em máquina do usuário: basta acessar o endereço da plataforma pelo navegador.

**Monitoramento:** a plataforma expõe um endereço de verificação de saúde (`/health`) que confirma se a aplicação está no ar e se o banco de dados está respondendo.

---

## 9. Processo de desenvolvimento

| Aspecto | Descrição |
|---|---|
| Controle de versão | **Git**, com repositório remoto no GitHub. |
| Período de desenvolvimento | **dezembro de 2025 a julho de 2026** (em andamento). |
| Volume de trabalho registrado | **208 registros de alteração** (*commits*) rastreáveis. |
| Equipe de desenvolvimento | **2 desenvolvedores**. |
| Fluxo de trabalho | Ramificação por funcionalidade (`feat/`), correção (`fix/`) ou refatoração (`refactor/`), integração no ramo `dev` e publicação a partir do ramo `main`. |
| Revisão de código | Toda alteração exige **revisão e aprovação por outro desenvolvedor** antes da incorporação (*pull request*). |
| Padrão de mensagens | **Conventional Commits**, que documenta a natureza de cada alteração. |
| Testes automatizados | **pytest** — conjunto de testes cobrindo os módulos de agendamento, mapa de problemas, materiais e cronograma. |
| Documentação da API | Gerada automaticamente pelo FastAPI, acessível de forma interativa. |
| Metodologia | Desenvolvimento **iterativo e incremental**, com entrega de módulos funcionais em ciclos sucessivos e validação junto à equipe de profissionais de saúde. |

---

## 10. Quadro-resumo da arquitetura


| Camada | Tecnologia | Versão |
|---|---|---|
| Interface (front end) | JavaScript + React | React 18.3.1 |
| Build e empacotamento | Vite | 7.3.6 |
| Estilização e responsividade | Tailwind CSS | 3.4.19 |
| Navegação | React Router | 6.30.4 |
| Mapas | Leaflet / react-leaflet | 1.9.4 / 4.2.1 |
| Servidor (back end) | Python + FastAPI | Python 3.12.10 / FastAPI 0.115.4 |
| Servidor de aplicação | Uvicorn + Gunicorn | 0.30.6 / 26.0.0 |
| Acesso a dados (ORM) | SQLAlchemy (assíncrono) | 2.0.34 |
| Versionamento do banco | Alembic | 1.13.3 |
| Banco de dados (produção) | **PostgreSQL** (via Supabase) | PostgreSQL 17.6 |
| Banco de dados (desenvolvimento) | SQLite | 3.49.1 |
| Autenticação | JWT (HS256) + Google OAuth 2.0 | python-jose 3.3.0 / OAuth 2.0 |
| Criptografia de senha | PBKDF2-SHA256 (Passlib) | 1.7.4 |
| Geração de relatórios PDF | ReportLab | 4.2.5 |
| Envio de e-mail | API Brevo / SMTP | API v3 |
| Hospedagem da aplicação | Render.com | Serviço em nuvem (sem versionamento) |
| Controle de versão do código | Git / GitHub | Git 2.53.0 |
| Testes automatizados | pytest | 8.3.4 |


---


## 11. Glossário para leitores não familiarizados com TI

| Termo | Significado |
|---|---|
| **Front end** | A parte visível do sistema — telas, botões, formulários. Roda no navegador do usuário. |
| **Back end** | A parte invisível — processa dados, aplica regras, controla acesso. Roda no servidor. |
| **API** | Conjunto padronizado de "portas de comunicação" pelas quais o front end conversa com o back end. |
| **Framework** | Estrutura pronta que organiza o desenvolvimento, evitando construir tudo do zero. |
| **Banco de dados relacional** | Sistema que guarda dados em tabelas interligadas, garantindo consistência entre elas. |
| **ORM** | Ferramenta que traduz o código do programa em comandos de banco de dados. |
| **Migration** | Registro versionado de uma alteração na estrutura do banco (nova tabela, novo campo). |
| **JWT** | "Crachá digital" temporário e assinado, entregue ao usuário após o login. |
| **OAuth 2.0** | Protocolo que permite entrar em um sistema usando conta de outro serviço (ex.: Google) sem compartilhar a senha. |
| **Hash de senha** | Transformação irreversível da senha, de modo que ela não possa ser lida nem por quem administra o sistema. |
| **HTTPS** | Versão criptografada da comunicação na internet — impede que dados sejam lidos em trânsito. |
| **Responsivo** | Interface que se adapta automaticamente ao tamanho da tela (computador, tablet, celular). |
| **Deploy** | Ato de publicar uma nova versão do sistema para os usuários. |
| **Commit** | Registro datado e identificado de uma alteração no código. |
| **Multi-tenant** | Arquitetura em que várias organizações (aqui, várias UBS) usam o mesmo sistema com dados isolados entre si. |
| **React Native** | Tecnologia para criar aplicativos instaláveis em celulares. **Não** foi utilizada neste projeto. |

---


*Documento elaborado a partir da análise do código-fonte da plataforma, com auxílio de ferramentas de inteligência artificial. Última verificação: agosto de 2026.*
