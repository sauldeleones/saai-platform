import { useEffect, useState } from 'react'
import { cursos, estudiantes, entregas } from '../services/api'
import Card from '../components/Card'

export default function Dashboard() {
  const [stats, setStats] = useState({ cursos: 0, estudiantes: 0, entregas: 0, analizadas: 0 })

  useEffect(() => {
    Promise.all([cursos.listar(), estudiantes.listar(), entregas.listar()])
      .then(([c, e, en]) => {
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

  const tarjetas = [
    { label: 'Cursos activos',      valor: stats.cursos,      color: 'bg-indigo-50 text-indigo-700',  icon: '📚' },
    { label: 'Estudiantes',         valor: stats.estudiantes, color: 'bg-emerald-50 text-emerald-700', icon: '👥' },
    { label: 'Entregas recibidas',  valor: stats.entregas,    color: 'bg-amber-50 text-amber-700',     icon: '📁' },
    { label: 'Entregas analizadas', valor: stats.analizadas,  color: 'bg-purple-50 text-purple-700',   icon: '🤖' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del sistema</p>
      </div>

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
    </div>
  )
}
