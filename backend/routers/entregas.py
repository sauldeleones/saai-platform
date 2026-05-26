import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
from models.entrega import Entrega, EstadoEntrega
from models.estudiante import Estudiante
from models.curso import Curso
from models.analisis import Analisis
from schemas.schemas import EntregaRead
from services.file_processor import detectar_tipo, extraer_texto

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/entregas", tags=["Entregas"])


@router.post("/", response_model=EntregaRead, status_code=201)
async def subir_entrega(
    estudiante_id: int = Form(...),
    curso_id: int = Form(...),
    tema_id: int = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validar que existen estudiante y curso
    if not db.query(Estudiante).filter(Estudiante.id == estudiante_id).first():
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if not db.query(Curso).filter(Curso.id == curso_id).first():
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    # Guardar archivo en disco con nombre único
    extension = Path(archivo.filename).suffix
    nombre_unico = f"{uuid.uuid4().hex}{extension}"
    ruta = UPLOADS_DIR / nombre_unico

    contenido_bytes = await archivo.read()
    with open(ruta, "wb") as f:
        f.write(contenido_bytes)

    # Detectar tipo y extraer texto
    tipo = detectar_tipo(archivo.filename)
    texto = extraer_texto(str(ruta), tipo)

    nueva = Entrega(
        estudiante_id=estudiante_id,
        curso_id=curso_id,
        tema_id=tema_id,
        nombre_archivo=archivo.filename,
        tipo_archivo=tipo,
        ruta_archivo=str(ruta),
        contenido_extraido=texto,
        estado=EstadoEntrega.pending,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=list[EntregaRead])
def listar_entregas(db: Session = Depends(get_db)):
    return db.query(Entrega).all()


@router.get("/{entrega_id}", response_model=EntregaRead)
def obtener_entrega(entrega_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    return entrega


@router.delete("/{entrega_id}", status_code=204)
def eliminar_entrega(entrega_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    # Borrar análisis asociado si existe
    analisis = db.query(Analisis).filter(Analisis.entrega_id == entrega_id).first()
    if analisis:
        db.delete(analisis)
    # Borrar archivo del disco
    if entrega.ruta_archivo:
        try:
            Path(entrega.ruta_archivo).unlink(missing_ok=True)
        except Exception:
            pass
    db.delete(entrega)
    db.commit()


@router.get("/{entrega_id}/texto")
def ver_texto_extraido(entrega_id: int, db: Session = Depends(get_db)):
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega no encontrada")
    return {
        "archivo": entrega.nombre_archivo,
        "tipo": entrega.tipo_archivo,
        "caracteres": len(entrega.contenido_extraido or ""),
        "texto": entrega.contenido_extraido,
    }
