import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { IncomeAccount, IncomeMovement, IncomeMovementWithRelations } from '../types/database'

export function useIncomeAccounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['income_accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as IncomeAccount[]
    },
    enabled: !!user,
  })
}

export function useCreateIncomeAccount() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (account: Omit<IncomeAccount, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('income_accounts')
        .insert({ ...account, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_accounts'] }),
  })
}

export function useUpdateIncomeAccount() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IncomeAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('income_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_accounts'] }),
  })
}

export function useDeleteIncomeAccount() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_accounts'] }),
  })
}

// Income movements
export function useIncomeMovements(filter: { year?: number; month?: number; accountId?: string } = {}) {
  const { user } = useAuth()
  const { year, month, accountId } = filter

  return useQuery({
    queryKey: ['income_movements', user?.id, year, month, accountId],
    queryFn: async () => {
      let query = supabase
        .from('income_movements')
        .select('*, categories(*), income_accounts(id, name, color)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (accountId) query = query.eq('account_id', accountId)

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
      return data as IncomeMovementWithRelations[]
    },
    enabled: !!user,
  })
}

export function useCreateIncomeMovement() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (movement: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('income_movements')
        .insert({ ...movement, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_movements'] }),
  })
}

export function useDeleteIncomeMovement() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('income_movements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income_movements'] }),
  })
}
