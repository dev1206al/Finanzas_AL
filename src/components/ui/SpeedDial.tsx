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

// Fan: 3 items spreading up-left from FAB (bottom-right)
// Angles from vertical: 20°, 55°, 90° — radius 82px — equal arc spacing
const FAN = [
  { x: -28, y: -77, label: 'Movimiento', color: '#6366f1', icon: <Receipt className="w-5 h-5" /> },
  { x: -67, y: -47, label: 'Ingreso',    color: '#22c55e', icon: <Wallet  className="w-5 h-5" /> },
  { x: -82, y:  -8, label: 'Tarjeta',    color: '#0ea5e9', icon: <CreditCard className="w-5 h-5" /> },
]

type Modal = 'movement' | 'income' | 'card' | null

export default function SpeedDial() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)

  const { data: cards = [] }    = useCards()
  const { data: accounts = [] } = useIncomeAccounts()
  const { data: categories = [] } = useCategories()

  const createMovement      = useCreateMovement()
  const createIncomeMovement = useCreateIncomeMovement()
  const createCard          = useCreateCard()

  function openModal(m: Modal) { setOpen(false); setModal(m) }

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
    try {
      await createMovement.mutateAsync(data)
      toast.success('Movimiento registrado')
      setModal(null)
    } catch { toast.error('Error al guardar') }
  }

  async function handleCreateIncome(data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createIncomeMovement.mutateAsync(data)
      toast.success('Movimiento registrado')
      setModal(null)
    } catch { toast.error('Error al guardar') }
  }

  async function handleCreateCard(data: CardFormData) {
    try {
      await createCard.mutateAsync({
        name: data.name,
        bank: data.bank || null,
        color: data.color,
        credit_limit: data.credit_limit,
        cut_day: data.cut_day,
        payment_day: data.payment_day,
        last_four: data.last_four || null,
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

      {/* Speed Dial */}
      <div className="fixed fab-position right-4 z-50">
        {/* Fan items */}
        {FAN.map((item, i) => (
          <div
            key={i}
            className="absolute bottom-0 right-0 flex items-center gap-2.5"
            style={{
              transform: open
                ? `translate(${item.x}px, ${item.y}px)`
                : 'translate(0, 0)',
              opacity: open ? 1 : 0,
              transition: open
                ? `transform 0.25s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms, opacity 0.15s ease ${i * 55}ms`
                : `transform 0.18s ease ${(FAN.length - 1 - i) * 40}ms, opacity 0.12s ease ${(FAN.length - 1 - i) * 40}ms`,
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            {/* Label */}
            <span className="bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap select-none">
              {item.label}
            </span>
            {/* Action button */}
            <button
              onClick={() => handleAction(i)}
              className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0"
              style={{ backgroundColor: item.color, boxShadow: `0 4px 14px ${item.color}66` }}
            >
              {item.icon}
            </button>
          </div>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-all"
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
