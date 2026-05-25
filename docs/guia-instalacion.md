# Guía de instalación detallada — SAAI

## macOS (Apple Silicon M1/M2/M3/M4/M5)

### Paso 1: Instalar dependencias del sistema

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Python 3.10+
brew install python@3.11

# Instalar tesseract (OCR para imágenes)
brew install tesseract tesseract-lang
```

### Paso 2: Instalar Ollama

```bash
brew install ollama

# Descargar modelo llama3 (~4.7GB, solo una vez)
ollama pull llama3

# Verificar que funciona
ollama run llama3 "Hola, responde solo: OK"
```

### Paso 3: Configurar el proyecto

```bash
git clone https://github.com/TU_USUARIO/saai-platform.git
cd saai-platform

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r backend/requirements.txt

# Configurar variables de entorno
cp .env.example .env
```

### Paso 4: Ejecutar el servidor

```bash
# Terminal 1: servidor Ollama
ollama serve

# Terminal 2: backend SAAI
cd backend
source ../venv/bin/activate
uvicorn main:app --reload --port 8000
```

Abrir: http://localhost:8000/docs

## Solución de problemas

### Error: "ollama: connection refused"
Asegúrate de que Ollama esté corriendo: `ollama serve`

### Error: "ModuleNotFoundError"
Activa el entorno virtual: `source venv/bin/activate`

### El análisis tarda mucho
Normal en la primera ejecución — el modelo se carga en memoria. Las siguientes son más rápidas.
