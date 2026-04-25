import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import NGODashboard from './pages/NGODashboard'
import VolunteerDashboard from './pages/VolunteerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth()
  if (!currentUser) return <Navigate to="/auth" replace />
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'ngo') return <Navigate to="/ngo" replace />
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/volunteer" replace />
  }
  return children
}

function AppRoutes() {
  const { isDark } = useTheme()
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/ngo/*" element={<ProtectedRoute allowedRoles={['ngo']}><NGODashboard /></ProtectedRoute>} />
        <Route path="/volunteer/*" element={<ProtectedRoute allowedRoles={['volunteer']}><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastWrapper />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function ToastWrapper() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#0f172a',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(34,197,94,0.2)',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: isDark ? '#000' : '#fff' } },
      }}
    />
  )
}
