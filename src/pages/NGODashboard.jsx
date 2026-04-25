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
  { month: 'Jan', volunteers: 18, drives: 3 },
  { month: 'Feb', volunteers: 35, drives: 5 },
  { month: 'Mar', volunteers: 58, drives: 7 },
  { month: 'Apr', volunteers: 47, drives: 4 },
  { month: 'May', volunteers: 82, drives: 9 },
  { month: 'Jun', volunteers: 114, drives: 12 },
]

// Mock drives for prototype — food, health, awareness
const MOCK_NGO_DRIVES = [
  {
    id: 'mock-ngo-1',
    title: 'Community Food Distribution Drive',
    category: 'food',
    location: 'Connaught Place, New Delhi',
    date: '2026-05-10',
    duration: '4 hours',
    urgency: 'high',
    estimatedVolunteers: 30,
    volunteersJoined: 22,
    status: 'active',
    description: 'Distributing nutritious meal packets to underprivileged families and homeless individuals around CP.',
    skills: ['Cooking', 'Driving', 'Social Media'],
  },
  {
    id: 'mock-ngo-2',
    title: 'Free Health Check-up Camp',
    category: 'health',
    location: 'Lajpat Nagar, New Delhi',
    date: '2026-05-12',
    duration: '6 hours',
    urgency: 'critical',
    estimatedVolunteers: 20,
    volunteersJoined: 14,
    status: 'active',
    description: 'Free blood pressure, sugar, and general health screening for residents. Doctors and paramedics on-site.',
    skills: ['First Aid', 'Medical', 'Data Entry'],
  },
  {
    id: 'mock-ngo-3',
    title: 'Mental Health Awareness Walk',
    category: 'awareness',
    location: 'India Gate Lawns, New Delhi',
    date: '2026-05-15',
    duration: '3 hours',
    urgency: 'medium',
    estimatedVolunteers: 50,
    volunteersJoined: 38,
    status: 'active',
    description: 'A community walk to break the stigma around mental health. Participants carry placards and distribute pamphlets.',
    skills: ['Social Media', 'Photography', 'Teaching'],
  },
  {
    id: 'mock-ngo-4',
    title: 'Hunger-Free Weekend — Meal Drive',
    category: 'food',
    location: 'Nizamuddin Basti, New Delhi',
    date: '2026-05-17',
    duration: '5 hours',
    urgency: 'high',
    estimatedVolunteers: 25,
    volunteersJoined: 18,
    status: 'active',
    description: 'Weekend meal drive serving hot cooked food to 500+ residents of Nizamuddin Basti.',
    skills: ['Cooking', 'Waste Management'],
  },
  {
    id: 'mock-ngo-5',
    title: 'Eye Care & Vision Screening Camp',
    category: 'health',
    location: 'Rohini Sector 11, New Delhi',
    date: '2026-05-20',
    duration: '5 hours',
    urgency: 'medium',
    estimatedVolunteers: 15,
    volunteersJoined: 9,
    status: 'completed',
    description: 'Free eye check-up and spectacle distribution for school children and senior citizens.',
    skills: ['Medical', 'First Aid', 'Data Entry'],
    verification: { impact: { treesPlanted: 0, wasteCollected: 0, peopleHelped: 120 }, photoCount: 8, verifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  },
  {
    id: 'mock-ngo-6',
    title: 'Road Safety Awareness Campaign',
    category: 'awareness',
    location: 'Dwarka Sector 10, New Delhi',
    date: '2026-05-22',
    duration: '3 hours',
    urgency: 'low',
    estimatedVolunteers: 40,
    volunteersJoined: 27,
    status: 'active',
    description: 'Educating commuters and school students about road safety rules, helmet usage, and pedestrian safety.',
    skills: ['Teaching', 'Photography', 'Social Media'],
  },
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

  // Use mock drives when Firebase has no data (prototype mode)
  const allDrives = drives.length > 0 ? drives : MOCK_NGO_DRIVES

  const totalVols = allDrives.reduce((s, d) => s + (d.volunteersJoined || 0), 0)
  const activeDrives = allDrives.filter(d => d.status === 'active').length
  const completed = allDrives.filter(d => d.status === 'completed').length
  const fillRate = allDrives.length
    ? Math.round(allDrives.reduce((s, d) => s + Math.min(((d.volunteersJoined || 0) / (d.estimatedVolunteers || 20)) * 100, 100), 0) / allDrives.length)
    : 0

  const filteredDrives = allDrives
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
            {/* Mobile: Logo + dark mode only | Desktop: section title */}
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 rounded-xl card b-theme" style={{ color: 'var(--text-secondary)' }}>
                <Menu size={20} />
              </button>
              {/* Mobile logo */}
              <div className="flex md:hidden items-center gap-2">
                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                  <Leaf size={15} className="text-black" />
                </div>
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Align<span className="text-green-500">Setu</span></span>
              </div>
              {/* Desktop section title */}
              <div className="hidden md:block">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium uppercase tracking-wider">NGO Dashboard</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                <QrCode size={15} /> QR Intake
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setAiFinderOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
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
                  <StatCard icon={List} value={allDrives.length} label="Total Drives" color="green" />
                  <StatCard icon={Users} value={totalVols * 8} label="People Helped" color="blue" />
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
                    { label: 'Trees Planted', value: allDrives.length * 120, icon: TreePine, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Waste Collected', value: `${(allDrives.length * 0.4).toFixed(1)}T`, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Areas Covered', value: `${allDrives.length * 2}km²`, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allDrives.slice(0, 3).map((drive, i) => (
                        <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <DriveCard drive={drive} onViewDetails={setSelectedDrive} />
                        </motion.div>
                      ))}
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
                            ({f === 'all' ? allDrives.length : allDrives.filter(d => d.status === f).length})
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
            {activeSection === 'analytics' && (() => {
              // Real impact from verified drives
              const verifiedDrives = allDrives.filter(d => d.status === 'completed' && d.verification?.impact)
              const totalTrees = verifiedDrives.reduce((s, d) => s + (Number(d.verification.impact.treesPlanted) || 0), 0)
              const totalWaste = verifiedDrives.reduce((s, d) => s + (Number(d.verification.impact.wasteCollected) || 0), 0)
              const totalAttended = verifiedDrives.reduce((s, d) => s + (Number(d.verification.impact.volunteersAttended) || 0), 0)
              const avgImpactScore = verifiedDrives.length
                ? Math.round(verifiedDrives.reduce((s, d) => s + (d.verification.aiResult?.impactScore || 0), 0) / verifiedDrives.length * 10) / 10
                : 0

              // Build monthly chart data from real drives
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              const monthlyMap = {}
              allDrives.forEach(d => {
                const ts = d.createdAt?.toDate ? d.createdAt.toDate() : d.createdAt ? new Date(d.createdAt) : null
                if (!ts) return
                const key = monthNames[ts.getMonth()]
                if (!monthlyMap[key]) monthlyMap[key] = { month: key, drives: 0, volunteers: 0, trees: 0 }
                monthlyMap[key].drives += 1
                monthlyMap[key].volunteers += d.volunteersJoined || 0
                if (d.verification?.impact?.treesPlanted) monthlyMap[key].trees += Number(d.verification.impact.treesPlanted) || 0
              })
              const realChartData = monthNames
                .filter(m => monthlyMap[m])
                .map(m => monthlyMap[m])
              const displayChartData = realChartData.length >= 2 ? realChartData : chartData

              // Top performing drives by fill rate
              const topDrives = [...allDrives]
                .map(d => ({ ...d, pct: Math.min(((d.volunteersJoined || 0) / (d.estimatedVolunteers || 20)) * 100, 100) }))
                .sort((a, b) => b.pct - a.pct)
                .slice(0, 5)

              // Category breakdown with icons
              const catIcons = { tree_plantation: '🌳', waste_cleanup: '♻️', awareness: '📢', food_drive: '🍱', food: '🍱', health: '🏥', water_conservation: '💧', other: '🌍' }
              const catMap = allDrives.reduce((acc, d) => {
                const cat = d.category || 'other'
                acc[cat] = (acc[cat] || 0) + 1
                return acc
              }, {})
              const catColors = ['text-green-400 bg-green-500/10 border-green-500/20', 'text-blue-400 bg-blue-500/10 border-blue-500/20', 'text-purple-400 bg-purple-500/10 border-purple-500/20', 'text-orange-400 bg-orange-500/10 border-orange-500/20', 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 'text-pink-400 bg-pink-500/10 border-pink-500/20']

              return (
                <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                  {/* Top KPI row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} value={totalVols} label="Total Volunteers" color="green" />
                    <StatCard icon={Target} value={fillRate} label="Avg. Fill Rate" color="blue" suffix="%" />
                    <StatCard icon={CheckCircle} value={completed} label="Drives Completed" color="purple" />
                    <StatCard icon={Users} value={totalVols * 8} label="People Helped" color="orange" />
                  </div>

                  {/* Charts row */}
                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-semibold text-primary">Monthly Drives</h2>
                          <p className="text-xs text-secondary mt-0.5">Drives created per month</p>
                        </div>
                        <span className="text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                          {allDrives.length} total
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={displayChartData} barSize={24}>
                          <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<TT />} />
                          <Bar dataKey="drives" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-semibold text-primary">Volunteer Growth</h2>
                          <p className="text-xs text-secondary mt-0.5">Cumulative participation trend</p>
                        </div>
                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1">
                          <TrendingUp size={10} /> Growing
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={displayChartData}>
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

                  {/* Drive Fill Rate */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="font-semibold text-primary">Drive Fill Rate</h2>
                        <p className="text-xs text-secondary mt-0.5">Volunteer slots filled per drive</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥80%</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />50–79%</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />&lt;50%</span>
                      </div>
                    </div>
                    {allDrives.length === 0 ? (
                      <p className="text-secondary text-sm text-center py-8">No drives to analyze yet</p>
                    ) : (
                      <div className="space-y-4">
                        {allDrives.slice(0, 6).map((d, i) => {
                          const pct = Math.min(((d.volunteersJoined || 0) / (d.estimatedVolunteers || 20)) * 100, 100)
                          return (
                            <div key={d.id} className="flex items-center gap-4">
                              <span className="text-xs text-secondary w-36 truncate">{d.title}</span>
                              <div className="flex-1 h-2.5 rounded-full" style={{ background: 'var(--border)' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                />
                              </div>
                              <span className="text-xs text-secondary w-16 text-right">{d.volunteersJoined || 0}/{d.estimatedVolunteers || 20}</span>
                              <span className={`text-xs font-bold w-10 text-right ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {Math.round(pct)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top Performing Drives + Category Breakdown */}
                  <div className="grid lg:grid-cols-2 gap-5">

                    {/* Top Drives */}
                    <div className="card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <TrendingUp size={15} className="text-green-400" />
                        <h2 className="font-semibold text-primary">Top Performing Drives</h2>
                      </div>
                      {topDrives.length === 0 ? (
                        <p className="text-secondary text-sm text-center py-8">No drives yet</p>
                      ) : (                        <div className="space-y-3">
                          {topDrives.map((d, i) => (
                            <motion.div
                              key={d.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => setSelectedDrive(d)}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                i === 1 ? 'bg-gray-400/20 text-gray-400' :
                                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-white/5 text-secondary'
                              }`}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary truncate">{d.title}</p>
                                <p className="text-xs text-secondary truncate">{d.location}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-bold ${d.pct >= 80 ? 'text-green-400' : d.pct >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                  {Math.round(d.pct)}%
                                </p>
                                <p className="text-xs text-secondary">{d.volunteersJoined || 0} vols</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category Breakdown */}
                    <div className="card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Globe size={15} className="text-purple-400" />
                        <h2 className="font-semibold text-primary">Drives by Category</h2>
                      </div>
                      {allDrives.length === 0 ? (
                        <p className="text-secondary text-sm text-center py-8">No drives yet</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(catMap)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, count], i) => {
                              const pct = Math.round((count / drives.length) * 100)
                              return (
                                <div key={cat} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-secondary flex items-center gap-1.5">
                                      <span>{catIcons[cat] || '🌍'}</span>
                                      <span className="capitalize">{cat.replace('_', ' ')}</span>
                                    </span>
                                    <span className="text-xs font-semibold text-primary">{count} <span className="text-secondary font-normal">({pct}%)</span></span>
                                  </div>
                                  <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.7, delay: i * 0.08 }}
                                      className={`h-full rounded-full ${catColors[i % catColors.length].split(' ')[0].replace('text', 'bg').replace('-400', '-500')}`}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verified Drives Impact Table */}
                  {verifiedDrives.length > 0 && (
                    <div className="card p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <CheckCircle size={15} className="text-green-400" />
                        <h2 className="font-semibold text-primary">Verified Impact Breakdown</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 ml-auto">
                          {verifiedDrives.length} drives
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Drive', 'Trees 🌳', 'Waste ♻️', 'Volunteers 👥', 'AI Score ⭐'].map(h => (
                                <th key={h} className="text-left pb-3 text-secondary font-medium pr-4">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {verifiedDrives.map((d, i) => (
                              <motion.tr
                                key={d.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-white/3 transition-colors cursor-pointer"
                                onClick={() => setSelectedDrive(d)}
                                style={{ borderBottom: '1px solid var(--border)' }}
                              >
                                <td className="py-3 pr-4 font-medium text-primary max-w-[140px] truncate">{d.title}</td>
                                <td className="py-3 pr-4 text-green-400 font-semibold">{d.verification.impact.treesPlanted || '—'}</td>
                                <td className="py-3 pr-4 text-blue-400 font-semibold">{d.verification.impact.wasteCollected ? `${d.verification.impact.wasteCollected} kg` : '—'}</td>
                                <td className="py-3 pr-4 text-purple-400 font-semibold">{d.verification.impact.volunteersAttended || '—'}</td>
                                <td className="py-3">
                                  {d.verification.aiResult?.impactScore ? (
                                    <span className={`px-2 py-0.5 rounded-lg font-bold ${
                                      d.verification.aiResult.impactScore >= 8 ? 'bg-green-500/15 text-green-400' :
                                      d.verification.aiResult.impactScore >= 6 ? 'bg-yellow-500/15 text-yellow-400' :
                                      'bg-red-500/15 text-red-400'
                                    }`}>
                                      {d.verification.aiResult.impactScore}/10
                                    </span>
                                  ) : '—'}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </motion.div>
              )
            })()}

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
