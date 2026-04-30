import { useState, useMemo } from 'react'
import { Filter, Calendar, TrendingDown, TrendingUp, CreditCard } from 'lucide-react'
import { useMovements } from '../hooks/useMovements'
import { useCards } from '../hooks/useCards'
import { useCategories } from '../hooks/useCategories'
import { formatMXN, MONTHS } from '../lib/format'

const CURRENT_YEAR = new Date().getFullYear()

export default function SummaryPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState<number | undefined>(undefined)
  const [view, setView] = useState<'category' | 'card' | 'debt'>('category')

  const { data: movements = [] } = useMovements({ year, month })
  const { data: cards = [] } = useCards()
  const { data: categories = [] } = useCategories()

  const expenses = movements.filter(m => m.type === 'expense')
  const payments = movements.filter(m => m.type === 'payment' || m.type === 'income')

  const totalExpenses = expenses.reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalPayments = payments.reduce((s, m) => s + m.amount, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, { category: typeof categories[0]; byCard: Map<string, number>; total: number; isLent: boolean }>()
    for (const m of expenses) {
      const cat = categories.find(c => c.id === m.category_id)
      const catId = m.category_id ?? '__none__'
      if (!map.has(catId)) {
        map.set(catId, {
          category: cat ?? { id: '__none__', name: 'Sin categoría', color: '#94a3b8', type: 'expense', icon: null, user_id: '', created_at: '' },
          byCard: new Map(), total: 0, isLent: cat?.type === 'lent',
        })
      }
      const entry = map.get(catId)!
      const abs = Math.abs(m.amount)
      entry.total += abs
      entry.byCard.set(m.card_id, (entry.byCard.get(m.card_id) ?? 0) + abs)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [expenses, categories])

  const myExpenses = byCategory.filter(c => !c.isLent).reduce((s, c) => s + c.total, 0)
  const lentExpenses = byCategory.filter(c => c.isLent).reduce((s, c) => s + c.total, 0)

  const byCard = useMemo(() => {
    return cards.map(card => {
      const cardExpenses = expenses.filter(m => m.card_id === card.id)
      const cardPayments = payments.filter(m => m.card_id === card.id)
      const total = cardExpenses.reduce((s, m) => s + Math.abs(m.amount), 0)
      const paid = cardPayments.reduce((s, m) => s + m.amount, 0)
      return { card, total, paid, balance: total - paid }
    }).sort((a, b) => b.balance - a.balance)
  }, [cards, expenses, payments])

  return (
    <div>
      {/* ── Sticky header con filtros y totales ── */}
      <div className="safe-header sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Resumen</h1>

          {/* Filtros */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none"
              >
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={month ?? ''}
                onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                className="text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none w-full"
              >
                <option value="">Todo el año</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Total gastos</p>
              </div>
              <p className="text-base font-bold text-red-700 dark:text-red-400">{formatMXN(totalExpenses)}</p>
              <div className="mt-1 space-y-0.5">
                <p className="text-xs text-red-400 dark:text-red-500">Míos: {formatMXN(myExpenses)}</p>
                <p className="text-xs text-red-400 dark:text-red-500">Prestado: {formatMXN(lentExpenses)}</p>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total pagado</p>
              </div>
              <p className="text-base font-bold text-green-700 dark:text-green-400">{formatMXN(totalPayments)}</p>
              <p className="text-xs text-green-400 dark:text-green-500 mt-1">
                Deuda neta: {formatMXN(totalExpenses - totalPayments)}
              </p>
            </div>
          </div>

          {/* Tabs de vista */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {(['category', 'card', 'debt'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === v
                    ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {v === 'category' ? 'Categoría' : v === 'card' ? 'Tarjeta' : 'Deuda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido según vista ── */}
      <div className="px-4 py-4 space-y-2">
        {view === 'category' && (
          <>
            {byCategory.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">Sin movimientos en este período</p>
            ) : byCategory.map(({ category, byCard: cardMap, total, isLent }) => (
              <div key={category.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: category.color }}>
                    {category.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{category.name}</p>
                      {isLent && <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full flex-shrink-0">Prestado</span>}
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1.5">
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: category.color, width: `${Math.min((total / totalExpenses) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 flex-shrink-0">{formatMXN(total)}</p>
                </div>
                {cards.length > 1 && cardMap.size > 0 && (
                  <div className="border-t border-gray-50 dark:border-gray-800 px-3 py-2 grid grid-cols-2 gap-1">
                    {cards.filter(c => cardMap.has(c.id)).map(c => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.name}:</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatMXN(cardMap.get(c.id)!)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {view === 'card' && byCard.map(({ card, total, paid, balance }) => (
          <div key={card.id} className="card overflow-hidden">
            <div className="p-3 text-white text-sm font-semibold" style={{ backgroundColor: card.color }}>
              {card.name}
            </div>
            <div className="p-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Gastos</p>
                <p className="font-bold text-red-600 dark:text-red-400">{formatMXN(total)}</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Pagado</p>
                <p className="font-bold text-green-600 dark:text-green-400">{formatMXN(paid)}</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Deuda</p>
                <p className={`font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{formatMXN(balance)}</p>
              </div>
            </div>
            {card.credit_limit > 0 && (
              <div className="px-3 pb-3">
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                  <span>Uso del crédito</span>
                  <span>{((balance / card.credit_limit) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ backgroundColor: card.color, width: `${Math.min((balance / card.credit_limit) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}

        {view === 'debt' && (
          <>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-1">Tarjetas por deuda mayor</p>
            {byCard.map(({ card, balance }, i) => (
              <div key={card.id} className="card p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: card.color }}>
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: card.color }} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{card.name}</span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatMXN(balance)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
