import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { isAdmin } = useAuth()

  return (
    <div>
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
        <Link to="/dashboard/product-images" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Imágenes</div>
          <p className="mt-1 text-sm text-gray-600">Galería de productos</p>
        </Link>
        <Link to="/dashboard/suppliers" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Proveedores</div>
          <p className="mt-1 text-sm text-gray-600">Contactos</p>
        </Link>
        <Link to="/dashboard/warehouses" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Almacenes</div>
          <p className="mt-1 text-sm text-gray-600">Ubicaciones</p>
        </Link>
        <Link to="/dashboard/customers" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Clientes</div>
          <p className="mt-1 text-sm text-gray-600">Gestión de clientes</p>
        </Link>
        <Link to="/dashboard/companies" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Empresas</div>
          <p className="mt-1 text-sm text-gray-600">Datos fiscales</p>
        </Link>
        <Link to="/dashboard/sales-orders" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Pedidos</div>
          <p className="mt-1 text-sm text-gray-600">Órdenes de venta</p>
        </Link>
        <Link to="/dashboard/purchase-orders" className="rounded-xl border p-4 transition hover:shadow-sm hover:-translate-y-0.5 hover:border-[var(--brand-300)]">
          <div className="font-medium">Compras</div>
          <p className="mt-1 text-sm text-gray-600">Órdenes de compra</p>
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
    </div>
  )
}