'use client'

import { useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { SignIn } from './routes/SignIn'
import { useAuth } from './context/AuthContext'
import Dashboard from './routes/Dashboard'
import Categories from './routes/Categories'
import Products from './routes/Products'
import Suppliers from './routes/Suppliers'
import Warehouses from './routes/Warehouses'
import StockMovements from './routes/StockMovements'
import InventoryLevels from './routes/InventoryLevels'
import Customers from './routes/Customers'
import SalesOrders from './routes/SalesOrders'
import PurchaseOrders from './routes/PurchaseOrders'
import Companies from './routes/Companies'
import ProductImages from './routes/ProductImages'
import DashboardLayout from './components/DashboardLayout'
import Roles from './routes/Roles'
import Users from './routes/Users'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Cargando...</span>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] text-gray-900">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-[var(--brand-600)] text-white font-bold">S</span>
            <span>Stocker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-[var(--brand-700)]">Características</a>
            <a href="#precios" className="hover:text-[var(--brand-700)]">Precios</a>
            <a href="#soporte" className="hover:text-[var(--brand-700)]">Soporte</a>
            <Link to="/signin" className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)]">Entrar</Link>
          </nav>
          <button aria-label="Abrir menú" className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100" onClick={() => setMobileOpen(v => !v)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M3.75 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="container mx-auto px-4 py-3 grid gap-3 text-sm">
              <a href="#features" className="hover:text-[var(--brand-700)]">Características</a>
              <a href="#precios" className="hover:text-[var(--brand-700)]">Precios</a>
              <a href="#soporte" className="hover:text-[var(--brand-700)]">Soporte</a>
              <Link to="/signin" className="inline-flex items-center justify-center rounded-md bg-[var(--brand-600)] px-3 py-2 text-white hover:bg-[var(--brand-700)]">Entrar</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl/tight md:text-5xl font-bold tracking-tight">
              Gestión de inventario simple, modular y escalable
            </h1>
            <p className="mt-4 text-gray-600">
              Stocker te ayuda a controlar productos, proveedores y stock con un enfoque moderno y responsive.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to="/signin" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-500">Comenzar</Link>
              <a href="#features" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2.5 hover:bg-[var(--brand-50)] hover:border-[var(--brand-300)]">Ver características</a>
            </div>
          </div>
          <div>
            <div className="rounded-xl border bg-white shadow-sm p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Productos</div>
                  <div className="mt-1 text-2xl font-semibold">1,248</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Stock bajo</div>
                  <div className="mt-1 text-2xl font-semibold text-amber-600">23</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Proveedores</div>
                  <div className="mt-1 text-2xl font-semibold">54</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-gray-500">Movimientos hoy</div>
                  <div className="mt-1 text-2xl font-semibold">312</div>
                </div>
              </div>
              <div className="mt-4 h-28 rounded-md bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)]" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-16 md:mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold">Características clave</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="font-semibold">Catálogo de productos</div>
              <p className="mt-1 text-sm text-gray-600">CRUD, variantes, SKUs y categorías.</p>
            </article>
            <article className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="font-semibold">Control de stock</div>
              <p className="mt-1 text-sm text-gray-600">Entradas, salidas y alertas por umbral.</p>
            </article>
            <article className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="font-semibold">Proveedores</div>
              <p className="mt-1 text-sm text-gray-600">Contactos, lead time y calificaciones.</p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Stocker. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      {/* Dashboard nested with layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="product-images" element={<ProductImages />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="customers" element={<Customers />} />
        <Route path="sales-orders" element={<SalesOrders />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="movements" element={<StockMovements />} />
        <Route path="inventory" element={<InventoryLevels />} />
        <Route path="companies" element={<Companies />} />
        <Route path="roles" element={<Roles />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  )
}