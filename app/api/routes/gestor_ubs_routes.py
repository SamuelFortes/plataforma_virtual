from typing import List
import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select

from app.database import get_db
from app.models.diagnostico_models import UBS
from app.models.auth_models import Usuario
from app.schemas.diagnostico_schemas import GestorUBSItem
from app.utils.deps import get_current_gestor_user

gestor_ubs_router = APIRouter(prefix="/gestor/ubs", tags=["gestor-ubs"])

logger = logging.getLogger(__name__)


def _not_deleted():
    """Filtro robusto: aceita is_deleted=False OU is_deleted=NULL (PostgreSQL)."""
    return or_(UBS.is_deleted.is_(False), UBS.is_deleted.is_(None))


@gestor_ubs_router.get("", response_model=List[GestorUBSItem])
async def list_all_ubs(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_gestor_user),
):
    """Lista todas as UBS cadastradas (não deletadas) para o gestor."""
    resultado = await db.execute(
        select(UBS)
        .where(_not_deleted())
        .order_by(UBS.created_at.desc())
    )
    ubs_list = resultado.scalars().all()

    logger.info("Gestor %s: listando UBS — %d encontrada(s)", current_user.id, len(ubs_list))

    items = []
    for ubs in ubs_list:
        item = GestorUBSItem.model_validate(ubs)
        item.is_active = ubs.id == current_user.active_ubs_id
        items.append(item)

    return items


@gestor_ubs_router.delete("/{ubs_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ubs(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_gestor_user),
):
    """Soft-delete de uma UBS pelo gestor."""
    resultado = await db.execute(
        select(UBS).where(UBS.id == ubs_id, _not_deleted())
    )
    ubs = resultado.scalar_one_or_none()
    if not ubs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="UBS não encontrada")

    ubs.is_deleted = True

    if current_user.active_ubs_id == ubs_id:
        current_user.active_ubs_id = None

    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@gestor_ubs_router.patch("/{ubs_id}/set-active", response_model=GestorUBSItem)
async def set_active_ubs(
    ubs_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_gestor_user),
):
    """Define uma UBS como ativa para o gestor logado."""
    resultado = await db.execute(
        select(UBS).where(UBS.id == ubs_id, _not_deleted())
    )
    ubs = resultado.scalar_one_or_none()
    if not ubs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="UBS não encontrada")

    current_user.active_ubs_id = ubs_id
    await db.commit()
    await db.refresh(ubs)

    item = GestorUBSItem.model_validate(ubs)
    item.is_active = True
    return item
