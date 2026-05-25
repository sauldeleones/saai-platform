from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Analisis(Base):
    __tablename__ = "analisis"

    id = Column(Integer, primary_key=True, index=True)
    entrega_id = Column(Integer, ForeignKey("entregas.id"), nullable=False, unique=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)

    # JSON almacenado como texto (SQLite no tiene tipo JSON nativo)
    temas_detectados = Column(Text)   # JSON: [{"tema": "...", "dominio": 75, "evidencia": "..."}]
    nivel_dominio = Column(Float)     # Promedio general 0-100
    fortalezas = Column(Text)         # JSON: ["fortaleza 1", ...]
    debilidades = Column(Text)        # JSON: ["debilidad 1", ...]

    siguiente_tema_zdp = Column(String(200))
    resumen_ia = Column(Text)

    proveedor_ia = Column(String(50))  # "ollama" o "claude"
    modelo_ia = Column(String(100))    # "llama3", "claude-sonnet-4-...", etc.

    fecha_analisis = Column(DateTime, server_default=func.now())

    entrega = relationship("Entrega", back_populates="analisis")
    estudiante = relationship("Estudiante", back_populates="analisis")
    curso = relationship("Curso", back_populates="analisis")
