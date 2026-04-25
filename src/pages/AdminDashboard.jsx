import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Shield, Flag, Map, BarChart3, Settings,
  CheckCircle, XCircle, AlertTriangle, Users, Activity,
  TrendingUp, Zap, Sun, Moon, Globe, Eye, Search,
  TreePine, Bell, Save, Mail, User, Menu, Sparkles, Leaf
} from 'lucide-react'
import { collection, onSnapshot, doc, updateDoc, db } from '../config/firebase'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import MapView from '../components/MapView'
import { getAdminPlatformInsight } from '../services/gemini'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts'

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/ngos', icon: Shield, label: 'NGO Verification' },
  { to: '/admin/flagged', icon: Flag, label: 'Flagged NGOs' },
  { to: '/admin/map', icon: Map, label: 'Live Map' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

const categoryData = [
  { name: 'Cleanup', value: 35, color: '#60a5fa' },
  { name: 'Plantation', value: 28, color: '#4ade80' },
  { name: 'Awareness', value: 18, color: '#facc15' },
  { name: 'Recycling', value: 12, color: '#c084fc' },
  { name: 'Water', value: 7, color: '#22d3ee' },
]

const weeklyData = [
  { day: 'Mon', drives: 4, volunteers: 28 },
  { day: 'Tue', drives: 7, volunteers: 45 },
  { day: 'Wed', drives: 5, volunteers: 32 },
  { day: 'Thu', drives: 9, volunteers: 61 },
  { day: 'Fri', drives: 12, volunteers: 78 },
  { day: 'Sat', drives: 18, volunteers: 120 },
  { day: 'Sun', drives: 14, volunteers: 95 },
]

const growthData = [
  { month: 'Jan', users: 120, ngos: 8 },
  { month: 'Feb', users: 280, ngos: 15 },
  { month: 'Mar', users: 450, ngos: 22 },
  { month: 'Apr', users: 620, ngos: 31 },
  { month: 'May', users: 890, ngos: 42 },
  { month: 'Jun', users: 1240, ngos: 58 },
]

const flaggedMockNGOs = [
  { id: 'f1', name: 'EcoFake Foundation', email: 'fake@ecofake.org', reason: 'Suspicious activity: 0 drives in 6 months', severity: 'high' },
  { id: 'f2', name: 'Green Scam NGO', email: 'info@greenscam.org', reason: 'Duplicate registration detected', severity: 'critical' },
  { id: 'f3', name: 'Nature Inactive', email: 'contact@natureinactive.org', reason: 'No volunteer engagement for 90 days', severity: 'medium' },
]

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs" style={{ border: '1px solid var(--border)' }}>
      <p className="text-secondary mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color || '#22c55e' }} className="font-semibold">{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function AdminDashboard() {
  const { isDark, toggle } = useTheme()
  const [ngos, setNgos] = useState([])
  const [drives, setDrives] = useState([])
  const [users, setUsers] = useState([])
  const [activeSection, setActiveSection] = useState('overview')
  const [ngoSearch, setNgoSearch] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mapLayer, setMapLayer] = useState('drives')
  const [adminNotifications, setAdminNotifications] = useState({
    ngoVerification: true, flaggedActivity: true, weeklyReport: true, systemAlerts: false
  })
  const [platformInsight, setPlatformInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setNgos(all.filter(u => u.role === 'ngo'))
      setUsers(all)
    })
    const u2 = onSnapshot(collection(db, 'drives'), snap => {
      setDrives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2() }
  }, [])

  const handleVerify = async (ngoId, verified) => {
    await updateDoc(doc(db, 'users', ngoId), { verified })
    toast.success(verified ? 'NGO verified!' : 'NGO rejected')
  }

  const pendingNgos = ngos.filter(n => !n.verified)
  const verifiedNgos = ngos.filter(n => n.verified)
  const volunteers = users.filter(u => u.role === 'volunteer')

  // AI: fetch platform insight once data is loaded
  useEffect(() => {
    if (!drives.length && !ngos.length) return
    if (platformInsight || insightLoading) return
    setInsightLoading(true)
    getAdminPlatformInsight({
      totalDrives: drives.length,
      activeDrives: drives.filter(d => d.status === 'active').length,
      completedDrives: drives.filter(d => d.status === 'completed').length,
      totalUsers: users.length,
      pendingNgos: ngos.filter(n => !n.verified).length,
      verifiedNgos: ngos.filter(n => n.verified).length,
    })
      .then(i => setPlatformInsight(i))
      .catch(() => {})
      .finally(() => setInsightLoading(false))
  }, [drives.length, ngos.length]) // eslint-disable-line
  const filteredNgos = ngos.filter(n =>
    !ngoSearch || n.name?.toLowerCase().includes(ngoSearch.toLowerCase()) || n.email?.toLowerCase().includes(ngoSearch.toLowerCase())
  )
  const drivesWithCoords = drives.map(d => ({
    ...d,
    lat: d.lat || 28.6139 + (Math.random() - 0.5) * 0.22,
    lng: d.lng || 77.209 + (Math.random() - 0.5) * 0.22,
  }))

  const usersWithCoords = users.filter(u => u.role === 'volunteer').map(u => ({
    ...u,
    lat: u.lat || 28.6139 + (Math.random() - 0.5) * 0.22,
    lng: u.lng || 77.209 + (Math.random() - 0.5) * 0.22,
  }))

  const severityColor = { low: 'text-gray-400 bg-gray-500/10 border-gray-500/20', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', high: 'text-orange-400 bg-orange-500/10 border-orange-500/20', critical: 'text-red-400 bg-red-500/10 border-red-500/20' }

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar links={sidebarLinks} activeSection={activeSection} onSectionChange={setActiveSection}
        mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* Topbar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl card b-theme" style={{ color: 'var(--text-secondary)' }}>
                <Menu size={20} />
              </button>
              {/* Mobile logo */}
              <div className="flex md:hidden items-center gap-2">
                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                  <Leaf size={15} className="text-black" />
                </div>
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Align<span className="text-green-500">Setu</span></span>
              </div>
              {/* Desktop title */}
              <div className="hidden md:block">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400 font-medium uppercase tracking-wider">Admin Panel</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeSection === 'overview' && 'Platform Overview'}
                  {activeSection === 'ngos' && 'NGO Verification'}
                  {activeSection === 'flagged' && 'Flagged NGOs'}
                  {activeSection === 'map' && 'Live Activity Map'}
                  {activeSection === 'analytics' && 'Analytics'}
                  {activeSection === 'settings' && 'Settings'}
                </h1>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
              className="p-2.5 rounded-xl card border-theme">
              {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-blue-400" />}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} value={users.length} label="Total Users" color="green" />
                  <StatCard icon={Shield} value={verifiedNgos.length} label="Verified NGOs" color="blue" />
                  <StatCard icon={Activity} value={drives.length} label="Total Drives" color="purple" />
                  <StatCard icon={AlertTriangle} value={pendingNgos.length} label="Pending Verification" color="orange" />
                </div>

                {pendingNgos.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 cursor-pointer"
                    onClick={() => setActiveSection('ngos')}>
                    <AlertTriangle size={16} className="text-yellow-400" />
                    <span className="text-sm text-yellow-300">{pendingNgos.length} NGO{pendingNgos.length > 1 ? 's' : ''} awaiting verification</span>
                    <span className="ml-auto text-xs text-yellow-400 hover:text-yellow-300">Review →</span>
                  </motion.div>
                )}

                {/* ── AlignSetu AI Platform Insight ── */}
                {(platformInsight || insightLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,197,94,0.06))', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={insightLoading ? { rotate: 360 } : { rotate: [0, 10, -10, 0] }}
                        transition={insightLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 3, repeat: Infinity }}
                        className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <Sparkles size={15} className="text-purple-400" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block mb-1.5" style={{ background: 'linear-gradient(90deg, #a78bfa, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          AlignSetu AI — Platform Intelligence
                        </span>
                        {insightLoading ? (
                          <div className="space-y-1.5">
                            <div className="h-3 w-64 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
                            <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{platformInsight?.insight}</p>
                            {platformInsight?.alert && (
                              <div className="flex items-start gap-2 text-xs text-yellow-400">
                                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                                {platformInsight.alert}
                              </div>
                            )}
                            {platformInsight?.recommendation && (
                              <div className="flex items-start gap-2 text-xs text-green-400">
                                <Zap size={11} className="mt-0.5 shrink-0" />
                                {platformInsight.recommendation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="font-semibold text-primary">Weekly Activity</h2>
                        <p className="text-xs text-secondary mt-0.5">Drives & volunteers per day</p>
                      </div>
                      <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                        <TrendingUp size={11} /> +18% this week
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyData} barSize={20}>
                        <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Bar dataKey="drives" fill="#22c55e" radius={[4, 4, 0, 0]} name="drives" />
                        <Bar dataKey="volunteers" fill="#818cf8" radius={[4, 4, 0, 0]} name="volunteers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-5">Drive Categories</h2>
                    <div className="flex items-center gap-5">
                      <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" strokeWidth={0}>
                            {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2.5 flex-1">
                        {categoryData.map(({ name, value, color }) => (
                          <div key={name} className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-secondary flex-1 text-xs">{name}</span>
                            <span className="text-primary font-semibold text-xs">{value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Avg. Volunteers/Drive', value: drives.length ? Math.round(drives.reduce((s, d) => s + (d.volunteersJoined || 0), 0) / drives.length) : 0, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Active Volunteers', value: volunteers.length, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Verification Rate', value: `${ngos.length ? Math.round((verifiedNgos.length / ngos.length) * 100) : 0}%`, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}><Icon size={18} /></div>
                      <div>
                        <p className="text-xl font-bold text-primary">{value}</p>
                        <p className="text-xs text-secondary">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── NGO VERIFICATION ── */}
            {activeSection === 'ngos' && (
              <motion.div key="ngos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={ngoSearch} onChange={e => setNgoSearch(e.target.value)}
                    placeholder="Search NGOs by name or email..."
                    className="input-field w-full pl-10 pr-4 py-3 text-sm" />
                </div>

                {pendingNgos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-yellow-400" /> Pending ({pendingNgos.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingNgos.filter(n => !ngoSearch || n.name?.toLowerCase().includes(ngoSearch.toLowerCase()) || n.email?.toLowerCase().includes(ngoSearch.toLowerCase())).map((ngo, i) => (
                        <motion.div key={ngo.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="card p-5 border-yellow-500/15 hover:border-yellow-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-yellow-500/15 rounded-xl flex items-center justify-center text-sm font-bold text-yellow-400">
                                {(ngo.name || ngo.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-primary">{ngo.name || 'Unnamed NGO'}</p>
                                <p className="text-sm text-secondary">{ngo.email}</p>
                                <p className="text-xs text-muted mt-0.5">Registered {ngo.createdAt ? new Date(ngo.createdAt).toLocaleDateString() : 'recently'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => handleVerify(ngo.id, true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 text-green-400 border border-green-500/25 rounded-xl text-sm hover:bg-green-500/25 transition-colors">
                                <CheckCircle size={14} /> Verify
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => handleVerify(ngo.id, false)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/25 rounded-xl text-sm hover:bg-red-500/25 transition-colors">
                                <XCircle size={14} /> Reject
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingNgos.length === 0 && (
                  <div className="card p-14 text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={24} className="text-green-400" />
                    </div>
                    <p className="text-primary font-medium">All NGOs verified</p>
                    <p className="text-secondary text-sm mt-1">No pending requests</p>
                  </div>
                )}

                {verifiedNgos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" /> Verified ({verifiedNgos.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {filteredNgos.filter(n => n.verified).map(ngo => (
                        <div key={ngo.id} className="card p-4 flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-500/15 rounded-full flex items-center justify-center text-xs font-bold text-green-400">
                            {(ngo.name || ngo.email)?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">{ngo.name || 'NGO'}</p>
                            <p className="text-xs text-secondary truncate">{ngo.email}</p>
                          </div>
                          <CheckCircle size={15} className="text-green-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FLAGGED NGOs ── */}
            {activeSection === 'flagged' && (
              <motion.div key="flagged" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/5">
                  <Flag size={16} className="text-red-400" />
                  <p className="text-sm text-red-300">AI has flagged {flaggedMockNGOs.length} NGOs for suspicious activity. Review and take action.</p>
                </div>

                {flaggedMockNGOs.map((ngo, i) => (
                  <motion.div key={ngo.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-red-500/15 rounded-xl flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                          {ngo.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-primary">{ngo.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${severityColor[ngo.severity]}`}>{ngo.severity}</span>
                          </div>
                          <p className="text-sm text-secondary">{ngo.email}</p>
                          <div className="flex items-start gap-1.5 mt-2">
                            <AlertTriangle size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-yellow-300">{ngo.reason}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => toast.success('NGO reviewed and cleared')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/15 text-green-400 border border-green-500/25 rounded-xl text-xs hover:bg-green-500/25 transition-colors">
                          <CheckCircle size={13} /> Clear
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => toast.success('NGO suspended')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/15 text-red-400 border border-red-500/25 rounded-xl text-xs hover:bg-red-500/25 transition-colors">
                          <XCircle size={13} /> Suspend
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => toast('Viewing details...')}
                          className="flex items-center gap-1.5 px-3 py-2 card border-theme text-secondary rounded-xl text-xs hover:text-primary transition-colors">
                          <Eye size={13} /> View
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── LIVE MAP ── */}
            {activeSection === 'map' && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Toggle + Stats bar */}
                <div className="card p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {[
                        { key: 'drives', label: 'NGO Drives', color: 'bg-green-500/20 text-green-400 border-green-500/40', dot: 'bg-green-400' },
                        { key: 'volunteers', label: 'Volunteers', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', dot: 'bg-purple-400' },
                      ].map(({ key, label, color, dot }) => (
                        <motion.button key={key} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => setMapLayer(key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            mapLayer === key ? color : 'card border-theme text-secondary hover:text-primary'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${mapLayer === key ? dot : 'bg-gray-500'}`} />
                          {label}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-secondary">
                      {mapLayer === 'drives' ? (
                        <>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Active</span>
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Completed</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Volunteer</span>
                      )}
                    </div>
                  </div>

                  {/* Stats — change based on layer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(mapLayer === 'drives' ? [
                      { label: 'Total Drives', value: drives.length, color: 'text-green-400', bg: 'bg-green-500/10' },
                      { label: 'Active', value: drives.filter(d => d.status === 'active').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Completed', value: drives.filter(d => d.status === 'completed').length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                      { label: 'Volunteers Joined', value: drives.reduce((s, d) => s + (d.volunteersJoined || 0), 0), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    ] : [
                      { label: 'Total Volunteers', value: users.filter(u => u.role === 'volunteer').length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                      { label: 'Drives Joined', value: users.filter(u => u.role === 'volunteer').reduce((s, u) => s + (u.joinedDrives?.length || 0), 0), color: 'text-green-400', bg: 'bg-green-500/10' },
                      { label: 'With Skills', value: users.filter(u => u.role === 'volunteer' && u.skills?.length > 0).length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Active Today', value: Math.floor(users.filter(u => u.role === 'volunteer').length * 0.3), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    ]).map(({ label, value, color, bg }) => (
                      <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-3 flex items-center gap-3 ${bg}`}>
                        <div>
                          <p className={`text-xl font-black ${color}`}>{value}</p>
                          <p className="text-xs text-secondary mt-0.5">{label}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-theme" style={{ height: '520px' }}>
                  <MapView
                    drives={mapLayer === 'drives' ? drivesWithCoords : []}
                    volunteers={mapLayer === 'volunteers' ? usersWithCoords : []}
                    mode="admin"
                  />
                </div>
              </motion.div>
            )}

            {/* ── ANALYTICS ── */}
            {activeSection === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} value={users.length} label="Total Users" color="green" />
                  <StatCard icon={Globe} value={drives.length * 3} label="Cities Reached" color="blue" />
                  <StatCard icon={TreePine} value={drives.length * 120} label="Trees Planted" color="purple" />
                  <StatCard icon={Activity} value={drives.length * 4} label="Total Hours" color="orange" suffix="k" />
                </div>

                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-5">Platform Growth</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Area type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} fill="url(#gu)" name="users" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-5">NGO Onboarding</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={growthData}>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Line type="monotone" dataKey="ngos" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: '#818cf8', r: 4 }} name="ngos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-semibold text-primary mb-5">Weekly Drive & Volunteer Activity</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyData} barSize={18}>
                      <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="drives" fill="#22c55e" radius={[4, 4, 0, 0]} name="drives" />
                      <Bar dataKey="volunteers" fill="#818cf8" radius={[4, 4, 0, 0]} name="volunteers" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-2xl mx-auto space-y-5">

                  {/* Admin Profile */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <User size={18} className="text-red-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">Admin Profile</h2>
                        <p className="text-xs text-secondary mt-0.5">Your administrator account details</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center text-3xl font-black text-red-400 shrink-0">
                        A
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-xl">Administrator</h3>
                        <p className="text-sm text-secondary mt-0.5">Platform Admin</p>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-block mt-2">
                          Super Admin
                        </span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-secondary mb-2 block">Display Name</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input placeholder="Admin" className="input-field w-full pl-10 pr-4 py-3 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-secondary mb-2 block">Email Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input placeholder="admin@alignsetu.app" className="input-field w-full pl-10 pr-4 py-3 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => toast.success('Profile updated!')}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2.5 rounded-xl text-sm">
                        <Save size={15} /> Save Changes
                      </motion.button>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <Bell size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">Notifications</h2>
                        <p className="text-xs text-secondary mt-0.5">Manage admin alert preferences</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { key: 'ngoVerification', label: 'New NGO verification requests', desc: 'When an NGO registers and needs review' },
                        { key: 'flaggedActivity', label: 'Flagged NGO activity', desc: 'When AI detects suspicious behaviour' },
                        { key: 'weeklyReport', label: 'Weekly platform report', desc: 'Summary of platform activity every Monday' },
                        { key: 'systemAlerts', label: 'System alerts', desc: 'Critical errors and downtime notifications' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-4 border-b border-theme last:border-0">
                          <div>
                            <p className="text-sm font-medium text-primary">{label}</p>
                            <p className="text-xs text-secondary mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => setAdminNotifications(n => ({ ...n, [key]: !n[key] }))}
                            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ml-6 ${adminNotifications[key] ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <motion.div
                              animate={{ x: adminNotifications[key] ? 22 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appearance */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                        {isDark ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-yellow-400" />}
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">Appearance</h2>
                        <p className="text-xs text-secondary mt-0.5">Choose your preferred theme</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { t: 'dark', emoji: '🌙', label: 'Dark Mode' },
                        { t: 'light', emoji: '☀️', label: 'Light Mode' },
                      ].map(({ t, emoji, label }) => {
                        const isActive = (isDark && t === 'dark') || (!isDark && t === 'light')
                        return (
                          <motion.button key={t} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { if (!isActive) toggle() }}
                            className={`py-4 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-2 ${
                              isActive ? 'bg-green-500/15 text-green-400 border-green-500/40' : 'card border-theme text-secondary hover:text-primary'
                            }`}>
                            <span className="text-2xl">{emoji}</span>
                            {label}
                            {isActive && <span className="text-xs bg-green-500/20 px-2 py-0.5 rounded-full">Active</span>}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Platform Stats */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Activity size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">Platform Info</h2>
                        <p className="text-xs text-secondary mt-0.5">Current system status</p>
                      </div>
                      <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> All systems operational
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Users', value: users.length, color: 'text-green-400' },
                        { label: 'Verified NGOs', value: ngos.filter(n => n.verified).length, color: 'text-blue-400' },
                        { label: 'Active Drives', value: drives.filter(d => d.status === 'active').length, color: 'text-purple-400' },
                        { label: 'Pending', value: ngos.filter(n => !n.verified).length, color: 'text-orange-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center p-4 rounded-xl" style={{ background: 'var(--input-bg)' }}>
                          <p className={`text-2xl font-black ${color}`}>{value}</p>
                          <p className="text-xs text-secondary mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  )
}
