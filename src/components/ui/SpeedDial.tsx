import { useState } from 'react'
import { Plus, CreditCard, Wallet, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards, useCreateCard } from '../../hooks/useCards'
import { useIncomeAccounts, useCreateIncomeMovement } from '../../hooks/useIncomeAccounts'
import { useCategories } from '../../hooks/useCategories'
import { useCreateMovement } from '../../hooks/useMovements'
import Modal from './Modal'
import MovementForm from '../movements/MovementForm'
import IncomeMovementForm from '../income/IncomeMovementForm'
import CardForm, { type CardFormData } from '../cards/CardForm'
import type { Movement, IncomeMovement } from '../../types/database'

const ACTIONS = [
  { label: 'Movimiento', color: '#6366f1', icon: <Receipt   className="w-5 h-5" /> },
  { label: 'Ingreso',    color: '#22c55e', icon: <Wallet    className="w-5 h-5" /> },
  { label: 'Tarjeta',   color: '#0ea5e9', icon: <CreditCard className="w-5 h-5" /> },
]

type ModalKey = 'movement' | 'income' | 'card' | null

export default function SpeedDial() {
  const [open, setOpen]   = useState(false)
  const [modal, setModal] = useState<ModalKey>(null)

  const { data: cards      = [] } = useCards()
  const { data: accounts   = [] } = useIncomeAccounts()
  const { data: categories = [] } = useCategories()

  const createMovement       = useCreateMovement()
  const createIncomeMovement = useCreateIncomeMovement()
  const createCard           = useCreateCard()

  function openModal(m: ModalKey) { setOpen(false); setModal(m) }

  function handleAction(idx: number) {
    if (idx === 0) {
      if (cards.length === 0) { toast.error('Primero agrega una tarjeta'); return }
      openModal('movement')
    } else if (idx === 1) {
      if (accounts.length === 0) { toast.error('Primero agrega una cuenta'); return }
      openModal('income')
    } else {
      openModal('card')
    }
  }

  async function handleCreateMovement(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try { await createMovement.mutateAsync(data); toast.success('Movimiento registrado'); setModal(null) }
    catch { toast.error('Error al guardar') }
  }

  async function handleCreateIncome(data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) {
    try { await createIncomeMovement.mutateAsync(data); toast.success('Movimiento registrado'); setModal(null) }
    catch { toast.error('Error al guardar') }
  }

  async function handleCreateCard(data: CardFormData) {
    try {
      await createCard.mutateAsync({
        name: data.name, bank: data.bank || null, color: data.color,
        credit_limit: data.credit_limit, cut_day: data.cut_day,
        payment_day: data.payment_day, last_four: data.last_four || null,
        is_active: true,
      })
      toast.success('Tarjeta agregada')
      setModal(null)
    } catch { toast.error('Error al crear tarjeta') }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Speed Dial — flex-col: items arriba, FAB abajo */}
      <div className="fixed fab-position right-4 z-50 flex flex-col items-end gap-3">

        {/* Action items */}
        {ACTIONS.map((action, i) => {
          // Al abrir: el más cercano al FAB (Tarjeta, i=2) aparece primero
          const openDelay  = (ACTIONS.length - 1 - i) * 55
          // Al cerrar: el más alejado (Movimiento, i=0) desaparece primero
          const closeDelay = i * 40

          return (
            <div
              key={action.label}
              className="flex items-center gap-2.5"
              style={{
                opacity:   open ? 1 : 0,
                transform: open
                  ? 'translateY(0) scale(1)'
                  : 'translateY(12px) scale(0.85)',
                transition: open
                  ? `opacity .18s ease ${openDelay}ms, transform .26s cubic-bezier(.34,1.56,.64,1) ${openDelay}ms`
                  : `opacity .14s ease ${closeDelay}ms, transform .16s ease ${closeDelay}ms`,
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              {/* Label */}
              <span className="bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap select-none">
                {action.label}
              </span>
              {/* Button */}
              <button
                onClick={() => handleAction(i)}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0"
                style={{
                  backgroundColor: action.color,
                  boxShadow: `0 4px 16px ${action.color}55`,
                }}
              >
                {action.icon}
              </button>
            </div>
          )
        })}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="w-14 h-14 rounded-full bg-violet-600 text-white flex items-center justify-center active:scale-90 transition-transform"
          style={{ boxShadow: '0 4px 20px rgba(94,23,235,0.4)' }}
        >
          <Plus
            className="w-6 h-6 transition-transform duration-300"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* Modals */}
      {modal === 'movement' && (
        <Modal title="Nuevo movimiento" onClose={() => setModal(null)}>
          <MovementForm
            cardId={cards[0]?.id ?? ''}
            categories={categories}
            cards={cards}
            onSubmit={handleCreateMovement}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal === 'income' && (
        <Modal title="Nuevo ingreso" onClose={() => setModal(null)}>
          <IncomeMovementForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleCreateIncome}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal === 'card' && (
        <Modal title="Nueva tarjeta" onClose={() => setModal(null)}>
          <CardForm onSubmit={handleCreateCard} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </>
  )
}
