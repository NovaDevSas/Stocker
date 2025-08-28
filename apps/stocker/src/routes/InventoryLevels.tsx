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

  const totalItems = filtered.length
  const totalQuantity = filtered.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-[var(--brand-50)]">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Niveles de Inventario</h1>
              <p className="text-sm text-gray-600 mt-1">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'} • {totalQuantity} unidades totales
              </p>
            </div>
            {!isAdmin && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                Solo lectura
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Panel de filtros */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Filtra y busca en el inventario.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Almacén
                    </label>
                    <select 
                      value={warehouseFilter} 
                      onChange={e => setWarehouseFilter(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                    >
                      <option value="">Todos los almacenes</option>
                      {(whQ.data ?? []).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar producto
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Buscar por nombre..." 
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {(warehouseFilter || search) && (
                    <button
                      onClick={() => {
                        setWarehouseFilter('')
                        setSearch('')
                      }}
                      className="w-full text-sm text-[var(--brand-600)] hover:text-[var(--brand-700)] font-medium transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                
                {/* Estadísticas rápidas */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Productos:</span>
                      <span className="font-medium text-gray-900">{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total unidades:</span>
                      <span className="font-medium text-gray-900">{totalQuantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de inventario */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inventario actual</h2>
                {(invQ.isLoading || prodQ.isLoading || whQ.isLoading) && (
                  <p className="text-sm text-gray-500 mt-1">Cargando inventario...</p>
                )}
              </div>
              
              {(invQ.isError || prodQ.isError || whQ.isError) && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-red-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">
                          Error al cargar datos del inventario.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Almacén
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última actualización
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filtered ?? []).map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {productMap.get(row.product_id) ?? row.product_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {warehouseMap.get(row.warehouse_id) ?? row.warehouse_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              row.quantity === 0 ? 'bg-red-100 text-red-800' :
                              row.quantity < 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {row.quantity}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(row.updated_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(row.updated_at).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered && filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-sm text-gray-500">
                              {search || warehouseFilter ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos en inventario aún.'}
                            </p>
                            {(search || warehouseFilter) && (
                              <button
                                onClick={() => {
                                  setWarehouseFilter('')
                                  setSearch('')
                                }}
                                className="text-xs text-[var(--brand-600)] hover:text-[var(--brand-700)] mt-1 font-medium transition-colors"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}