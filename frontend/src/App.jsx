import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Cursos from './pages/Cursos'
import Estudiantes from './pages/Estudiantes'
import Entregas from './pages/Entregas'
import Evaluaciones from './pages/Evaluaciones'
import Retroalimentacion from './pages/Retroalimentacion'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/"                   element={<Home />} />
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/cursos"             element={<Cursos />} />
            <Route path="/estudiantes"        element={<Estudiantes />} />
            <Route path="/entregas"           element={<Entregas />} />
            <Route path="/evaluaciones"       element={<Evaluaciones />} />
            <Route path="/retroalimentacion"  element={<Retroalimentacion />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
