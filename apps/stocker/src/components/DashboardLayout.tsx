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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'General': true,
    'Catálogo': true,
    'Operaciones': true,
    'Almacén': true,
    'Maestros': true
  })

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newState: Record<string, boolean> = {}
      // Cerrar todas las secciones
      Object.keys(prev).forEach(key => {
        newState[key] = true
      })
      // Si la sección actual está cerrada (true) o no existe, abrirla (false)
      // Si está abierta (false), cerrarla (true)
      const isCurrentlyClosed = prev[sectionId] === undefined || prev[sectionId] === true
      newState[sectionId] = isCurrentlyClosed ? false : true
      return newState
    })
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

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
    <aside className={classNames(
      "h-full shrink-0 border-r border-gray-200/60 bg-white/95 backdrop-blur-sm transition-all duration-300",
      isSidebarCollapsed ? "w-16" : "w-80"
    )}>
      <div className={classNames(
        "flex items-center border-b border-gray-200/60 py-5 transition-all duration-300",
        isSidebarCollapsed ? "px-3 justify-center" : "px-6 gap-3"
      )}>
        <Link to="/dashboard" className="inline-flex items-center gap-3 font-semibold text-gray-900 hover:text-[var(--brand-700)] transition-colors">
          <div className="relative">
            <span className="inline-grid place-content-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] text-white font-bold text-sm shadow-lg shadow-[var(--brand-600)]/25">S</span>
            <div className="absolute -inset-1 bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] rounded-xl opacity-20 blur-sm"></div>
          </div>
          {!isSidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Stocker</span>
          )}
        </Link>
      </div>
      <nav className={classNames(
        "py-6 h-[calc(100%-73px)] transition-all duration-300",
        isSidebarCollapsed ? "px-2 overflow-hidden" : "px-4 overflow-y-auto"
      )}>
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className={classNames(
             isSidebarCollapsed ? "mb-3" : "mb-6", 
             sectionIndex === 0 ? "" : ""
           )}>
             {isSidebarCollapsed && sectionIndex > 0 && (
               <div className="mx-auto w-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-3"></div>
             )}
            {!isSidebarCollapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-600)] rounded-full"></div>
                  <span className="select-none">{section.title}</span>
                </div>
                <svg
                  className={classNames(
                    "w-4 h-4 transition-transform duration-200",
                    collapsedSections[section.title] ? "rotate-0" : "rotate-90"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div className={classNames(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "max-h-96 opacity-100" : (collapsedSections[section.title] ? "max-h-0 opacity-0" : "max-h-96 opacity-100")
            )}>
              <ul className={classNames(
                "transition-all duration-300",
                isSidebarCollapsed ? "space-y-2 mt-0" : "space-y-1 mt-2"
              )}>
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={(item as any).end}
                      className={({ isActive }) =>
                        classNames(
                          'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out',
                          isSidebarCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-3 py-2.5',
                          isActive
                            ? isSidebarCollapsed 
                              ? 'bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] text-white shadow-lg shadow-[var(--brand-500)]/30 transform scale-105'
                              : 'bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)]/80 text-[var(--brand-800)] shadow-sm border border-[var(--brand-200)]/50 transform scale-[1.02]'
                            : isSidebarCollapsed
                              ? 'text-gray-500 hover:bg-[var(--brand-100)]/60 hover:text-[var(--brand-700)] hover:shadow-md hover:transform hover:scale-110'
                              : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 hover:transform hover:scale-[1.01]'
                        )
                      }
                      onClick={() => setMobileOpen(false)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      style={isSidebarCollapsed ? { pointerEvents: 'auto' } : {}}
                    >
                      <span className={classNames(
                        'flex-shrink-0 transition-all duration-200',
                        'text-gray-500 group-hover:text-[var(--brand-600)]'
                      )}>
                        <item.icon />
                      </span>
                      {!isSidebarCollapsed && (
                        <>
                          <span className="font-medium tracking-tight">{item.label}</span>
                          {/* Indicador activo */}
                          <div className={classNames(
                            'absolute right-2 w-1.5 h-1.5 rounded-full transition-all duration-200',
                            'opacity-0 group-hover:opacity-100',
                            'bg-[var(--brand-500)]'
                          )}></div>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)]/30 via-white to-[var(--brand-100)]/50 text-gray-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-xl p-2.5 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-gray-700">
                <path fillRule="evenodd" d="M3.75 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden md:inline-flex items-center justify-center rounded-xl p-2.5 hover:bg-gray-100/80 transition-all duration-200"
              aria-label={isSidebarCollapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
            >
              {isSidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-gray-700">
                  <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm3-1.5A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12A1.5 1.5 0 0 0 19.5 18V6A1.5 1.5 0 0 0 18 4.5H6ZM9 9a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 9 9Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 9 12Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 9 15Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-gray-700">
                  <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm3-1.5A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h3V4.5H6ZM10.5 4.5v15h8A1.5 1.5 0 0 0 19.5 18V6A1.5 1.5 0 0 0 18 4.5h-7.5Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <Link to="/dashboard" className="hidden md:inline-flex items-center gap-3 font-semibold text-gray-900 hover:text-[var(--brand-700)] transition-colors">
              <div className="relative">
                <span className="inline-grid place-content-center w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] text-white font-bold text-sm shadow-lg shadow-[var(--brand-600)]/25">S</span>
                <div className="absolute -inset-1 bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] rounded-xl opacity-20 blur-sm"></div>
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Stocker</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            </div>
            <button 
              onClick={handleSignOut} 
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-600)]/25 hover:shadow-xl hover:shadow-[var(--brand-600)]/30 hover:scale-105 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
       <div className="mx-auto max-w-[1440px] px-3 sm:px-4 md:px-6">
         <div className={classNames(
           "flex py-6 md:py-8 transition-all duration-300",
           isSidebarCollapsed ? "gap-4" : "gap-8"
         )}>
          {/* Desktop sidebar */}
           <div className="hidden md:block sticky top-[64px] h-[calc(100vh-64px)]">
             {Sidebar}
           </div>

           {/* Mobile drawer */}
           {mobileOpen && (
             <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
               <div className="absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-gray-200/60">
                 <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/60">
                   <Link to="/dashboard" className="inline-flex items-center gap-3 font-semibold text-gray-900 hover:text-[var(--brand-700)] transition-colors" onClick={() => setMobileOpen(false)}>
                     <div className="relative">
                       <span className="inline-grid place-content-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] text-white font-bold text-sm shadow-lg shadow-[var(--brand-600)]/25">S</span>
                       <div className="absolute -inset-1 bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] rounded-xl opacity-20 blur-sm"></div>
                     </div>
                     <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Stocker</span>
                   </Link>
                   <button
                     onClick={() => setMobileOpen(false)}
                     className="inline-flex items-center justify-center rounded-xl p-2.5 hover:bg-gray-100/80 transition-colors"
                     aria-label="Cerrar menú"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-gray-600">
                       <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.061L12 11.646l-4.715 4.715a.75.75 0 11-1.06-1.061l4.714-4.714-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                     </svg>
                   </button>
                 </div>
                 <nav className="px-4 py-6 overflow-y-auto h-[calc(100%-73px)]">
                   {sections.map((section, sectionIndex) => (
                     <div key={section.title} className={classNames("mb-6", sectionIndex === 0 ? "" : "")}>
                       <button
                         onClick={() => toggleSection(section.title)}
                         className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors duration-200"
                       >
                         <div className="flex items-center gap-2">
                           <div className="w-1 h-4 bg-gradient-to-b from-[var(--brand-500)] to-[var(--brand-600)] rounded-full"></div>
                           <span className="select-none">{section.title}</span>
                         </div>
                         <svg
                           className={classNames(
                             "w-4 h-4 transition-transform duration-200",
                             collapsedSections[section.title] ? "rotate-0" : "rotate-90"
                           )}
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </button>
                       <div className={classNames(
                         "overflow-hidden transition-all duration-300 ease-in-out",
                         collapsedSections[section.title] ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
                       )}>
                         <ul className="space-y-1 mt-2">
                           {section.items.map((item) => (
                             <li key={item.to}>
                               <NavLink
                                 to={item.to}
                                 end={(item as any).end}
                                 className={({ isActive }) =>
                                   classNames(
                                     'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out',
                                     isActive
                                       ? 'bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)]/80 text-[var(--brand-800)] shadow-sm border border-[var(--brand-200)]/50 transform scale-[1.02]'
                                       : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 hover:transform hover:scale-[1.01]'
                                   )
                                 }
                                 onClick={() => setMobileOpen(false)}
                               >
                                 <span className={classNames(
                                   'flex-shrink-0 transition-all duration-200',
                                   'text-gray-500 group-hover:text-[var(--brand-600)]'
                                 )}>
                                   <item.icon />
                                 </span>
                                 <span className="font-medium tracking-tight">{item.label}</span>
                                 {/* Indicador activo */}
                                 <div className={classNames(
                                   'absolute right-2 w-1.5 h-1.5 rounded-full transition-all duration-200',
                                   'opacity-0 group-hover:opacity-100',
                                   'bg-[var(--brand-500)]'
                                 )}></div>
                               </NavLink>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   ))}
                 </nav>
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