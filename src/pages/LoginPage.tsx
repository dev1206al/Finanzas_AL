import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden', path: ['confirmPassword'],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { signIn, signUp } = useAuth()

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function handleLogin(data: LoginForm) {
    try { await signIn(data.email, data.password) }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error al iniciar sesión') }
  }
  async function handleRegister(data: RegisterForm) {
    try { await signUp(data.email, data.password, data.name); toast.success('Cuenta creada. Revisa tu email.') }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error al crear cuenta') }
  }

  const inputClass = 'input'

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Finanzas AL" className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas AL</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Control de gastos personal</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-white dark:bg-gray-700 shadow text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input {...loginForm.register('email')} type="email" placeholder="tu@email.com" className={inputClass} />
                {loginForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                <input {...loginForm.register('password')} type="password" placeholder="••••••••" className={inputClass} />
                {loginForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {loginForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input {...registerForm.register('name')} type="text" placeholder="Tu nombre" className={inputClass} />
                {registerForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input {...registerForm.register('email')} type="email" placeholder="tu@email.com" className={inputClass} />
                {registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                <input {...registerForm.register('password')} type="password" placeholder="Mínimo 6 caracteres" className={inputClass} />
                {registerForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar contraseña</label>
                <input {...registerForm.register('confirmPassword')} type="password" placeholder="••••••••" className={inputClass} />
                {registerForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={registerForm.formState.isSubmitting} className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {registerForm.formState.isSubmitting ? 'Creando...' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
