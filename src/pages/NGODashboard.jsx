import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Plus, List, BarChart3, Settings,
  TreePine, Users, CheckCircle, Zap, TrendingUp, Sparkles,
  ArrowUpRight, Bell, Globe, Target, Leaf,
  Sun, Moon, Save, User, Mail, Phone, MapPin, Shield, Menu, Filter, Search,
  FileCheck, Clock, CheckCircle2, AlertCircle, X, MessageSquare, Camera, QrCode, Inbox
} from 'lucide-react'
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import DriveCard from '../components/DriveCard'
import CreateDriveModal from '../components/CreateDriveModal'
import StatCard from '../components/StatCard'
import AIFinder from '../components/AIFinder'
import DriveVerificationModal from '../components/DriveVerificationModal'
import DriveDetailModal from '../components/DriveDetailModal'
import QRIntakeModal from '../components/QRIntakeModal'
import PublicNeedsPanel from '../components/PublicNeedsPanel'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const sidebarLinks = [
  { to: '/ngo', icon: LayoutDashboard, label: 'Overview' },
  { to: '/ngo/drives', icon: List, label: 'Drives' },
  { to: '/ngo/verification', icon: FileCheck, label: 'Verification' },
  { to: '/ngo/needs', icon: Inbox, label: 'Public Needs' },
  { to: '/ngo/ai-finder', icon: Sparkles, label: 'AI Finder', badge: 'AI' },
  { to: '/ngo/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ngo/settings', icon: Settings, label: 'Settings' },
]

const chartData = [
  { month: 'Jan', volunteers: 12, drives: 2 },
  { month: 'Feb', volunteers: 28, drives: 4 },
  { month: 'Mar', volunteers: 45, drives: 5 },
  { month: 'Apr', volunteers: 38, drives: 3 },
  { month: 'May', volunteers: 62, drives: 7 },
  { month: 'Jun', volunteers: 89, drives: 9 },
]

