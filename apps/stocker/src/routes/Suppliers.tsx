import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

interface SupplierForm {
  name: string
  email?: string
  phone?: string
  notes?: string
}

export default function Suppliers() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, email, phone, notes, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Supplier[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierForm>({
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  })

  const createMutation = useMutation({
    mutationFn: async (values: SupplierForm) => {
      const payload = {
        name: values.name.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        notes: values.notes?.trim() || null,
      }
      const { error } = await supabase.from('suppliers').insert(payload)
      if (error) throw error
    },
    onSuccess: async () => {
      reset()
      await qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  const onSubmit = async (values: SupplierForm) => {
    await createMutation.mutateAsync(values)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)]">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Proveedores</h1>
            <p className="text-sm text-gray-600">Gestiona la información de tus proveedores</p>
          </div>
          <div className="flex items-center gap-3">
            {suppliersQuery.data && (
              <span className="hidden sm:inline text-sm text-gray-600">{suppliersQuery.data.length} en total</span>
            )}
            {isAdmin && (
              <a href="#create" className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)] transition-colors">
                Nuevo
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        {isAdmin ? (
          <div id="create" className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6 h-max">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Crear proveedor</h2>
              <p className="text-sm text-gray-600">
                Completa los datos para incorporarlo al directorio.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">Nombre</label>
                <input 
                  id="name" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors" 
                  {...register('name', { required: 'El nombre es obligatorio' })} 
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">Email</label>
                <input 
                  id="email" 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors" 
                  {...register('email')} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">Teléfono</label>
                <input 
                  id="phone" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors" 
                  {...register('phone')} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="notes">Notas</label>
                <textarea 
                  id="notes" 
                  rows={3} 
                  placeholder="Notas adicionales sobre el proveedor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors resize-none" 
                  {...register('notes')} 
                />
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || createMutation.isPending} 
                  className="w-full inline-flex items-center justify-center rounded-lg bg-[var(--brand-600)] px-4 py-2.5 text-white font-medium hover:bg-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                {createMutation.isError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    Error: {(createMutation.error as any)?.message}
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-800 text-sm">
            No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Listado de Proveedores</h2>
                <p className="text-sm text-gray-600 mt-1">Gestiona todos los proveedores registrados en el sistema</p>
              </div>
              {suppliersQuery.isLoading && <span className="text-sm text-gray-500">Cargando...</span>}
            </div>
          </div>
          <div className="p-6">
            {suppliersQuery.isError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                Error: {(suppliersQuery.error as any)?.message}
              </div>
            )}
            {suppliersQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando proveedores...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Contacto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Notas</th>
                      {isAdmin && <th className="text-right py-3 px-4 font-medium text-gray-900">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliersQuery.data?.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900">{s.name}</td>
                        <td className="py-4 px-4 text-gray-600">
                          <div className="space-y-1">
                            {s.email && <div className="text-sm">{s.email}</div>}
                            {s.phone && <div className="text-sm text-gray-500">{s.phone}</div>}
                            {!s.email && !s.phone && <span className="text-sm text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {s.notes ? (
                            <div className="max-w-xs truncate" title={s.notes}>{s.notes}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end">
                              <button 
                                onClick={() => deleteMutation.mutate(s.id)} 
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm font-medium transition-colors" 
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {suppliersQuery.data && suppliersQuery.data.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="py-8 text-center text-gray-500">No hay proveedores aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}