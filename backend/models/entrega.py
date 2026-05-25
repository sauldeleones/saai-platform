from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class TipoArchivo(str, enum.Enum):
    code = "code"
    document = "document"
    presentation = "presentation"
    image = "image"


class EstadoEntrega(str, enum.Enum):
    pending = "pending"
    analyzed = "analyzed"


class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    tema_id = Column(Integer, ForeignKey("temas.id"), nullable=True)

    nombre_archivo = Column(String(300), nullable=False)
    tipo_archivo = Column(Enum(TipoArchivo), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    contenido_extraido = Column(Text)

    fecha_entrega = Column(DateTime, server_default=func.now())
    estado = Column(Enum(EstadoEntrega), default=EstadoEntrega.pending)

    estudiante = relationship("Estudiante", back_populates="entregas")
    curso = relationship("Curso", back_populates="entregas")
    tema = relationship("Tema", back_populates="entregas")
    analisis = relationship("Analisis", back_populates="entrega", uselist=False)
