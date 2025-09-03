import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// Simple inline SVG icons to avoid adding new deps
const IconHome = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M3 11l9-8 9 8" />
    <path d="M9 22V12h6v10" />
  </svg>
)
const IconTag = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M20.59 13.41L11 3H4v7l9.59 9.59a2 2 0 002.82 0l4.18-4.18a2 2 0 000-2.82z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)
const IconBox = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96L12 12l8.73-5.04" />
    <path d="M12 22V12" />
  </svg>
)
const IconImage = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)
const IconTruck = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M10 17h4V5H2v12h2" />
    <path d="M14 7h4l4 4v6h-2" />
    <circle cx="6.5" cy="17.5" r="1.5" />
    <circle cx="17.5" cy="17.5" r="1.5" />
  </svg>
)
const IconBuilding = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 7h10M7 12h10M7 17h10" />
  </svg>
)
const IconUsers = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconArrows = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <path d="M7 7h10M7 17h10" />
    <path d="M7 7l3-3M7 7l3 3M17 17l-3-3M17 17l-3 3" />
  </svg>
)
const IconLayers = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)
const IconClipboard = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
  </svg>
)
const IconCart = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 12.39a2 2 0 002 1.61H19a2 2 0 002-1.61L23 6H6" />
  </svg>
)

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  const sections = [
    {
      title: 'General',
      items: [
        { to: '/dashboard', label: 'Inicio', icon: IconHome, end: true },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { to: '/dashboard/categories', label: 'Categorías', icon: IconTag },
        { to: '/dashboard/products', label: 'Productos', icon: IconBox },
        { to: '/dashboard/product-images', label: 'Imágenes', icon: IconImage },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        { to: '/dashboard/sales-orders', label: 'Pedidos', icon: IconClipboard },
        { to: '/dashboard/purchase-orders', label: 'Compras', icon: IconCart },
      ],
    },
    {
      title: 'Almacén',
      items: [
        { to: '/dashboard/movements', label: 'Movimientos', icon: IconArrows },
        { to: '/dashboard/inventory', label: 'Inventario', icon: IconLayers },
        { to: '/dashboard/warehouses', label: 'Almacenes', icon: IconBuilding },
      ],
    },
    {
      title: 'Maestros',
      items: [
        { to: '/dashboard/suppliers', label: 'Proveedores', icon: IconTruck },
        { to: '/dashboard/customers', label: 'Clientes', icon: IconUsers },
        { to: '/dashboard/companies', label: 'Empresas', icon: IconBuilding },
      ],
    },
  ]

  const Sidebar = (
    <aside className="h-full w-72 shrink-0 border-r bg-white">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold">
          <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-[var(--brand-600)] text-white font-bold">S</span>
          <span className="tracking-tight">Stocker</span>
        </Link>
      </div>
      <nav className="px-3 py-3 overflow-y-auto h-[calc(100%-57px)]">
        {sections.map((section) => (
          <div key={section.title} className="mt-3 first:mt-0">
            <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{section.title}</div>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={(item as any).end}
                    className={({ isActive }) =>
                      classNames(
                        'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                        isActive
                          ? 'bg-[var(--brand-50)] text-[var(--brand-800)] border border-[var(--brand-200)]'
                          : 'text-gray-700 hover:bg-gray-50'
                      )
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-gray-500 group-hover:text-[var(--brand-700)]">
                      <item.icon />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] text-gray-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M3.75 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd" />
              </svg>
            </button>
            <Link to="/dashboard" className="hidden md:inline-flex items-center gap-2 font-semibold">
              <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-[var(--brand-600)] text-white font-bold">S</span>
              <span className="tracking-tight">Stocker</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-gray-600">{user?.email}</span>
            <button onClick={handleSignOut} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)]">Salir</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-[1400px] px-2 sm:px-4 md:px-6">
        <div className="flex gap-6 py-4 md:py-6">
          {/* Desktop sidebar */}
          <div className="hidden md:block sticky top-[64px] h-[calc(100vh-64px)]">
            {Sidebar}
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <Link to="/dashboard" className="inline-flex items-center gap-2 font-semibold" onClick={() => setMobileOpen(false)}>
                    <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-[var(--brand-600)] text-white font-bold">S</span>
                    <span className="tracking-tight">Stocker</span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                    aria-label="Cerrar menú"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.061L12 11.646l-4.715 4.715a.75.75 0 11-1.06-1.061l4.714-4.714-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {Sidebar}
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1">
            {/* Dejamos que cada página gestione su propio contenedor/card para evitar duplicación */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}