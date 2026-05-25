from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Estudiante(Base):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)

    curso = relationship("Curso", back_populates="estudiantes")
    entregas = relationship("Entrega", back_populates="estudiante")
    analisis = relationship("Analisis", back_populates="estudiante")
    evaluaciones = relationship("Evaluacion", back_populates="estudiante")
