import { useEffect, useState } from 'react'
import { cursos as api } from '../services/api'
import Card from '../components/Card'

export default function Cursos() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ nombre: '', codigo: '', periodo: '', descripcion: '' })
  const [temaForm, setTemaForm] = useState({ nombre: '', descripcion: '', peso_porcentual: 0, orden: 1 })
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [temas, setTemas] = useState([])
  const [error, setError] = useState('')

  const cargar = () => api.listar().then(r => setLista(r.data))
  useEffect(() => { cargar() }, [])

  const crearCurso = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.crear(form)
      setForm({ nombre: '', codigo: '', periodo: '', descripcion: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear curso')
    }
  }

  const seleccionarCurso = async (curso) => {
    setCursoSeleccionado(curso)
    const r = await api.listarTemas(curso.id)
    setTemas(r.data)
  }

  const agregarTema = async (e) => {
    e.preventDefault()
    await api.agregarTema(cursoSeleccionado.id, temaForm)
    setTemaForm({ nombre: '', descripcion: '', peso_porcentual: 0, orden: temas.length + 2 })
    const r = await api.listarTemas(cursoSeleccionado.id)
    setTemas(r.data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Crear nuevo curso">
          <form onSubmit={crearCurso} className="space-y-3">
            {[
              { key: 'nombre',      placeholder: 'Nombre del curso',  required: true },
              { key: 'codigo',      placeholder: 'Código (ej: PROG101)', required: true },
              { key: 'periodo',     placeholder: 'Período (ej: 2026-1)' },
              { key: 'descripcion', placeholder: 'Descripción (opcional)' },
            ].map(({ key, placeholder, required }) => (
              <input
                key={key}
                type="text"
                placeholder={placeholder}
                required={required}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            ))}
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Crear curso
            </button>
          </form>
        </Card>

        <Card title={`Cursos (${lista.length})`}>
          {lista.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay cursos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {lista.map(c => (
                <li
                  key={c.id}
                  onClick={() => seleccionarCurso(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    cursoSeleccionado?.id === c.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-800">{c.nombre}</p>
                  <p className="text-xs text-gray-400">{c.codigo} · {c.periodo}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {cursoSeleccionado && (
        <Card title={`Temario — ${cursoSeleccionado.nombre}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={agregarTema} className="space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Agregar tema</p>
              <input
                type="text" placeholder="Nombre del tema" required
                value={temaForm.nombre}
                onChange={e => setTemaForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                type="text" placeholder="Descripción (opcional)"
                value={temaForm.descripcion}
                onChange={e => setTemaForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Peso %" min="0" max="100"
                  value={temaForm.peso_porcentual}
                  onChange={e => setTemaForm(f => ({ ...f, peso_porcentual: Number(e.target.value) }))}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="number" placeholder="Orden" min="1"
                  value={temaForm.orden}
                  onChange={e => setTemaForm(f => ({ ...f, orden: Number(e.target.value) }))}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                Agregar tema
              </button>
            </form>

            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
                Temas ({temas.length})
              </p>
              {temas.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin temas aún.</p>
              ) : (
                <ul className="space-y-2">
                  {temas.map(t => (
                    <li key={t.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t.orden}. {t.nombre}</p>
                        {t.descripcion && <p className="text-xs text-gray-400">{t.descripcion}</p>}
                      </div>
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                        {t.peso_porcentual}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
