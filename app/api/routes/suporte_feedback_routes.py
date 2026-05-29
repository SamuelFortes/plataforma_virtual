from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.auth_models import Usuario
from app.models.suporte_feedback_models import SuporteFeedback, FeedbackMensagem, StatusFeedback
from app.schemas.suporte_feedback_schemas import (
    SuporteFeedbackCreate,
    SuporteFeedbackUpdateStatus,
    SuporteFeedbackEncerrar,
    SuporteFeedbackResponse,
    FeedbackMensagemCreate,
    FeedbackMensagemResponse,
)
from app.utils.deps import get_current_user

suporte_feedback_router = APIRouter(tags=["Suporte e Feedback"])


def _is_gestor(user: Usuario) -> bool:
    return (user.role or "USER").upper() == "GESTOR"


def _feedback_response(fb: SuporteFeedback) -> SuporteFeedbackResponse:
    resp = SuporteFeedbackResponse.model_validate(fb)
    if fb.usuario:
        resp.nome_usuario = fb.usuario.nome
        resp.email_usuario = fb.usuario.email
    return resp


@suporte_feedback_router.post(
    "/suporte-feedback",
    response_model=SuporteFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def criar_feedback(
    payload: SuporteFeedbackCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.assunto not in ("duvida", "sugestao", "problema"):
        raise HTTPException(status_code=400, detail="Assunto inválido.")
    if not payload.mensagem or not payload.mensagem.strip():
        raise HTTPException(status_code=400, detail="Mensagem não pode ser vazia.")

    novo = SuporteFeedback(
        usuario_id=current_user.id,
        assunto=payload.assunto,
        mensagem=payload.mensagem.strip(),
        status=StatusFeedback.PENDENTE,
        encerrado=False,
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)

    resp = SuporteFeedbackResponse.model_validate(novo)
    resp.nome_usuario = current_user.nome
    resp.email_usuario = current_user.email
    return resp


@suporte_feedback_router.get(
    "/suporte-feedback",
    response_model=List[SuporteFeedbackResponse],
)
async def listar_feedbacks(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gestor vê todos; outros usuários veem apenas os próprios chamados."""
    stmt = (
        select(SuporteFeedback)
        .options(selectinload(SuporteFeedback.usuario))
        .order_by(SuporteFeedback.created_at.desc())
    )
    if not _is_gestor(current_user):
        stmt = stmt.where(SuporteFeedback.usuario_id == current_user.id)

    result = await db.execute(stmt)
    return [_feedback_response(fb) for fb in result.scalars().all()]


@suporte_feedback_router.patch(
    "/suporte-feedback/{feedback_id}",
    response_model=SuporteFeedbackResponse,
)
async def atualizar_status_feedback(
    feedback_id: int,
    payload: SuporteFeedbackUpdateStatus,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Atualiza status PENDENTE/LIDA (mantido para compatibilidade — apenas GESTOR)."""
    if not _is_gestor(current_user) and current_user.cargo != "Recepcionista":
        raise HTTPException(status_code=403, detail="Acesso restrito.")

    fb = await db.get(SuporteFeedback, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    if payload.status not in (StatusFeedback.PENDENTE, StatusFeedback.LIDA):
        raise HTTPException(status_code=400, detail="Status inválido.")

    fb.status = payload.status
    await db.commit()
    await db.refresh(fb)
    usuario = await db.get(Usuario, fb.usuario_id)
    resp = SuporteFeedbackResponse.model_validate(fb)
    if usuario:
        resp.nome_usuario = usuario.nome
        resp.email_usuario = usuario.email
    return resp


@suporte_feedback_router.patch(
    "/suporte-feedback/{feedback_id}/encerrar",
    response_model=SuporteFeedbackResponse,
)
async def encerrar_feedback(
    feedback_id: int,
    payload: SuporteFeedbackEncerrar,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Encerra ou reabre um chamado (gestor ou autor do chamado)."""
    fb = await db.get(SuporteFeedback, feedback_id, options=[selectinload(SuporteFeedback.usuario)])
    if not fb:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    if not _is_gestor(current_user) and fb.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar este chamado.")

    fb.encerrado = payload.encerrado
    await db.commit()
    await db.refresh(fb)
    return _feedback_response(fb)


@suporte_feedback_router.get(
    "/suporte-feedback/{feedback_id}/mensagens",
    response_model=List[FeedbackMensagemResponse],
)
async def listar_mensagens_feedback(
    feedback_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista mensagens do mini-chat de um chamado."""
    fb = await db.get(SuporteFeedback, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    if not _is_gestor(current_user) and fb.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")

    result = await db.execute(
        select(FeedbackMensagem)
        .options(selectinload(FeedbackMensagem.autor))
        .where(FeedbackMensagem.feedback_id == feedback_id)
        .order_by(FeedbackMensagem.created_at)
    )
    msgs = result.scalars().all()

    response = []
    for msg in msgs:
        r = FeedbackMensagemResponse.model_validate(msg)
        if msg.autor:
            r.nome_autor = msg.autor.nome
            r.role_autor = msg.autor.role
        response.append(r)
    return response


@suporte_feedback_router.post(
    "/suporte-feedback/{feedback_id}/mensagens",
    response_model=FeedbackMensagemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def enviar_mensagem_feedback(
    feedback_id: int,
    payload: FeedbackMensagemCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Envia uma resposta no mini-chat de um chamado."""
    fb = await db.get(SuporteFeedback, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    if not _is_gestor(current_user) and fb.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    if fb.encerrado:
        raise HTTPException(status_code=400, detail="Chamado encerrado. Reabra para enviar mensagens.")

    conteudo = (payload.conteudo or "").strip()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Mensagem não pode ser vazia.")

    msg = FeedbackMensagem(
        feedback_id=feedback_id,
        autor_id=current_user.id,
        conteudo=conteudo,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    r = FeedbackMensagemResponse.model_validate(msg)
    r.nome_autor = current_user.nome
    r.role_autor = current_user.role
    return r
