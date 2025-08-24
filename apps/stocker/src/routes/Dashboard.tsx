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
            <Link to="/dashboard/suppliers" className="hover:text-indigo-600">Proveedores</Link>
            <Link to="/dashboard/warehouses" className="hover:text-indigo-600">Almacenes</Link>
            <Link to="/dashboard/movements" className="hover:text-indigo-600">Movimientos</Link>
            <Link to="/dashboard/inventory" className="hover:text-indigo-600">Inventario</Link>
          </nav>
          <button onClick={handleSignOut} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800">Salir</button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Hola, {user?.email}</h1>
          <p className="mt-1 text-sm text-gray-600">Rol admin: {isAdmin ? 'sí' : 'no'}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <Link to="/dashboard/categories" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Categorías</div>
              <p className="mt-1 text-sm text-gray-600">Gestiona familias</p>
            </Link>
            <Link to="/dashboard/products" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Productos</div>
              <p className="mt-1 text-sm text-gray-600">Alta y catálogo</p>
            </Link>
            <Link to="/dashboard/suppliers" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Proveedores</div>
              <p className="mt-1 text-sm text-gray-600">Contactos</p>
            </Link>
            <Link to="/dashboard/warehouses" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Almacenes</div>
              <p className="mt-1 text-sm text-gray-600">Ubicaciones</p>
            </Link>
            <Link to="/dashboard/movements" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Movimientos</div>
              <p className="mt-1 text-sm text-gray-600">Entradas/Salidas</p>
            </Link>
            <Link to="/dashboard/inventory" className="rounded-lg border p-4 hover:bg-gray-50">
              <div className="font-medium">Inventario</div>
              <p className="mt-1 text-sm text-gray-600">Existencias actuales</p>
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