import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  category_id: string | null
  created_at: string
}

interface Category { id: string; name: string }

interface ProductForm {
  name: string
  sku?: string
  price: number
  category_id?: string
}

export default function Products() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'for-select'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name')
      if (error) throw error
      return data as Category[]
    },
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, category_id, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    defaultValues: { name: '', sku: '', price: 0, category_id: '' },
  })

  const createMutation = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        name: values.name.trim(),
        sku: values.sku?.trim() || null,
        price: Number(values.price) || 0,
        category_id: values.category_id ? values.category_id : null,
      }
      const { error } = await supabase.from('products').insert(payload)
      if (error) throw error
    },
    onSuccess: async () => {
      reset()
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const onSubmit = async (values: ProductForm) => {
    await createMutation.mutateAsync(values)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Productos</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6">
        {isAdmin ? (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Crear producto</h2>
            <form className="mt-3 grid gap-3 sm:grid-cols-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                <input id="name" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('name', { required: 'El nombre es obligatorio' })} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="sku">SKU</label>
                <input id="sku" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('sku')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="price">Precio</label>
                <input id="price" type="number" step="0.01" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('price', { required: 'El precio es obligatorio', valueAsNumber: true })} />
                {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="category_id">Categoría</label>
                <select id="category_id" className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('category_id')}>
                  <option value="">Sin categoría</option>
                  {categoriesQuery.data?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex items-end">
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
            {productsQuery.isLoading && <span className="text-sm text-gray-500">Cargando...</span>}
          </div>
          {productsQuery.isError && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              Error: {(productsQuery.error as any)?.message}
            </div>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productsQuery.data?.map(p => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.sku || '-'}</td>
                    <td className="py-2 pr-4">${'{'}p.price?.toFixed ? p.price.toFixed(2) : Number(p.price).toFixed(2){'}'}</td>
                  </tr>
                ))}
                {productsQuery.data && productsQuery.data.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-gray-500">No hay productos aún.</td>
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
