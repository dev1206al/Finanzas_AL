import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Movement, MovementWithRelations } from '../types/database'

interface MovementsFilter {
  year?: number
  month?: number   // 1-12, undefined = todos
  cardId?: string
}

export function useMovements(filter: MovementsFilter = {}) {
  const { user } = useAuth()
  const { year, month, cardId } = filter

  return useQuery({
    queryKey: ['movements', user?.id, year, month, cardId],
    queryFn: async () => {
      let query = supabase
        .from('movements')
        .select('*, categories(*), cards(id, name, color)')
        .eq('user_id', user!.id)
        .is('msi_parent_id', null)  // solo movimientos padre (no cuotas MSI hijas)
        .order('date', { ascending: false })

      if (cardId) query = query.eq('card_id', cardId)

      if (year && month) {
        const from = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
        query = query.gte('date', from).lte('date', to)
      } else if (year) {
        query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as MovementWithRelations[]
    },
    enabled: !!user,
  })
}

export function useCreateMovement() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (movement: Omit<Movement, 'id' | 'created_at' | 'user_id'>) => {
      const payload = { ...movement, user_id: user!.id }

      // Si es MSI, crear movimiento padre y generar cuotas
      if (movement.msi_months && movement.msi_months > 1) {
        const { data: parent, error: parentError } = await supabase
          .from('movements')
          .insert(payload)
          .select()
          .single()
        if (parentError) throw parentError

        const installmentAmount = Number((movement.amount / movement.msi_months).toFixed(2))
        const baseDate = new Date(movement.date)

        const installments = Array.from({ length: movement.msi_months - 1 }, (_, i) => {
          const d = new Date(baseDate)
          d.setMonth(d.getMonth() + i + 1)
          return {
            user_id: user!.id,
            card_id: movement.card_id,
            category_id: movement.category_id,
            date: d.toISOString().slice(0, 10),
            merchant: `${movement.merchant} (MSI ${i + 2}/${movement.msi_months})`,
            amount: installmentAmount,
            type: 'expense' as const,
            msi_months: null,
            msi_parent_id: parent.id,
            notes: movement.notes,
          }
        })

        if (installments.length > 0) {
          const { error: instError } = await supabase.from('movements').insert(installments)
          if (instError) throw instError
        }

        return parent
      }

      const { data, error } = await supabase
        .from('movements')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movements'] }),
  })
}

export function useUpdateMovement() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Movement> & { id: string }) => {
      const { data, error } = await supabase
        .from('movements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movements'] }),
  })
}

export function useDeleteMovement() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Eliminar también cuotas MSI hijas
      await supabase.from('movements').delete().eq('msi_parent_id', id)
      const { error } = await supabase.from('movements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movements'] }),
  })
}
