import { useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSwipeDown } from '../../hooks/useSwipeDown'
import { resetMobileViewport } from '../../lib/viewport'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: ModalProps) {
  const handleClose = useCallback(() => {
    resetMobileViewport()
    onClose()
  }, [onClose])

  const { panelRef, handleRef } = useSwipeDown(handleClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handler)
    }
  }, [handleClose])

  return (
    /*
      z-[60] > z-50 del bottom nav → siempre encima.
      Móvil: bottom-sheet desde abajo. Desktop: modal centrado.
    */
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div
        ref={panelRef}
        className="relative bg-white dark:bg-gray-900 w-full max-w-md
                   rounded-t-2xl sm:rounded-2xl shadow-2xl
                   border border-gray-100 dark:border-gray-800
                   flex flex-col animate-slide-up sm:animate-none"
        style={{ maxHeight: 'min(88dvh, 88vh)' }}
      >
        {/* Drag handle — solo visible en móvil para indicar que se puede arrastrar */}
        <div
          ref={handleRef}
          className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 touch-none cursor-grab"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Título */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Contenido scrolleable con overscroll-contain para no botar el fondo */}
        <div className="overflow-y-auto flex-1 p-4 overscroll-contain">
          {children}
          {/* Spacer final para el home indicator de iPhone */}
          <div aria-hidden style={{ height: 'env(safe-area-inset-bottom, 0px)' }} className="sm:hidden" />
        </div>
      </div>
    </div>
  )
}
