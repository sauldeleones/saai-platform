# SAAI — Sistema Adaptativo de Aprendizaje Integrado

> Plataforma educativa con IA local para evaluación adaptativa y retroalimentación personalizada.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)

---

## Descripción

SAAI es una herramienta open source diseñada para apoyar la práctica docente mediante inteligencia artificial. Permite al docente subir las entregas de sus alumnos en cualquier formato, obtener un análisis automático del nivel de dominio por tema, generar exámenes adaptativos personalizados y visualizar brechas de aprendizaje a nivel individual y grupal.

El sistema es **content-agnostic**: funciona para cualquier materia (programación, historia, matemáticas, biología, etc.) sin configuración adicional.

Desarrollado como parte de una tesis doctoral en **Educación e Innovación Tecnológica**.

---

## Fundamentación teórica

El diseño pedagógico de SAAI se sustenta en tres marcos teóricos:

| Marco | Autor | Aplicación en SAAI |
|---|---|---|
| Zona de Desarrollo Próximo (ZDP) | Vygotsky (1978) | El sistema identifica el siguiente tema alcanzable para cada alumno según su nivel actual |
| Aprendizaje Significativo | Ausubel (1968) | El análisis IA conecta nuevos conceptos con conocimiento previo detectado |
| Autoeficacia | Bandura (1977) | La retroalimentación personalizada refuerza la confianza del alumno en su capacidad de aprender |

---

## Arquitectura del sistema

```
Docente → sube entrega → file_processor → extrae texto
                                        → ai_engine (Ollama/Claude)
                                        → análisis de dominio por tema
                                        → exam_generator → examen adaptativo
                                        → dashboard → visualización de brechas
```

### Stack tecnológico

- **Backend**: Python 3.10+ + FastAPI
- **Base de datos**: SQLite + SQLAlchemy ORM
- **IA principal**: [Ollama](https://ollama.ai) (modelo local, sin costo, sin internet)
- **IA alternativa**: Anthropic Claude API (opcional)
- **Frontend**: React (etapa posterior)

---

## Requisitos de instalación

### Software necesario

- Python 3.10 o superior
- Node.js 18+ (para el frontend)
- [Ollama](https://ollama.ai) (para IA local)
- Git

### Verificar instalaciones

```bash
python3 --version    # debe mostrar 3.10+
node --version       # debe mostrar 18+
git --version
ollama --version
```

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/saai-platform.git
cd saai-platform
```

### 2. Crear entorno virtual de Python

```bash
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
```

### 3. Instalar dependencias del backend

```bash
pip install -r backend/requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 5. Instalar Ollama y descargar el modelo

```bash
# Instalar Ollama (macOS)
brew install ollama
# O descargar desde https://ollama.ai

# Descargar el modelo de lenguaje (una sola vez, ~4GB)
ollama pull llama3

# Iniciar el servidor Ollama (dejar corriendo en otra terminal)
ollama serve
```

### 6. Ejecutar el backend

```bash
cd backend
uvicorn main:app --reload
```

Abrir en el navegador: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Uso básico

1. Crear un curso con su temario via `/cursos`
2. Registrar estudiantes via `/estudiantes`
3. Subir entrega de un alumno via `/entregas`
4. Solicitar análisis IA via `/analisis`
5. Generar examen adaptativo via `/evaluaciones`

---

## Estructura del proyecto

```
saai-platform/
├── backend/
│   ├── main.py          # Punto de entrada FastAPI
│   ├── config.py        # Configuración (DB, IA, etc.)
│   ├── database.py      # Conexión SQLite + SQLAlchemy
│   ├── models/          # Modelos de base de datos
│   ├── routers/         # Endpoints de la API
│   ├── services/        # Lógica de negocio (IA, archivos)
│   └── schemas/         # Validación con Pydantic
├── frontend/            # React app (próximamente)
└── docs/                # Documentación técnica
```

---

## Captura de pantalla

*(Se agregará al completar el frontend)*

---

## Citar este proyecto

Si usas SAAI en investigación académica, por favor cita:

```bibtex
@software{saai2026,
  author  = {de Leones, Saúl},
  title   = {SAAI: Sistema Adaptativo de Aprendizaje Integrado},
  year    = {2026},
  url     = {https://github.com/TU_USUARIO/saai-platform},
  note    = {Tesis doctoral, Educación e Innovación Tecnológica}
}
```

---

## Contacto

**Saúl de Leones**
Doctorando en Educación e Innovación Tecnológica
Email: sauldeleones@gmail.com

---

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE). Libre para usar, modificar y distribuir con atribución.
