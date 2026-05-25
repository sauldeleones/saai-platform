# Guía de instalación en Windows

Esta guía cubre todo lo necesario para correr SAAI en Windows 10 u 11 desde cero.

---

## Requisitos previos

Instala estos programas en orden. Cada uno tiene un instalador `.exe` — usa las opciones por defecto salvo que se indique lo contrario.

### 1. Git
Descarga desde: https://git-scm.com/download/win

Durante la instalación, en la pantalla **"Adjusting your PATH environment"** elige:
**"Git from the command line and also from 3rd-party software"**

### 2. Python 3.11
Descarga desde: https://www.python.org/downloads/windows/

> ⚠️ **Importante:** en la primera pantalla del instalador marca la casilla **"Add Python to PATH"** antes de hacer clic en Install.

Verifica en PowerShell:
```powershell
python --version
```
Debe mostrar `Python 3.11.x`

### 3. Node.js 18+
Descarga desde: https://nodejs.org (versión LTS)

Verifica:
```powershell
node --version
npm --version
```

### 4. Ollama
Descarga desde: https://ollama.com/download/windows

Instala y luego descarga el modelo (puede tardar varios minutos, ~4.7 GB):
```powershell
ollama pull llama3
```

### 5. Tesseract OCR (para leer imágenes — opcional)
Descarga desde: https://github.com/UB-Mannheim/tesseract/wiki

Durante la instalación selecciona también el idioma **Spanish**.

Después de instalar, agrega Tesseract al PATH:
1. Busca "Variables de entorno" en el menú de inicio
2. En "Variables del sistema" → `Path` → Editar → Nuevo
3. Agrega: `C:\Program Files\Tesseract-OCR`

---

## Instalación del proyecto

Abre **PowerShell** (no el símbolo del sistema) y ejecuta los siguientes pasos.

### Paso 1 — Clonar el repositorio
```powershell
git clone https://github.com/sauldeleones/saai-platform.git
cd saai-platform
```

### Paso 2 — Crear entorno virtual de Python
```powershell
python -m venv venv
```

### Paso 3 — Activar el entorno virtual
```powershell
venv\Scripts\activate
```

Si aparece un error de permisos, ejecuta primero:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Y vuelve a intentar activar.

Sabrás que está activo cuando el prompt muestre `(venv)` al inicio.

### Paso 4 — Instalar dependencias del backend
```powershell
pip install -r backend\requirements.txt
```

### Paso 5 — Crear el archivo .env
```powershell
copy .env.example .env
```

Abre `.env` con el Bloc de notas y verifica que tenga:
```
AI_PROVIDER=ollama
AI_MODEL=llama3
OLLAMA_URL=http://localhost:11434
ANTHROPIC_API_KEY=
SECRET_KEY=saai_secret_key_2026
```

### Paso 6 — Instalar dependencias del frontend
```powershell
cd frontend
npm install
cd ..
```

---

## Ejecutar el proyecto

Necesitas **3 ventanas de PowerShell** abiertas al mismo tiempo.

### Terminal 1 — Ollama (modelo de IA)
```powershell
ollama serve
```
Déjala abierta. Verás: `Listening on 127.0.0.1:11434`

### Terminal 2 — Backend FastAPI
```powershell
cd saai-platform
venv\Scripts\activate
cd backend
uvicorn main:app --reload
```
Verás: `Uvicorn running on http://127.0.0.1:8000`

### Terminal 3 — Frontend React
```powershell
cd saai-platform\frontend
npm run dev
```
Verás: `Local: http://localhost:5173/`

---

## Verificación

Abre en tu navegador:

| URL | Qué deberías ver |
|---|---|
| http://localhost:5173 | Interfaz SAAI con sidebar azul |
| http://localhost:8000/docs | Documentación interactiva de la API |

---

## Solución de problemas frecuentes en Windows

### "python no se reconoce como comando"
Python no está en el PATH. Reinstala marcando **"Add Python to PATH"**, o agrégalo manualmente en Variables de entorno → `C:\Users\TU_USUARIO\AppData\Local\Programs\Python\Python311\`

### "venv\Scripts\activate no se puede cargar"
Falta permiso para ejecutar scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error al instalar `pytesseract`
Instala primero Tesseract OCR (ver Paso 5 de Requisitos). Si no necesitas analizar imágenes puedes ignorar este error — el resto funciona igual.

### "ollama: connection refused" en el análisis
Verifica que la Terminal 1 esté abierta y muestre `Listening on 127.0.0.1:11434`.

### Puerto 8000 ocupado
```powershell
netstat -ano | findstr :8000
taskkill /PID <número_del_pid> /F
```

### El análisis IA tarda mucho
Normal en la primera llamada — el modelo se carga en memoria RAM. Las siguientes son más rápidas.

---

## Notas sobre diferencias con macOS

| macOS | Windows |
|---|---|
| `source venv/bin/activate` | `venv\Scripts\activate` |
| `python3` | `python` |
| `brew install tesseract` | Instalador de UB-Mannheim |
| `/` en rutas | `\` en rutas (PowerShell acepta ambas) |
