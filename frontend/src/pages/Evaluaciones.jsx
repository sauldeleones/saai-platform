import { useEffect, useState } from 'react'
import { evaluaciones as api, estudiantes as apiEst, cursos as apiCursos } from '../services/api'
import Card from '../components/Card'

export default function Evaluaciones() {
  const [estudiantesList, setEstudiantesList] = useState([])
  const [cursosList, setCursosList] = useState([])
  const [form, setForm] = useState({ estudiante_id: '', curso_id: '', tipo: 'adaptive' })
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    apiEst.listar().then(r => setEstudiantesList(r.data))
    apiCursos.listar().then(r => setCursosList(r.data))
  }, [])

  const cargarPerfil = async () => {
    if (!form.estudiante_id || !form.curso_id) return
    try {
      const r = await api.perfilDominio(form.estudiante_id, form.curso_id)
      setPerfil(r.data)
    } catch {
      setPerfil(null)
    }
  }

  const generar = async (e) => {
    e.preventDefault()
    setGenerando(true)
    setResultado(null)
    try {
      const ev = await api.generar({
        estudiante_id: Number(form.estudiante_id),
        curso_id: Number(form.curso_id),
        tipo: form.tipo,
      })
      const preguntas = await api.verPreguntas(ev.data.id)
      setResultado(preguntas.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al generar evaluación')
    } finally {
      setGenerando(false)
    }
  }

  const dificultadColor = {
    basica: 'bg-emerald-50 text-emerald-700',
    intermedia: 'bg-amber-50 text-amber-700',
    avanzada: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Evaluaciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Generar examen adaptativo">
          <form onSubmit={generar} className="space-y-3">
            <select required value={form.estudiante_id}
              onChange={e => { setForm(f => ({ ...f, estudiante_id: e.target.value })); setPerfil(null) }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
              <option value="">Seleccionar estudiante</option>
              {estudiantesList.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <select required value={form.curso_id}
              onChange={e => { setForm(f => ({ ...f, curso_id: e.target.value })); setPerfil(null) }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
              <option value="">Seleccionar curso</option>
              {cursosList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
              <option value="adaptive">Adaptativo (prioriza temas débiles)</option>
              <option value="general">General (distribuido)</option>
            </select>

            {form.estudiante_id && form.curso_id && !perfil && (
              <button type="button" onClick={cargarPerfil}
                className="w-full border border-indigo-200 text-indigo-600 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                Ver perfil de dominio del alumno
              </button>
            )}

            <button disabled={generando}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {generando ? 'Generando con IA...' : '📝 Generar examen'}
            </button>
          </form>
        </Card>

        {perfil && (
          <Card title="Perfil de dominio del alumno">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Nivel general</span>
              <span className="text-lg font-bold text-indigo-700">{perfil.nivel_general ?? '—'}%</span>
            </div>
            {Object.keys(perfil.perfil || {}).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin análisis previos — se generará examen general.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(perfil.perfil).map(([tema, dominio]) => (
                  <li key={tema}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{tema}</span>
                      <span className="font-medium">{dominio}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${dominio >= 60 ? 'bg-emerald-500' : 'bg-red-400'}`}
                        style={{ width: `${dominio}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {resultado && (
        <Card title={`Examen generado — ${resultado.tipo} · ${resultado.total_preguntas} preguntas`}>
          <div className="space-y-4">
            {resultado.preguntas.map((p) => (
              <div key={p.numero} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-medium text-sm text-gray-800">
                    {p.numero}. {p.pregunta}
                  </p>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dificultadColor[p.dificultad] || 'bg-gray-100 text-gray-600'}`}>
                      {p.dificultad}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {p.tipo}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Tema: {p.tema}</p>
                <p className="text-xs text-indigo-600 mt-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                  💡 {p.justificacion_pedagogica}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
