from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models  # noqa: F401 — registra todos los modelos con SQLAlchemy
from routers import cursos, estudiantes, entregas, analisis, evaluaciones

# Crea las tablas en saai.db si no existen todavía
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SAAI — Sistema Adaptativo de Aprendizaje Integrado",
    description="API para evaluación adaptativa con IA local (Ollama) o Claude API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cursos.router)
app.include_router(estudiantes.router)
app.include_router(entregas.router)
app.include_router(analisis.router)
app.include_router(evaluaciones.router)


@app.get("/")
def root():
    return {"mensaje": "SAAI API activa", "docs": "/docs"}
