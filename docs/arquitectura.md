# Arquitectura de SAAI

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Dashboard │ Cursos │ Entregas │ Análisis │ Evaluaciones  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────┐
│                  BACKEND (FastAPI)                        │
│                                                           │
│  /cursos  /estudiantes  /entregas  /analisis  /evaluacion │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │file_processor│  │  ai_engine   │  │ exam_generator │  │
│  │PDF/DOCX/img │  │Ollama/Claude │  │   adaptativo   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │              SQLite (saai.db)                     │    │
│  │  Curso │ Tema │ Estudiante │ Entrega │ Analisis   │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┴───────────────┐
         │                                │
┌────────▼────────┐             ┌─────────▼────────┐
│  Ollama (local) │             │  Claude API       │
│  llama3/mistral │             │  (opcional)       │
└─────────────────┘             └──────────────────┘
```

## Flujo de análisis de una entrega

1. Docente sube archivo → `POST /entregas`
2. `file_processor` extrae texto del archivo
3. Docente solicita análisis → `POST /analisis/{entrega_id}`
4. `ai_engine` construye prompt con el texto + temario del curso
5. Modelo IA devuelve JSON con dominio por tema, fortalezas, ZDP
6. Resultado se guarda en tabla `Analisis`
7. Dashboard muestra brechas de aprendizaje

## Flujo de generación de examen adaptativo

1. Docente solicita examen → `POST /evaluaciones`
2. `exam_generator` obtiene perfil de dominio del alumno (promedio de análisis)
3. Construye prompt con temas débiles (dominio < 60%) y temas fuertes
4. IA genera preguntas priorizando áreas de oportunidad
5. Examen se guarda con preguntas en JSON
