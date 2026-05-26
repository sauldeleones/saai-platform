import { useEffect, useState } from 'react'
import { entregas as api, estudiantes as apiEst, cursos as apiCursos, analisis as apiAnalisis } from '../services/api'
import Card from '../components/Card'

export default function Entregas() {
  const [lista, setLista] = useState([])
  const [estudiantesList, setEstudiantesList] = useState([])
  const [cursosList, setCursosList] = useState([])
  const [form, setForm] = useState({ estudiante_id: '', curso_id: '', tema_id: '' })
  const [archivo, setArchivo] = useState(null)
  const [analizando, setAnalizando] = useState(null)
  const [analisisVista, setAnalisisVista] = useState({})
  const [error, setError] = useState('')

  const cargar = () => api.listar().then(r => setLista(r.data))

  useEffect(() => {
    cargar()
    apiEst.listar().then(r => setEstudiantesList(r.data))
    apiCursos.listar().then(r => setCursosList(r.data))
  }, [])

  const subir = async (e) => {
    e.preventDefault()
    setError('')
    if (!archivo) return setError('Selecciona un archivo')
    const fd = new FormData()
    fd.append('estudiante_id', form.estudiante_id)
    fd.append('curso_id', form.curso_id)
    if (form.tema_id) fd.append('tema_id', form.tema_id)
    fd.append('archivo', archivo)
    try {
      await api.subir(fd)
      setForm({ estudiante_id: '', curso_id: '', tema_id: '' })
      setArchivo(null)
      e.target.reset()
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir entrega')
    }
  }

  const analizar = async (entregaId) => {
    setAnalizando(entregaId)
    try {
      const r = await apiAnalisis.analizar(entregaId)
      setAnalisisVista(v => ({ ...v, [entregaId]: r.data }))
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al analizar')
    } finally {
      setAnalizando(null)
    }
  }

  const eliminar = async (entregaId, nombreArchivo) => {
    if (!confirm(`¿Eliminar "${nombreArchivo}" y su análisis?`)) return
    try {
      await api.eliminar(entregaId)
      setAnalisisVista(v => { const n = { ...v }; delete n[entregaId]; return n })
      cargar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  const verAnalisis = async (entregaId) => {
    if (analisisVista[entregaId]) {
      setAnalisisVista(v => { const n = { ...v }; delete n[entregaId]; return n })
      return
    }
    try {
      const r = await apiAnalisis.porEntrega(entregaId)
      setAnalisisVista(v => ({ ...v, [entregaId]: r.data }))
    } catch {
      alert('No hay análisis para esta entrega')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Entregas</h1>

      <Card title="Subir entrega">
        <form onSubmit={subir} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select required value={form.estudiante_id}
            onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
            <option value="">Seleccionar estudiante</option>
            {estudiantesList.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select required value={form.curso_id}
            onChange={e => setForm(f => ({ ...f, curso_id: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
            <option value="">Seleccionar curso</option>
            {cursosList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="file"
            onChange={e => setArchivo(e.target.files[0])}
            className="md:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {error && <p className="md:col-span-2 text-red-500 text-xs">{error}</p>}
          <button className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Subir entrega
          </button>
        </form>
      </Card>

      <Card title={`Entregas (${lista.length})`}>
        {lista.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin entregas registradas.</p>
        ) : (
          <div className="space-y-3">
            {lista.map(en => {
              const est = estudiantesList.find(e => e.id === en.estudiante_id)
              const analisisData = analisisVista[en.id]
              return (
                <div key={en.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{en.nombre_archivo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {est?.nombre || `Estudiante ${en.estudiante_id}`} · {en.tipo_archivo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        en.estado === 'analyzed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {en.estado === 'analyzed' ? 'Analizado' : 'Pendiente'}
                      </span>
                      {en.estado === 'pending' ? (
                        <button
                          onClick={() => analizar(en.id)}
                          disabled={analizando === en.id}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {analizando === en.id ? 'Analizando...' : '🤖 Analizar'}
                        </button>
                      ) : (
                        <button
                          onClick={() => verAnalisis(en.id)}
                          className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          {analisisData ? 'Ocultar' : 'Ver análisis'}
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(en.id, en.nombre_archivo)}
                        className="text-xs text-red-500 hover:text-red-600 px-2 py-1.5 rounded hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {analisisData && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div
                            className="bg-indigo-500 h-3 rounded-full transition-all"
                            style={{ width: `${analisisData.nivel_dominio}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-indigo-700 w-12 text-right">
                          {analisisData.nivel_dominio}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{analisisData.resumen_ia}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 mb-1">Fortalezas</p>
                          {JSON.parse(analisisData.fortalezas || '[]').map((f, i) => (
                            <p key={i} className="text-xs text-gray-600">· {f}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-1">Áreas de oportunidad</p>
                          {JSON.parse(analisisData.debilidades || '[]').map((d, i) => (
                            <p key={i} className="text-xs text-gray-600">· {d}</p>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                        🎯 Siguiente tema (ZDP): <strong>{analisisData.siguiente_tema_zdp}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
