import { useRef, useEffect } from 'react'

/**
 * Hook para drag-to-dismiss en modales bottom-sheet.
 * Arrastra desde handleRef; si supera threshold → llama onClose.
 * passive: false en touchmove permite e.preventDefault() para bloquear scroll de fondo.
 */
export function useSwipeDown(onClose: () => void, threshold = 72) {
  const startY    = useRef<number | null>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const handle = handleRef.current
    const panel  = panelRef.current
    if (!handle || !panel) return

    const p = panel

    function onTouchStart(e: TouchEvent) {
      startY.current = e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) return
      e.preventDefault()
      p.style.transform  = `translateY(${dy}px)`
      p.style.transition = 'none'
    }

    function onTouchEnd(e: TouchEvent) {
      if (startY.current === null) return
      const dy = e.changedTouches[0].clientY - startY.current
      startY.current = null
      if (dy > threshold) {
        p.style.transform  = ''
        p.style.transition = ''
        onCloseRef.current()
      } else {
        p.style.transition = 'transform 0.22s ease'
        p.style.transform  = ''
      }
    }

    handle.addEventListener('touchstart', onTouchStart, { passive: true })
    handle.addEventListener('touchmove',  onTouchMove,  { passive: false })
    handle.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      handle.removeEventListener('touchstart', onTouchStart)
      handle.removeEventListener('touchmove',  onTouchMove)
      handle.removeEventListener('touchend',   onTouchEnd)
    }
  })

  return { panelRef, handleRef }
}
