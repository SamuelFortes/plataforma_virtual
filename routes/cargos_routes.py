from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.auth_models import Cargo, Usuario
from utils.deps import get_current_active_user, get_current_gestor_user

cargos_router = APIRouter(prefix="/cargos", tags=["cargos"])


class CargoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)


class CargoOut(BaseModel):
    id: int
    nome: str


@cargos_router.get("", response_model=list[CargoOut])
async def listar_cargos(db: AsyncSession = Depends(get_db)):
    """Lista todos os cargos disponíveis (público)."""
    resultado = await db.execute(select(Cargo).order_by(Cargo.nome))
    return resultado.scalars().all()


@cargos_router.post("", response_model=CargoOut, status_code=status.HTTP_201_CREATED)
async def criar_cargo(
    payload: CargoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_gestor_user),
):
    """Cria um novo cargo (somente GESTOR)."""
    resultado = await db.execute(select(Cargo).where(Cargo.nome == payload.nome))
    if resultado.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cargo já existe.")

    cargo = Cargo(nome=payload.nome)
    db.add(cargo)
    await db.commit()
    await db.refresh(cargo)
    return cargo


@cargos_router.delete("/{cargo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remover_cargo(
    cargo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_gestor_user),
):
    """Remove um cargo (somente GESTOR). Impede remoção se há usuários vinculados."""
    cargo = await db.get(Cargo, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado.")

    resultado = await db.execute(
        select(func.count(Usuario.id)).where(Usuario.cargo == cargo.nome)
    )
    count = int(resultado.scalar_one() or 0)
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível remover: {count} usuário(s) utilizam este cargo.",
        )

    await db.delete(cargo)
    await db.commit()
    return None
