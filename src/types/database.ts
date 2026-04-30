export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      cards: {
        Row: Card
        Insert: Omit<Card, 'id' | 'created_at'>
        Update: Partial<Omit<Card, 'id' | 'created_at'>>
      }
      payment_exceptions: {
        Row: PaymentException
        Insert: Omit<PaymentException, 'id' | 'created_at'>
        Update: Partial<Omit<PaymentException, 'id' | 'created_at'>>
      }
      movements: {
        Row: Movement
        Insert: Omit<Movement, 'id' | 'created_at'>
        Update: Partial<Omit<Movement, 'id' | 'created_at'>>
      }
      income_accounts: {
        Row: IncomeAccount
        Insert: Omit<IncomeAccount, 'id' | 'created_at'>
        Update: Partial<Omit<IncomeAccount, 'id' | 'created_at'>>
      }
      income_movements: {
        Row: IncomeMovement
        Insert: Omit<IncomeMovement, 'id' | 'created_at'>
        Update: Partial<Omit<IncomeMovement, 'id' | 'created_at'>>
      }
    }
    Functions: {
      seed_default_categories: {
        Args: { p_user_id: string }
        Returns: void
      }
    }
  }
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'expense' | 'lent' | 'income'
  color: string
  icon: string | null
  created_at: string
}

export interface Card {
  id: string
  user_id: string
  name: string
  bank: string | null
  color: string
  credit_limit: number
  cut_day: number
  payment_day: number
  last_four: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface PaymentException {
  id: string
  card_id: string
  user_id: string
  original_date: string
  new_date: string
  reason: string | null
  created_at: string
}

export interface Movement {
  id: string
  user_id: string
  card_id: string
  category_id: string | null
  date: string
  merchant: string
  amount: number  // negativo = gasto, positivo = pago/ingreso a tarjeta
  type: 'expense' | 'payment' | 'income'
  msi_months: number | null
  msi_parent_id: string | null
  notes: string | null
  created_at: string
}

export interface IncomeAccount {
  id: string
  user_id: string
  name: string
  bank: string | null
  type: 'checking' | 'savings' | 'payroll' | 'cash' | 'other'
  color: string
  is_active: boolean
  created_at: string
}

export interface IncomeMovement {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  date: string
  concept: string
  amount: number  // positivo = ingreso, negativo = egreso
  type: 'income' | 'expense'
  notes: string | null
  created_at: string
}

// Tipos extendidos con joins
export interface MovementWithRelations extends Movement {
  categories: Category | null
  cards: Pick<Card, 'id' | 'name' | 'color'> | null
}

export interface IncomeMovementWithRelations extends IncomeMovement {
  categories: Category | null
  income_accounts: Pick<IncomeAccount, 'id' | 'name' | 'color'> | null
}
