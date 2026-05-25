import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.analisis import Analisis
from models.entrega import Entrega, EstadoEntrega
from models.tema import Tema
from schemas.schemas import AnalisisRead
from services.ai_engine import analizar_entrega

router = APIRouter(prefix="/analisis", tags=["Análisis IA"])


@router.post("/{entrega_id}", response_model=AnalisisRead, status_code=201)
async def analizar(entrega_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    if not entrega.contenido_extraido:
        raise HTTPException(status_code=400, detail="La entrega no tiene texto extraído")
    if entrega.analisis:
        raise HTTPException(status_code=400, detail="Esta entrega ya fue analizada")

    # Obtener temario del curso
    temas = db.query(Tema).filter(Tema.curso_id == entrega.curso_id).order_by(Tema.orden).all()
    nombres_temas = [t.nombre for t in temas]
    if not nombres_temas:
        raise HTTPException(status_code=400, detail="El curso no tiene temas definidos")

    # Llamar al motor de IA
    try:
        resultado = await analizar_entrega(entrega.contenido_extraido, nombres_temas)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error del motor de IA: {str(e)}")

    # Guardar análisis en BD
    nuevo = Analisis(
        entrega_id=entrega_id,
        estudiante_id=entrega.estudiante_id,
        curso_id=entrega.curso_id,
        temas_detectados=json.dumps(resultado.get("temas_detectados", []), ensure_ascii=False),
        nivel_dominio=resultado.get("nivel_dominio", 0),
        fortalezas=json.dumps(resultado.get("fortalezas", []), ensure_ascii=False),
        debilidades=json.dumps(resultado.get("debilidades", []), ensure_ascii=False),
        siguiente_tema_zdp=resultado.get("siguiente_tema_zdp", ""),
        resumen_ia=resultado.get("resumen", ""),
        proveedor_ia=resultado.get("proveedor_ia", ""),
        modelo_ia=resultado.get("modelo_ia", ""),
    )
    db.add(nuevo)

    entrega.estado = EstadoEntrega.analyzed
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/entrega/{entrega_id}", response_model=AnalisisRead)
def obtener_analisis(entrega_id: int, db: Session = Depends(get_db)):
    analisis = db.query(Analisis).filter(Analisis.entrega_id == entrega_id).first()
    if not analisis:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    return analisis


@router.get("/estudiante/{estudiante_id}", response_model=list[AnalisisRead])
def analisis_por_estudiante(estudiante_id: int, db: Session = Depends(get_db)):
    return db.query(Analisis).filter(Analisis.estudiante_id == estudiante_id).all()
