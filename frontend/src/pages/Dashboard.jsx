import { useEffect, useState } from 'react'
import { cursos as apiCursos, estudiantes as apiEst, entregas as apiEnt } from '../services/api'
import Card from '../components/Card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

// ── Helpers ────────────────────────────────────────────────────────────────

function nivelColor(score) {
  if (score === null || score === undefined) return { bg: 'bg-gray-100', text: 'text-gray-400', bar: '#e5e7eb' }
  if (score >= 70) return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10b981' }
  if (score >= 40) return { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: '#f59e0b' }
  return               { bg: 'bg-red-100',         text: 'text-red-700',     bar: '#ef4444' }
}

function NivelBadge({ score }) {
  const c = nivelColor(score)
  return (
    <span className={`inline-block min-w-[48px] text-center text-xs font-semibold px-2 py-1 rounded ${c.bg} ${c.text}`}>
      {score != null ? `${score}%` : '—'}
    </span>
  )
}

// ── Leyenda ────────────────────────────────────────────────────────────────
function Leyenda() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span className="font-medium">Dominio:</span>
      {[
        { label: '≥70% Domina',      bg: 'bg-emerald-100 text-emerald-700' },
        { label: '40–69% En proceso', bg: 'bg-amber-100 text-amber-700' },
        { label: '<40% Bajo',         bg: 'bg-red-100 text-red-700' },
        { label: 'Sin datos',         bg: 'bg-gray-100 text-gray-400' },
      ].map(({ label, bg }) => (
        <span key={label} className={`px-2 py-0.5 rounded font-medium ${bg}`}>{label}</span>
      ))}
    </div>
  )
}

