# Manual de Perfis e Acesso: Como Funcionam os Tipos de Usuários

Este guia prático explica como funcionam os perfis de acesso da plataforma virtual, detalhando as permissões de cada tipo de usuário e como realizar alterações de perfil ou cargo.

---

## 1. Como Acessar a Plataforma

Qualquer usuário pode acessar a plataforma utilizando uma das duas formas:

1. **E-mail e Senha:** Login tradicional com as credenciais cadastradas pelo usuário.
   * *Segurança:* Se o usuário errar a senha 5 vezes seguidas, a conta é suspensa temporariamente por 15 minutos para proteção de dados.
2. **Entrar com o Google:** Login rápido utilizando uma conta Google existente.
   * Se o usuário ainda não tiver cadastro na plataforma, uma nova conta sob o perfil de **Cidadão Comum (USER)** será gerada automaticamente ao logar com o Google pela primeira vez.

---

## 2. Os Tipos de Usuário (Perfis de Acesso)

A plataforma organiza os usuários em quatro níveis, dependendo da sua função na Unidade Básica de Saúde (UBS):

### 👤 Cidadão / Usuário Geral (`USER`)
* **Quem é:** Moradores da comunidade que utilizam o sistema para agendar consultas e ler materiais de saúde.
* **Cargo:** Não possui cargo (por exemplo: não é "Médico" nem "Enfermeiro" no sistema).
* **O que pode fazer:** Visualizar informações da sua UBS, ler materiais educativos e agendar consultas.

### 🩺 Profissional de Saúde (`PROFISSIONAL`)
* **Quem é:** Médicos, Enfermeiros, Educadores Físicos, ACS, Dentistas, Recepcionistas, etc.
* **Cargo:** Possui obrigatoriamente um cargo definido e um número de conselho ou registro profissional (ex: CRM, COREN, CREF).
* **O que pode fazer:** Realizar diagnósticos da comunidade, preencher cronogramas de atividades, gerenciar agendas de atendimento e cadastrar materiais de orientação.

### 👔 Gestor da UBS (`GESTOR`)
* **Quem é:** Coordenadores, diretores ou gerentes administrativos da UBS.
* **Cargo:** Gestor geral da unidade.
* **O que pode fazer:** Montar equipes de trabalho, organizar as microáreas da UBS e avaliar (aprovar/rejeitar) os pedidos de acesso enviados pelos profissionais de saúde.

### ⚙️ Administrador do Sistema (`ADMIN`)
* **Quem é:** Equipe de suporte técnico e gerenciamento global do sistema.
* **O que pode fazer:** Acesso irrestrito às configurações do sistema, incluindo o **Painel Administrativo** para alterar as permissões de qualquer usuário, editar cargos e ativar/desativar contas.

---

## 3. Mudança de Perfil (Promoções e Rebaixamentos)

A promoção de um usuário comum (`USER`) para um perfil de trabalho (`PROFISSIONAL` ou `GESTOR`) ocorre de dois modos:

### A. Solicitação pelo Próprio Profissional (Auto-serviço)
Para profissionais de saúde que acabaram de criar uma conta comum:
1. O profissional clica no menu do seu perfil (canto superior direito) e escolhe **"Solicitar acesso profissional"**.
2. Um formulário se abre para que ele selecione seu **Cargo** (ex: Médico, ACS, Enfermeiro) e digite o seu **Registro Profissional** (CRM, CREF, etc.).
3. O **Gestor da UBS** (ou um Administrador) visualiza essa solicitação na tela de pendências e:
   * **Se Aprovada:** O profissional ganha acesso imediato às ferramentas de trabalho e seu cargo/registro são confirmados no sistema.
   * **Se Rejeitada:** O papel dele continua como Cidadão (`USER`). O Gestor deve informar o motivo da rejeição para que o profissional possa corrigir as informações e enviar a solicitação novamente.

### B. Ajustes Diretos pelo Administrador (Painel Administrativo)
Através do Painel, o Administrador Geral pode ajustar permissões e corrigir perfis a qualquer momento:

* **Promover ou Mudar Permissões:** O Admin clica no papel desejado (ex: `PROFISSIONAL`, `GESTOR`) ao lado do nome do usuário. Se mudar para `PROFISSIONAL`, o sistema exige a seleção do cargo correto a partir de um menu de seleção (dropdown).
* **Alterar Cargo de um Profissional:** Caso um profissional mude de especialidade ou função, o Admin pode clicar no ícone de lápis (editar) ao lado do cargo dele e selecionar o novo cargo na lista.
* **Rebaixar para Cidadão (`USER`):** Se um profissional for desligado ou voltar a ser um usuário comum, o Admin clica em `USER`. Automaticamente:
  * O cargo dele é limpo (pois cidadãos comuns não possuem cargos).
  * Seus vínculos como profissional ativo na UBS são desativados.
  * O histórico de solicitações dele é zerado, **permitindo que ele faça novos pedidos de acesso profissional no futuro** se necessário.
