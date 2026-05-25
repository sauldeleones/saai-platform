import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',            label: 'Dashboard',    icon: '📊' },
  { to: '/cursos',      label: 'Cursos',        icon: '📚' },
  { to: '/estudiantes', label: 'Estudiantes',   icon: '👥' },
  { to: '/entregas',    label: 'Entregas',      icon: '📁' },
  { to: '/evaluaciones',       label: 'Evaluaciones',       icon: '📝' },
  { to: '/retroalimentacion', label: 'Retroalimentación',  icon: '💬' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-indigo-900 text-white flex flex-col">
      <div className="p-5 border-b border-indigo-700">
        <h1 className="text-xl font-bold tracking-wide">SAAI</h1>
        <p className="text-indigo-300 text-xs mt-1">Aprendizaje Adaptativo</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-indigo-400 text-xs border-t border-indigo-700">
        Tesis doctoral · 2026
      </div>
    </aside>
  )
}
