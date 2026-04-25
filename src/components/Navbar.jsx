import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Menu, X, LogOut, User, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { currentUser, userRole, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/') }
  const dashboardPath = userRole === 'ngo' ? '/ngo' : userRole === 'admin' ? '/admin' : '/volunteer'

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled ? {
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
      } : { paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div whileHover={{ rotate: 20 }} className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf size={18} className="text-black" />
          </motion.div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Align<span className="text-green-500">Setu</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Impact', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm transition-colors hover:text-green-500"
              style={{ color: 'var(--text-secondary)' }}>
              {item}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
            className="p-2 rounded-lg transition-colors card b-theme">
            {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-blue-500" />}
          </motion.button>

          {currentUser ? (
            <>
              <Link to={dashboardPath}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors hover:text-green-500"
                style={{ color: 'var(--text-secondary)' }}>
                <User size={15} /> Dashboard
              </Link>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg card b-theme transition-colors hover:text-red-500"
                style={{ color: 'var(--text-secondary)' }}>
                <LogOut size={15} /> Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm px-4 py-2 transition-colors hover:text-green-500"
                style={{ color: 'var(--text-secondary)' }}>
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/auth" className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
            className="p-2 rounded-lg transition-colors card b-theme">
            {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-blue-500" />}
          </motion.button>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--text-primary)' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-6 py-4 flex flex-col gap-4"
            style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)' }}>
            {['Features', 'Impact', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm hover:text-green-500 transition-colors"
                style={{ color: 'var(--text-secondary)' }}>{item}</a>
            ))}
            {currentUser ? (
              <>
                <Link to={dashboardPath} className="text-sm hover:text-green-500 transition-colors flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}>
                  <User size={15} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm text-left hover:text-red-500 transition-colors flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-sm bg-green-500 text-black font-semibold px-4 py-2 rounded-lg text-center">
                Get Started
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
