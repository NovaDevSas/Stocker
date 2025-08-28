import React, { useState, useEffect, useMemo } from 'react'
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

interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

function ProductImagesManager({ productId, isAdmin }: { productId: string; isAdmin: boolean }) {
  const qc = useQueryClient()
  const imagesQ = useQuery({
    queryKey: ['product_images', productId],
    queryFn: async (): Promise<ProductImage[]> => {
      const { data, error } = await supabase
        .from('product_images')
        .select('id, product_id, image_url, alt_text, is_primary, sort_order, created_at')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as any
    },
    enabled: !!productId,
  })

  const [signedMap, setSignedMap] = useState<Record<string, string>>({})
  useEffect(() => {
    const run = async () => {
      const list = imagesQ.data ?? []
      if (!list.length) { setSignedMap({}); return }
      const paths = list.map(i => i.image_url)
      const { data, error } = await supabase.storage.from('product-images').createSignedUrls(paths, 3600)
      if (!error && data) {
        const map: Record<string, string> = {}
        data.forEach((d, idx) => {
          map[paths[idx]] = d.signedUrl
        })
        setSignedMap(map)
      }
    }
    run()
  }, [imagesQ.data])

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const orig = file.name || 'file'
      const ext = (orig.includes('.') ? orig.split('.').pop() : '')?.toLowerCase() || 'bin'
      const path = `${productId}/${Date.now()}.${ext}`
      const contentType = file.type && file.type.length > 0 ? file.type : 'application/octet-stream'
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { contentType, cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { error: insErr } = await supabase.from('product_images').insert({
        product_id: productId,
        image_url: path,
        alt_text: orig,
        is_primary: false,
        sort_order: (imagesQ.data?.length || 0)
      })
      if (insErr) throw insErr
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product_images', productId] })
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (img: ProductImage) => {
      const { error: delObjErr } = await supabase.storage.from('product-images').remove([img.image_url])
      if (delObjErr) throw delObjErr
      const { error: delRowErr } = await supabase.from('product_images').delete().eq('id', img.id)
      if (delRowErr) throw delRowErr
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product_images', productId] })
    }
  })

  const setPrimaryMut = useMutation({
    mutationFn: async (img: ProductImage) => {
      // Desmarcar todas y marcar una
      const { error: clearErr } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
      if (clearErr) throw clearErr
      const { error: setErr } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', img.id)
      if (setErr) throw setErr
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product_images', productId] })
    }
  })

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMut.mutate(file)
    e.currentTarget.value = ''
  }

  return (
    <div className="mt-3">
      {isAdmin && (
        <div className="mb-3">
          <label className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 cursor-pointer">
            {uploadMut.isPending ? 'Subiendo...' : 'Subir imagen'}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
          {uploadMut.isError && <span className="ml-2 text-sm text-red-600">{(uploadMut.error as any)?.message || 'Error al subir'}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {(imagesQ.data ?? []).map(img => (
          <div key={img.id} className="rounded border p-2">
            <div className="aspect-square overflow-hidden rounded bg-gray-100">
              {signedMap[img.image_url] ? (
                <img src={signedMap[img.image_url]} alt={img.alt_text ?? ''} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">Sin vista previa</div>
              )}
            </div>
            <div className="mt-2 text-xs">
              {img.is_primary ? (
                <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">Principal</span>
              ) : isAdmin ? (
                <button onClick={() => setPrimaryMut.mutate(img)} className="text-indigo-600 hover:underline">Hacer principal</button>
              ) : null}
            </div>
            {isAdmin && (
              <div className="mt-1">
                <button onClick={() => deleteMut.mutate(img)} className="text-red-600 hover:underline text-xs">Eliminar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(imagesQ.isLoading) && <p className="mt-2 text-sm text-gray-500">Cargando imágenes...</p>}
      {(imagesQ.isError) && <p className="mt-2 text-sm text-red-600">Error al cargar imágenes.</p>}
    </div>
  )
}

export default function Products() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  // Estado de edición: producto actual a editar (o null si creando)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

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

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProductForm>({
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

  // Mutación para actualizar producto
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductForm }) => {
      const payload = {
        name: values.name.trim(),
        sku: values.sku?.trim() || null,
        price: Number(values.price) || 0,
        category_id: values.category_id ? values.category_id : null,
      }
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      // limpiar formulario y estado de edición
      reset()
      setEditingProduct(null)
      await qc.invalidateQueries({ queryKey: ['products'] })
      // si está seleccionado para imágenes y se editó otro campo, no hace falta cambiar nada
    },
  })

  // Mutación para eliminar producto
  const deleteMutationRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_, id) => {
      // si se estaba editando o seleccionado para imágenes, limpiar
      if (editingProduct?.id === id) setEditingProduct(null)
      if (selectedProductId === id) setSelectedProductId('')
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  // Al entrar a modo edición, cargar valores en el formulario
  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        sku: editingProduct.sku ?? '',
        price: editingProduct.price,
        category_id: editingProduct.category_id ?? '',
      })
    } else {
      // Si cancelamos la edición, dejamos el form listo para crear
      reset({ name: '', sku: '', price: 0, category_id: '' })
    }
  }, [editingProduct, reset])

  const onSubmit = async (values: ProductForm) => {
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  // Estado de búsqueda local y lista filtrada
  const [search, setSearch] = useState<string>('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = productsQuery.data ?? []
    if (!q) return items
    return items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q)
    )
  }, [productsQuery.data, search])

  return (
    <SearchContext.Provider value={[search, setSearch]}>
       <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)]">
         <header className="border-b bg-white">
           <div className="container mx-auto px-4 py-3 flex items-center justify-between">
             <div className="font-semibold tracking-tight">Productos</div>
             <div className="flex items-center gap-3">
               {productsQuery.data && (
                 <span className="hidden sm:inline text-sm text-gray-600">{productsQuery.data.length} en total</span>
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
               <h2 className="text-lg font-semibold">{editingProduct ? 'Editar producto' : 'Crear producto'}</h2>
               <p className="mt-1 text-sm text-gray-600">
                 {editingProduct ? 'Actualiza los datos del producto seleccionado.' : 'Completa los datos para incorporarlo al catálogo.'}
               </p>
               <form className="mt-4 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                 <div className="grid gap-1.5">
                   <label className="text-sm font-medium" htmlFor="name">Nombre</label>
                   <input id="name" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('name', { required: 'El nombre es obligatorio' })} />
                   {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                 </div>
                 <div className="grid gap-1.5">
                   <label className="text-sm font-medium" htmlFor="sku">SKU</label>
                   <input id="sku" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('sku')} />
                 </div>
                 <div className="grid gap-1.5">
                   <label className="text-sm font-medium" htmlFor="price">Precio</label>
                   <input id="price" type="number" step="0.01" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('price', { required: 'El precio es obligatorio', valueAsNumber: true })} />
                   {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
                 </div>
                 <div className="grid gap-1.5">
                   <label className="text-sm font-medium" htmlFor="category_id">Categoría</label>
                   <select id="category_id" className="w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" {...register('category_id')}>
                     <option value="">Sin categoría</option>
                     {categoriesQuery.data?.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex items-center gap-3">
                   <button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-4 py-2 text-white hover:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] disabled:opacity-60">
                     {editingProduct ? (updateMutation.isPending ? 'Guardando...' : 'Guardar cambios') : (createMutation.isPending ? 'Creando...' : 'Crear')}
                   </button>
                   {editingProduct && (
                     <button type="button" onClick={() => setEditingProduct(null)} disabled={updateMutation.isPending} className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] disabled:opacity-60">
                       Cancelar
                     </button>
                   )}
                   {(createMutation.isError || updateMutation.isError) && (
                     <span className="text-sm text-red-600">Error: {(createMutation.error as any)?.message || (updateMutation.error as any)?.message}</span>
                   )}
                 </div>
               </form>
             </div>
           ) : (
             <div className="rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-800 text-sm">
               No tienes permisos de escritura. Contacta a un administrador si necesitas acceso.
             </div>
           )}

           {/* Buscador + Listado */}
           <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <h2 className="font-semibold">Listado</h2>
               <ProductsSearch />
             </div>
             {productsQuery.isError && (
               <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">
                 Error: {(productsQuery.error as any)?.message}
               </div>
             )}
             <div className="mt-4 overflow-x-auto">
               <table className="min-w-full text-sm">
                 <thead>
                   <tr className="text-left text-gray-600">
                     <th className="py-2 pr-4">Nombre</th>
                     <th className="py-2 pr-4">SKU</th>
                     <th className="py-2 pr-4">Precio</th>
                     {isAdmin && <th className="py-2 pr-2 text-right">Acciones</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {filtered?.map(p => (
                     <tr key={p.id} className="hover:bg-[var(--brand-50)]/40">
                       <td className="py-2 pr-4 font-medium">{p.name}</td>
                       <td className="py-2 pr-4">{p.sku || '-'}</td>
                       <td className="py-2 pr-4">${typeof p.price === 'number' ? p.price.toFixed(2) : Number(p.price).toFixed(2)}</td>
                       {isAdmin && (
                         <td className="py-2 pr-2">
                           <div className="flex items-center justify-end gap-2">
                             <button
                               className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                               onClick={() => {
                                 setEditingProduct(p)
                                 setValue('name', p.name)
                                 setValue('sku', p.sku ?? '')
                                 setValue('price', Number(p.price))
                                 setValue('category_id', (p as any).category_id ?? '')
                                 window?.scrollTo({ top: 0, behavior: 'smooth' })
                               }}
                             >
                               Editar
                             </button>
                             <button
                               className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                               disabled={deleteMutationRow.isPending}
                               onClick={() => {
                                 if (confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) {
                                   deleteMutationRow.mutate(p.id)
                                 }
                               }}
                             >
                               Eliminar
                             </button>
                           </div>
                         </td>
                       )}
                     </tr>
                   ))}
                   {filtered && filtered.length === 0 && (
                     <tr>
                       <td colSpan={isAdmin ? 4 : 3} className="py-6 text-gray-500">No hay productos {search ? `para "${search}"` : 'aún'}.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>

           <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
             <div className="flex items-center justify-between">
               <h2 className="font-semibold">Imágenes de producto</h2>
             </div>
             <div className="mt-3 grid gap-3 sm:grid-cols-3">
               <div>
                 <label className="text-sm font-medium">Selecciona un producto</label>
                 <select className="mt-1 w-full rounded-md border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                   <option value="">Elige...</option>
                   {(productsQuery.data ?? []).map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
               </div>
             </div>
             {selectedProductId && (
               <ProductImagesManager productId={selectedProductId} isAdmin={!!isAdmin} />
             )}
           </div>
         </main>
       </div>
    </SearchContext.Provider>
  )
}

 // Local search component and hook inside this file for simplicity
 function ProductsSearch() {
   const [search, setSearch] = React.useContext(SearchContext)
   return (
     <div className="flex items-center gap-2">
       <label htmlFor="product-search" className="sr-only">Buscar productos</label>
       <input
         id="product-search"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Buscar por nombre o SKU"
         className="w-72 max-w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]"
       />
       {search && (
         <button onClick={() => setSearch('')} className="text-sm text-gray-600 hover:underline">Limpiar</button>
       )}
     </div>
   )
 }

 // Simple context to share search state within Products
 const SearchContext = React.createContext<[string, React.Dispatch<React.SetStateAction<string>>]>(['', () => {}])