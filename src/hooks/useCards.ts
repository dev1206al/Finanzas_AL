import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Card } from '../types/database'

export function useCards() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Card[]
    },
    enabled: !!user,
  })
}

export function useCreateCard() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (card: Omit<Card, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('cards')
        .insert({ ...card, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Card> & { id: string }) => {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })
}

// Calcula la próxima fecha de pago/corte para una tarjeta
export function getNextDate(day: number): Date {
  const now = new Date()
  const candidate = new Date(now.getFullYear(), now.getMonth(), day)
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1)
  }
  return candidate
}

export function getDaysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
