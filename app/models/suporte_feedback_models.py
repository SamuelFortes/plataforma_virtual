from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class StatusFeedback(str, enum.Enum):
    PENDENTE = "PENDENTE"
    LIDA = "LIDA"


class SuporteFeedback(Base):
    __tablename__ = "suporte_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    assunto = Column(String(50), nullable=False)
    mensagem = Column(Text, nullable=False)
    status = Column(String(20), default=StatusFeedback.PENDENTE, nullable=False)
    encerrado = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", backref="feedbacks")
    respostas = relationship(
        "FeedbackMensagem",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="FeedbackMensagem.created_at",
    )


class FeedbackMensagem(Base):
    __tablename__ = "suporte_feedback_mensagens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    feedback_id = Column(
        Integer, ForeignKey("suporte_feedback.id", ondelete="CASCADE"), nullable=False
    )
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    conteudo = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    feedback = relationship("SuporteFeedback", back_populates="respostas")
    autor = relationship("Usuario")
