import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Dashboard</div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/dashboard/categories" className="hover:text-indigo-600">Categorías</Link>
            <Link to="/dashboard/products" className="hover:text-indigo-600">Productos</Link>
          </nav>
          <button onClick={handleSignOut} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800">Salir</button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Hola, {user?.email}</h1>
          <p className="mt-1 text-sm text-gray-600">Rol admin: {isAdmin ? 'sí' : 'no'}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to="/dashboard/categories" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Ir a Categorías</div>
              <p className="text-sm text-gray-600">Gestiona el catálogo de categorías.</p>
            </Link>
            <Link to="/dashboard/products" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Ir a Productos</div>
              <p className="text-sm text-gray-600">Consulta y crea productos.</p>
            </Link>
          </div>
          {!isAdmin && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
              No eres admin. Podrás ver datos pero no crear/editar. Si esperabas tener permisos, confirma que tu perfil tenga is_admin=true.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}