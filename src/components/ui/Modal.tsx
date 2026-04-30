import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/*
        max-h usa dvh (dynamic viewport height) para que el teclado virtual
        no tape los botones — el modal se achica junto con el viewport visible.
      */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800"
           style={{ maxHeight: 'min(85dvh, 85vh)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        {/* overflow-y-auto + padding bottom para que el sticky form-actions funcione */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(min(85dvh, 85vh) - 56px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
