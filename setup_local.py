"""Script para criar o banco SQLite local e o usuario admin."""
import sqlite3
from passlib.context import CryptContext

db_path = "dev.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# ---- TABELAS ----

c.execute("""CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    cargo VARCHAR(100),
    welcome_email_sent BOOLEAN DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT 1,
    tentativas_login INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    cargo VARCHAR(100) NOT NULL,
    registro_professional VARCHAR(50) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(200) NOT NULL,
    ip_address VARCHAR(45),
    sucesso BOOLEAN NOT NULL,
    motivo VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS professional_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
    cargo VARCHAR(100) NOT NULL,
    registro_professional VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by_user_id INTEGER REFERENCES usuarios(id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL REFERENCES usuarios(id),
    nome_ubs VARCHAR(255) NOT NULL,
    nome_relatorio VARCHAR(255),
    cnes VARCHAR(32) NOT NULL,
    area_atuacao TEXT NOT NULL,
    numero_habitantes_ativos INTEGER NOT NULL DEFAULT 0,
    numero_microareas INTEGER NOT NULL DEFAULT 0,
    numero_familias_cadastradas INTEGER NOT NULL DEFAULT 0,
    numero_domicilios INTEGER NOT NULL DEFAULT 0,
    domicilios_rurais INTEGER,
    data_inauguracao DATE,
    data_ultima_reforma DATE,
    descritivos_gerais TEXT,
    observacoes_gerais TEXT,
    outros_servicos TEXT,
    periodo_referencia VARCHAR(50),
    identificacao_equipe VARCHAR(100),
    responsavel_nome VARCHAR(255),
    responsavel_cargo VARCHAR(255),
    responsavel_contato VARCHAR(255),
    fluxo_agenda_acesso TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    submitted_at DATETIME,
    submitted_by INTEGER REFERENCES usuarios(id),
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ubs_id, service_id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size_bytes INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    section VARCHAR(50),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    nome_indicador VARCHAR(255) NOT NULL,
    valor NUMERIC(18,4) NOT NULL,
    meta NUMERIC(18,4),
    tipo_valor VARCHAR(40) DEFAULT 'PERCENTUAL',
    periodo_referencia VARCHAR(100) NOT NULL,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS professional_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    cargo_funcao VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    tipo_vinculo VARCHAR(50),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS territory_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL UNIQUE REFERENCES ubs(id) ON DELETE CASCADE,
    descricao_territorio TEXT NOT NULL,
    potencialidades_territorio TEXT,
    riscos_vulnerabilidades TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_needs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL UNIQUE REFERENCES ubs(id) ON DELETE CASCADE,
    problemas_identificados TEXT NOT NULL,
    necessidades_equipamentos_insumos TEXT,
    necessidades_especificas_acs TEXT,
    necessidades_infraestrutura_manutencao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id)
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    gut_gravidade INTEGER NOT NULL DEFAULT 1,
    gut_urgencia INTEGER NOT NULL DEFAULT 1,
    gut_tendencia INTEGER NOT NULL DEFAULT 1,
    gut_score INTEGER NOT NULL DEFAULT 1,
    is_prioritario BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES ubs_problems(id) ON DELETE CASCADE,
    objetivo TEXT NOT NULL,
    metas TEXT,
    responsavel VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'PLANEJADO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS ubs_intervention_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intervention_id INTEGER NOT NULL REFERENCES ubs_interventions(id) ON DELETE CASCADE,
    acao TEXT NOT NULL,
    prazo DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANEJADO',
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES usuarios(id),
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    data_hora DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADO',
    observacoes TEXT,
    confirmacao_enviada DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS bloqueios_agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    motivo VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS cronograma_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'OUTRO',
    local VARCHAR(255),
    inicio DATETIME NOT NULL,
    fim DATETIME,
    dia_inteiro BOOLEAN NOT NULL DEFAULT 0,
    observacoes TEXT,
    recorrencia VARCHAR(20) NOT NULL DEFAULT 'NONE',
    recorrencia_intervalo INTEGER NOT NULL DEFAULT 1,
    recorrencia_fim DATE,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS microareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COBERTA',
    populacao INTEGER NOT NULL DEFAULT 0,
    familias INTEGER NOT NULL DEFAULT 0,
    geojson JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS agentes_saude (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    microarea_id INTEGER NOT NULL REFERENCES microareas(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS educational_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ubs_id INTEGER NOT NULL REFERENCES ubs(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(80),
    publico_alvo VARCHAR(80),
    ativo BOOLEAN NOT NULL DEFAULT 1,
    created_by INTEGER REFERENCES usuarios(id),
    updated_by INTEGER REFERENCES usuarios(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
)""")

c.execute("""CREATE TABLE IF NOT EXISTS educational_material_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES educational_materials(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size_bytes INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS suporte_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    assunto VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

c.execute("""CREATE TABLE IF NOT EXISTS cargos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)""")

# ---- CARGOS PADRAO ----
cargos_padrao = [
    "Médico", "Enfermeiro", "Dentista", "Recepcionista",
    "Agente Comunitário de Saúde", "Técnico de Enfermagem",
]
for cargo in cargos_padrao:
    c.execute("INSERT OR IGNORE INTO cargos (nome) VALUES (?)", (cargo,))

# ---- SERVICOS PADRAO ----
servicos = [
    "Programa Saude da Familia", "Atendimento medico", "Atendimento de enfermagem",
    "Atendimento odontologico", "Atendimento de urgencia / acolhimento",
    "Procedimentos (curativos, inalacao, etc.)", "Sala de vacina",
    "Saude da crianca", "Saude da mulher", "Saude do homem", "Saude do idoso",
    "Planejamento familiar", "Pre-natal", "Puericultura",
    "Atendimento a condicoes cronicas (hipertensao, diabetes, etc.)",
    "Programa Saude na Escola (PSE)", "Saude mental",
    "Atendimento multiprofissional (NASF ou equivalente)",
    "Testes rapidos de IST", "Vigilancia epidemiologica",
    "Vigilancia em saude ambiental", "Visitas domiciliares",
    "Atividades coletivas e preventivas", "Grupos operativos (gestantes, tabagismo, etc.)",
]
for s in servicos:
    c.execute("INSERT OR IGNORE INTO services (name) VALUES (?)", (s,))

# ---- USUARIO ADMIN ----
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
hashed = pwd_context.hash("Password123")

c.execute("SELECT id FROM usuarios WHERE email = ?", ("admin@example.com",))
if not c.fetchone():
    c.execute(
        """INSERT INTO usuarios (nome, email, senha, cpf, role, ativo, tentativas_login, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        ("Administrador Local", "admin@example.com", hashed, "11144477735", "GESTOR", 1, 0),
    )
    print("Usuario admin criado com sucesso!")
else:
    print("Usuario admin ja existe.")

conn.commit()
conn.close()

print("\n=== Credenciais do Admin ===")
print("Email: admin@example.com")
print("Senha: Password123")
print("Role:  GESTOR")
