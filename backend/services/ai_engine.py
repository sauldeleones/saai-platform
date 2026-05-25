"""
Motor de IA con capa de abstracción.
Cambia AI_PROVIDER en .env para alternar entre Ollama y Claude sin tocar este archivo.
"""
import json
import re
import httpx

from config import settings


# ─────────────────────────────────────────────────────────────────────────────
# PROMPTS
# ─────────────────────────────────────────────────────────────────────────────

def _prompt_analisis(texto_entrega: str, temas_curso: list[str]) -> str:
    temas_str = "\n".join(f"- {t}" for t in temas_curso)
    return f"""Eres un asistente pedagógico experto. Analiza la siguiente entrega de un estudiante.

TEMARIO DEL CURSO:
{temas_str}

ENTREGA DEL ESTUDIANTE:
{texto_entrega[:4000]}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta estructura exacta:
{{
  "temas_detectados": [
    {{"tema": "nombre del tema", "dominio": 75, "evidencia": "descripción breve de qué demostró el alumno"}}
  ],
  "fortalezas": ["fortaleza 1", "fortaleza 2"],
  "debilidades": ["área de oportunidad 1"],
  "siguiente_tema_zdp": "nombre del tema más cercano que el alumno puede aprender ahora",
  "resumen": "Texto de 2-3 oraciones resumiendo el desempeño del estudiante."
}}

El campo "dominio" es un número entero de 0 a 100.
Solo incluye en "temas_detectados" los temas del temario que aparecen en la entrega."""


def _prompt_examen(perfil_dominio: dict, tipo: str) -> str:
    temas_debiles = [t for t, d in perfil_dominio.items() if d < 60]
    temas_fuertes = [t for t, d in perfil_dominio.items() if d >= 60]

    if tipo == "adaptive":
        enfoque = f"Enfócate en los temas débiles: {', '.join(temas_debiles) or 'ninguno identificado'}."
    else:
        enfoque = "Distribuye preguntas equitativamente entre todos los temas."

    return f"""Eres un evaluador pedagógico experto. Genera un examen personalizado.

PERFIL DEL ESTUDIANTE:
- Temas con dominio alto (≥60): {', '.join(temas_fuertes) or 'ninguno'}
- Temas con dominio bajo (<60): {', '.join(temas_debiles) or 'ninguno'}

INSTRUCCIÓN: {enfoque}

Genera exactamente 5 preguntas. Responde ÚNICAMENTE con JSON válido:
{{
  "preguntas": [
    {{
      "numero": 1,
      "tema": "nombre del tema",
      "tipo": "teorica",
      "dificultad": "basica",
      "pregunta": "texto de la pregunta",
      "justificacion_pedagogica": "por qué esta pregunta es relevante para este estudiante"
    }}
  ]
}}

Valores permitidos — tipo: "teorica" o "practica". dificultad: "basica", "intermedia" o "avanzada"."""


# ─────────────────────────────────────────────────────────────────────────────
# PARSEO DE RESPUESTA
# ─────────────────────────────────────────────────────────────────────────────

def _parsear_json(texto: str) -> dict:
    """Extrae el primer bloque JSON de la respuesta del modelo."""
    # Intentar parsear directo
    try:
        return json.loads(texto.strip())
    except json.JSONDecodeError:
        pass
    # Buscar bloque ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", texto, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    # Buscar primer { ... } en el texto
    match = re.search(r"\{.*\}", texto, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    raise ValueError(f"No se encontró JSON válido en la respuesta del modelo:\n{texto[:500]}")


# ─────────────────────────────────────────────────────────────────────────────
# PROVEEDORES
# ─────────────────────────────────────────────────────────────────────────────

async def _llamar_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.ollama_url}/api/generate",
            json={
                "model": settings.ai_model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
        )
        response.raise_for_status()
        return response.json()["response"]


async def _llamar_claude(prompt: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model=settings.ai_model,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def _llamar_ia(prompt: str) -> str:
    if settings.ai_provider == "ollama":
        return await _llamar_ollama(prompt)
    elif settings.ai_provider == "claude":
        return await _llamar_claude(prompt)
    raise ValueError(f"Proveedor de IA no soportado: {settings.ai_provider}")


# ─────────────────────────────────────────────────────────────────────────────
# API PÚBLICA DEL MOTOR
# ─────────────────────────────────────────────────────────────────────────────

async def analizar_entrega(texto_entrega: str, temas_curso: list[str]) -> dict:
    """
    Analiza una entrega y devuelve dominio por tema, fortalezas, ZDP y resumen.
    Lanza una excepción si la IA no responde o devuelve JSON inválido.
    """
    prompt = _prompt_analisis(texto_entrega, temas_curso)
    respuesta_raw = await _llamar_ia(prompt)
    resultado = _parsear_json(respuesta_raw)

    # Calcular nivel de dominio general como promedio
    temas = resultado.get("temas_detectados", [])
    nivel_promedio = (
        sum(t.get("dominio", 0) for t in temas) / len(temas) if temas else 0
    )
    resultado["nivel_dominio"] = round(nivel_promedio, 1)
    resultado["proveedor_ia"] = settings.ai_provider
    resultado["modelo_ia"] = settings.ai_model

    return resultado


async def generar_examen(perfil_dominio: dict, tipo: str = "adaptive") -> dict:
    """
    Genera preguntas adaptativas según el perfil de dominio del alumno.
    perfil_dominio: {"Tema 1": 80, "Tema 2": 40, ...}
    """
    prompt = _prompt_examen(perfil_dominio, tipo)
    respuesta_raw = await _llamar_ia(prompt)
    resultado = _parsear_json(respuesta_raw)
    resultado["proveedor_ia"] = settings.ai_provider
    resultado["modelo_ia"] = settings.ai_model
    return resultado
