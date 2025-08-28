import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMemo, useState } from 'react'

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

  // Filtro local para una UX más empresarial
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const list = categoriesQuery.data ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(c => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q))
  }, [categoriesQuery.data, search])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)]">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold tracking-tight">Categorías</div>
          <div className="flex items-center gap-3">
            {categoriesQuery.data && (
              <span className="hidden sm:inline text-sm text-gray-600">{categoriesQuery.data.length} en total</span>
            )}
            {isAdmin && (
              <a href="#create" className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)]">Nueva</a>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-3">
        {isAdmin ? (
          <div id="create" className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6 h-max">
            <h2 className="text-lg font-semibold">Crear categoría</h2>
            <p className="mt-1 text-sm text-gray-600">Define el nombre y descripción para organizar tu catálogo.</p>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                <input id="name" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('name', { required: 'El nombre es obligatorio' })} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="description">Descripción</label>
                <input id="description" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('description')} />
              </div>
              <div>
                <button type="submit" disabled={isSubmitting || createMutation.isPending} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-4 py-2 text-white hover:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] disabled:opacity-60">
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
                {createMutation.isError && <span className="ml-3 text-sm text-red-600">Error: {(createMutation.error as any)?.message}</span>}
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-800 text-sm lg:col-span-1">
            No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
          </div>
        )}

        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Listado</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="search" className="sr-only">Buscar categorías</label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="w-72 max-w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-sm text-gray-600 hover:underline">Limpiar</button>
              )}
            </div>
          </div>
          {categoriesQuery.isError && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              Error: {(categoriesQuery.error as any)?.message}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr>
                  <th className="py-2 pr-3 font-medium">Nombre</th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">Descripción</th>
                  <th className="py-2 pr-3 font-medium hidden sm:table-cell">Creada</th>
                  {isAdmin && <th className="py-2 w-px" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered?.map(cat => (
                  <tr key={cat.id} className="hover:bg-[var(--brand-50)]/40">
                    <td className="py-2 pr-3 font-medium">{cat.name}</td>
                    <td className="py-2 pr-3 hidden md:table-cell text-gray-700">{cat.description || '—'}</td>
                    <td className="py-2 pr-3 hidden sm:table-cell text-gray-600">{new Date(cat.created_at).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => { if (confirm('¿Eliminar categoría?')) deleteMutation.mutate(cat.id) }}
                          className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-60"
                          disabled={deleteMutation.isPending}
                          aria-label={`Eliminar ${cat.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V4.5h3.75a.75.75 0 0 1 0 1.5H18l-.787 12.074A3 3 0 0 1 14.22 21H9.78a3 3 0 0 1-2.993-2.926L6 6H5.25a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.75h3V4.5h-3V4.5Zm-.72 4.97a.75.75 0 1 0-1.06 1.06l.53 8.255a1.5 1.5 0 0 0 1.497 1.415h4.44a1.5 1.5 0 0 0 1.497-1.415l.53-8.255a.75.75 0 1 0-1.06-1.06l-.53 8.255a.75.75 0 0 1-.748.708H11.25a.75.75 0 0 1-.748-.708l-.53-8.255Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered && filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">{search ? `No hay resultados para “${search}”.` : 'No hay categorías aún.'}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
