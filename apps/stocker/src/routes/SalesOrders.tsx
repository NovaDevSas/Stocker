import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface SalesOrder {
  id: string
  order_number: string | null
  customer_id: string | null
  created_by: string | null
  total: number
  notes: string | null
  created_at: string
  customers?: {
    name: string
  }
  sales_order_items?: SalesOrderItem[]
}

interface SalesOrderItem {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  products?: {
    name: string
    price: number
  }
}

interface SalesOrderForm {
  customer_id: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
  }[]
}

interface Customer {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  price: number
}

export default function SalesOrders() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)

  const { register, handleSubmit, reset, control, watch } = useForm<SalesOrderForm>({
    defaultValues: {
      items: [{ product_id: '', quantity: 1, unit_price: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  const total = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Fetch sales orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers(name),
          sales_order_items(
            *,
            products(name, price)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as SalesOrder[]
    }
  })

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data as Customer[]
    }
  })

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name')
      
      if (error) throw error
      return data as Product[]
    }
  })

  // Create sales order mutation
  const createOrder = useMutation({
    mutationFn: async (formData: SalesOrderForm) => {
      // Generate order number
      const orderNumber = `SO-${Date.now()}`
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert([{
          order_number: orderNumber,
          customer_id: formData.customer_id || null,
          total: total,
          notes: formData.notes || null
        }])
        .select()
        .single()
      
      if (orderError) throw orderError

      // Create order items
      const items = formData.items.map(item => ({
        sales_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(items)
      
      if (itemsError) throw itemsError
      
      return order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      reset({
        items: [{ product_id: '', quantity: 1, unit_price: 0 }]
      })
    }
  })

  // Delete sales order mutation
  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      setSelectedOrder(null)
    }
  })

  const onSubmit = (data: SalesOrderForm) => {
    createOrder.mutate(data)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido de venta?')) {
      deleteOrder.mutate(id)
    }
  }

  const addItem = () => {
    append({ product_id: '', quantity: 1, unit_price: 0 })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos de venta...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Pedidos de Venta</h1>
              <p className="text-sm text-gray-600 mt-1">
                {orders.length} {orders.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
              </p>
            </div>
            {isAdmin && (
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Pedido
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Crear pedido de venta</h2>
                    <p className="text-sm text-gray-600">
                      Registra un nuevo pedido de venta con sus productos correspondientes.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente
                      </label>
                      <select
                        {...register('customer_id')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      >
                        <option value="">Seleccionar cliente (opcional)</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas
                      </label>
                      <textarea
                        {...register('notes')}
                        rows={2}
                        placeholder="Notas del pedido..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors resize-none"
                      />
                    </div>

                    {/* Items Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Productos
                        </label>
                        <button
                          type="button"
                          onClick={addItem}
                          className="text-sm text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                        >
                          + Agregar producto
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Producto {index + 1}</span>
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                            </div>
                            
                            <div className="space-y-2">
                              <select
                                {...register(`items.${index}.product_id`, { required: 'Selecciona un producto' })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)]"
                              >
                                <option value="">Seleccionar producto</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - ${product.price}
                                  </option>
                                ))}
                              </select>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  {...register(`items.${index}.quantity`, { 
                                    required: 'Cantidad requerida',
                                    min: { value: 1, message: 'Mínimo 1' }
                                  })}
                                  type="number"
                                  placeholder="Cant."
                                  min="1"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)]"
                                />
                                <input
                                  {...register(`items.${index}.unit_price`, { 
                                    required: 'Precio requerido',
                                    min: { value: 0, message: 'Mínimo 0' }
                                  })}
                                  type="number"
                                  step="0.01"
                                  placeholder="Precio"
                                  min="0"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-[var(--brand-600)]">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={createOrder.isPending}
                      className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createOrder.isPending ? 'Creando...' : 'Crear Pedido'}
                    </button>

                    {createOrder.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">
                          Error: {createOrder.error.message}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lista de pedidos de venta</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona los pedidos de venta registrados en el sistema
                </p>
              </div>

              {error && (
                <div className="p-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Error al cargar pedidos: {error.message}</p>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos de venta</h3>
                  <p className="text-gray-600 mb-4">Comienza creando tu primer pedido de venta.</p>
                  {isAdmin && (
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear primer pedido
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Número</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Cliente</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Fecha</th>
                        {isAdmin && <th className="text-left py-3 px-6 font-medium text-gray-700">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{order.order_number}</div>
                            {order.notes && (
                              <div className="text-sm text-gray-500">{order.notes}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {order.customers?.name || (
                              <span className="text-gray-400">Sin cliente</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-[var(--brand-600)]">
                              ${order.total.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-700">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  disabled={deleteOrder.isPending}
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pedido {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <p className="text-gray-900">{selectedOrder.customers?.name || 'Sin cliente'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <p className="text-lg font-bold text-[var(--brand-600)]">${selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <p className="text-gray-900">{selectedOrder.notes || 'Sin notas'}</p>
                </div>
              </div>

              {selectedOrder.sales_order_items && selectedOrder.sales_order_items.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Productos</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Producto</th>
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Cantidad</th>
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Precio Unit.</th>
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.sales_order_items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-4 text-sm text-gray-900">
                              {item.products?.name || 'Producto eliminado'}
                            </td>
                            <td className="py-2 px-4 text-sm text-gray-900">{item.quantity}</td>
                            <td className="py-2 px-4 text-sm text-gray-900">${item.unit_price.toFixed(2)}</td>
                            <td className="py-2 px-4 text-sm font-medium text-gray-900">
                              ${(item.quantity * item.unit_price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}