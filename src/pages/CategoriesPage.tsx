import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import type { Category } from '../types/database'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CategoryForm from '../components/categories/CategoryForm'

const TYPE_LABELS: Record<Category['type'], string> = {
  expense: 'Gasto',
  lent: 'Prestado',
  income: 'Ingreso',
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  async function handleCreate(data: Omit<Category, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createCategory.mutateAsync(data)
      toast.success('Categoría creada')
      setShowForm(false)
    } catch {
      toast.error('Error al crear categoría')
    }
  }

  async function handleUpdate(data: Omit<Category, 'id' | 'created_at' | 'user_id'>) {
    if (!editing) return
    try {
      await updateCategory.mutateAsync({ id: editing.id, ...data })
      toast.success('Categoría actualizada')
      setEditing(null)
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteCategory.mutateAsync(deleting.id)
      toast.success('Categoría eliminada')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const grouped = {
    expense: categories.filter(c => c.type === 'expense'),
    lent: categories.filter(c => c.type === 'lent'),
    income: categories.filter(c => c.type === 'income'),
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Sin categorías</p>
        </div>
      ) : (
        <div className="space-y-5">
          {(['expense', 'lent', 'income'] as const).map(type => {
            const cats = grouped[type]
            if (cats.length === 0) return null
            return (
              <div key={type}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {TYPE_LABELS[type]}
                </p>
                <div className="space-y-1.5">
                  {cats.map(cat => (
                    <div key={cat.id} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
                      <button onClick={() => setEditing(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleting(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nueva categoría" onClose={() => setShowForm(false)}>
          <CategoryForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar categoría" onClose={() => setEditing(null)}>
          <CategoryForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`¿Eliminar categoría "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
