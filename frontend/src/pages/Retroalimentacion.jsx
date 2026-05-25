import { useEffect, useState } from 'react'
import { cursos as apiCursos, estudiantes as apiEst } from '../services/api'
import Card from '../components/Card'

// ── Tarjeta de feedback con ícono y color ──────────────────────────────────
function FeedbackCard({ tipo, titulo, children }) {
  const estilos = {
    exito:    { bg: 'bg-emerald-50',  border: 'border-emerald-200', titulo: 'text-emerald-700', icono: '✅' },
    atencion: { bg: 'bg-amber-50',    border: 'border-amber-200',   titulo: 'text-amber-700',   icono: '⚠️' },
    urgente:  { bg: 'bg-red-50',      border: 'border-red-200',     titulo: 'text-red-700',     icono: '❌' },
    zdp:      { bg: 'bg-indigo-50',   border: 'border-indigo-200',  titulo: 'text-indigo-700',  icono: '🎯' },
    bandura:  { bg: 'bg-purple-50',   border: 'border-purple-200',  titulo: 'text-purple-700',  icono: '⭐' },
  }
  const e = estilos[tipo] || estilos.exito

  return (
    <div className={`rounded-xl border p-4 ${e.bg} ${e.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{e.icono}</span>
        <h3 className={`font-semibold text-sm ${e.titulo}`}>{titulo}</h3>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed pl-6">
        {children}
      </div>
    </div>
  )
}

// ── Barra de dominio por tema ──────────────────────────────────────────────
function BarraTema({ nombre, dominio }) {
  const color =
    dominio >= 70 ? 'bg-emerald-500' :
    dominio >= 40 ? 'bg-amber-400' :
    'bg-red-400'

  const etiqueta =
    dominio >= 70 ? 'Domina' :
    dominio >= 40 ? 'En proceso' :
    'Necesita refuerzo'

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{nombre}</span>
        <span className="font-semibold">{dominio}% — {etiqueta}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${dominio}%` }}
        />
      </div>
    </div>
  )
}

