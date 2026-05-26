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
    temas_numerados = "\n".join(f"{i+1}. {t}" for i, t in enumerate(temas_curso))
    nombres_exactos = ", ".join(f'"{t}"' for t in temas_curso)
    return f"""Eres un evaluador pedagógico. Tu única tarea es analizar una entrega estudiantil usando EXCLUSIVAMENTE los temas del siguiente temario.

REGLA ABSOLUTA: Solo puedes usar estos {len(temas_curso)} temas. No inventes, no agregues, no renombres:
{temas_numerados}

ENTREGA DEL ESTUDIANTE:
{texto_entrega[:4000]}

INSTRUCCIONES:
1. Lee la entrega y detecta cuáles de los {len(temas_curso)} temas listados arriba aparecen con evidencia clara.
2. Si un tema no aparece explícitamente en la entrega, NO lo incluyas.
3. El valor "tema" debe ser copiado textualmente de la lista de arriba. Valores permitidos: {nombres_exactos}
4. "dominio" es un entero 0-100 que refleja qué tan bien domina el estudiante ese tema según la evidencia en la entrega.
5. "siguiente_tema_zdp" debe ser uno de los temas de la lista que el alumno aún no domina bien y puede aprender como próximo paso.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{{
  "temas_detectados": [
    {{"tema": "nombre exacto del tema de la lista", "dominio": 75, "evidencia": "qué escribió el alumno que demuestra este tema"}}
  ],
  "fortalezas": ["habilidad concreta que demostró el alumno"],
  "debilidades": ["área específica que necesita reforzar"],
  "siguiente_tema_zdp": "nombre exacto de un tema de la lista",
  "resumen": "2-3 oraciones sobre el desempeño del estudiante."
}}"""


def _prompt_examen(perfil_dominio: dict, temas_curso: list[str], tipo: str) -> str:
    temas_debiles = [t for t, d in perfil_dominio.items() if d < 60]
    temas_fuertes = [t for t, d in perfil_dominio.items() if d >= 60]
    temas_sin_evidencia = [t for t in temas_curso if t not in perfil_dominio]

    temas_numerados = "\n".join(f"{i+1}. {t}" for i, t in enumerate(temas_curso))
    nombres_exactos = ", ".join(f'"{t}"' for t in temas_curso)

    temas_trabajados = list(perfil_dominio.keys())

    if tipo == "adaptive":
        if temas_debiles:
            enfoque = f"Genera preguntas sobre los temas con dominio bajo: {', '.join(temas_debiles)}."
        elif temas_sin_evidencia:
            enfoque = f"El alumno no ha mostrado evidencia de estos temas aún, enfócate en ellos: {', '.join(temas_sin_evidencia)}."
        else:
            enfoque = "El alumno domina todos los temas evaluados. Genera preguntas de nivel avanzado."
    else:
        if temas_trabajados:
            enfoque = f"Distribuye las 5 preguntas entre los temas que el alumno ya trabajó en sus entregas: {', '.join(temas_trabajados)}. No uses temas que no estén en esta lista."
        else:
            enfoque = "No hay entregas previas del alumno. Genera 5 preguntas introductorias sobre los temas del temario."

    perfil_str = "\n".join(
        f"- {t}: {d}% de dominio" for t, d in perfil_dominio.items()
    ) or "- Sin análisis previos"

    return f"""Eres un evaluador pedagógico. Genera exactamente 5 preguntas de examen.

REGLA ABSOLUTA: Solo puedes generar preguntas sobre los siguientes {len(temas_curso)} temas. No uses ningún otro tema:
{temas_numerados}

PERFIL DE DOMINIO DEL ESTUDIANTE (basado en sus entregas reales):
{perfil_str}

INSTRUCCIÓN: {enfoque}

RESTRICCIONES:
- El campo "tema" debe ser copiado textualmente de la lista. Valores permitidos: {nombres_exactos}
- No inventes temas, no uses sinónimos, no uses subtemas no listados
- Las preguntas deben estar relacionadas con lo que el alumno ya trabajó o necesita trabajar según su perfil
- tipo: solo "teorica" o "practica"
- dificultad: solo "basica", "intermedia" o "avanzada"

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{{
  "preguntas": [
    {{
      "numero": 1,
      "tema": "nombre exacto de la lista",
      "tipo": "teorica",
      "dificultad": "basica",
      "pregunta": "texto de la pregunta",
      "justificacion_pedagogica": "relación entre esta pregunta y el perfil del alumno"
    }}
  ]
}}"""


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
    # Filtramos solo los elementos que sean dicts (llama3 a veces devuelve strings)
    temas_raw = resultado.get("temas_detectados", [])
    temas = [t for t in temas_raw if isinstance(t, dict)]
    resultado["temas_detectados"] = temas

    nivel_promedio = (
        sum(t.get("dominio", 0) for t in temas) / len(temas) if temas else 0
    )
    resultado["nivel_dominio"] = round(nivel_promedio, 1)
    resultado["proveedor_ia"] = settings.ai_provider
    resultado["modelo_ia"] = settings.ai_model

    return resultado


async def generar_examen(perfil_dominio: dict, temas_curso: list[str], tipo: str = "adaptive") -> dict:
    """
    Genera preguntas adaptativas según el perfil de dominio del alumno.
    perfil_dominio: {"Tema 1": 80, "Tema 2": 40, ...}
    temas_curso: lista completa de temas del curso (ancla contra alucinaciones)
    """
    prompt = _prompt_examen(perfil_dominio, temas_curso, tipo)
    respuesta_raw = await _llamar_ia(prompt)
    resultado = _parsear_json(respuesta_raw)
    resultado["proveedor_ia"] = settings.ai_provider
    resultado["modelo_ia"] = settings.ai_model
    return resultado
