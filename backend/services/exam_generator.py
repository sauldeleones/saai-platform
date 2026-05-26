"""
Lógica de generación de exámenes adaptativos.
Construye el perfil de dominio del alumno a partir de sus análisis previos
y delega la generación de preguntas al motor de IA.
"""
import json
from sqlalchemy.orm import Session

from models.analisis import Analisis
from models.tema import Tema
from services.ai_engine import generar_examen


def construir_perfil_dominio(estudiante_id: int, curso_id: int, db: Session) -> dict:
    """
    Promedia el dominio por tema de todos los análisis del alumno en el curso.
    Devuelve: {"Tema 1": 75.0, "Tema 2": 40.0, ...}
    """
    analisis_list = (
        db.query(Analisis)
        .filter(
            Analisis.estudiante_id == estudiante_id,
            Analisis.curso_id == curso_id,
        )
        .all()
    )

    acumulado: dict[str, list[float]] = {}
    for a in analisis_list:
        if not a.temas_detectados:
            continue
        temas = json.loads(a.temas_detectados)
        for t in temas:
            nombre = t.get("tema", "")
            dominio = float(t.get("dominio", 0))
            acumulado.setdefault(nombre, []).append(dominio)

    return {
        tema: round(sum(valores) / len(valores), 1)
        for tema, valores in acumulado.items()
    }


async def crear_evaluacion(
    estudiante_id: int,
    curso_id: int,
    tipo: str,
    db: Session,
) -> dict:
    """
    Construye el perfil de dominio y genera el examen adaptativo via IA.
    Devuelve el dict con las preguntas generadas.
    """
    perfil = construir_perfil_dominio(estudiante_id, curso_id, db)

    temas_curso = [
        t.nombre
        for t in db.query(Tema)
        .filter(Tema.curso_id == curso_id)
        .order_by(Tema.orden)
        .all()
    ]

    if not perfil:
        tipo = "general"

    resultado = await generar_examen(perfil, temas_curso, tipo)
    return resultado
