import { useEffect, useState } from 'react'
import { estudiantes as api, cursos as apiCursos } from '../services/api'
import Card from '../components/Card'

export default function Estudiantes() {
  const [lista, setLista] = useState([])
  const [cursosList, setCursosList] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', curso_id: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    api.listar().then(r => setLista(r.data))
    apiCursos.listar().then(r => setCursosList(r.data))
  }, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const r = await api.crear({ ...form, curso_id: Number(form.curso_id) })
      setLista(l => [...l, r.data])
      setForm({ nombre: '', email: '', curso_id: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar estudiante')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Estudiantes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Registrar estudiante">
          <form onSubmit={crear} className="space-y-3">
            <input
              type="text" placeholder="Nombre completo" required
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="email" placeholder="Correo electrónico" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              required
              value={form.curso_id}
              onChange={e => setForm(f => ({ ...f, curso_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600"
            >
              <option value="">Seleccionar curso</option>
              {cursosList.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>
              ))}
            </select>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Registrar
            </button>
          </form>
        </Card>

        <Card title={`Estudiantes registrados (${lista.length})`}>
          {lista.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin estudiantes registrados.</p>
          ) : (
            <ul className="space-y-2">
              {lista.map(e => {
                const curso = cursosList.find(c => c.id === e.curso_id)
                return (
                  <li key={e.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.nombre}</p>
                      <p className="text-xs text-gray-400">{e.email}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                      {curso?.codigo || `Curso ${e.curso_id}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
