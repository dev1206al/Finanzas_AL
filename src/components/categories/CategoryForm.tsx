import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category } from '../../types/database'

const CAT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#d946ef',
  '#f43f5e', '#fb923c', '#16a34a', '#0891b2', '#1d4ed8',
  '#7c3aed', '#9333ea', '#475569', '#94a3b8', '#78716c',
]

const EMOJI_PRESETS: Record<Category['type'], string[]> = {
  expense: ['🍔','🛒','🎬','🎮','💊','🏠','🚗','✈️','📱','💻','👕','💪','📚','☕','🍺','🎁','🔧','⚡','💧','🐕','🎨','🏥','🍕','🍜','🛍️','💈','⛽','🎓','📺','🎵','💆','🏋️','🌿','🎯','🏊','🌊','🎭','🍦','🧴','🪴'],
  income:  ['💰','💵','💼','🏦','📈','💎','🏆','🌟','🤝','🪙','📊','✨','🎯','🎪','🎁','🏗️','💻','🧾'],
  lent:    ['🤝','💸','👋','📋','⏰','🔄','📤','🫱','🫲','📝'],
}

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  type: z.enum(['expense', 'lent', 'income']),
  color: z.string(),
  icon: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface CategoryFormProps {
  initial?: Partial<Category>
  onSubmit: (data: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

export default function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'expense',
      color: initial?.color ?? '#6366f1',
      icon: initial?.icon ?? null,
    },
  })

  const selectedColor = watch('color')
  const selectedType = watch('type')
  const selectedIcon = watch('icon')

  function handleSubmitForm(d: FormData) {
    return onSubmit({ name: d.name, type: d.type, color: d.color, icon: d.icon || null })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
        <input {...register('name')} placeholder="ej. Streaming, Gym…" className="input" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(['expense', 'lent', 'income'] as const).map(t => (
            <label
              key={t}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedType === t ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              {t === 'expense' ? 'Gasto' : t === 'lent' ? 'Prestado' : 'Ingreso'}
            </label>
          ))}
        </div>
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ícono (emoji)</label>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: selectedColor }}
          >
            {selectedIcon
              ? <span>{selectedIcon}</span>
              : <span className="text-white text-sm font-bold">{watch('name')?.charAt(0) || '?'}</span>
            }
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={selectedIcon ?? ''}
              onChange={e => {
                const val = [...e.target.value].slice(0, 2).join('')
                setValue('icon', val || null)
              }}
              placeholder="Pega o escribe un emoji"
              className="input text-lg"
            />
          </div>
          {selectedIcon && (
            <button
              type="button"
              onClick={() => setValue('icon', null)}
              className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              Quitar
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {EMOJI_PRESETS[selectedType].map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setValue('icon', selectedIcon === e ? null : e)}
              className={`flex-shrink-0 w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                selectedIcon === e
                  ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-400 scale-110'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color de fondo</label>
        <div className="flex flex-wrap gap-2 items-center">
          {CAT_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className="w-7 h-7 rounded-full cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden"
            title="Color personalizado"
            style={{ backgroundColor: CAT_COLORS.includes(selectedColor) ? 'transparent' : selectedColor }}
          >
            <input
              type="color"
              value={selectedColor}
              onChange={e => setValue('color', e.target.value)}
              className="opacity-0 absolute w-px h-px"
            />
            {CAT_COLORS.includes(selectedColor) && (
              <span className="text-gray-400 dark:text-gray-500 text-[10px] leading-none">+</span>
            )}
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </div>
    </form>
  )
}
