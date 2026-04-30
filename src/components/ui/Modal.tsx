import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    // Bloquea el scroll del fondo mientras el modal está abierto
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    /*
      z-[60] > z-50 del bottom nav → el modal siempre queda encima.
      items-end en móvil: sube desde abajo como sheet nativo.
    */
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col"
        style={{ maxHeight: 'min(88dvh, 88vh)' }}
      >
        {/* Cabecera fija */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Contenido scrolleable — padding inferior cubre el safe area en iPhone */}
        <div
          className="overflow-y-auto flex-1 p-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
