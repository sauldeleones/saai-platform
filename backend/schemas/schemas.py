from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

from models.entrega import TipoArchivo, EstadoEntrega
from models.evaluacion import TipoEvaluacion


# ─────────────────────────────────────────
# TEMA
# ─────────────────────────────────────────

class TemaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    peso_porcentual: float = 0.0
    orden: int = 1

class TemaRead(TemaCreate):
    id: int
    curso_id: int

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# CURSO
# ─────────────────────────────────────────

class CursoCreate(BaseModel):
    nombre: str
    codigo: str
    periodo: Optional[str] = None
    descripcion: Optional[str] = None

class CursoRead(CursoCreate):
    id: int
    fecha_creacion: Optional[datetime] = None
    temas: list[TemaRead] = []

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# ESTUDIANTE
# ─────────────────────────────────────────

class EstudianteCreate(BaseModel):
    nombre: str
    email: EmailStr
    curso_id: int

class EstudianteRead(EstudianteCreate):
    id: int

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# ENTREGA
# ─────────────────────────────────────────

class EntregaRead(BaseModel):
    id: int
    estudiante_id: int
    curso_id: int
    tema_id: Optional[int] = None
    nombre_archivo: str
    tipo_archivo: TipoArchivo
    ruta_archivo: str
    contenido_extraido: Optional[str] = None
    fecha_entrega: Optional[datetime] = None
    estado: EstadoEntrega

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# ANALISIS
# ─────────────────────────────────────────

class AnalisisRead(BaseModel):
    id: int
    entrega_id: int
    estudiante_id: int
    curso_id: int
    temas_detectados: Optional[str] = None   # JSON string
    nivel_dominio: Optional[float] = None
    fortalezas: Optional[str] = None         # JSON string
    debilidades: Optional[str] = None        # JSON string
    siguiente_tema_zdp: Optional[str] = None
    resumen_ia: Optional[str] = None
    proveedor_ia: Optional[str] = None
    modelo_ia: Optional[str] = None
    fecha_analisis: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────
# EVALUACION
# ─────────────────────────────────────────

class EvaluacionCreate(BaseModel):
    estudiante_id: int
    curso_id: int
    tipo: TipoEvaluacion = TipoEvaluacion.adaptive

    @field_validator("tipo", mode="before")
    @classmethod
    def tipo_valido(cls, v):
        if v not in ("adaptive", "general"):
            raise ValueError("tipo debe ser 'adaptive' o 'general'")
        return v

class EvaluacionRead(EvaluacionCreate):
    id: int
    preguntas: Optional[str] = None   # JSON string
    fecha_generacion: Optional[datetime] = None

    model_config = {"from_attributes": True}
