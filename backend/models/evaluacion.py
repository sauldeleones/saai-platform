from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class TipoEvaluacion(str, enum.Enum):
    adaptive = "adaptive"
    general = "general"


class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)

    tipo = Column(Enum(TipoEvaluacion), nullable=False)
    preguntas = Column(Text)  # JSON: lista de preguntas con tipo, dificultad, tema

    fecha_generacion = Column(DateTime, server_default=func.now())

    estudiante = relationship("Estudiante", back_populates="evaluaciones")
    curso = relationship("Curso", back_populates="evaluaciones")
