import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

interface SwipeRowProps {
  children: React.ReactNode
  onDelete: () => void
}

const THRESHOLD = 60

export default function SwipeRow({ children, onDelete }: SwipeRowProps) {
  const startX = useRef(0)
  const [offset, setOffset] = useState(0)
  const [swiped, setSwiped] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = startX.current - e.touches[0].clientX
    if (dx > 0) setOffset(Math.min(dx, 72))
  }

  function onTouchEnd() {
    if (offset >= THRESHOLD) {
      setOffset(72)
      setSwiped(true)
    } else {
      setOffset(0)
      setSwiped(false)
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete()
  }

  function reset() {
    setOffset(0)
    setSwiped(false)
  }

  return (
    <div className="swipe-row-container group">
      {/* Mobile: botón rojo revelado por swipe */}
      {swiped && (
        <button className="swipe-row-action sm:hidden" onClick={handleDeleteClick}>
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      )}

      <div
        className="swipe-row-content"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={swiped ? reset : undefined}
      >
        {children}
      </div>
    </div>
  )
}
