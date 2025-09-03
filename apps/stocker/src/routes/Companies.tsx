import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Company {
  id: string
  name: string
  tax_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  signature_url: string | null
  created_at: string
}

interface CompanyForm {
  name: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
}

export default function Companies() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyForm>()

  // Fetch companies
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Company[]
    }
  })

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (formData: CompanyForm) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([formData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      reset()
    }
  })

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setSelectedCompany(null)
    }
  })

  const onSubmit = (data: CompanyForm) => {
    createCompany.mutate(data)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      deleteCompany.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
              <p className="text-sm text-gray-600 mt-1">
                {companies.length} {companies.length === 1 ? 'empresa registrada' : 'empresas registradas'}
              </p>
            </div>
            {isAdmin && (
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Empresa
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Registrar empresa</h2>
                    <p className="text-sm text-gray-600">
                      Agrega una nueva empresa con sus datos fiscales y de contacto.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la empresa *
                      </label>
                      <input
                        {...register('name', { required: 'El nombre es requerido' })}
                        type="text"
                        placeholder="Nombre de la empresa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RFC / Tax ID
                      </label>
                      <input
                        {...register('tax_id')}
                        type="text"
                        placeholder="RFC o identificación fiscal"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <textarea
                        {...register('address')}
                        rows={2}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="Número de teléfono"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        {...register('email', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        type="email"
                        placeholder="correo@empresa.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] transition-colors"
                      />
                      {errors.email && (
                        <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={createCompany.isPending}
                      className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createCompany.isPending ? 'Registrando...' : 'Registrar Empresa'}
                    </button>

                    {createCompany.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">
                          Error: {createCompany.error.message}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Companies List */}
          <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lista de empresas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona las empresas registradas en el sistema
                </p>
              </div>

              {error && (
                <div className="p-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Error al cargar empresas: {error.message}</p>
                  </div>
                </div>
              )}

              {companies.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empresas registradas</h3>
                  <p className="text-gray-600 mb-4">Comienza registrando tu primera empresa.</p>
                  {isAdmin && (
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Registrar primera empresa
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Empresa</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">RFC/Tax ID</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Contacto</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Fecha</th>
                        {isAdmin && <th className="text-left py-3 px-6 font-medium text-gray-700">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.website && (
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                              >
                                {company.website}
                              </a>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {company.tax_id ? (
                              <span className="text-gray-900">{company.tax_id}</span>
                            ) : (
                              <span className="text-gray-400">Sin RFC</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              {company.email && (
                                <div className="text-sm text-gray-900">{company.email}</div>
                              )}
                              {company.phone && (
                                <div className="text-sm text-gray-600">{company.phone}</div>
                              )}
                              {!company.email && !company.phone && (
                                <span className="text-gray-400">Sin contacto</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-700">
                              {new Date(company.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedCompany(company)}
                                  className="text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(company.id)}
                                  disabled={deleteCompany.isPending}
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

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCompany.name}
                </h3>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-gray-900">{selectedCompany.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFC / Tax ID</label>
                    <p className="text-gray-900">{selectedCompany.tax_id || 'No especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedCompany.email || 'No especificado'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <p className="text-gray-900">{selectedCompany.phone || 'No especificado'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                    {selectedCompany.website ? (
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                      >
                        {selectedCompany.website}
                      </a>
                    ) : (
                      <p className="text-gray-900">No especificado</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de registro</label>
                    <p className="text-gray-900">{new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <p className="text-gray-500 text-sm">Funcionalidad de subida de archivos pendiente</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                    <p className="text-gray-500 text-sm">Funcionalidad de subida de archivos pendiente</p>
                  </div>
                </div>
              </div>
              
              {selectedCompany.address && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <p className="text-gray-900">{selectedCompany.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}