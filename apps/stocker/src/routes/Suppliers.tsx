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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Proveedores</h1>
            <p className="mt-1 text-sm text-gray-600">Gestiona la información de tus proveedores</p>
          </div>
          <div className="flex items-center gap-3">
            {suppliersQuery.data && (
              <span className="hidden sm:inline text-sm text-gray-600">{suppliersQuery.data.length} en total</span>
            )}
            {isAdmin && (
              <a href="#create" className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)]">Nuevo</a>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        {isAdmin ? (
          <div id="create" className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6 h-max">
            <h2 className="text-lg font-semibold">Crear proveedor</h2>
            <p className="mt-1 text-sm text-gray-600">
              Completa los datos para incorporarlo al directorio.
            </p>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                <input id="name" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('name', { required: 'El nombre es obligatorio' })} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="email">Email</label>
                <input id="email" type="email" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('email')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="phone">Teléfono</label>
                <input id="phone" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('phone')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="notes">Notas</label>
                <textarea id="notes" rows={3} className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('notes')} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={isSubmitting || createMutation.isPending} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-4 py-2 text-white hover:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] disabled:opacity-60">
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                {createMutation.isError && (
                  <span className="text-sm text-red-600">Error: {(createMutation.error as any)?.message}</span>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-800 text-sm">
            No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
          </div>
        )}

        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Listado</h2>
            {suppliersQuery.isLoading && <span className="text-sm text-gray-500">Cargando...</span>}
          </div>
          {suppliersQuery.isError && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              Error: {(suppliersQuery.error as any)?.message}
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Contacto</th>
                  <th className="py-2 pr-4">Notas</th>
                  {isAdmin && <th className="py-2 pr-2 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliersQuery.data?.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--brand-50)]/40">
                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                    <td className="py-3 pr-4">
                      <div className="space-y-1">
                        {s.email && <div className="text-sm text-gray-600">{s.email}</div>}
                        {s.phone && <div className="text-sm text-gray-600">{s.phone}</div>}
                        {!s.email && !s.phone && <span className="text-sm text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {s.notes ? (
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={s.notes}>{s.notes}</div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 pr-2">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => deleteMutation.mutate(s.id)} 
                            className="inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300" 
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
                    <td colSpan={isAdmin ? 4 : 3} className="py-6 text-gray-500">No hay proveedores aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}