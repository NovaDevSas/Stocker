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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Movimientos</div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Movimientos de stock</h1>
            {!isAdmin && <span className="text-sm text-gray-600">Solo lectura</span>}
          </div>

          {isAdmin && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Producto</label>
                <select
                  {...register('product_id', { required: 'Selecciona un producto' })}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  <option value="">Selecciona...</option>
                  {(productsQuery.data ?? []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.product_id && <p className="mt-1 text-xs text-red-600">{errors.product_id.message}</p>}
              </div>
              {showWarehouseField && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">Almacén</label>
                  <select
                    {...register('warehouse_id')}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="">Selecciona...</option>
                    {(warehousesQuery.data ?? []).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <select
                  {...register('movement_type', { required: true })}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  <option value="IN">Entrada</option>
                  <option value="OUT">Salida</option>
                  <option value="ADJUST">Ajuste (cantidad final)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Cantidad</label>
                <input
                  type="number"
                  step="1"
                  min={1}
                  {...register('quantity', { required: 'Ingresa cantidad', min: { value: 1, message: 'Mínimo 1' } })}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
                {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
              </div>
              <div className="sm:col-span-5">
                <label className="block text-sm font-medium">Notas</label>
                <input
                  type="text"
                  {...register('notes')}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder="Opcional"
                />
              </div>
              <div className="sm:col-span-5 flex items-end">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMut.isPending ? 'Registrando...' : 'Registrar movimiento'}
                </button>
              </div>
              <p className="sm:col-span-5 mt-1 text-xs text-gray-500">Nota: Ajuste establece la cantidad final absoluta para el producto en el almacén.</p>
            </form>
          )}

          <div className="mt-8">
            <h2 className="font-medium">Recientes</h2>
            {(movementsQuery.isLoading) && <p className="mt-2 text-sm">Cargando...</p>}
            {movementsQuery.isError && (
              <div className="mt-2 text-sm text-red-600">{(movementsQuery.error as any)?.message}</div>
            )}
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Producto</th>
                    {showWarehouseField && (<th className="px-3 py-2">Almacén</th>)}
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {(movementsQuery.data ?? []).map(m => (
                    <tr key={m.id} className="border-b">
                      <td className="px-3 py-2">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{productMap.get(m.product_id) ?? m.product_id}</td>
                      {showWarehouseField && (
                        <td className="px-3 py-2">{m.warehouse_id ? (warehouseMap.get(m.warehouse_id) ?? m.warehouse_id) : ''}</td>
                      )}
                      <td className="px-3 py-2">{m.movement_type}</td>
                      <td className="px-3 py-2">{m.quantity}</td>
                      <td className="px-3 py-2">{m.notes ?? ''}</td>
                    </tr>
                  ))}
                  {movementsQuery.data && movementsQuery.data.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-gray-500" colSpan={showWarehouseField ? 6 : 5}>No hay movimientos aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}