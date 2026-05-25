from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Tema(Base):
    __tablename__ = "temas"

    id = Column(Integer, primary_key=True, index=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    peso_porcentual = Column(Float, default=0.0)
    orden = Column(Integer, default=1)

    curso = relationship("Curso", back_populates="temas")
    entregas = relationship("Entrega", back_populates="tema")