// ── Mapa de calor ──────────────────────────────────────────────────────────
function MapaCalor({ temas, estudiantes, promedios_clase }) {
  if (estudiantes.length === 0) {
    return <p className="text-gray-400 text-sm py-6 text-center">Sin estudiantes con análisis en este curso.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4 min-w-[140px]">Estudiante</th>
            {temas.map(t => (
              <th key={t.id} className="text-center text-xs text-gray-500 font-medium pb-2 px-1 max-w-[90px]">
                <span className="block leading-tight">{t.nombre}</span>
              </th>
            ))}
            <th className="text-center text-xs text-gray-500 font-medium pb-2 px-2">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map(est => (
            <tr key={est.id}>
              <td className="pr-4 py-1">
                <div className="font-medium text-gray-800 text-sm">{est.nombre}</div>
                <div className="text-xs text-gray-400">{est.total_analisis} análisis</div>
              </td>
              {temas.map(t => {
                const score = est.dominio_por_tema[t.nombre] ?? null
                return (
                  <td key={t.id} className="text-center py-1 px-1">
                    <NivelBadge score={score} />
                  </td>
                )
              })}
              <td className="text-center py-1 px-2">
                <span className={`text-sm font-bold ${nivelColor(est.nivel_general).text}`}>
                  {est.nivel_general > 0 ? `${est.nivel_general}%` : '—'}
                </span>
              </td>
            </tr>
          ))}

          {/* Fila de promedio de la clase */}
          <tr className="border-t border-gray-200">
            <td className="pr-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Promedio clase
            </td>
            {temas.map(t => (
              <td key={t.id} className="text-center py-2 px-1">
                <NivelBadge score={promedios_clase[t.nombre] ?? null} />
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ── Gráfica de barras por tema ─────────────────────────────────────────────
function GraficaTemas({ temas, promedios_clase }) {
  const data = temas
    .filter(t => promedios_clase[t.nombre] != null)
    .map(t => ({
      nombre: t.nombre.length > 18 ? t.nombre.slice(0, 18) + '…' : t.nombre,
      promedio: promedios_clase[t.nombre],
    }))

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          formatter={(v) => [`${v}%`, 'Promedio clase']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <ReferenceLine y={60} stroke="#6366f1" strokeDasharray="4 2" label={{ value: 'Meta 60%', fontSize: 10, fill: '#6366f1' }} />
        {data.map((entry) => (
          <Bar key={entry.nombre} dataKey="promedio" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={nivelColor(d.promedio).bar} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Cards de alumno ────────────────────────────────────────────────────────
function CardEstudiante({ est }) {
  const c = nivelColor(est.nivel_general)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{est.nombre}</p>
          <p className="text-xs text-gray-400">{est.total_analisis} entrega(s) analizada(s)</p>
        </div>
        <span className={`text-lg font-bold ${c.text}`}>
          {est.nivel_general > 0 ? `${est.nivel_general}%` : '—'}
        </span>
      </div>

      {/* Barra general */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${est.nivel_general}%`, backgroundColor: c.bar }}
        />
      </div>

      {est.temas_fuertes.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-emerald-600 mb-1">Domina</p>
          {est.temas_fuertes.map(t => (
            <p key={t} className="text-xs text-gray-600">· {t}</p>
          ))}
        </div>
      )}
      {est.temas_debiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-500 mb-1">Necesita refuerzo</p>
          {est.temas_debiles.map(t => (
            <p key={t} className="text-xs text-gray-600">· {t}</p>
          ))}
        </div>
      )}
      {est.total_analisis === 0 && (
        <p className="text-xs text-gray-400 italic">Sin análisis registrados aún.</p>
      )}
    </div>
  )
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState({ cursos: 0, estudiantes: 0, entregas: 0, analizadas: 0 })
  const [cursosList, setCursosList] = useState([])
  const [cursoId, setCursoId] = useState(null)
  const [brechas, setBrechas] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    Promise.all([apiCursos.listar(), apiEst.listar(), apiEnt.listar()])
      .then(([c, e, en]) => {
        setCursosList(c.data)
        if (c.data.length > 0) setCursoId(c.data[0].id)
        const entregasList = en.data
        setStats({
          cursos: c.data.length,
          estudiantes: e.data.length,
          entregas: entregasList.length,
          analizadas: entregasList.filter(e => e.estado === 'analyzed').length,
        })
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!cursoId) return
    setCargando(true)
    setBrechas(null)
    apiCursos.brechas(cursoId)
      .then(r => setBrechas(r.data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [cursoId])

  const tarjetas = [
    { label: 'Cursos activos',      valor: stats.cursos,      color: 'bg-indigo-50 text-indigo-700',   icon: '📚' },
    { label: 'Estudiantes',         valor: stats.estudiantes, color: 'bg-emerald-50 text-emerald-700',  icon: '👥' },
    { label: 'Entregas recibidas',  valor: stats.entregas,    color: 'bg-amber-50 text-amber-700',      icon: '📁' },
    { label: 'Entregas analizadas', valor: stats.analizadas,  color: 'bg-purple-50 text-purple-700',    icon: '🤖' },
  ]

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de Brechas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Visualización del dominio por alumno y tema — fundamentado en la ZDP de Vygotsky
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map(({ label, valor, color, icon }) => (
          <Card key={label}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${color}`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{valor}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Selector de curso */}
      {cursosList.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Curso:</label>
          <select
            value={cursoId || ''}
            onChange={e => setCursoId(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {cursosList.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>
            ))}
          </select>
        </div>
      )}

      {/* Mapa de calor */}
      {cargando && (
        <Card><p className="text-gray-400 text-sm text-center py-4">Cargando datos...</p></Card>
      )}

      {brechas && !cargando && (
        <>
          <Card title={`Mapa de calor — ${brechas.curso.nombre}`}>
            <Leyenda />
            <div className="mt-4">
              <MapaCalor
                temas={brechas.temas}
                estudiantes={brechas.estudiantes}
                promedios_clase={brechas.promedios_clase}
              />
            </div>
          </Card>

          {Object.values(brechas.promedios_clase).some(v => v != null) && (
            <Card title="Promedio de la clase por tema">
              <GraficaTemas
                temas={brechas.temas}
                promedios_clase={brechas.promedios_clase}
              />
            </Card>
          )}

          {brechas.estudiantes.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                Perfil individual ({brechas.estudiantes.length} estudiantes)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brechas.estudiantes.map(est => (
                  <CardEstudiante key={est.id} est={est} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!brechas && !cargando && cursosList.length === 0 && (
        <Card title="Cómo usar SAAI">
          <ol className="space-y-3 text-sm text-gray-600">
            {[
              ['Cursos', 'Crea un curso y define su temario'],
              ['Estudiantes', 'Registra los alumnos del curso'],
              ['Entregas', 'Sube los trabajos de los alumnos (PDF, código, Word)'],
              ['Análisis', 'Solicita el análisis IA desde la vista de entregas'],
              ['Evaluaciones', 'Genera exámenes adaptativos por alumno'],
            ].map(([paso, desc], i) => (
              <li key={paso} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span><strong className="text-gray-700">{paso}:</strong> {desc}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
