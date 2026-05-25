import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.evaluacion import Evaluacion, TipoEvaluacion
from models.estudiante import Estudiante
from models.curso import Curso
from schemas.schemas import EvaluacionCreate, EvaluacionRead
from services.exam_generator import crear_evaluacion, construir_perfil_dominio

router = APIRouter(prefix="/evaluaciones", tags=["Evaluaciones"])


@router.post("/", response_model=EvaluacionRead, status_code=201)
async def generar_evaluacion(datos: EvaluacionCreate, db: Session = Depends(get_db)):
    if not db.query(Estudiante).filter(Estudiante.id == datos.estudiante_id).first():
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if not db.query(Curso).filter(Curso.id == datos.curso_id).first():
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    try:
        resultado = await crear_evaluacion(
            datos.estudiante_id, datos.curso_id, datos.tipo.value, db
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error del motor de IA: {str(e)}")

    nueva = Evaluacion(
        estudiante_id=datos.estudiante_id,
        curso_id=datos.curso_id,
        tipo=datos.tipo,
        preguntas=json.dumps(resultado.get("preguntas", []), ensure_ascii=False),
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/{evaluacion_id}", response_model=EvaluacionRead)
def obtener_evaluacion(evaluacion_id: int, db: Session = Depends(get_db)):
    ev = db.query(Evaluacion).filter(Evaluacion.id == evaluacion_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    return ev


@router.get("/{evaluacion_id}/preguntas")
def ver_preguntas(evaluacion_id: int, db: Session = Depends(get_db)):
    ev = db.query(Evaluacion).filter(Evaluacion.id == evaluacion_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    preguntas = json.loads(ev.preguntas) if ev.preguntas else []
    return {
        "evaluacion_id": ev.id,
        "estudiante_id": ev.estudiante_id,
        "tipo": ev.tipo,
        "total_preguntas": len(preguntas),
        "preguntas": preguntas,
    }


@router.get("/estudiante/{estudiante_id}/perfil")
def perfil_dominio(estudiante_id: int, curso_id: int, db: Session = Depends(get_db)):
    """Devuelve el perfil de dominio actual del alumno sin generar examen."""
    perfil = construir_perfil_dominio(estudiante_id, curso_id, db)
    if not perfil:
        return {"mensaje": "Sin análisis previos", "perfil": {}}
    promedio = round(sum(perfil.values()) / len(perfil.values()), 1)
    return {
        "estudiante_id": estudiante_id,
        "curso_id": curso_id,
        "nivel_general": promedio,
        "perfil": perfil,
        "temas_debiles": [t for t, d in perfil.items() if d < 60],
        "temas_fuertes": [t for t, d in perfil.items() if d >= 60],
    }
