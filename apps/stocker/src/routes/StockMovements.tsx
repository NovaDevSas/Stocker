import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface MovementForm {
  product_id: string
  warehouse_id?: string
  movement_type: 'IN' | 'OUT' | 'ADJUST'
  quantity: number
  notes?: string
}

interface ProductOption { id: string; name: string }
interface WarehouseOption { id: string; name: string }

interface MovementRow {
  id: string
  product_id: string
  warehouse_id?: string | null
  movement_type: 'IN' | 'OUT' | 'ADJUST'
  quantity: number
  notes: string | null
  created_at: string
}

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data as ProductOption[]
}

async function fetchWarehouses() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data as WarehouseOption[]
}

async function fetchRecentMovements() {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('id', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as MovementRow[]
}

async function createMovement(payload: MovementForm) {
  const row: any = {
    product_id: payload.product_id,
    movement_type: payload.movement_type,
    quantity: payload.quantity,
    notes: payload.notes ?? null,
  }
  if (payload.warehouse_id) row.warehouse_id = payload.warehouse_id

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(row)
    .select('id')
    .single()
  if (error) throw error
  return data
}

export default function StockMovements() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovementForm>({
    defaultValues: { movement_type: 'IN' }
  })

  const productsQuery = useQuery({ queryKey: ['products','options'], queryFn: fetchProducts })
  const warehousesQuery = useQuery({ queryKey: ['warehouses','options'], queryFn: fetchWarehouses })
  const movementsQuery = useQuery({ queryKey: ['stock_movements','recent'], queryFn: fetchRecentMovements })

  // Mostrar el campo de almacén si existen almacenes disponibles (independiente de si hay movimientos previos)
  const showWarehouseField = (warehousesQuery.data ?? []).length > 0

  const createMut = useMutation({
    mutationFn: (form: MovementForm) => createMovement(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock_movements'] })
      qc.invalidateQueries({ queryKey: ['inventory_levels'] })
      reset({ movement_type: 'IN' } as any)
    }
  })

  const onSubmit = (form: MovementForm) => {
    if (!isAdmin) return
    createMut.mutate({ ...form, quantity: Number(form.quantity) })
  }

  const productMap = new Map((productsQuery.data ?? []).map(p => [p.id, p.name]))
  const warehouseMap = new Map((warehousesQuery.data ?? []).map(w => [w.id, w.name]))
  const totalMovements = movementsQuery.data?.length ?? 0

  return (
    <div className="min-h-screen bg-[var(--brand-50)]">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Movimientos de Stock</h1>
              <p className="text-sm text-gray-600 mt-1">
                {totalMovements} {totalMovements === 1 ? 'movimiento' : 'movimientos'} registrados
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => document.getElementById('movement-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-4 py-2 bg-[var(--brand-600)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-700)] transition-colors"
              >
                Nuevo movimiento
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Formulario de creación */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div id="movement-form" className="sticky top-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Registrar movimiento</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Registra entradas, salidas o ajustes de inventario.
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Producto *
                      </label>
                      <select
                        {...register('product_id', { required: 'Selecciona un producto' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                      >
                        <option value="">Selecciona un producto...</option>
                        {(productsQuery.data ?? []).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {errors.product_id && <p className="text-xs text-red-600 mt-1">{errors.product_id.message}</p>}
                    </div>
                    
                    {showWarehouseField && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Almacén
                        </label>
                        <select
                          {...register('warehouse_id')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                        >
                          <option value="">Selecciona un almacén...</option>
                          {(warehousesQuery.data ?? []).map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo *
                        </label>
                        <select
                          {...register('movement_type', { required: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                        >
                          <option value="IN">Entrada</option>
                          <option value="OUT">Salida</option>
                          <option value="ADJUST">Ajuste</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          step="1"
                          min={1}
                          {...register('quantity', { required: 'Ingresa cantidad', min: { value: 1, message: 'Mínimo 1' } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                          placeholder="0"
                        />
                        {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas
                      </label>
                      <textarea
                        rows={3}
                        {...register('notes')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors resize-none"
                        placeholder="Información adicional..."
                      />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Nota:</strong> El ajuste establece la cantidad final absoluta para el producto en el almacén.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={createMut.isPending}
                      className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {createMut.isPending ? 'Registrando...' : 'Registrar movimiento'}
                    </button>
                    
                    {createMut.isError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        Error: {(createMut.error as any)?.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Lista de movimientos */}
          <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {!isAdmin && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-amber-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      Solo lectura. No tienes permisos para registrar movimientos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Movimientos recientes</h2>
                {movementsQuery.isLoading && (
                  <p className="text-sm text-gray-500 mt-1">Cargando movimientos...</p>
                )}
              </div>
              
              {movementsQuery.isError && (
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
                          Error al cargar movimientos: {(movementsQuery.error as any)?.message}
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
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      {showWarehouseField && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Almacén
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(movementsQuery.data ?? []).map(movement => (
                      <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(movement.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {productMap.get(movement.product_id) ?? movement.product_id}
                          </div>
                        </td>
                        {showWarehouseField && (
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {movement.warehouse_id ? (warehouseMap.get(movement.warehouse_id) ?? movement.warehouse_id) : 
                                <span className="text-gray-400 italic">Sin almacén</span>
                              }
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            movement.movement_type === 'IN' ? 'bg-green-100 text-green-800' :
                            movement.movement_type === 'OUT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {movement.movement_type === 'IN' ? 'Entrada' :
                             movement.movement_type === 'OUT' ? 'Salida' : 'Ajuste'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {movement.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {movement.notes || <span className="text-gray-400 italic">Sin notas</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {movementsQuery.data && movementsQuery.data.length === 0 && (
                      <tr>
                        <td colSpan={showWarehouseField ? 6 : 5} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <p className="text-sm text-gray-500">No hay movimientos registrados aún.</p>
                            {isAdmin && (
                              <p className="text-xs text-gray-400 mt-1">Registra tu primer movimiento usando el formulario.</p>
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