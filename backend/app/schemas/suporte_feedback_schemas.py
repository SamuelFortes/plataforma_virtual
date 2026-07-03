from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class SuporteFeedbackCreate(BaseModel):
    assunto: str
    mensagem: str


class SuporteFeedbackUpdateStatus(BaseModel):
    status: str


class SuporteFeedbackEncerrar(BaseModel):
    encerrado: bool


class FeedbackMensagemCreate(BaseModel):
    conteudo: str


class FeedbackMensagemResponse(BaseModel):
    id: int
    feedback_id: int
    autor_id: int
    conteudo: str
    created_at: datetime
    nome_autor: Optional[str] = None
    role_autor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SuporteFeedbackResponse(BaseModel):
    id: int
    usuario_id: int
    assunto: str
    mensagem: str
    status: str
    encerrado: bool = False
    created_at: datetime
    nome_usuario: Optional[str] = None
    email_usuario: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
