import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface CategoryForm {
  name: string
  description?: string
}

export default function Categories() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Category[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryForm>({
    defaultValues: { name: '', description: '' },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CategoryForm) => {
      const { error } = await supabase
        .from('categories')
        .insert({ name: values.name.trim(), description: values.description?.trim() || null })
      if (error) throw error
    },
    onSuccess: async () => {
      reset()
      await qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const onSubmit = async (values: CategoryForm) => {
    await createMutation.mutateAsync(values)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Categorías</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6">
        {isAdmin ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Crear categoría</h2>
            <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5 sm:col-span-1">
                <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                <input id="name" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('name', { required: 'El nombre es obligatorio' })} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5 sm:col-span-1">
                <label className="text-sm font-medium" htmlFor="description">Descripción</label>
                <input id="description" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('description')} />
              </div>
              <div className="sm:col-span-2">
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
            {categoriesQuery.isLoading && <span className="text-sm text-gray-500">Cargando...</span>}
          </div>
          {categoriesQuery.isError && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              Error: {(categoriesQuery.error as any)?.message}
            </div>
          )}
          <ul className="mt-3 divide-y">
            {categoriesQuery.data?.map(cat => (
              <li key={cat.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{cat.name}</div>
                  {cat.description && <div className="text-sm text-gray-600">{cat.description}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteMutation.mutate(cat.id)} className="text-sm text-red-600 hover:underline" disabled={deleteMutation.isPending}>
                    Eliminar
                  </button>
                )}
              </li>
            ))}
            {categoriesQuery.data && categoriesQuery.data.length === 0 && (
              <li className="py-6 text-sm text-gray-500">No hay categorías aún.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}