function TT({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs border border-white/10">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function NGODashboard() {
  const { currentUser } = useAuth()
  const { isDark, toggle } = useTheme()
  const [drives, setDrives] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [aiFinderOpen, setAiFinderOpen] = useState(false)
  const [verificationDrive, setVerificationDrive] = useState(null)
  const [completionPopup, setCompletionPopup] = useState(null) // drive that just got completed
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [driveFilter, setDriveFilter] = useState('all')
  const [driveSearch, setDriveSearch] = useState('')
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', location: '', about: '' })
  const [notifications, setNotifications] = useState({
    newVolunteer: true, driveReminder: true, aiAnalysis: false, weeklyReport: true
  })
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'drives'), where('ngoId', '==', currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      setDrives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    // Pre-fill email from auth
    setProfileData(p => ({ ...p, email: currentUser.email || '' }))
    return unsub
  }, [currentUser])

  const handleCreateDrive = async (driveData) => {
    try {
      await addDoc(collection(db, 'drives'), {
        ...driveData, ngoId: currentUser.uid,
        volunteersJoined: 0, status: 'active', createdAt: serverTimestamp(),
      })
      toast.success('Drive published!')
      setModalOpen(false)
    } catch { toast.error('Failed to create drive') }
  }

  const handleMarkComplete = async (driveId) => {
    const drive = drives.find(d => d.id === driveId)
    if (drive) setVerificationDrive(drive)
  }

  const handleVerificationSubmit = async ({ impact, photos, aiResult }) => {
    if (!verificationDrive) return
    try {
      await updateDoc(doc(db, 'drives', verificationDrive.id), {
        status: 'completed',
        verification: { impact, photoCount: photos.length, aiResult, verifiedAt: new Date().toISOString() },
      })
      const justCompleted = verificationDrive
      setVerificationDrive(null)
      // Show completion popup
      setCompletionPopup(justCompleted)
      setTimeout(() => setCompletionPopup(null), 6000)
    } catch { toast.error('Failed to verify drive') }
  }

  // 8-hour window: drives completed within last 8 hours that need/have verification
  const EIGHT_HOURS = 8 * 60 * 60 * 1000
  const now = Date.now()
  const verifiableDrives = drives.filter(d => {
    if (d.status !== 'active') return false
    // For demo: all active drives are in window (real: check createdAt + duration)
    return true
  })
  const recentlyVerified = drives.filter(d => {
    if (d.status !== 'completed' || !d.verification?.verifiedAt) return false
    return now - new Date(d.verification.verifiedAt).getTime() < EIGHT_HOURS
  })

  const totalVols = drives.reduce((s, d) => s + (d.volunteersJoined || 0), 0)
  const activeDrives = drives.filter(d => d.status === 'active').length
  const completed = drives.filter(d => d.status === 'completed').length
  const fillRate = drives.length
    ? Math.round(drives.reduce((s, d) => s + Math.min(((d.volunteersJoined || 0) / (d.estimatedVolunteers || 20)) * 100, 100), 0) / drives.length)
    : 0

  const filteredDrives = drives
    .filter(d => driveFilter === 'all' || d.status === driveFilter)
    .filter(d => !driveSearch || d.title?.toLowerCase().includes(driveSearch.toLowerCase()) || d.location?.toLowerCase().includes(driveSearch.toLowerCase()))

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar
        links={sidebarLinks}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onAIFinder={() => setAiFinderOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {/* Topbar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 rounded-xl card b-theme" style={{ color: 'var(--text-secondary)' }}>
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium uppercase tracking-wider">NGO Dashboard</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeSection === 'overview' && 'Overview'}
                  {activeSection === 'drives' && 'My Drives'}
                  {activeSection === 'verification' && 'Verification'}
                  {activeSection === 'needs' && 'Public Needs'}
                  {activeSection === 'analytics' && 'Analytics'}
                  {activeSection === 'settings' && 'Settings'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
                className="p-2.5 rounded-xl card border-theme">
                {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-blue-400" />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                <QrCode size={15} /> QR Intake
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setAiFinderOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Sparkles size={15} /> AI Finder
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={List} value={drives.length} label="Total Drives" color="green" />
                  <StatCard icon={Zap} value={activeDrives} label="Active Drives" color="blue" />
                  <StatCard icon={Users} value={totalVols} label="Volunteers Joined" color="purple" />
                  <StatCard icon={CheckCircle} value={completed} label="Completed" color="orange" />
                </div>

                {/* Chart + Quick Actions */}
                <div className="grid lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="font-semibold text-primary">Volunteer Engagement</h2>
                        <p className="text-xs text-secondary mt-0.5">Monthly participation trend</p>
                      </div>
                      <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                        <TrendingUp size={11} /> +24% this month
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Area type="monotone" dataKey="volunteers" stroke="#22c55e" strokeWidth={2} fill="url(#gv)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card p-6 space-y-3">
                    <h2 className="font-semibold text-primary mb-4">Quick Actions</h2>
                    {[
                      { icon: Plus, label: 'Create New Drive', action: () => setModalOpen(true), color: 'text-green-400', bg: 'bg-green-500/10' },
                      { icon: QrCode, label: 'QR Data Intake', action: () => setQrModalOpen(true), color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                      { icon: Inbox, label: 'Public Needs', action: () => setActiveSection('needs'), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                      { icon: Sparkles, label: 'AI Volunteer Finder', action: () => setAiFinderOpen(true), color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                      { icon: BarChart3, label: 'View Analytics', action: () => setActiveSection('analytics'), color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { icon: Settings, label: 'NGO Settings', action: () => setActiveSection('settings'), color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    ].map(({ icon: Icon, label, action, color, bg }) => (
                      <motion.button key={label} whileHover={{ x: 4 }} onClick={action}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} ${color}`}><Icon size={14} /></div>
                        <span className="text-sm text-secondary group-hover:text-primary transition-colors flex-1">{label}</span>
                        <ArrowUpRight size={13} className="text-muted group-hover:text-secondary transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Impact row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Trees Planted', value: drives.length * 120, icon: TreePine, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Waste Collected', value: `${(drives.length * 0.4).toFixed(1)}T`, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Areas Covered', value: `${drives.length * 2}km²`, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Lives Impacted', value: totalVols * 8, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <motion.div key={label} whileHover={{ y: -3 }} className="card p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}><Icon size={18} /></div>
                      <div>
                        <p className="text-lg font-black text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                        <p className="text-xs text-secondary">{label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent drives */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-primary">Recent Drives</h2>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveSection('drives')} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                        View all <ArrowUpRight size={12} />
                      </button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalOpen(true)}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs transition-all">
                        <Plus size={13} /> New Drive
                      </motion.button>
                    </div>
                  </div>
                  {drives.length === 0 ? (
                    <div className="card p-12 text-center">
                      <TreePine size={32} className="text-green-400 mx-auto mb-3" />
                      <p className="text-secondary text-sm mb-4">No drives yet. Create your first one!</p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalOpen(true)}
                        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                        <Plus size={15} /> Create Drive
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drives.slice(0, 3).map((drive, i) => (
                        <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <DriveCard drive={drive} onViewDetails={setSelectedDrive} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── MY DRIVES ── */}
            {activeSection === 'drives' && (
              <motion.div key="drives" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={driveSearch}
                        onChange={e => setDriveSearch(e.target.value)}
                        placeholder="Search drives..."
                        className="input-field pl-8 pr-4 py-2 text-xs rounded-lg w-44"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Filter size={13} className="text-muted" />
                      {['all', 'active', 'completed'].map(f => (
                        <button key={f} onClick={() => setDriveFilter(f)}
                          className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all ${
                            driveFilter === f
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'card border-theme text-secondary hover:text-primary'
                          }`}>
                          {f}
                          <span className="ml-1 opacity-60">
                            ({f === 'all' ? drives.length : drives.filter(d => d.status === f).length})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-green-500/20 shrink-0">
                    <Plus size={15} /> New Drive
                  </motion.button>
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        className="h-52 card" />
                    ))}
                  </div>
                ) : filteredDrives.length === 0 ? (
                  <div className="card p-16 text-center">
                    <TreePine size={36} className="text-green-400 mx-auto mb-4" />
                    <p className="text-primary font-medium mb-1">{driveSearch ? 'No drives found' : 'No drives yet'}</p>
                    <p className="text-secondary text-sm mb-6">
                      {driveSearch ? `No results for "${driveSearch}"` : 'Create your first environmental drive'}
                    </p>
                    {!driveSearch && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModalOpen(true)}
                        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                        <Plus size={15} /> Create Drive
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDrives.map((drive, i) => (
                      <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="relative group">
                        <DriveCard drive={drive} onViewDetails={setSelectedDrive} />
                        {drive.status === 'active' && (
                          <button
                            onClick={() => handleMarkComplete(drive.id)}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                            Mark Complete
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── VERIFICATION ── */}
            {activeSection === 'verification' && (
              <motion.div key="verification" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Header info */}
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>8-Hour Verification Window</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Complete your drive verification within 8 hours of drive completion. Upload photos & impact data to get AI-verified.
                    </p>
                  </div>
                </div>

                {/* Pending Verification — active drives */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} className="text-orange-400" />
                    <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Pending Verification</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 font-medium">
                      {verifiableDrives.length}
                    </span>
                  </div>

                  {verifiableDrives.length === 0 ? (
                    <div className="card p-10 text-center">
                      <CheckCircle2 size={28} className="text-green-400 mx-auto mb-3" />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All drives verified!</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No pending verifications right now.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {verifiableDrives.map((drive, i) => (
                        <motion.div
                          key={drive.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          whileHover={{ y: -3 }}
                          className="card p-5 flex flex-col gap-3"
                          style={{ border: '1px solid rgba(249,115,22,0.2)' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{drive.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <MapPin size={11} className="text-green-400" />
                                <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{drive.location}</span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/25 shrink-0 font-medium flex items-center gap-1">
                              <Clock size={10} /> 8h window
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1"><Users size={11} className="text-purple-400" />{drive.volunteersJoined || 0} joined</span>
                            <span className="flex items-center gap-1"><Zap size={11} className="text-yellow-400" />{drive.urgency}</span>
                            <span className="capitalize flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-input)' }}>{drive.category?.replace('_', ' ')}</span>
                          </div>

                          {/* Volunteer photo submissions */}
                          {drive.volunteerSubmissions?.length > 0 && (
                            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                              <p className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                                <Camera size={11} /> {drive.volunteerSubmissions.length} volunteer check-in{drive.volunteerSubmissions.length > 1 ? 's' : ''}
                              </p>
                              <div className="flex gap-1.5 flex-wrap">
                                {drive.volunteerSubmissions.slice(0, 6).map((sub, si) =>
                                  sub.photos?.slice(0, 1).map((photo, pi) => (
                                    <div key={`${si}-${pi}`} className="w-10 h-10 rounded-lg overflow-hidden border border-green-500/20">
                                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))
                                )}
                                {drive.volunteerSubmissions.reduce((t, s) => t + (s.photos?.length || 0), 0) > 6 && (
                                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xs text-green-400 font-bold">
                                    +{drive.volunteerSubmissions.reduce((t, s) => t + (s.photos?.length || 0), 0) - 6}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {drive.volunteerSubmissions.map((sub, si) => (
                                  <span key={si} className="text-xs px-2 py-0.5 rounded-md text-secondary" style={{ background: 'var(--bg-input)' }}>
                                    {sub.volunteerName}
                                    {sub.rating > 0 && <span className="text-yellow-400 ml-1">{'★'.repeat(sub.rating)}</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setVerificationDrive(drive)}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                          >
                            <FileCheck size={14} /> Verify This Drive
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Verified */}
                {recentlyVerified.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recently Verified</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
                        {recentlyVerified.length}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {recentlyVerified.map((drive, i) => (
                        <motion.div
                          key={drive.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className="card p-5 flex flex-col gap-3"
                          style={{ border: '1px solid rgba(34,197,94,0.2)' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{drive.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <MapPin size={11} className="text-green-400" />
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{drive.location}</span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 shrink-0 font-medium flex items-center gap-1">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          </div>
                          {drive.verification?.aiResult && (
                            <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
                              <p className="text-xs font-medium text-green-400 mb-0.5">AI Impact Score: {drive.verification.aiResult.impactScore}/10</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{drive.verification.aiResult.headline}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { label: 'Volunteers', val: drive.verification?.impact?.volunteersAttended || '—' },
                              { label: 'Trees', val: drive.verification?.impact?.treesPlanted || '—' },
                              { label: 'Waste (kg)', val: drive.verification?.impact?.wasteCollected || '—' },
                            ].map(({ label, val }) => (
                              <div key={label} className="rounded-lg py-2" style={{ background: 'var(--bg-input)' }}>
                                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{val}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PUBLIC NEEDS ── */}
            {activeSection === 'needs' && (
              <motion.div key="needs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <PublicNeedsPanel
                  ngoId={currentUser?.uid}
                  onOpenQR={() => setQrModalOpen(true)}
                />
              </motion.div>
            )}

            {/* ── ANALYTICS ── */}
            {activeSection === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} value={totalVols} label="Total Volunteers" color="green" />
                  <StatCard icon={Target} value={fillRate} label="Avg. Fill Rate" color="blue" suffix="%" />
                  <StatCard icon={Globe} value={drives.length * 2} label="Areas Covered" color="purple" />
                  <StatCard icon={Leaf} value={drives.length * 120} label="Trees Planted" color="orange" />
                </div>

                <div className="grid lg:grid-cols-2 gap-5">
                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-5">Monthly Drives Created</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} barSize={24}>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Bar dataKey="drives" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-5">Volunteer Growth</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TT />} />
                        <Area type="monotone" dataKey="volunteers" stroke="#818cf8" strokeWidth={2} fill="url(#ga)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-primary">Drive Fill Rate</h2>
                    <span className="text-xs text-secondary">{drives.length} drives total</span>
                  </div>
                  {drives.length === 0 ? (
                    <p className="text-secondary text-sm text-center py-8">No drives to analyze yet</p>
                  ) : (
                    <div className="space-y-4">
                      {drives.slice(0, 6).map((d, i) => {
                        const pct = Math.min(((d.volunteersJoined || 0) / (d.estimatedVolunteers || 20)) * 100, 100)
                        return (
                          <div key={d.id} className="flex items-center gap-4">
                            <span className="text-xs text-secondary w-36 truncate">{d.title}</span>
                            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                              />
                            </div>
                            <span className="text-xs text-secondary w-16 text-right">{d.volunteersJoined || 0}/{d.estimatedVolunteers || 20}</span>
                            <span className={`text-xs font-semibold w-10 text-right ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>
                              {Math.round(pct)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Category breakdown */}
                {drives.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-semibold text-primary mb-4">Drives by Category</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(
                        drives.reduce((acc, d) => {
                          const cat = d.category || 'other'
                          acc[cat] = (acc[cat] || 0) + 1
                          return acc
                        }, {})
                      ).map(([cat, count]) => (
                        <div key={cat} className="card p-4 text-center">
                          <p className="text-2xl font-black text-primary">{count}</p>
                          <p className="text-xs text-secondary capitalize mt-1">{cat.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-2xl mx-auto space-y-5">

                {/* Profile */}
                <div className="card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <User size={18} className="text-green-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-primary">Organization Profile</h2>
                      <p className="text-xs text-secondary mt-0.5">Update your NGO's public information</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Organization Name', placeholder: 'Green Earth Foundation', icon: Shield },
                      { key: 'email', label: 'Email Address', placeholder: 'contact@greenearth.org', icon: Mail },
                      { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', icon: Phone },
                      { key: 'location', label: 'Location', placeholder: 'New Delhi, India', icon: MapPin },
                    ].map(({ key, label, placeholder, icon: Icon }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-secondary mb-2 block">{label}</label>
                        <div className="relative">
                          <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            value={profileData[key]}
                            onChange={e => setProfileData(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="input-field w-full pl-10 pr-4 py-3 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-secondary mb-2 block">About your NGO</label>
                      <textarea
                        rows={3}
                        value={profileData.about}
                        onChange={e => setProfileData(p => ({ ...p, about: e.target.value }))}
                        placeholder="Describe your organization's mission..."
                        className="input-field w-full px-4 py-3 text-sm resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => toast.success('Profile saved!')}
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
                      <p className="text-xs text-secondary mt-0.5">Manage your alert preferences</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {[
                      { key: 'newVolunteer', label: 'New volunteer joins a drive', desc: 'Get notified when someone joins' },
                      { key: 'driveReminder', label: 'Drive completion reminders', desc: '24h before a drive ends' },
                      { key: 'aiAnalysis', label: 'AI analysis ready', desc: 'When AI Finder completes a search' },
                      { key: 'weeklyReport', label: 'Weekly impact report', desc: 'Summary every Monday morning' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b border-theme last:border-0">
                        <div>
                          <p className="text-sm font-medium text-primary">{label}</p>
                          <p className="text-xs text-secondary mt-0.5">{desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ml-6 ${notifications[key] ? 'bg-green-500' : 'bg-gray-600'}`}>
                          <motion.div
                            animate={{ x: notifications[key] ? 22 : 2 }}
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

                {/* Danger zone */}
                <div className="card p-8 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <Shield size={18} className="text-red-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-red-400">Danger Zone</h2>
                      <p className="text-xs text-secondary mt-0.5">These actions are irreversible</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button onClick={() => toast.error('Contact support to delete your account')}
                      className="text-sm px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium">
                      Delete Account
                    </button>
                    <button onClick={() => toast('All drives archived', { icon: '📦' })}
                      className="text-sm px-4 py-3 rounded-xl border border-theme text-secondary hover:text-primary transition-colors font-medium">
                      Archive All Drives
                    </button>
                  </div>
                </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </main>

      <CreateDriveModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreateDrive} />
      <AIFinder open={aiFinderOpen} onClose={() => setAiFinderOpen(false)} />
      <DriveVerificationModal
        open={!!verificationDrive}
        onClose={() => setVerificationDrive(null)}
        drive={verificationDrive}
        onSubmit={handleVerificationSubmit}
      />
      <DriveDetailModal
        drive={selectedDrive}
        open={!!selectedDrive}
        onClose={() => setSelectedDrive(null)}
        isNGO={true}
      />
      <QRIntakeModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ngoId={currentUser?.uid}
        ngoName={profileData.name || currentUser?.displayName || 'My NGO'}
      />

      {/* Drive Completion Popup */}
      <AnimatePresence>
        {completionPopup && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-6 right-6 z-[60] w-80 rounded-2xl p-5 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(13,17,23,0.98), rgba(20,30,20,0.98))',
              border: '1px solid rgba(34,197,94,0.4)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.15)',
            }}
          >
            <button
              onClick={() => setCompletionPopup(null)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>

            {/* Animated checkmark */}
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0"
              >
                <CheckCircle2 size={20} className="text-green-400" />
              </motion.div>
              <div>
                <p className="text-sm font-bold text-green-400">Drive Complete!</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Verified via AlignSetu</p>
              </div>
            </div>

            <p className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
              {completionPopup.title}
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Your drive has been successfully verified. Impact data saved.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveSection('verification'); setCompletionPopup(null) }}
              className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <FileCheck size={13} /> View Verification
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
