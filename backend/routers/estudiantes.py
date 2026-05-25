from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.estudiante import Estudiante
from models.curso import Curso
from schemas.schemas import EstudianteCreate, EstudianteRead

router = APIRouter(prefix="/estudiantes", tags=["Estudiantes"])


@router.post("/", response_model=EstudianteRead, status_code=201)
def crear_estudiante(estudiante: EstudianteCreate, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == estudiante.curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    existente = db.query(Estudiante).filter(Estudiante.email == estudiante.email).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe un estudiante con email '{estudiante.email}'")
    nuevo = Estudiante(**estudiante.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[EstudianteRead])
def listar_estudiantes(db: Session = Depends(get_db)):
    return db.query(Estudiante).all()


@router.get("/{estudiante_id}", response_model=EstudianteRead)
def obtener_estudiante(estudiante_id: int, db: Session = Depends(get_db)):
    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return estudiante


@router.get("/curso/{curso_id}", response_model=list[EstudianteRead])
def estudiantes_por_curso(curso_id: int, db: Session = Depends(get_db)):
    return db.query(Estudiante).filter(Estudiante.curso_id == curso_id).all()
