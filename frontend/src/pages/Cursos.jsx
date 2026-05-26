import { useEffect, useState } from 'react'
import { cursos as api } from '../services/api'
import Card from '../components/Card'

const TEMA_VACIO = { nombre: '', descripcion: '', peso_porcentual: 0, orden: 1 }

export default function Cursos() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ nombre: '', codigo: '', periodo: '', descripcion: '' })
  const [temaForm, setTemaForm] = useState(TEMA_VACIO)
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [temas, setTemas] = useState([])
  const [editando, setEditando] = useState(null) // id del tema en edición
  const [error, setError] = useState('')

  const cargar = () => api.listar().then(r => setLista(r.data))
  const cargarTemas = (cursoId) => api.listarTemas(cursoId).then(r => setTemas(r.data))

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
    setEditando(null)
    setTemaForm(TEMA_VACIO)
    cargarTemas(curso.id)
  }

  const agregarTema = async (e) => {
    e.preventDefault()
    await api.agregarTema(cursoSeleccionado.id, temaForm)
    setTemaForm({ ...TEMA_VACIO, orden: temas.length + 2 })
    cargarTemas(cursoSeleccionado.id)
  }

  const iniciarEdicion = (tema) => {
    setEditando(tema.id)
    setTemaForm({
      nombre: tema.nombre,
      descripcion: tema.descripcion || '',
      peso_porcentual: tema.peso_porcentual,
      orden: tema.orden,
    })
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    await api.editarTema(cursoSeleccionado.id, editando, temaForm)
    setEditando(null)
    setTemaForm(TEMA_VACIO)
    cargarTemas(cursoSeleccionado.id)
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setTemaForm(TEMA_VACIO)
  }

  const eliminarTema = async (temaId) => {
    if (!confirm('¿Eliminar este tema?')) return
    await api.eliminarTema(cursoSeleccionado.id, temaId)
    cargarTemas(cursoSeleccionado.id)
  }

  const camposInput = [
    { key: 'nombre',      placeholder: 'Nombre del tema', required: true, full: true },
    { key: 'descripcion', placeholder: 'Descripción / subtemas (opcional)', full: true },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Crear nuevo curso">
          <form onSubmit={crearCurso} className="space-y-3">
            {[
              { key: 'nombre',      placeholder: 'Nombre del curso',       required: true },
              { key: 'codigo',      placeholder: 'Código (ej: PROG101)',    required: true },
              { key: 'periodo',     placeholder: 'Período (ej: 2026-1)' },
              { key: 'descripcion', placeholder: 'Descripción (opcional)' },
            ].map(({ key, placeholder, required }) => (
              <input key={key} type="text" placeholder={placeholder} required={required}
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
                <li key={c.id} onClick={() => seleccionarCurso(c)}
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

            {/* Formulario agregar / editar */}
            <form onSubmit={editando ? guardarEdicion : agregarTema} className="space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {editando ? '✏️ Editando tema' : 'Agregar tema'}
              </p>
              <input type="text" placeholder="Nombre del tema" required
                value={temaForm.nombre}
                onChange={e => setTemaForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input type="text" placeholder="Descripción / subtemas (opcional)"
                value={temaForm.descripcion}
                onChange={e => setTemaForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-2">
                <input type="number" placeholder="Peso %" min="0" max="100"
                  value={temaForm.peso_porcentual}
                  onChange={e => setTemaForm(f => ({ ...f, peso_porcentual: Number(e.target.value) }))}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input type="number" placeholder="Orden" min="1"
                  value={temaForm.orden}
                  onChange={e => setTemaForm(f => ({ ...f, orden: Number(e.target.value) }))}
                  className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2">
                <button className={`flex-1 text-white py-2 rounded-lg text-sm font-medium transition-colors ${
                  editando ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}>
                  {editando ? 'Guardar cambios' : 'Agregar tema'}
                </button>
                {editando && (
                  <button type="button" onClick={cancelarEdicion}
                    className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Lista de temas */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
                Temas ({temas.length})
              </p>
              {temas.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin temas aún.</p>
              ) : (
                <ul className="space-y-2">
                  {temas.map(t => (
                    <li key={t.id} className={`p-2.5 rounded-lg border transition-colors ${
                      editando === t.id ? 'border-amber-300 bg-amber-50' : 'bg-gray-50 border-transparent'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{t.orden}. {t.nombre}</p>
                          {t.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.descripcion}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                            {t.peso_porcentual}%
                          </span>
                          <button onClick={() => iniciarEdicion(t)}
                            className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => eliminarTema(t.id)}
                            className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </div>
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
