import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, LogOut, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const sectionMap = {
  'Overview': 'overview', 'My Drives': 'mydrives', 'AI Finder': 'ai-finder',
  'Analytics': 'analytics', 'Settings': 'settings', 'Verification': 'verification',
  'Map View': 'map', 'Browse Drives': 'drives', 'My Profile': 'profile',
  'NGO Verification': 'ngos', 'Flagged NGOs': 'flagged', 'Live Map': 'map',
  'Drives': 'drives', 'Public Needs': 'needs',
}

export default function Sidebar({ links, activeSection, onSectionChange, onAIFinder, mobileOpen, onMobileClose }) {
  const { logout, currentUser, userRole } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/') }

  const roleLabel = userRole === 'ngo' ? 'NGO' : userRole === 'admin' ? 'Admin' : 'Volunteer'
  const roleColor = userRole === 'ngo'
    ? 'text-blue-400 bg-blue-500/10'
    : userRole === 'admin'
    ? 'text-red-400 bg-red-500/10'
    : 'text-green-400 bg-green-500/10'

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : currentUser?.email?.[0]?.toUpperCase() || '?'

  const handleClick = (link) => {
    if (link.label === 'AI Finder') { onAIFinder?.(); onMobileClose?.(); return }
    const section = sectionMap[link.label]
    if (section && onSectionChange) onSectionChange(section)
    onMobileClose?.()
  }

  const isActive = (link) => {
    if (link.label === 'AI Finder') return false
    return sectionMap[link.label] === activeSection
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Leaf size={17} className="text-black" />
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Align<span className="text-green-500">Setu</span>
          </span>
        </div>
        {/* Close button — only on mobile */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-green-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const { icon: Icon, label, badge } = link
          const active = isActive(link)
          const isAI = label === 'AI Finder'

          return (
            <motion.button
              key={label}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(link)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                active
                  ? 'bg-green-500/15 border border-green-500/25'
                  : isAI
                  ? 'border border-transparent hover:border-yellow-500/20 hover:bg-yellow-500/10'
                  : 'border border-transparent hover:bg-white/5'
              }`}
              style={{
                color: active ? '#4ade80' : isAI ? '#facc15' : 'var(--text-secondary)',
              }}
            >
              <Icon size={17} />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium border ${
                  badge === 'AI'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                }`}>
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={13} className="text-green-400/60" />}
            </motion.button>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-input)' }}>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500/40 to-emerald-500/40 rounded-full flex items-center justify-center text-xs font-bold text-green-400 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all hover:bg-red-500/10 hover:text-red-400"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible) ── */}
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col z-40 sidebar"
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile overlay + drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-full w-64 z-50 flex flex-col sidebar"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
