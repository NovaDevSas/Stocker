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
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)]">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold">
            <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-[var(--brand-500)] text-white font-bold">S</span>
            <span className="tracking-tight">Stocker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/dashboard/categories" className="hover:text-[var(--brand-700)]">Categorías</Link>
            <Link to="/dashboard/products" className="hover:text-[var(--brand-700)]">Productos</Link>
            <Link to="/dashboard/suppliers" className="hover:text-[var(--brand-700)]">Proveedores</Link>
            <Link to="/dashboard/warehouses" className="hover:text-[var(--brand-700)]">Almacenes</Link>
            <Link to="/dashboard/movements" className="hover:text-[var(--brand-700)]">Movimientos</Link>
            <Link to="/dashboard/inventory" className="hover:text-[var(--brand-700)]">Inventario</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-gray-600">{user?.email}</span>
            <button onClick={handleSignOut} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)]">Salir</button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
          <p className="mt-1 text-sm text-gray-600">Rol admin: {isAdmin ? 'sí' : 'no'}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Link to="/dashboard/categories" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Categorías</div>
              <p className="mt-1 text-sm text-gray-600">Gestiona familias</p>
            </Link>
            <Link to="/dashboard/products" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Productos</div>
              <p className="mt-1 text-sm text-gray-600">Alta y catálogo</p>
            </Link>
            <Link to="/dashboard/suppliers" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Proveedores</div>
              <p className="mt-1 text-sm text-gray-600">Contactos</p>
            </Link>
            <Link to="/dashboard/warehouses" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Almacenes</div>
              <p className="mt-1 text-sm text-gray-600">Ubicaciones</p>
            </Link>
            <Link to="/dashboard/movements" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Movimientos</div>
              <p className="mt-1 text-sm text-gray-600">Entradas/Salidas</p>
            </Link>
            <Link to="/dashboard/inventory" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
              <div className="font-medium">Inventario</div>
              <p className="mt-1 text-sm text-gray-600">Existencias actuales</p>
            </Link>
          </div>

          {!isAdmin && (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
              No eres admin. Podrás ver datos pero no crear/editar. Si esperabas tener permisos, confirma que tu perfil tenga is_admin=true.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}