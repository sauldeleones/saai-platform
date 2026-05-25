from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.curso import Curso
from models.tema import Tema
from schemas.schemas import CursoCreate, CursoRead, TemaCreate, TemaRead

router = APIRouter(prefix="/cursos", tags=["Cursos"])


@router.post("/", response_model=CursoRead, status_code=201)
def crear_curso(curso: CursoCreate, db: Session = Depends(get_db)):
    existente = db.query(Curso).filter(Curso.codigo == curso.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un curso con código '{curso.codigo}'")
    nuevo = Curso(**curso.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[CursoRead])
def listar_cursos(db: Session = Depends(get_db)):
    return db.query(Curso).all()


@router.get("/{curso_id}", response_model=CursoRead)
def obtener_curso(curso_id: int, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso


@router.delete("/{curso_id}", status_code=204)
def eliminar_curso(curso_id: int, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    db.delete(curso)
    db.commit()


# ── Temas de un curso ──────────────────────────────────────────────────────

@router.post("/{curso_id}/temas", response_model=TemaRead, status_code=201)
def agregar_tema(curso_id: int, tema: TemaCreate, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    nuevo = Tema(curso_id=curso_id, **tema.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/{curso_id}/temas", response_model=list[TemaRead])
def listar_temas(curso_id: int, db: Session = Depends(get_db)):
    return db.query(Tema).filter(Tema.curso_id == curso_id).order_by(Tema.orden).all()
