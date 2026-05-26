import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const cursos = {
  listar: () => api.get('/cursos/'),
  obtener: (id) => api.get(`/cursos/${id}`),
  crear: (datos) => api.post('/cursos/', datos),
  eliminar: (id) => api.delete(`/cursos/${id}`),
  agregarTema: (cursoId, datos) => api.post(`/cursos/${cursoId}/temas`, datos),
  listarTemas: (cursoId) => api.get(`/cursos/${cursoId}/temas`),
  editarTema: (cursoId, temaId, datos) => api.put(`/cursos/${cursoId}/temas/${temaId}`, datos),
  eliminarTema: (cursoId, temaId) => api.delete(`/cursos/${cursoId}/temas/${temaId}`),
  brechas: (cursoId) => api.get(`/cursos/${cursoId}/brechas`),
  retroalimentacion: (cursoId, estudianteId) =>
    api.get(`/cursos/${cursoId}/retroalimentacion/${estudianteId}`),
}

export const estudiantes = {
  listar: () => api.get('/estudiantes/'),
  porCurso: (cursoId) => api.get(`/estudiantes/curso/${cursoId}`),
  crear: (datos) => api.post('/estudiantes/', datos),
}

export const entregas = {
  listar: () => api.get('/entregas/'),
  subir: (formData) => api.post('/entregas/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  eliminar: (id) => api.delete(`/entregas/${id}`),
  verTexto: (id) => api.get(`/entregas/${id}/texto`),
}

export const analisis = {
  analizar: (entregaId) => api.post(`/analisis/${entregaId}`),
  porEntrega: (entregaId) => api.get(`/analisis/entrega/${entregaId}`),
  porEstudiante: (estudianteId) => api.get(`/analisis/estudiante/${estudianteId}`),
}

export const evaluaciones = {
  generar: (datos) => api.post('/evaluaciones/', datos),
  verPreguntas: (id) => api.get(`/evaluaciones/${id}/preguntas`),
  perfilDominio: (estudianteId, cursoId) =>
    api.get(`/evaluaciones/estudiante/${estudianteId}/perfil?curso_id=${cursoId}`),
}
