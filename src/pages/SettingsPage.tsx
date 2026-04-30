import { useState } from 'react'
import { LogOut, User, Tag, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const name = user?.user_metadata?.full_name ?? 'Usuario'
  const email = user?.email ?? ''

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Ajustes</h1>

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-400">{email}</p>
        </div>
      </div>

      {/* Opciones */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => navigate('/ajustes/categorias')}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <Tag className="w-5 h-5 text-indigo-500" />
          <span className="flex-1 text-left text-sm font-medium text-gray-900">Gestionar categorías</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={() => navigate('/perfil')}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <User className="w-5 h-5 text-indigo-500" />
          <span className="flex-1 text-left text-sm font-medium text-gray-900">Editar perfil</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <button
        onClick={() => setConfirmLogout(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-600">Cerrar sesión</span>
      </button>

      {confirmLogout && (
        <ConfirmDialog
          message="¿Cerrar sesión?"
          confirmLabel="Cerrar sesión"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  )
}
