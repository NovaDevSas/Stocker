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
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Proveedores</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6">
        {isAdmin ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Crear proveedor</h2>
            <form className="mt-3 grid gap-3 sm:grid-cols-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                <input id="name" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('name', { required: 'El nombre es obligatorio' })} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="email">Email</label>
                <input id="email" type="email" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('email')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="phone">Teléfono</label>
                <input id="phone" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('phone')} />
              </div>
              <div className="grid gap-1.5 sm:col-span-4">
                <label className="text-sm font-medium" htmlFor="notes">Notas</label>
                <textarea id="notes" rows={3} className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('notes')} />
              </div>
              <div className="sm:col-span-4">
                <button type="submit" disabled={isSubmitting || createMutation.isPending} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60">
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                {createMutation.isError && <span className="ml-3 text-sm text-red-600">Error: {(createMutation.error as any)?.message}</span>}
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-800 text-sm">
            No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
          </div>
        )}

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Listado</h2>
            {suppliersQuery.isLoading && <span className="text-sm text-gray-500">Cargando...</span>}
          </div>
          {suppliersQuery.isError && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              Error: {(suppliersQuery.error as any)?.message}
            </div>
          )}
          <ul className="mt-3 divide-y">
            {suppliersQuery.data?.map(s => (
              <li key={s.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600 space-x-3">
                    {s.email && <span>{s.email}</span>}
                    {s.phone && <span>{s.phone}</span>}
                  </div>
                  {s.notes && <div className="text-sm text-gray-600 mt-1">{s.notes}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteMutation.mutate(s.id)} className="text-sm text-red-600 hover:underline" disabled={deleteMutation.isPending}>
                    Eliminar
                  </button>
                )}
              </li>
            ))}
            {suppliersQuery.data && suppliersQuery.data.length === 0 && (
              <li className="py-6 text-sm text-gray-500">No hay proveedores aún.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}