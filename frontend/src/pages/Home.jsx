import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cursos, estudiantes, entregas } from '../services/api'
import Card from '../components/Card'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ cursos: 0, estudiantes: 0, entregas: 0, analizadas: 0 })

  useEffect(() => {
    Promise.all([cursos.listar(), estudiantes.listar(), entregas.listar()])
      .then(([c, e, en]) => {
        const lista = en.data
        setStats({
          cursos: c.data.length,
          estudiantes: e.data.length,
          entregas: lista.length,
          analizadas: lista.filter(x => x.estado === 'analyzed').length,
        })
      })
      .catch(console.error)
  }, [])

  const tarjetas = [
    { label: 'Cursos activos',      valor: stats.cursos,      color: 'bg-indigo-50 text-indigo-700',  icon: '📚' },
    { label: 'Estudiantes',         valor: stats.estudiantes, color: 'bg-emerald-50 text-emerald-700', icon: '👥' },
    { label: 'Entregas recibidas',  valor: stats.entregas,    color: 'bg-amber-50 text-amber-700',     icon: '📁' },
    { label: 'Entregas analizadas', valor: stats.analizadas,  color: 'bg-purple-50 text-purple-700',   icon: '🤖' },
  ]

  const modulos = [
    { ruta: '/cursos',            icono: '📚', titulo: 'Cursos',              desc: 'Crea cursos y define el temario' },
    { ruta: '/estudiantes',       icono: '👥', titulo: 'Estudiantes',         desc: 'Registra los alumnos del curso' },
    { ruta: '/entregas',          icono: '📁', titulo: 'Entregas',            desc: 'Sube trabajos en PDF, código, Word o imágenes' },
    { ruta: '/dashboard',         icono: '📊', titulo: 'Dashboard de Brechas',desc: 'Mapa de calor del dominio por alumno y tema' },
    { ruta: '/evaluaciones',      icono: '📝', titulo: 'Evaluaciones',        desc: 'Genera exámenes adaptativos por alumno' },
    { ruta: '/retroalimentacion', icono: '💬', titulo: 'Retroalimentación',   desc: 'Diagnóstico personalizado con sugerencias de estudio' },
  ]

  return (
    <div className="space-y-8">

      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido a SAAI</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-2xl">
          Sistema Adaptativo de Aprendizaje Integrado — plataforma de apoyo pedagógico con inteligencia artificial
          para la evaluación formativa y la retroalimentación personalizada.
        </p>
      </div>

      {/* Estadísticas */}
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

      {/* Marco teórico */}
      <Card title="Fundamentación teórica">
        <p className="text-sm text-gray-500 mb-5">
          SAAI implementa tres marcos teóricos de la pedagogía constructivista para fundamentar cada decisión del sistema.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              autor: 'Vygotsky',
              anio: '1978',
              principio: 'Zona de Desarrollo Próximo',
              desc: 'El sistema identifica el nivel actual de dominio de cada alumno y sugiere el siguiente tema alcanzable — el que está justo en el límite de su capacidad con orientación adecuada.',
              color: 'text-indigo-700',
              bg: 'bg-indigo-50',
              border: 'border-indigo-200',
              aplicacion: 'Motor de análisis IA y recomendación ZDP',
            },
            {
              autor: 'Ausubel',
              anio: '1968',
              principio: 'Aprendizaje Significativo',
              desc: 'Las evaluaciones adaptativas parten del conocimiento previo demostrado en las entregas del alumno, construyendo nuevo aprendizaje sobre lo que ya sabe.',
              color: 'text-emerald-700',
              bg: 'bg-emerald-50',
              border: 'border-emerald-200',
              aplicacion: 'Generación de exámenes adaptativos',
            },
            {
              autor: 'Bandura',
              anio: '1977',
              principio: 'Autoeficacia',
              desc: 'El dashboard y la retroalimentación muestran el progreso visible del alumno, reforzando su creencia en la propia capacidad de aprender y reduciendo la ansiedad académica.',
              color: 'text-purple-700',
              bg: 'bg-purple-50',
              border: 'border-purple-200',
              aplicacion: 'Dashboard de brechas y retroalimentación',
            },
          ].map(({ autor, anio, principio, desc, color, bg, border, aplicacion }) => (
            <div key={autor} className={`rounded-xl border p-5 ${bg} ${border}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-bold text-base ${color}`}>{autor}</span>
                <span className="text-xs text-gray-400">({anio})</span>
              </div>
              <p className={`text-sm font-semibold ${color} mb-3`}>{principio}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{desc}</p>
              <div className={`text-xs font-medium ${color} border-t ${border} pt-2`}>
                Aplicación en SAAI: {aplicacion}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Módulos del sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modulos.map(({ ruta, icono, titulo, desc }) => (
            <button
              key={ruta}
              onClick={() => navigate(ruta)}
              className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <span className="text-2xl">{icono}</span>
              <p className="font-semibold text-gray-800 text-sm mt-2 group-hover:text-indigo-700 transition-colors">
                {titulo}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pie con info de tesis */}
      <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex justify-between items-center">
        <span>SAAI v0.1 — Tesis doctoral en Educación e Innovación Tecnológica · 2026</span>
        <span>Saúl de Leones · sauldeleones@gmail.com</span>
      </div>
    </div>
  )
}