// ── Marco teórico ──────────────────────────────────────────────────────────
function MarcoTeorico() {
  return (
    <Card title="Fundamentación teórica de esta retroalimentación">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            autor: 'Vygotsky',
            principio: 'Zona de Desarrollo Próximo',
            color: 'text-indigo-700',
            bg: 'bg-indigo-50',
            desc: 'El siguiente tema recomendado está justo en el límite de lo que el alumno puede aprender ahora con orientación adecuada.',
          },
          {
            autor: 'Ausubel',
            principio: 'Aprendizaje Significativo',
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            desc: 'Las fortalezas identificadas son el ancla de conocimiento previo desde la cual se construye el nuevo aprendizaje.',
          },
          {
            autor: 'Bandura',
            principio: 'Autoeficacia',
            color: 'text-purple-700',
            bg: 'bg-purple-50',
            desc: 'Mostrar el progreso visible y los logros concretos refuerza la creencia del alumno en su propia capacidad de aprender.',
          },
        ].map(({ autor, principio, color, bg, desc }) => (
          <div key={autor} className={`rounded-xl p-4 ${bg}`}>
            <p className={`font-bold text-sm ${color}`}>{autor}</p>
            <p className={`text-xs font-semibold ${color} mb-2`}>{principio}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Retroalimentacion() {
  const [cursosList, setCursosList] = useState([])
  const [estudiantesList, setEstudiantesList] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [estudianteId, setEstudianteId] = useState('')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    apiCursos.listar().then(r => {
      setCursosList(r.data)
      if (r.data.length > 0) setCursoId(r.data[0].id)
    })
    apiEst.listar().then(r => setEstudiantesList(r.data))
  }, [])

  const estudiantesFiltrados = estudiantesList.filter(
    e => String(e.curso_id) === String(cursoId)
  )

  useEffect(() => {
    if (estudiantesFiltrados.length > 0) {
      setEstudianteId(estudiantesFiltrados[0].id)
    } else {
      setEstudianteId('')
    }
    setDatos(null)
  }, [cursoId])

  const cargar = () => {
    if (!cursoId || !estudianteId) return
    setCargando(true)
    setDatos(null)
    apiCursos.retroalimentacion(cursoId, estudianteId)
      .then(r => setDatos(r.data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }

  const curso = cursosList.find(c => c.id === Number(cursoId))
  const estudiante = estudiantesList.find(e => e.id === Number(estudianteId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Retroalimentación Personalizada</h1>
        <p className="text-gray-500 text-sm mt-1">
          Diagnóstico individual generado por IA — conectado con ZDP (Vygotsky), aprendizaje significativo (Ausubel) y autoeficacia (Bandura)
        </p>
      </div>

      {/* Selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Curso</label>
            <select
              value={cursoId}
              onChange={e => setCursoId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {cursosList.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Estudiante</label>
            <select
              value={estudianteId}
              onChange={e => { setEstudianteId(e.target.value); setDatos(null) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={estudiantesFiltrados.length === 0}
            >
              {estudiantesFiltrados.length === 0
                ? <option>Sin estudiantes en este curso</option>
                : estudiantesFiltrados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))
              }
            </select>
          </div>
          <button
            onClick={cargar}
            disabled={!cursoId || !estudianteId || cargando}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {cargando ? 'Generando...' : '🤖 Generar retroalimentación'}
          </button>
        </div>
      </Card>

      {/* Sin datos */}
      {datos?.sin_datos && (
        <Card>
          <div className="text-center py-6">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-700">{datos.estudiante.nombre} no tiene análisis en este curso.</p>
            <p className="text-sm text-gray-400 mt-1">Sube y analiza al menos una entrega primero.</p>
          </div>
        </Card>
      )}

      {/* Retroalimentación completa */}
      {datos && !datos.sin_datos && (
        <>
          {/* Encabezado del alumno */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                {datos.estudiante.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">{datos.estudiante.nombre}</p>
                <p className="text-sm text-gray-500">{datos.curso.nombre} · {datos.total_analisis} entrega(s) analizada(s)</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-600">{datos.nivel_general}%</p>
                <p className="text-xs text-gray-400">nivel general</p>
              </div>
            </div>

            {/* Barra general */}
            <div className="mt-4 w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  datos.nivel_general >= 70 ? 'bg-emerald-500' :
                  datos.nivel_general >= 40 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${datos.nivel_general}%` }}
              />
            </div>
          </Card>

          {/* Dominio por tema */}
          {Object.keys(datos.dominio_por_tema).length > 0 && (
            <Card title="Dominio por tema">
              {Object.entries(datos.dominio_por_tema).map(([tema, dominio]) => (
                <BarraTema key={tema} nombre={tema} dominio={dominio} />
              ))}
              {datos.temas_sin_evidencia.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sin entregas aún</p>
                  {datos.temas_sin_evidencia.map(t => (
                    <p key={t} className="text-xs text-gray-400">· {t}</p>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tarjetas de feedback */}
          <div className="space-y-3">

            {datos.fortalezas.length > 0 && (
              <FeedbackCard tipo="exito" titulo="Fortalezas identificadas">
                <ul className="space-y-1">
                  {datos.fortalezas.map((f, i) => <li key={i}>· {f}</li>)}
                </ul>
              </FeedbackCard>
            )}

            {datos.temas_debiles.length > 0 && (
              <FeedbackCard tipo="atencion" titulo="Áreas de oportunidad">
                <p className="mb-2">Necesita refuerzo en:</p>
                <ul className="space-y-1">
                  {datos.temas_debiles.map((t, i) => <li key={i}>· {t}</li>)}
                </ul>
                {datos.debilidades.length > 0 && (
                  <ul className="mt-2 space-y-1 text-gray-500">
                    {datos.debilidades.map((d, i) => <li key={i}>· {d}</li>)}
                  </ul>
                )}
              </FeedbackCard>
            )}

            {datos.temas_sin_evidencia.length > 0 && (
              <FeedbackCard tipo="urgente" titulo="Temas sin evidencia">
                <p className="mb-2">Aún no hay entregas en:</p>
                <ul className="space-y-1">
                  {datos.temas_sin_evidencia.map((t, i) => <li key={i}>· {t}</li>)}
                </ul>
              </FeedbackCard>
            )}

            {datos.siguiente_tema_zdp && (
              <FeedbackCard tipo="zdp" titulo="Siguiente paso recomendado — Zona de Desarrollo Próximo (Vygotsky)">
                <p>
                  Con base en el nivel actual de <strong>{datos.estudiante.nombre}</strong>, el siguiente tema alcanzable es:{' '}
                  <strong className="text-indigo-700">"{datos.siguiente_tema_zdp}"</strong>.
                </p>
                <p className="mt-1 text-gray-500 text-xs">
                  Este tema está dentro de la ZDP: el alumno tiene las bases necesarias para dominarlo con práctica y orientación.
                </p>
              </FeedbackCard>
            )}

            {datos.nivel_general >= 60 && (
              <FeedbackCard tipo="bandura" titulo="Reconocimiento de avance — Autoeficacia (Bandura)">
                <p>
                  {datos.estudiante.nombre} ha alcanzado un nivel general de <strong>{datos.nivel_general}%</strong> y domina{' '}
                  <strong>{datos.temas_fuertes.length}</strong> tema(s).
                  Los datos demuestran una capacidad real de aprendizaje.
                </p>
                <p className="mt-1 text-gray-500 text-xs">
                  Reconocer el progreso concreto fortalece la autoeficacia y la motivación para continuar.
                </p>
              </FeedbackCard>
            )}
          </div>

          {/* Resumen de la IA */}
          {datos.resumen_reciente && (
            <Card title="Resumen del análisis más reciente">
              <p className="text-sm text-gray-700 leading-relaxed">{datos.resumen_reciente}</p>
              <p className="text-xs text-gray-400 mt-3">
                Generado por: {datos.proveedor_ia} · {datos.modelo_ia}
              </p>
            </Card>
          )}

          <MarcoTeorico />
        </>
      )}
    </div>
  )
}
