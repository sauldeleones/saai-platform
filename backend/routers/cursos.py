import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.curso import Curso
from models.tema import Tema
from models.estudiante import Estudiante
from models.analisis import Analisis
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


@router.get("/{curso_id}/brechas")
def dashboard_brechas(curso_id: int, db: Session = Depends(get_db)):
    """
    Agrega el dominio de todos los alumnos por tema para el mapa de calor.
    Promedia el dominio de TODOS los análisis del alumno en el curso.
    """
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    temas = db.query(Tema).filter(Tema.curso_id == curso_id).order_by(Tema.orden).all()
    estudiantes = db.query(Estudiante).filter(Estudiante.curso_id == curso_id).all()

    resultado_estudiantes = []
    for estudiante in estudiantes:
        analisis_list = (
            db.query(Analisis)
            .filter(Analisis.estudiante_id == estudiante.id, Analisis.curso_id == curso_id)
            .all()
        )

        # Acumular dominio por tema a través de todos los análisis
        acumulado: dict[str, list[float]] = {}
        for a in analisis_list:
            if not a.temas_detectados:
                continue
            for t in json.loads(a.temas_detectados):
                nombre = t.get("tema", "")
                dominio = float(t.get("dominio", 0))
                acumulado.setdefault(nombre, []).append(dominio)

        dominio_por_tema = {
            nombre: round(sum(vals) / len(vals), 1)
            for nombre, vals in acumulado.items()
        }

        valores = list(dominio_por_tema.values())
        nivel_general = round(sum(valores) / len(valores), 1) if valores else 0

        resultado_estudiantes.append({
            "id": estudiante.id,
            "nombre": estudiante.nombre,
            "email": estudiante.email,
            "dominio_por_tema": dominio_por_tema,
            "nivel_general": nivel_general,
            "temas_fuertes": [t for t, d in dominio_por_tema.items() if d >= 60],
            "temas_debiles": [t for t, d in dominio_por_tema.items() if d < 60],
            "total_analisis": len(analisis_list),
        })

    # Promedio de la clase por tema
    promedios_clase = {}
    for tema in temas:
        valores_tema = [
            e["dominio_por_tema"].get(tema.nombre)
            for e in resultado_estudiantes
            if tema.nombre in e["dominio_por_tema"]
        ]
        promedios_clase[tema.nombre] = (
            round(sum(valores_tema) / len(valores_tema), 1) if valores_tema else None
        )

    return {
        "curso": {"id": curso.id, "nombre": curso.nombre, "codigo": curso.codigo},
        "temas": [{"id": t.id, "nombre": t.nombre, "orden": t.orden} for t in temas],
        "estudiantes": resultado_estudiantes,
        "promedios_clase": promedios_clase,
    }


@router.get("/{curso_id}/retroalimentacion/{estudiante_id}")
def retroalimentacion_estudiante(curso_id: int, estudiante_id: int, db: Session = Depends(get_db)):
    """
    Genera la retroalimentación personalizada de un alumno en un curso.
    Agrega fortalezas, debilidades y ZDP de todos sus análisis.
    """
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    estudiante = db.query(Estudiante).filter(Estudiante.id == estudiante_id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    analisis_list = (
        db.query(Analisis)
        .filter(Analisis.estudiante_id == estudiante_id, Analisis.curso_id == curso_id)
        .order_by(Analisis.fecha_analisis.desc())
        .all()
    )

    if not analisis_list:
        return {
            "estudiante": {"id": estudiante.id, "nombre": estudiante.nombre, "email": estudiante.email},
            "curso": {"id": curso.id, "nombre": curso.nombre},
            "sin_datos": True,
        }

    # Agregar fortalezas y debilidades únicas de todos los análisis
    fortalezas_set: set[str] = set()
    debilidades_set: set[str] = set()
    for a in analisis_list:
        if a.fortalezas:
            fortalezas_set.update(json.loads(a.fortalezas))
        if a.debilidades:
            debilidades_set.update(json.loads(a.debilidades))

    # Dominio por tema (mismo cálculo que brechas)
    acumulado: dict[str, list[float]] = {}
    for a in analisis_list:
        if not a.temas_detectados:
            continue
        for t in json.loads(a.temas_detectados):
            nombre = t.get("tema", "")
            dominio = float(t.get("dominio", 0))
            acumulado.setdefault(nombre, []).append(dominio)

    dominio_por_tema = {
        nombre: round(sum(vals) / len(vals), 1)
        for nombre, vals in acumulado.items()
    }
    valores = list(dominio_por_tema.values())
    nivel_general = round(sum(valores) / len(valores), 1) if valores else 0

    # ZDP del análisis más reciente
    siguiente_zdp = analisis_list[0].siguiente_tema_zdp or ""
    resumen_reciente = analisis_list[0].resumen_ia or ""

    temas_curso = db.query(Tema).filter(Tema.curso_id == curso_id).order_by(Tema.orden).all()
    temas_sin_evidencia = [
        t.nombre for t in temas_curso
        if t.nombre not in dominio_por_tema
    ]

    return {
        "estudiante": {"id": estudiante.id, "nombre": estudiante.nombre, "email": estudiante.email},
        "curso": {"id": curso.id, "nombre": curso.nombre},
        "sin_datos": False,
        "nivel_general": nivel_general,
        "total_analisis": len(analisis_list),
        "dominio_por_tema": dominio_por_tema,
        "temas_fuertes": [t for t, d in dominio_por_tema.items() if d >= 60],
        "temas_debiles": [t for t, d in dominio_por_tema.items() if d < 60],
        "temas_sin_evidencia": temas_sin_evidencia,
        "fortalezas": list(fortalezas_set),
        "debilidades": list(debilidades_set),
        "siguiente_tema_zdp": siguiente_zdp,
        "resumen_reciente": resumen_reciente,
        "proveedor_ia": analisis_list[0].proveedor_ia,
        "modelo_ia": analisis_list[0].modelo_ia,
    }
