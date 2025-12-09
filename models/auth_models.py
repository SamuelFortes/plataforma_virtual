#Arquivo com todas as classes do nosso BD
#ORM -> Escreve uma classe, como se fosse POO, e ele traduz para SQL
from sqlalchemy import create_engine, Column, String, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import declarative_base

#criando conexão com o bd
link_DB = ""
db = create_engine(link_DB)

#Criando a base do bd
base = declarative_base()

#Criar classes/tabelas do BD
#usuarios
class Usuario(base):
    __tablename__ = "usuarios"
    id = Column("id", Integer)
    nome = Column("nome", String)
    email = Column("email", String)
    senha = Column("senha", String)
    tipo_usuario = Column("tipo_usuario", String)
    cpf = Column("cpf", String)

#profissionais_ubs
class ProfissionalUbs(base):
    __tablename__ = "Profissionais"
    id = Column("id", Integer)
    usuario_id = ("usuario_id", ForeignKey)
    cargo = ("cargo", String)
    registro_profissional = Column("registro_profissional", String)
    ubs_id = Column("ubs_id", Integer)

#ubs
class Ubs(base):
    __tablename__ = "UBSs"
    id = Column("id", Integer)
    nome = Column("nome", String)
    endereco = Column("endereco", String)
    telefone = Column("telefone", String)

#cidadaos = paciente do SUS, que pode ou não ter acesso ao sistema.
class Cidadaos(base):
    __tablename__ = "Cidadaos"
    id = Column("id", Integer)
    nome = Column("nome", String)
    cpf = Column("cpf", String)
    telefone = Column("telefone", String)
    email = Column("email", String)
    endereco = Column("endereco", String)

#executa a criação dos metadados do seu banco -> cria de fato o banco de dados
