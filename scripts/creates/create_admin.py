import os
import sys
import urllib.parse
from passlib.context import CryptContext
from dotenv import load_dotenv

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(base_dir, ".env"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Password123"
ADMIN_NOME = "Administrador Local"
ADMIN_CPF = "11144477735"

def _build_database_url() -> str:
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    name = os.getenv("DB_NAME")

    if all([user, password, host, port, name]):
        safe_password = urllib.parse.quote_plus(password)
        return f"postgresql://{user}:{safe_password}@{host}:{port}/{name}"

    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url.replace("postgresql+psycopg://", "postgresql://").replace("postgres://", "postgresql://")

    return None

db_url = _build_database_url()

if db_url and "sqlite" not in db_url:
    try:
        import psycopg
    except ImportError:
        try:
            import psycopg2 as psycopg
        except ImportError:
            print("Erro: instale psycopg ou psycopg2 (pip install psycopg[binary])")
            sys.exit(1)

    try:
        conn = psycopg.connect(db_url)
        conn.autocommit = False
        cursor = conn.cursor()

        cursor.execute("SELECT id, role FROM usuarios WHERE email = %s", (ADMIN_EMAIL,))
        user = cursor.fetchone()

        if user:
            user_id, current_role = user
            if current_role != "GESTOR":
                cursor.execute("UPDATE usuarios SET role = 'GESTOR' WHERE id = %s", (user_id,))
                conn.commit()
                print(f"[OK] Usuario {ADMIN_EMAIL} ja existia e foi promovido a GESTOR!")
            else:
                print(f"[INFO] Usuario {ADMIN_EMAIL} ja e um GESTOR.")
        else:
            hashed_pwd = hash_password(ADMIN_PASSWORD)
            cursor.execute(
                "INSERT INTO usuarios (nome, email, senha, cpf, role, ativo, tentativas_login, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())",
                (ADMIN_NOME, ADMIN_EMAIL, hashed_pwd, ADMIN_CPF, "GESTOR", True, 0)
            )
            conn.commit()
            print(f"[OK] Novo usuario GESTOR criado com sucesso no PostgreSQL!")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Erro ao conectar/criar no PostgreSQL: {e}")
        sys.exit(1)
else:
    import sqlite3

    db_path = os.path.join(base_dir, "dev.db")
    if not os.path.exists(db_path):
        print(f"Erro: {db_path} não existe. Execute 'python create_tables.py' primeiro.")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, role FROM usuarios WHERE email = ?", (ADMIN_EMAIL,))
        user = cursor.fetchone()

        if user:
            user_id, current_role = user
            if current_role != "GESTOR":
                cursor.execute("UPDATE usuarios SET role = 'GESTOR' WHERE id = ?", (user_id,))
                conn.commit()
                print(f"[OK] Usuario {ADMIN_EMAIL} ja existia e foi promovido a GESTOR!")
            else:
                print(f"[INFO] Usuario {ADMIN_EMAIL} ja e um GESTOR.")
        else:
            hashed_pwd = hash_password(ADMIN_PASSWORD)
            cursor.execute(
                "INSERT INTO usuarios (nome, email, senha, cpf, role, ativo, tentativas_login, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
                (ADMIN_NOME, ADMIN_EMAIL, hashed_pwd, ADMIN_CPF, "GESTOR", 1, 0)
            )
            conn.commit()
            print(f"[OK] Novo usuario GESTOR criado com sucesso no SQLite!")
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        conn.close()

print(f"Login: {ADMIN_EMAIL}")
print(f"Senha: {ADMIN_PASSWORD}")
print(f"Role: GESTOR")
