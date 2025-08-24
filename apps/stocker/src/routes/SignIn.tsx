import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface FormValues {
  email: string
  password: string
}

export function SignIn() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signInWithPassword } = useAuth()

  const onSubmit = async (values: FormValues) => {
    setAuthError(null)
    const { error } = await signInWithPassword({ email: values.email, password: values.password })
    if (error) {
      setAuthError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-lg">
            <span className="inline-grid place-content-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">S</span>
            <span>Stocker</span>
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-600">Accede con tu email y contraseña</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="tucorreo@dominio.com"
              {...register('email', { required: 'El email es obligatorio' })}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {authError && <div className="rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">{authError}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta? Crea una desde el panel de Supabase o habilita magic link.
        </p>
      </div>
    </div>
  )
}