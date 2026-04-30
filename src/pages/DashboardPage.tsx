import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, TrendingDown, TrendingUp, CreditCard, ChevronRight } from 'lucide-react'
import { useCards, getNextDate, getDaysUntil } from '../hooks/useCards'
import { useMovements } from '../hooks/useMovements'
import { useIncomeMovements } from '../hooks/useIncomeAccounts'
import { useAuth } from '../context/AuthContext'
import { formatMXN, MONTHS } from '../lib/format'

const now = new Date()
const YEAR = now.getFullYear()
const MONTH = now.getMonth() + 1

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: cards = [] } = useCards()
  const { data: movements = [] } = useMovements({ year: YEAR, month: MONTH })
  const { data: incomeMovements = [] } = useIncomeMovements({ year: YEAR, month: MONTH })

  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Luis'

  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalIncome = incomeMovements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0)

  // Próximos pagos (próximos 7 días)
  const upcomingPayments = useMemo(() => {
    return cards
      .map(card => {
        const paymentDate = getNextDate(card.payment_day)
        const days = getDaysUntil(new Date(paymentDate))
        return { card, days, paymentDate }
      })
      .filter(({ days }) => days <= 7)
      .sort((a, b) => a.days - b.days)
  }, [cards])

  // Deuda por tarjeta este mes
  const cardDebts = useMemo(() => {
    return cards.map(card => {
      const expenses = movements.filter(m => m.card_id === card.id && m.type === 'expense')
      const paid = movements.filter(m => m.card_id === card.id && (m.type === 'payment' || m.type === 'income'))
      const debt = expenses.reduce((s, m) => s + Math.abs(m.amount), 0) - paid.reduce((s, m) => s + m.amount, 0)
      return { card, debt }
    }).filter(({ debt }) => debt > 0).sort((a, b) => b.debt - a.debt)
  }, [cards, movements])

  const greeting = (() => {
    const h = now.getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  return (
    <div className="p-4 space-y-5">
      {/* Saludo */}
      <div className="pt-2">
        <p className="text-gray-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        <p className="text-gray-400 text-sm">{MONTHS[MONTH - 1]} {YEAR}</p>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <p className="text-xs font-medium text-red-600">Gastos del mes</p>
          </div>
          <p className="text-xl font-bold text-red-700">{formatMXN(totalExpenses)}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-xs font-medium text-green-600">Ingresos del mes</p>
          </div>
          <p className="text-xl font-bold text-green-700">{formatMXN(totalIncome)}</p>
        </div>
      </div>

      {/* Alertas de pago próximas */}
      {upcomingPayments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Pagos próximos
          </h2>
          <div className="space-y-2">
            {upcomingPayments.map(({ card, days }) => (
              <div
                key={card.id}
                onClick={() => navigate(`/tarjetas/${card.id}`)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${
                  days === 0 ? 'bg-red-50 border border-red-200' : days <= 2 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: card.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{card.name}</p>
                  <p className={`text-xs ${days === 0 ? 'text-red-600 font-semibold' : days <= 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {days === 0 ? '¡Vence hoy!' : `En ${days} día${days === 1 ? '' : 's'}`} · día {card.payment_day}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deuda por tarjeta */}
      {cardDebts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            Deuda este mes por tarjeta
          </h2>
          <div className="space-y-2">
            {cardDebts.map(({ card, debt }) => (
              <div
                key={card.id}
                onClick={() => navigate(`/tarjetas/${card.id}`)}
                className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 cursor-pointer"
              >
                <div className="w-2.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: card.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{card.name}</p>
                  {card.credit_limit > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div
                        className="h-1 rounded-full"
                        style={{ backgroundColor: card.color, width: `${Math.min((debt / card.credit_limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-red-600">{formatMXN(debt)}</p>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin tarjetas */}
      {cards.length === 0 && (
        <div
          onClick={() => navigate('/tarjetas')}
          className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-500">Agrega tu primera tarjeta</p>
          <p className="text-xs text-gray-400 mt-1">Toca para ir a Tarjetas →</p>
        </div>
      )}
    </div>
  )
}
