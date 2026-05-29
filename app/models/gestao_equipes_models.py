from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Microarea(Base):
    __tablename__ = "microareas"
    __table_args__ = (Index("ix_microareas_ubs_id", "ubs_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    ubs_id = Column(Integer, ForeignKey("ubs.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(100), nullable=False)
    localidades = Column(JSONB().with_variant(JSON, "sqlite"), nullable=False, default=list)
    descricao = Column(Text, nullable=False)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="COBERTA")  # COBERTA | DESCOBERTA
    populacao = Column(Integer, nullable=False, default=0)
    familias = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    ubs = relationship("UBS", backref="microareas")
    agentes = relationship("AgenteSaude", back_populates="microarea")


class AgenteSaude(Base):
    __tablename__ = "agentes_saude"
    __table_args__ = (
        Index("ix_agentes_saude_usuario_id", "usuario_id"),
        Index("ix_agentes_saude_microarea_id", "microarea_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    microarea_id = Column(Integer, ForeignKey("microareas.id", ondelete="SET NULL"), nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    usuario = relationship("Usuario", backref="agente_saude")
    microarea = relationship("Microarea", back_populates="agentes")
