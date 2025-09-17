import { useForm } from 'react-hook-form'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface ProfileForm {
  display_name: string
  username: string
  phone: string
  avatar_url?: string
}

interface Profile {
  id: string
  display_name: string | null
  username: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
 const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen válido' })
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' })
        return
      }
      
      setSelectedFile(file)
      
      // Crear URL de vista previa
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`
      
      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) {
        throw uploadError
      }
      
      // Obtener URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Error al subir la imagen' })
      return null
    } finally {
      setUploading(false)
    }
  }

  // Cargar perfil del usuario
  useEffect(() => {
    if (!user) return
    
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error loading profile:', error)
          setMessage({ type: 'error', text: 'Error al cargar el perfil' })
          return
        }
        
        setProfile(data)
        // Llenar el formulario con los datos actuales
        setValue('display_name', data.display_name || '')
        setValue('username', data.username || '')
        setValue('phone', data.phone || '')
        setValue('avatar_url', data.avatar_url || '')
      } catch (error) {
        console.error('Error:', error)
        setMessage({ type: 'error', text: 'Error inesperado al cargar el perfil' })
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [user, setValue])

  const onSubmit = async (values: ProfileForm) => {
    if (!user) return
    
    setUpdating(true)
    setMessage(null)
    
    try {
      let avatarUrl = values.avatar_url
      
      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        const uploadedUrl = await uploadAvatar(selectedFile)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        } else {
          // Si falla la subida, no continuar
          setUpdating(false)
          return
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: values.display_name,
          username: values.username,
          phone: values.phone,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) {
        console.error('Error updating profile:', error)
        setMessage({ type: 'error', text: error.message })
        return
      }
      
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
      
      // Limpiar archivo seleccionado y vista previa
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Recargar el perfil
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setValue('avatar_url', data.avatar_url || '')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'Error inesperado al actualizar el perfil' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Mi Perfil</h1>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza tu información personal y configuración de cuenta
            </p>
          </div>
          
          <div className="p-6">
            {message && (
              <div className={`mb-4 p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  {...register('display_name', { 
                    required: 'El nombre para mostrar es requerido',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                  })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Tu nombre completo"
                />
                {errors.display_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.display_name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  {...register('username', { 
                    required: 'El nombre de usuario es requerido',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Solo letras, números y guiones bajos'
                    }
                  })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="tu_usuario"
                />
                {errors.username && (
                  <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^[+]?[0-9\s\-\(\)]+$/,
                      message: 'Formato de teléfono inválido'
                    }
                  })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="+57 300 123 4567"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
              
              {/* Sección de Avatar */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Foto de Perfil
                </label>
                
                {/* Vista previa del avatar actual o seleccionado */}
                <div className="flex items-center space-x-6">
                  <div className="shrink-0">
                    <img
                      className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
                      src={previewUrl || profile?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iMzIiIHI9IjEyIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2OEMyMCA1Ni45NTQzIDI4Ljk1NDMgNDggNDAgNDhDNTEuMDQ1NyA0OCA2MCA1Ni45NTQzIDYwIDY4VjgwSDIwVjY4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'}
                      alt="Avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iMzIiIHI9IjEyIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCA2OEMyMCA1Ni45NTQzIDI4Ljk1NDMgNDggNDAgNDhDNTEuMDQ1NyA0OCA2MCA1Ni45NTQzIDYwIDY4VjgwSDIwVjY4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {uploading ? 'Subiendo...' : 'Cambiar foto'}
                      </button>
                      {selectedFile && (
                        <span className="text-sm text-gray-500">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>
                
                {/* Campo de URL alternativo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O ingresa una URL de imagen
                  </label>
                  <input
                    type="url"
                    {...register('avatar_url', {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'Debe ser una URL válida (http:// o https://)'
                      }
                    })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://ejemplo.com/mi-avatar.jpg"
                  />
                  {errors.avatar_url && (
                    <p className="text-red-600 text-sm mt-1">{errors.avatar_url.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {profile && (
                    <span>Última actualización: {new Date(profile.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={updating || uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo imagen...' : updating ? 'Actualizando...' : 'Actualizar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  )
}