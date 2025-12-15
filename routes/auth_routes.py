from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from database import get_db
from models.auth_models import Usuario, ProfissionalUbs
from services.email_service import enviar_confirmacao_cadastro


auth_router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=100)
    cpf: str = Field(..., min_length=11, max_length=14)


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    cpf: str
    is_profissional: bool

    class Config:
        from_attributes = True


class ProfissionalCreate(BaseModel):
    usuario_id: int
    cargo: str
    registro_profissional: str


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


@auth_router.post("/sign-up", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(payload: UsuarioCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Verifica email duplicado
    result = await db.execute(select(Usuario).filter(Usuario.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    # Verifica CPF duplicado
    result = await db.execute(select(Usuario).filter(Usuario.cpf == payload.cpf))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")

    user = Usuario(
        nome=payload.nome,
        email=payload.email,
        cpf=payload.cpf,
        senha=hash_password(payload.senha),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Envia email de confirmação em background
    background_tasks.add_task(enviar_confirmacao_cadastro, user.email, user.nome)

    return UsuarioOut(
        id=user.id,
        nome=user.nome,
        email=user.email,
        cpf=user.cpf,
        is_profissional=False,
    )


@auth_router.post("/login")
async def autenticar_usuario(payload: UsuarioLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).filter(Usuario.email == payload.email))
    user = result.scalars().first()
    
    if not user or not verify_password(payload.senha, user.senha):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    result = await db.execute(select(ProfissionalUbs).filter(ProfissionalUbs.usuario_id == user.id))
    prof = result.scalars().first()

    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "cpf": user.cpf,
        "is_profissional": bool(prof),
        "message": "Login realizado",
    }


@auth_router.post("/profissionais", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def cadastrar_profissional(payload: ProfissionalCreate, db: AsyncSession = Depends(get_db)):
    user = await db.get(Usuario, payload.usuario_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    result = await db.execute(select(ProfissionalUbs).filter(ProfissionalUbs.usuario_id == payload.usuario_id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Usuário já é profissional")

    result = await db.execute(select(ProfissionalUbs).filter(ProfissionalUbs.registro_profissional == payload.registro_profissional))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Registro profissional já cadastrado")

    prof = ProfissionalUbs(
        usuario_id=payload.usuario_id,
        cargo=payload.cargo,
        registro_profissional=payload.registro_profissional,
    )
    db.add(prof)
    await db.commit()
    await db.refresh(user)

    return UsuarioOut(
        id=user.id,
        nome=user.nome,
        email=user.email,
        cpf=user.cpf,
        is_profissional=True,
    )