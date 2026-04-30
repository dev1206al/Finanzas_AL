import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CardsPage from './pages/CardsPage'
import CardDetailPage from './pages/CardDetailPage'
import SummaryPage from './pages/SummaryPage'
import MovementsPage from './pages/MovementsPage'
import SettingsPage from './pages/SettingsPage'
import CategoriesPage from './pages/CategoriesPage'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tarjetas" element={<CardsPage />} />
        <Route path="/tarjetas/:id" element={<CardDetailPage />} />
        <Route path="/resumen" element={<SummaryPage />} />
        <Route path="/cuentas" element={<MovementsPage />} />
        <Route path="/movimientos" element={<Navigate to="/cuentas" replace />} />
        <Route path="/ingresos" element={<Navigate to="/cuentas" replace />} />
        <Route path="/ajustes" element={<SettingsPage />} />
        <Route path="/ajustes/categorias" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
                duration: 2500,
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
