import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface InventoryRow {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  updated_at: string
}

interface Option { id: string; name: string }

async function fetchInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('inventory_levels')
    .select('id, product_id, warehouse_id, quantity, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data as any
}

async function fetchProducts(): Promise<Option[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data as any
}

async function fetchWarehouses(): Promise<Option[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data as any
}

export default function InventoryLevels() {
  const { isAdmin } = useAuth()
  const [warehouseFilter, setWarehouseFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const invQ = useQuery({ queryKey: ['inventory_levels','list'], queryFn: fetchInventory })
  const prodQ = useQuery({ queryKey: ['products','options'], queryFn: fetchProducts })
  const whQ = useQuery({ queryKey: ['warehouses','options'], queryFn: fetchWarehouses })

  const productMap = useMemo(() => new Map((prodQ.data ?? []).map(p => [p.id, p.name])), [prodQ.data])
  const warehouseMap = useMemo(() => new Map((whQ.data ?? []).map(w => [w.id, w.name])), [whQ.data])

  const filtered = useMemo(() => {
    const rows = invQ.data ?? []
    return rows.filter(r => {
      const matchesWh = warehouseFilter ? r.warehouse_id === warehouseFilter : true
      const name = productMap.get(r.product_id) ?? ''
      const matchesSearch = search ? name.toLowerCase().includes(search.toLowerCase()) : true
      return matchesWh && matchesSearch
    })
  }, [invQ.data, warehouseFilter, search, productMap])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Inventario</div>
          {!isAdmin && <span className="text-sm text-gray-600">Solo lectura</span>}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Niveles de inventario</h1>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Almacén</label>
              <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
                <option value="">Todos</option>
                {(whQ.data ?? []).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Buscar producto</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre contiene..." className="mt-1 w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-600">
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Almacén</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {(filtered ?? []).map(row => (
                  <tr key={row.id} className="border-b">
                    <td className="px-3 py-2">{productMap.get(row.product_id) ?? row.product_id}</td>
                    <td className="px-3 py-2">{warehouseMap.get(row.warehouse_id) ?? row.warehouse_id}</td>
                    <td className="px-3 py-2">{row.quantity}</td>
                    <td className="px-3 py-2">{new Date(row.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
                {filtered && filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-gray-500" colSpan={4}>No hay registros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(invQ.isLoading || prodQ.isLoading || whQ.isLoading) && (
            <p className="mt-2 text-sm">Cargando...</p>
          )}
          {(invQ.isError || prodQ.isError || whQ.isError) && (
            <div className="mt-2 text-sm text-red-600">Error al cargar datos.</div>
          )}
        </div>
      </main>
    </div>
  )
}