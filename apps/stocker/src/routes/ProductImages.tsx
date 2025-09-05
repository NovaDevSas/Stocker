import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  is_primary: boolean
  created_at: string
  product?: {
    name: string
    sku: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
}

interface ProductImageForm {
  product_id: string
  alt_text?: string
  is_primary: boolean
}

export default function ProductImages() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductImageForm>({
    defaultValues: {
      is_primary: false
    }
  })

  const selectedProductId = watch('product_id')

  // Fetch product images
  const { data: productImages = [], isLoading, error } = useQuery({
    queryKey: ['product-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select(`
          *,
          product:products(
            name,
            sku
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ProductImage[]
    }
  })

  // Generate signed URLs for images
  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!productImages.length) {
        setSignedUrls({})
        return
      }

      console.log('ProductImages:', productImages)

      const paths = productImages.map(img => {
        // If the image_url is already a path, use it directly
        // If it's a full URL, extract the path
        if (img.image_url.startsWith('http')) {
          const url = new URL(img.image_url)
          return url.pathname.split('/').slice(-2).join('/') // Get the last two parts: folder/filename
        } else {
          return img.image_url // It's already a path
        }
      })

      console.log('Paths for signed URLs:', paths)

      const { data, error } = await supabase.storage
        .from('product-images')
        .createSignedUrls(paths, 3600)

      console.log('Signed URLs response:', { data, error })

      if (!error && data) {
        const urlMap: Record<string, string> = {}
        data.forEach((item, index) => {
          if (item.signedUrl) {
            urlMap[productImages[index].image_url] = item.signedUrl
          }
        })
        console.log('URL Map:', urlMap)
        setSignedUrls(urlMap)
      } else {
        console.error('Error generating signed URLs:', error)
      }
    }

    generateSignedUrls()
  }, [productImages])

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('name')
      
      if (error) throw error
      return data as Product[]
    }
  })

  // Upload image mutation
  const uploadImage = useMutation({
    mutationFn: async ({ file, formData }: { file: File, formData: ProductImageForm }) => {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // If this is set as primary, unset other primary images for this product
      if (formData.is_primary) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', formData.product_id)
      }

      // Insert image record with just the file path
      const { data, error } = await supabase
        .from('product_images')
        .insert([{
          ...formData,
          image_url: filePath
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] })
      reset()
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  })

  // Delete image mutation
  const deleteImage = useMutation({
    mutationFn: async (image: ProductImage) => {
      // Delete from storage using the stored path
      await supabase.storage
        .from('product-images')
        .remove([image.image_url])

      // Delete from database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', image.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] })
      setSelectedImage(null)
    }
  })

  // Set as primary mutation
  const setPrimary = useMutation({
    mutationFn: async (image: ProductImage) => {
      // Unset other primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', image.product_id)

      // Set this image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', image.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images'] })
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const onSubmit = (data: ProductImageForm) => {
    if (!selectedFile) {
      alert('Por favor selecciona una imagen')
      return
    }
    uploadImage.mutate({ file: selectedFile, formData: data })
  }

  const handleDelete = (image: ProductImage) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      deleteImage.mutate(image)
    }
  }

  const handleSetPrimary = (image: ProductImage) => {
    setPrimary.mutate(image)
  }

  // Filter images by selected product
  const filteredImages = selectedProductId 
    ? productImages.filter(img => img.product_id === selectedProductId)
    : productImages

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando imágenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Imágenes de Productos</h1>
              <p className="text-sm text-gray-600 mt-1">
                {productImages.length} {productImages.length === 1 ? 'imagen registrada' : 'imágenes registradas'}
              </p>
            </div>
            {isAdmin && (
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Subir Imagen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Subir imagen</h2>
                    <p className="text-sm text-gray-600">
                      Agrega imágenes a tus productos para mejorar su presentación.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Producto *
                      </label>
                      <select
                        {...register('product_id', { required: 'Selecciona un producto' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                      {errors.product_id && (
                        <p className="text-red-600 text-sm mt-1">{errors.product_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                      {previewUrl && (
                        <div className="mt-3">
                          <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto alternativo
                      </label>
                      <input
                        {...register('alt_text')}
                        type="text"
                        placeholder="Descripción de la imagen"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        {...register('is_primary')}
                        type="checkbox"
                        className="h-4 w-4 text-[var(--brand-600)] focus:ring-[var(--brand-500)] border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Imagen principal del producto
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={uploadImage.isPending || !selectedFile}
                      className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadImage.isPending ? 'Subiendo...' : 'Subir Imagen'}
                    </button>

                    {uploadImage.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">
                          Error: {uploadImage.error.message}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Images Grid */}
          <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Galería de imágenes</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Gestiona las imágenes de tus productos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filtrar por producto:</label>
                    <select
                      value={selectedProductId || ''}
                      onChange={(e) => {
                        const form = document.querySelector('form') as HTMLFormElement
                        if (form) {
                          const select = form.querySelector('select[name="product_id"]') as HTMLSelectElement
                          if (select) select.value = e.target.value
                        }
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)]"
                    >
                      <option value="">Todos los productos</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Error al cargar imágenes: {error.message}</p>
                  </div>
                </div>
              )}

              {filteredImages.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay imágenes</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedProductId ? 'Este producto no tiene imágenes.' : 'Comienza subiendo la primera imagen.'}
                  </p>
                  {isAdmin && (
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Subir primera imagen
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredImages.map((image) => (
                      <div key={image.id} className="relative group bg-gray-50 rounded-lg overflow-hidden">
                        <div className="aspect-square">
                          <img 
                            src={signedUrls[image.image_url] || image.image_url} 
                            alt={image.alt_text || 'Imagen del producto'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error loading image:', image.image_url, signedUrls[image.image_url]);
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWMTAwSDgwVjYwWiIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNOTAgODBMMTAwIDkwTDExMCA4MEwxMjAgMTAwSDgwTDkwIDgwWiIgZmlsbD0iI0E3QjJCOCIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              onClick={() => setSelectedImage(image)}
                              className="p-2 bg-white rounded-full text-gray-700 hover:text-[var(--brand-600)] transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {isAdmin && !image.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(image)}
                                disabled={setPrimary.isPending}
                                className="p-2 bg-white rounded-full text-gray-700 hover:text-yellow-600 transition-colors disabled:opacity-50"
                                title="Establecer como principal"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(image)}
                                disabled={deleteImage.isPending}
                                className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Primary badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Principal
                            </span>
                          </div>
                        )}
                        
                        {/* Product info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white text-sm font-medium">{image.product?.name}</p>
                          <p className="text-gray-300 text-xs">{image.product?.sku}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedImage.product?.name}
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={signedUrls[selectedImage.image_url] || selectedImage.image_url} 
                    alt={selectedImage.alt_text || 'Imagen del producto'}
                    className="w-full rounded-lg"
                    onError={(e) => {
                      console.error('Error loading preview image:', selectedImage.image_url, signedUrls[selectedImage.image_url]);
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWMTAwSDgwVjYwWiIgZmlsbD0iI0Q1RDlERCIvPgo8cGF0aCBkPSJNOTAgODBMMTAwIDkwTDExMCA4MEwxMjAgMTAwSDgwTDkwIDgwWiIgZmlsbD0iI0E3QjJCOCIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <p className="text-gray-900">{selectedImage.product?.name}</p>
                    <p className="text-gray-600 text-sm">{selectedImage.product?.sku}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto alternativo</label>
                    <p className="text-gray-900">{selectedImage.alt_text || 'No especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      selectedImage.is_primary 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedImage.is_primary ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Imagen principal
                        </>
                      ) : (
                        'Imagen secundaria'
                      )}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de subida</label>
                    <p className="text-gray-900">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de la imagen</label>
                    <p className="text-gray-600 text-sm break-all">{selectedImage.image_url}</p>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2 pt-4">
                      {!selectedImage.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(selectedImage)}
                          disabled={setPrimary.isPending}
                          className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          {setPrimary.isPending ? 'Estableciendo...' : 'Establecer como principal'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selectedImage)}
                        disabled={deleteImage.isPending}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {deleteImage.isPending ? 'Eliminando...' : 'Eliminar imagen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}