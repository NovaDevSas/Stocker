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
            <h2 className="text-3xl font-bold leading-tight">Bienvenido</h2>
            <p className="mt-2 text-white/90">Administra tu inventario, productos y movimientos en un solo lugar.</p>
            <ul className="mt-6 space-y-2 text-sm text-white/90 list-disc list-inside">
              <li>Simple y rápido de usar</li>
              <li>Seguro con autenticación</li>
              <li>Escalable y modular</li>
            </ul>
          </div>
          <div className="text-xs text-white/70">© {new Date().getFullYear()} Stocker</div>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center md:text-left">
            <div className="md:hidden mb-3 flex items-center justify-center">
              <Link to="/" className="inline-flex items-center gap-2 font-semibold text-lg">
                <span className="inline-grid place-content-center w-9 h-9 rounded-full bg-[var(--brand-500)] text-white font-bold">S</span>
                <span>Stocker</span>
              </Link>
            </div>
            <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-gray-600">Accede con tu email y contraseña</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]"
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
                className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] focus-visible:border-[var(--brand-500)]"
                placeholder="••••••••"
                {...register('password', { required: 'La contraseña es obligatoria' })}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {authError && <div className="rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">{authError}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-md bg-[var(--brand-600)] px-4 py-2 text-white shadow-sm hover:bg-[var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)] disabled:opacity-60">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">¿No tienes cuenta? Crea una desde Supabase.</span>
            <a className="text-[var(--brand-700)] hover:underline" href="#recuperar">Olvidé mi contraseña</a>
          </div>
        </div>
      </div>
    </div>
  )
}