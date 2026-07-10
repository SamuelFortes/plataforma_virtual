from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    dados_para_codificar = data.copy()
    if expires_delta:
        expiracao = datetime.utcnow() + expires_delta
    else:
        expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_para_codificar.update({"exp": expiracao})
    jwt_codificado = jwt.encode(dados_para_codificar, SECRET_KEY, algorithm=ALGORITHM)
    return jwt_codificado

def verify_token(token: str):
    try:
        carga_util = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return carga_util
    except JWTError:
        return None


# ─── Token de recuperação de senha ───────────────────────────────────
# Token dedicado (purpose="password_reset") para não ser aceito como token
# de login. Expiração curta, configurável via env.
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))


def create_password_reset_token(user_id: int) -> str:
    expiracao = datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)
    dados = {"sub": str(user_id), "purpose": "password_reset", "exp": expiracao}
    return jwt.encode(dados, SECRET_KEY, algorithm=ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[int]:
    """Valida o token de reset e retorna o user_id, ou None se inválido/expirado."""
    try:
        carga_util = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if carga_util.get("purpose") != "password_reset":
        return None
    sub = carga_util.get("sub")
    if sub is None:
        return None
    try:
        return int(sub)
    except (TypeError, ValueError):
        return None
