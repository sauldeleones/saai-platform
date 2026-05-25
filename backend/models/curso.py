from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    periodo = Column(String(50))
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime, server_default=func.now())

    # Un curso tiene muchos temas y muchos estudiantes
    temas = relationship("Tema", back_populates="curso", cascade="all, delete-orphan")
    estudiantes = relationship("Estudiante", back_populates="curso")
    entregas = relationship("Entrega", back_populates="curso")
    analisis = relationship("Analisis", back_populates="curso")
    evaluaciones = relationship("Evaluacion", back_populates="curso")
