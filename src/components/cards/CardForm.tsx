import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const CARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#1d4ed8',
  '#475569', '#78716c',
]

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  bank: z.string().optional(),
  color: z.string(),
  credit_limit: z.number({ error: 'Requerido' }).min(0, 'Debe ser positivo'),
  cut_day: z.number({ error: 'Requerido' }).min(1).max(31),
  payment_day: z.number({ error: 'Requerido' }).min(1).max(31),
  last_four: z.string().length(4, 'Deben ser 4 dígitos').optional().or(z.literal('')),
})

export type CardFormData = z.infer<typeof schema>

interface CardFormProps {
  initial?: CardFormData
  onSubmit: (data: CardFormData) => Promise<void>
  onCancel: () => void
}

export default function CardForm({ initial, onSubmit, onCancel }: CardFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      bank: initial?.bank ?? '',
      color: initial?.color ?? '#6366f1',
      credit_limit: initial?.credit_limit ?? 0,
      cut_day: initial?.cut_day ?? 1,
      payment_day: initial?.payment_day ?? 20,
      last_four: initial?.last_four ?? '',
    },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color de tarjeta</label>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input {...register('name')} placeholder="HSBC, BBVA…" className="input" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
          <input {...register('bank')} placeholder="Opcional" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Últimos 4 dígitos</label>
          <input {...register('last_four')} placeholder="1234" maxLength={4} className="input" />
          {errors.last_four && <p className="text-red-500 text-xs mt-1">{errors.last_four.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Límite de crédito *</label>
          <input {...register('credit_limit', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className="input" />
          {errors.credit_limit && <p className="text-red-500 text-xs mt-1">{errors.credit_limit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Día de corte *</label>
          <input {...register('cut_day', { valueAsNumber: true })} type="number" min={1} max={31} className="input" />
          {errors.cut_day && <p className="text-red-500 text-xs mt-1">{errors.cut_day.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Día de pago *</label>
          <input {...register('payment_day', { valueAsNumber: true })} type="number" min={1} max={31} className="input" />
          {errors.payment_day && <p className="text-red-500 text-xs mt-1">{errors.payment_day.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar tarjeta'}
        </button>
      </div>
    </form>
  )
}
