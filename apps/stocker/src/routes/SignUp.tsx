import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface FormValues {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  username: string
  phone?: string
}

export function SignUp() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '', username: '', phone: '' },
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const password = watch('password')

  const onSubmit = async (values: FormValues) => {
    setAuthError(null)
    
    if (values.password !== values.confirmPassword) {
      setAuthError('Las contraseñas no coinciden')
      return
    }

    try {
      // Registrar usuario con metadata adicional
      const { error, user } = await signUp({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        username: values.username,
        phone: values.phone
      })

      if (error) {
        setAuthError(error)
        return
      }

      if (user && !user.email_confirmed_at) {
        setSuccess(true)
      } else {
        // Si el email ya está confirmado, redirigir al dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      setAuthError('Error inesperado durante el registro')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] grid place-items-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full grid place-items-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Hemos enviado un enlace de confirmación a tu correo electrónico. 
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <Link 
            to="/signin" 
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-[var(--brand-600)] text-white rounded-lg hover:bg-[var(--brand-700)] transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--brand-100)] grid place-items-center px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl border bg-white shadow-xl">
        {/* Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] p-8 text-white">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-lg">
            <span className="inline-grid place-content-center w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/30">
              <span className="font-bold">S</span>
            </span>
            <span className="tracking-tight">Stocker</span>
          </Link>
          <div>
            <h2 className="text-3xl font-bold leading-tight">Únete a Stocker</h2>
            <p className="mt-2 text-white/90">Crea tu cuenta y comienza a gestionar tu inventario de manera profesional.</p>
            <ul className="mt-6 space-y-2 text-sm text-white/90 list-disc list-inside">
              <li>Perfil automático al registrarte</li>
              <li>Gestión completa de inventario</li>
              <li>Seguridad y respaldo en la nube</li>
            </ul>
          </div>
          <div className="text-xs text-white/70">© {new Date().getFullYear()} Stocker</div>
        </div>

        {/* Form panel */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="mt-2 text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/signin" className="font-medium text-[var(--brand-600)] hover:text-[var(--brand-500)]">
                Inicia sesión
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <input
                {...register('email', {
                  required: 'El correo es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="tu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                {...register('displayName', {
                  required: 'El nombre es obligatorio',
                  minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="Juan Pérez"
              />
              {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario *
              </label>
              <input
                {...register('username', {
                  required: 'El nombre de usuario es obligatorio',
                  minLength: { value: 3, message: 'El nombre de usuario debe tener al menos 3 caracteres' },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Solo se permiten letras, números y guiones bajos'
                  }
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="juanperez"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (opcional)
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña *
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--brand-600)] text-white py-2 px-4 rounded-lg hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUp