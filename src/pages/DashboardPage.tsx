import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, TrendingDown, TrendingUp, CreditCard, ChevronRight, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards, getNextDate, getDaysUntil } from '../hooks/useCards'
import { useMovements, useCreateMovement } from '../hooks/useMovements'
import { useIncomeAccounts, useIncomeMovements, useCreateIncomeMovement } from '../hooks/useIncomeAccounts'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../context/AuthContext'
import { formatMXN, formatShortDate, MONTHS } from '../lib/format'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'
import MovementForm from '../components/movements/MovementForm'
import IncomeMovementForm from '../components/income/IncomeMovementForm'
import type { Movement, IncomeMovement } from '../types/database'

const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() + 1

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: cards = [] } = useCards()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useIncomeAccounts()
  const { data: movements = [], isLoading: loadingMov } = useMovements({ year: YEAR, month: MONTH })
  const { data: incomeMovements = [] } = useIncomeMovements({ year: YEAR, month: MONTH })

  const createMovement = useCreateMovement()
  const createIncomeMovement = useCreateIncomeMovement()

  const [quickAdd, setQuickAdd] = useState<'expense' | 'income' | null>(null)

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Usuario'
  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalIncome = incomeMovements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0)

  const upcomingPayments = useMemo(() => {
    return cards
      .map(card => ({ card, days: getDaysUntil(new Date(getNextDate(card.payment_day))) }))
      .filter(({ days }) => days <= 7)
      .sort((a, b) => a.days - b.days)
  }, [cards])

  const cardDebts = useMemo(() => {
    return cards.map(card => {
      const exp = movements.filter(m => m.card_id === card.id && m.type === 'expense')
      const paid = movements.filter(m => m.card_id === card.id && (m.type === 'payment' || m.type === 'income'))
      const debt = exp.reduce((s, m) => s + Math.abs(m.amount), 0) - paid.reduce((s, m) => s + m.amount, 0)
      return { card, debt }
    }).filter(({ debt }) => debt > 0).sort((a, b) => b.debt - a.debt)
  }, [cards, movements])

  // Últimos 5 movimientos del mes (tarjeta + cuenta)
  const recentMovements = useMemo(() => {
    const cardMov = movements.slice(0, 5).map(m => ({
      id: m.id,
      date: m.date,
      concept: m.merchant,
      amount: m.amount,
      type: m.type as string,
      color: (m as typeof movements[0] & { categories?: { color: string } }).categories?.color ?? '#94a3b8',
      label: (m as typeof movements[0] & { categories?: { name: string } }).categories?.name ?? '',
    }))
    return cardMov
  }, [movements])

  const greeting = (() => {
    const h = now.getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  async function handleAddExpense(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createMovement.mutateAsync(data)
      toast.success('Gasto registrado')
      setQuickAdd(null)
    } catch { toast.error('Error al guardar') }
  }

  async function handleAddIncome(data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createIncomeMovement.mutateAsync(data)
      toast.success('Movimiento registrado')
      setQuickAdd(null)
    } catch { toast.error('Error al guardar') }
  }

  const defaultCard = cards[0]

  return (
    <div>
      <PageHeader>
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">{greeting},</p>
          <div className="flex items-end justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{name}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-0.5">{MONTHS[MONTH - 1]} {YEAR}</p>
          </div>
        </div>
      </PageHeader>

      <div className="px-4 py-4 space-y-5 pb-20">

        {/* ── Botones de acción rápida ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (cards.length === 0) { toast.error('Primero agrega una tarjeta'); return }
              setQuickAdd('expense')
            }}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white rounded-2xl py-3.5 font-semibold text-sm shadow-sm"
          >
            <ArrowUpRight className="w-5 h-5" />
            Egreso
          </button>
          <button
            onClick={() => {
              if (accounts.length === 0) { toast.error('Primero agrega una cuenta'); return }
              setQuickAdd('income')
            }}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white rounded-2xl py-3.5 font-semibold text-sm shadow-sm"
          >
            <ArrowDownLeft className="w-5 h-5" />
            Ingreso
          </button>
        </div>

        {/* ── Resumen del mes ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Gastos del mes</p>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatMXN(totalExpenses)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Ingresos del mes</p>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatMXN(totalIncome)}</p>
          </div>
        </div>

        {/* ── Pagos próximos ── */}
        {upcomingPayments.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Pagos próximos
            </h2>
            <div className="space-y-2">
              {upcomingPayments.map(({ card, days }) => (
                <div
                  key={card.id}
                  onClick={() => navigate(`/tarjetas/${card.id}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform ${
                    days === 0 ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800'
                    : days <= 2 ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: card.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{card.name}</p>
                    <p className={`text-xs ${days === 0 ? 'text-red-600 dark:text-red-400 font-semibold' : days <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {days === 0 ? '¡Vence hoy!' : `En ${days} día${days === 1 ? '' : 's'}`} · día {card.payment_day}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Deuda por tarjeta ── */}
        {cardDebts.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-500" />
              Deuda este mes por tarjeta
            </h2>
            <div className="space-y-2">
              {cardDebts.map(({ card, debt }) => (
                <div
                  key={card.id}
                  onClick={() => navigate(`/tarjetas/${card.id}`)}
                  className="card p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-2.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: card.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{card.name}</p>
                    {card.credit_limit > 0 && (
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full" style={{ backgroundColor: card.color, width: `${Math.min((debt / card.credit_limit) * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 flex-shrink-0">{formatMXN(debt)}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Últimos movimientos ── */}
        {(loadingMov || recentMovements.length > 0) && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gray-400" />
              Últimos movimientos
            </h2>
            <div className="space-y-2">
              {loadingMov ? (
                [1,2,3].map(i => <div key={i} className="skeleton h-14" />)
              ) : recentMovements.map(m => {
                const isExpense = m.type === 'expense'
                return (
                  <div key={m.id} className="card p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: m.color }}>
                      {(m.label || m.concept).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.concept}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(m.date)}</p>
                    </div>
                    <p className={`text-sm font-semibold flex-shrink-0 ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {isExpense ? '-' : '+'}{formatMXN(Math.abs(m.amount))}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sin tarjetas */}
        {cards.length === 0 && (
          <div
            onClick={() => navigate('/tarjetas')}
            className="text-center py-10 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer"
          >
            <CreditCard className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Agrega tu primera tarjeta</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Toca para ir a Tarjetas →</p>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => {
          if (cards.length === 0) { toast.error('Primero agrega una tarjeta'); return }
          setQuickAdd('expense')
        }}
        className="fixed fab-position right-4 z-40 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        style={{ boxShadow: '0 4px 20px rgba(94,23,235,0.4)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Modal Egreso rápido ── */}
      {quickAdd === 'expense' && defaultCard && (
        <Modal title="Registrar egreso" onClose={() => setQuickAdd(null)}>
          <MovementForm
            cardId={defaultCard.id}
            categories={categories}
            cards={cards}
            onSubmit={handleAddExpense}
            onCancel={() => setQuickAdd(null)}
          />
        </Modal>
      )}

      {/* ── Modal Ingreso rápido ── */}
      {quickAdd === 'income' && (
        <Modal title="Registrar movimiento" onClose={() => setQuickAdd(null)}>
          <IncomeMovementForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleAddIncome}
            onCancel={() => setQuickAdd(null)}
          />
        </Modal>
      )}
    </div>
  )
}
