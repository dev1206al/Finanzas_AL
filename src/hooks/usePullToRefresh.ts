import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const THRESHOLD = 72

export function usePullToRefresh() {
  const qc = useQueryClient()
  const pullYRef = useRef(0)
  const startY = useRef(0)
  const active = useRef(false)
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (document.body.style.overflow === 'hidden') return
      if (window.scrollY > 5) return
      startY.current = e.touches[0].clientY
      active.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || refreshing) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY === 0) {
        e.preventDefault()
        pullYRef.current = Math.min(dy * 0.45, THRESHOLD * 1.4)
        setPullY(pullYRef.current)
      } else {
        active.current = false
        pullYRef.current = 0
        setPullY(0)
      }
    }

    function onTouchEnd() {
      if (!active.current) return
      active.current = false
      const y = pullYRef.current
      pullYRef.current = 0
      setPullY(0)
      if (y >= THRESHOLD) {
        setRefreshing(true)
        qc.invalidateQueries().finally(() => setRefreshing(false))
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [refreshing, qc])

  return { pullY, refreshing, THRESHOLD }
}
