import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Warehouse {
  id: string
  name: string
  location: string | null
  notes: string | null
  created_at: string
}

interface WarehouseForm {
  name: string
  location?: string
  notes?: string
}

export default function Warehouses() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, location, notes, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Warehouse[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WarehouseForm>({
    defaultValues: { name: '', location: '', notes: '' },
  })

  const createMutation = useMutation({
    mutationFn: async (values: WarehouseForm) => {
      const payload = {
        name: values.name.trim(),
        location: values.location?.trim() || null,
        notes: values.notes?.trim() || null,
      }
      const { error } = await supabase.from('warehouses').insert(payload)
      if (error) throw error
    },
    onSuccess: async () => {
      reset()
      await qc.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('warehouses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })

  const onSubmit = async (values: WarehouseForm) => {
    await createMutation.mutateAsync(values)
  }

  const totalWarehouses = warehousesQuery.data?.length ?? 0

  return (
    <div className="min-h-screen bg-[var(--brand-50)]">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Almacenes</h1>
              <p className="text-sm text-gray-600 mt-1">
                {totalWarehouses} {totalWarehouses === 1 ? 'almacén' : 'almacenes'} registrados
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => document.getElementById('warehouse-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-4 py-2 bg-[var(--brand-600)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-700)] transition-colors"
              >
                Nuevo
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
              <div id="warehouse-form" className="sticky top-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Crear almacén</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Registra una nueva ubicación de almacenamiento para organizar tu inventario.
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                        Nombre *
                      </label>
                      <input 
                        id="name" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors" 
                        placeholder="Ej: Almacén Principal"
                        {...register('name', { required: 'El nombre es obligatorio' })} 
                      />
                      {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="location">
                        Ubicación
                      </label>
                      <input 
                        id="location" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors" 
                        placeholder="Ej: Calle 123, Ciudad"
                        {...register('location')} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="notes">
                        Notas
                      </label>
                      <textarea 
                        id="notes" 
                        rows={3} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors resize-none" 
                        placeholder="Información adicional..."
                        {...register('notes')} 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting || createMutation.isPending} 
                      className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {createMutation.isPending ? 'Creando...' : 'Crear almacén'}
                    </button>
                    
                    {createMutation.isError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        Error: {(createMutation.error as any)?.message}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Lista de almacenes */}
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
                      No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lista de almacenes</h2>
                {warehousesQuery.isLoading && (
                  <p className="text-sm text-gray-500 mt-1">Cargando almacenes...</p>
                )}
              </div>
              
              {warehousesQuery.isError && (
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
                          Error al cargar almacenes: {(warehousesQuery.error as any)?.message}
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
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehousesQuery.data?.map((warehouse) => (
                      <tr key={warehouse.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{warehouse.name}</div>
                          <div className="text-sm text-gray-500">
                            Creado {new Date(warehouse.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {warehouse.location || <span className="text-gray-400 italic">Sin ubicación</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {warehouse.notes || <span className="text-gray-400 italic">Sin notas</span>}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button 
                              onClick={() => deleteMutation.mutate(warehouse.id)} 
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {warehousesQuery.data && warehousesQuery.data.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-sm text-gray-500">No hay almacenes registrados aún.</p>
                            {isAdmin && (
                              <p className="text-xs text-gray-400 mt-1">Crea tu primer almacén usando el formulario.</p>
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