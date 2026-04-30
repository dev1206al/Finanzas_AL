import type { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  className?: string
}

/**
 * Header sticky con safe area correcta para iPhone/Dynamic Island.
 * El spacer invisible absorbe env(safe-area-inset-top) y el fondo
 * del header cubre naturalmente el notch — igual que en Recetario_AL.
 */
export default function PageHeader({ children, className = '' }: PageHeaderProps) {
  return (
    <div className={`sticky top-0 z-40 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      {/* Spacer que absorbe el safe area — el fondo cubre Dynamic Island */}
      <div aria-hidden style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      {children}
    </div>
  )
}
