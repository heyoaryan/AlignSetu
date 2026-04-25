import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Mail, Lock, User, Shield, Users, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState(searchParams.get('role') || 'volunteer')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const { signup, login, loginWithGoogle } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  const redirectTo = (r) => {
    if (r === 'ngo') return navigate('/ngo')
    if (r === 'admin') return navigate('/admin')
    return navigate('/volunteer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signup(form.email, form.password, role, form.name)
        toast.success('Account created!')
        redirectTo(role)
      } else {
        await login(form.email, form.password)
        toast.success('Welcome back!')
        redirectTo(role)
      }
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await loginWithGoogle(role)
      toast.success('Signed in with Google!')
      redirectTo(role)
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 bg-grid relative overflow-hidden">
      {/* Orbs */}
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }} transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-96 h-96 bg-green-500 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        className="absolute w-80 h-80 bg-emerald-400 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      {/* Theme toggle */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-xl card b-theme">
        {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-blue-500" />}
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Leaf size={20} className="text-black" />
            </div>
            <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>AlignSetu</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Sign in to your AlignSetu account' : 'Join the environmental movement'}
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-6">

          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg-input)' }}>
            {[{ value: 'volunteer', icon: Users, label: 'Volunteer' }, { value: 'ngo', icon: Shield, label: 'NGO' }].map(({ value, icon: Icon, label }) => (
              <motion.button key={value} whileTap={{ scale: 0.97 }} onClick={() => setRole(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === value ? 'bg-green-500 text-black shadow-sm' : ''
                }`}
                style={role !== value ? { color: 'var(--text-secondary)' } : {}}>
                <Icon size={15} /> {label}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder={role === 'ngo' ? 'Organization Name' : 'Full Name'}
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="input-field pl-10 pr-4 py-3 text-sm" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                className="input-field pl-10 pr-4 py-3 text-sm" />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                className="input-field pl-10 pr-10 py-3 text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoogle} disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 card b-theme"
            style={{ color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Switch mode */}
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-green-500 hover:text-green-400 font-semibold transition-colors">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Admin hint */}
          <div className="mt-4 pt-4 cursor-pointer group" style={{ borderTop: '1px solid var(--border)' }}
            onClick={() => setForm({ ...form, email: 'admin@alignsetu.ai', password: 'admin123' })}>
            <p className="text-center text-xs transition-colors group-hover:text-green-500" style={{ color: 'var(--text-muted)' }}>
              🔐 Admin: <span className="font-mono">admin@alignsetu.ai</span> (click to fill)
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
