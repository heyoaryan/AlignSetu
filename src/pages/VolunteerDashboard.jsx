import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, List, User, Star, MapPin, Clock,
  CheckCircle, Zap, TreePine, Award, Target, Search,
  Sun, Moon, Briefcase, GraduationCap, Heart, Building2,
  Wrench, Coffee, Globe, TrendingUp, Calendar, Edit3, Save, Menu,
  Flame, Trophy, Camera, Image, CheckCircle2, AlertCircle, History, Users, Sparkles
} from 'lucide-react'
import { collection, onSnapshot, doc, updateDoc, increment, getDoc, db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import DriveCard from '../components/DriveCard'
import MapView, { CATEGORY_COLORS, CATEGORY_LABELS } from '../components/MapView'
import StatCard from '../components/StatCard'
import DriveDetailModal from '../components/DriveDetailModal'
import VolunteerCheckInModal from '../components/VolunteerCheckInModal'
import { recommendDrivesForVolunteer, getVolunteerNudge } from '../services/gemini'
import toast from 'react-hot-toast'

const sidebarLinks = [
  { to: '/volunteer', icon: LayoutDashboard, label: 'Overview' },
  { to: '/volunteer/map', icon: Map, label: 'Map View' },
  { to: '/volunteer/drives', icon: List, label: 'Browse Drives' },
  { to: '/volunteer/mydrives', icon: History, label: 'My Drives' },
  { to: '/volunteer/profile', icon: User, label: 'My Profile' },
]

const skillOptions = [
  'Gardening', 'Waste Management', 'Teaching', 'Photography',
  'First Aid', 'Driving', 'Social Media', 'Data Entry',
  'Construction', 'Cooking', 'Medical', 'Legal', 'Carpentry', 'Plumbing'
]

const volunteerTypes = [
  { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Currently enrolled in school/college', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'professional', label: 'Working Professional', icon: Briefcase, desc: 'Employed full-time or part-time', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'ngo_worker', label: 'NGO Worker', icon: Heart, desc: 'Working with an NGO or non-profit', color: 'text-red-400', bg: 'bg-red-500/10' },
  { value: 'business_owner', label: 'Business Owner', icon: Building2, desc: 'Running your own business', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'freelancer', label: 'Freelancer', icon: Coffee, desc: 'Self-employed / independent', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { value: 'retired', label: 'Retired', icon: Globe, desc: 'Retired and giving back', color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'other', label: 'Other', icon: Wrench, desc: 'Something else entirely', color: 'text-gray-400', bg: 'bg-gray-500/10' },
]

const availabilityOptions = ['Weekdays', 'Weekends', 'Evenings', 'Mornings', 'Flexible', 'Full-time']

// XP per action
const XP_PER_JOIN = 50
const XP_STREAK_BONUS = 25

// Badge definitions with dynamic earned check
function getBadges(joinedDrives, drives, userSkills, streak) {
  const plantationJoined = drives.filter(d => d.category === 'plantation' && joinedDrives.includes(d.id)).length
  return [
    {
      icon: TreePine, label: 'Tree Planter', desc: 'Join 3+ plantation drives',
      color: 'text-green-400', bg: 'bg-green-500/10',
      earned: plantationJoined >= 3,
      progress: Math.min(plantationJoined, 3), total: 3,
    },
    {
      icon: Award, label: 'Eco Warrior', desc: 'Join 5+ drives',
      color: 'text-yellow-400', bg: 'bg-yellow-500/10',
      earned: joinedDrives.length >= 5,
      progress: Math.min(joinedDrives.length, 5), total: 5,
    },
    {
      icon: Target, label: 'Skill Master', desc: 'List 5+ skills',
      color: 'text-blue-400', bg: 'bg-blue-500/10',
      earned: userSkills.length >= 5,
      progress: Math.min(userSkills.length, 5), total: 5,
    },
    {
      icon: Flame, label: 'On Fire', desc: 'Maintain a 3-day streak',
      color: 'text-orange-400', bg: 'bg-orange-500/10',
      earned: streak >= 3,
      progress: Math.min(streak, 3), total: 3,
    },
    {
      icon: Trophy, label: 'Champion', desc: 'Earn 500+ XP',
      color: 'text-purple-400', bg: 'bg-purple-500/10',
      earned: joinedDrives.length * XP_PER_JOIN >= 500,
      progress: Math.min(joinedDrives.length * XP_PER_JOIN, 500), total: 500,
    },
    {
      icon: Star, label: 'Top Volunteer', desc: 'Join 10+ drives',
      color: 'text-pink-400', bg: 'bg-pink-500/10',
      earned: joinedDrives.length >= 10,
      progress: Math.min(joinedDrives.length, 10), total: 10,
    },
  ]
}

export default function VolunteerDashboard() {
  const { currentUser } = useAuth()
  const { isDark, toggle } = useTheme()
  const [drives, setDrives] = useState([])
  const [joinedDrives, setJoinedDrives] = useState([])
  const [activeSection, setActiveSection] = useState('overview')
  const [userSkills, setUserSkills] = useState([])
  const [volunteerType, setVolunteerType] = useState('')
  const [availability, setAvailability] = useState([])
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [volunteerCoords, setVolunteerCoords] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [radiusKm, setRadiusKm] = useState(20)
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [detailDefaultTab, setDetailDefaultTab] = useState('details')
  const [mapCategoryFilter, setMapCategoryFilter] = useState(new Set())
  const [checkInDrive, setCheckInDrive] = useState(null)

  // AI state
  const [aiRecommendations, setAiRecommendations] = useState([]) // [{id, matchScore, reason, tag}]
  const [aiRecsLoading, setAiRecsLoading] = useState(false)
  const [aiNudge, setAiNudge] = useState(null) // {message, cta, type}
  const [aiNudgeLoading, setAiNudgeLoading] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drives'), (snap) => {
      setDrives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'users', currentUser.uid)).then(d => {
      if (d.exists()) {
        const data = d.data()
        setJoinedDrives(data.joinedDrives || [])
        setUserSkills(data.skills || [])
        setVolunteerType(data.volunteerType || '')
        setAvailability(data.availability || [])
        setLocation(data.location || '')
        setBio(data.bio || '')
        setXp(data.xp || 0)
        setStreak(data.streak || 0)
      }
    })
  }, [currentUser])

  // AI: fetch nudge when profile loads
  useEffect(() => {
    if (!currentUser || aiNudge || aiNudgeLoading) return
    setAiNudgeLoading(true)
    getVolunteerNudge({
      joinedCount: joinedDrives.length,
      xp,
      streak,
      skills: userSkills,
      badgesEarned: getBadges(joinedDrives, drives, userSkills, streak).filter(b => b.earned).length,
    })
      .then(n => setAiNudge(n))
      .catch(() => {})
      .finally(() => setAiNudgeLoading(false))
  }, [currentUser, joinedDrives.length, xp]) // eslint-disable-line

  // AI: fetch drive recommendations when drives + profile are ready
  useEffect(() => {
    if (!drives.length || aiRecsLoading || aiRecommendations.length) return
    setAiRecsLoading(true)
    recommendDrivesForVolunteer(
      { skills: userSkills, volunteerType, availability, location, joinedDrives },
      drives.filter(d => !joinedDrives.includes(d.id) && d.status === 'active')
    )
      .then(recs => setAiRecommendations(recs))
      .catch(() => setAiRecommendations([]))
      .finally(() => setAiRecsLoading(false))
  }, [drives.length, userSkills.length]) // eslint-disable-line

  const handleJoin = async (drive) => {
    if (joinedDrives.includes(drive.id)) return toast('Already joined!', { icon: '✅' })
    try {
      const newJoined = [...joinedDrives, drive.id]
      const today = new Date().toDateString()
      const lastJoinDate = localStorage.getItem(`alignsetu_lastjoin_${currentUser.uid}`)
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      let newStreak = streak
      if (lastJoinDate === yesterday) {
        newStreak = streak + 1
      } else if (lastJoinDate !== today) {
        newStreak = 1
      }
      localStorage.setItem(`alignsetu_lastjoin_${currentUser.uid}`, today)

      const streakBonus = newStreak >= 3 ? XP_STREAK_BONUS : 0
      const xpGained = XP_PER_JOIN + streakBonus
      const newXp = xp + xpGained

      await updateDoc(doc(db, 'drives', drive.id), { volunteersJoined: increment(1) })
      await updateDoc(doc(db, 'users', currentUser.uid), {
        joinedDrives: newJoined,
        xp: newXp,
        streak: newStreak,
      })
      setJoinedDrives(newJoined)
      setXp(newXp)
      setStreak(newStreak)

      const msg = streakBonus > 0
        ? `+${xpGained} XP (${XP_PER_JOIN} + ${streakBonus} streak bonus) 🔥`
        : `+${xpGained} XP earned!`
      toast.success(`Joined "${drive.title}"! ${msg}`)

      // Auto-open detail modal on updates tab after joining
      openDriveDetail(drive, 'updates')
    } catch { toast.error('Failed to join drive') }
  }

  const openDriveDetail = (drive, tab = 'details') => {
    setDetailDefaultTab(tab)
    setSelectedDrive(drive)
  }

  const toggleSkill = (skill) => {
    const updated = userSkills.includes(skill) ? userSkills.filter(s => s !== skill) : [...userSkills, skill]
    setUserSkills(updated)
  }

  const toggleAvailability = (a) => {
    setAvailability(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const saveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { skills: userSkills, volunteerType, availability, location, bio })
      toast.success('Profile saved!')
      setEditingProfile(false)
    } catch { toast.error('Failed to save') }
  }

  const fetchVolunteerLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setVolunteerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationLoading(false)
        toast.success('Location fetched!')
      },
      () => {
        setLocationLoading(false)
        toast.error('Could not get location')
      }
    )
  }

  const drivesWithCoords = drives.map(d => ({
    ...d,
    lat: d.lat || 28.6139 + (Math.random() - 0.5) * 0.12,
    lng: d.lng || 77.209 + (Math.random() - 0.5) * 0.12,
  }))

  // radius filter for volunteer map
  const nearbyDrives = volunteerCoords
    ? drivesWithCoords.filter(d => {
        const R = 6371
        const dLat = ((d.lat - volunteerCoords.lat) * Math.PI) / 180
        const dLng = ((d.lng - volunteerCoords.lng) * Math.PI) / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((volunteerCoords.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm
      })
    : drivesWithCoords

  const filteredDrives = drives.filter(d =>
    !searchQuery ||
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedType = volunteerTypes.find(t => t.value === volunteerType)

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
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium uppercase tracking-wider">Volunteer Dashboard</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeSection === 'overview' && 'Overview'}
                  {activeSection === 'map' && 'Map View'}
                  {activeSection === 'drives' && 'Browse Drives'}
                  {activeSection === 'mydrives' && 'My Drives'}
                  {activeSection === 'profile' && 'My Profile'}
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
                  <StatCard icon={CheckCircle} value={joinedDrives.length} label="Drives Joined" color="green" />
                  <StatCard icon={Clock} value={joinedDrives.length * 3} label="Hours Contributed" color="blue" suffix="h" />
                  <StatCard icon={Zap} value={xp} label="Total XP" color="orange" />
                  <StatCard icon={Flame} value={`${streak}d`} label="Current Streak" color="purple" />
                </div>

                {/* ── AlignSetu AI Nudge ── */}
                <AnimatePresence>
                  {(aiNudge || aiNudgeLoading) && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(34,197,94,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}
                    >
                      <motion.div
                        animate={aiNudgeLoading ? { rotate: 360 } : { rotate: [0, 10, -10, 0] }}
                        transition={aiNudgeLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 3, repeat: Infinity }}
                        className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Sparkles size={16} className="text-purple-400" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block mb-0.5" style={{ background: 'linear-gradient(90deg, #a78bfa, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          AlignSetu AI
                        </span>
                        {aiNudgeLoading
                          ? <div className="h-3 w-52 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
                          : <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{aiNudge?.message}</p>
                        }
                      </div>
                      {aiNudge?.cta && !aiNudgeLoading && (
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveSection('drives')}
                          className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold text-black"
                          style={{ background: 'linear-gradient(135deg, #a78bfa, #22c55e)' }}
                        >
                          {aiNudge.cta}
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profile summary card */}
                <div className="card p-6 flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl flex items-center justify-center text-xl font-black text-green-400">
                    {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'V'}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-primary text-lg">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {selectedType && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${selectedType.bg} ${selectedType.color}`} style={{ borderColor: 'currentColor', opacity: 0.8 }}>
                          <selectedType.icon size={11} /> {selectedType.label}
                        </span>
                      )}
                      {location && <span className="text-xs text-secondary flex items-center gap-1"><MapPin size={11} className="text-green-400" />{location}</span>}
                      {!selectedType && <span className="text-xs text-muted">Complete your profile →</span>}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection('profile')}
                    className="text-xs px-4 py-2 rounded-xl card border-theme text-secondary hover:text-primary flex items-center gap-1.5">
                    <Edit3 size={12} /> Edit Profile
                  </motion.button>
                </div>

                {/* Upcoming joined drives */}
                <div>
                  <h2 className="font-semibold text-primary mb-4">Your Joined Drives</h2>
                  {joinedDrives.length === 0 ? (
                    <div className="card p-10 text-center">
                      <Calendar size={28} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary text-sm">You haven't joined any drives yet.</p>
                      <button onClick={() => setActiveSection('drives')} className="text-green-400 text-sm mt-2 hover:text-green-300">Browse drives →</button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drives.filter(d => joinedDrives.includes(d.id)).slice(0, 3).map((drive, i) => (
                        <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <DriveCard drive={drive} joined={true} onViewDetails={openDriveDetail} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── MAP VIEW ── */}
            {activeSection === 'map' && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* ── Row 1: Location status + button ── */}
                <div className="card p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${volunteerCoords ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                      <span className="text-sm text-secondary">
                        {volunteerCoords
                          ? `${nearbyDrives.length} drives within ${radiusKm}km`
                          : 'Enable location to see drives near you'}
                      </span>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={fetchVolunteerLocation} disabled={locationLoading}
                      className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors disabled:opacity-50">
                      <MapPin size={13} />
                      {locationLoading ? 'Fetching...' : volunteerCoords ? 'Refresh Location' : 'Use My Location'}
                    </motion.button>
                  </div>

                  {/* ── Row 2: Radius slider ── */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted shrink-0">20km</span>
                    <div className="relative flex-1 h-5 flex items-center">
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${((radiusKm - 20) / 30) * 100}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={20} max={50} step={5}
                        value={radiusKm}
                        onChange={e => setRadiusKm(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                      />
                      <div
                        className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md pointer-events-none transition-all"
                        style={{ left: `calc(${((radiusKm - 20) / 30) * 100}% - 8px)` }}
                      />
                    </div>
                    <span className="text-xs text-muted shrink-0">50km</span>
                    <span className="text-xs font-bold text-blue-400 w-12 text-right shrink-0">{radiusKm} km</span>
                  </div>

                  {/* ── Row 3: Category filter ── */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-muted shrink-0">Filter:</span>
                    <button
                      onClick={() => setMapCategoryFilter(new Set())}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                        mapCategoryFilter.size === 0
                          ? 'bg-white/10 text-primary border-white/20'
                          : 'text-secondary border-theme hover:text-primary'
                      }`}
                      style={{ background: mapCategoryFilter.size === 0 ? 'var(--bg-input)' : undefined }}
                    >
                      All
                    </button>
                    {[...new Set(drivesWithCoords.map(d => d.category).filter(Boolean))].map(cat => {
                      const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default
                      const isActive = mapCategoryFilter.has(cat)
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setMapCategoryFilter(prev => {
                              const next = new Set(prev)
                              if (next.has(cat)) next.delete(cat)
                              else next.add(cat)
                              return next
                            })
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all flex items-center gap-1.5"
                          style={{
                            background: isActive ? `${colors.fill}22` : 'var(--bg-input)',
                            color: isActive ? colors.stroke : 'var(--text-secondary)',
                            borderColor: isActive ? `${colors.fill}55` : 'var(--border)',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.fill }} />
                          {CATEGORY_LABELS[cat] || cat}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Map ── */}
                <div className="rounded-2xl overflow-hidden border border-theme mb-4" style={{ height: '480px' }}>
                  <MapView
                    drives={drivesWithCoords}
                    volunteerLocation={volunteerCoords}
                    radiusKm={radiusKm}
                    mode="volunteer"
                    selectedCategories={mapCategoryFilter}
                  />
                </div>

                {/* ── Below map: only filtered drives ── */}
                {(() => {
                  const base = volunteerCoords ? nearbyDrives : drivesWithCoords
                  const shown = mapCategoryFilter.size === 0
                    ? base
                    : base.filter(d => mapCategoryFilter.has(d.category))
                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <MapPin size={14} className="text-green-400" />
                        {volunteerCoords
                          ? `Drives within ${radiusKm}km${mapCategoryFilter.size > 0 ? ' · filtered' : ''} (${shown.length})`
                          : `Drives${mapCategoryFilter.size > 0 ? ' · filtered' : ''} (${shown.length})`}
                      </h3>
                      {shown.length === 0 ? (
                        <div className="card p-8 text-center">
                          <MapPin size={24} className="text-muted mx-auto mb-2" />
                          <p className="text-secondary text-sm">
                            {mapCategoryFilter.size > 0
                              ? 'No drives match the selected category filter'
                              : `No drives found within ${radiusKm}km`}
                          </p>
                          {mapCategoryFilter.size > 0 && (
                            <button onClick={() => setMapCategoryFilter(new Set())}
                              className="text-green-400 text-xs mt-2 hover:text-green-300">
                              Clear filter →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {shown.slice(0, 8).map(d => {
                            const colors = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.default
                            return (
                              <motion.div key={d.id} whileHover={{ y: -2 }}
                              onClick={() => { setDetailDefaultTab('details'); setSelectedDrive(d) }}
                                className="card p-3 cursor-pointer hover:border-green-500/30 transition-all">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.fill }} />
                                  <span className="text-xs text-primary font-medium truncate">{d.title}</span>
                                </div>
                                <span className="text-xs text-muted capitalize">{d.category?.replace('_', ' ')}</span>
                                {d.location && <p className="text-xs text-secondary mt-1 truncate">📍 {d.location}</p>}
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </motion.div>
            )}

            {/* ── BROWSE DRIVES ── */}
            {activeSection === 'drives' && (
              <motion.div key="drives" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative mb-5">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, category, or location..."
                    className="input-field w-full pl-10 pr-4 py-3 text-sm" />
                </div>

                {/* ── AlignSetu AI Recommendations ── */}
                {!searchQuery && (aiRecsLoading || aiRecommendations.length > 0) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <motion.div
                        animate={aiRecsLoading ? { rotate: 360 } : { rotate: [0, 10, -10, 0] }}
                        transition={aiRecsLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 3, repeat: Infinity }}
                      >
                        <Sparkles size={14} className="text-purple-400" />
                      </motion.div>
                      <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #a78bfa, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        AlignSetu AI — Best Matches for You
                      </span>
                      {aiRecsLoading && <span className="text-xs text-muted">Analyzing your profile...</span>}
                    </div>

                    {aiRecsLoading ? (
                      <div className="grid md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                            className="h-52 card rounded-2xl" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-4">
                        {aiRecommendations.map((rec, i) => {
                          const drive = drives.find(d => d.id === rec.id)
                          if (!drive) return null
                          return (
                            <motion.div key={rec.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                              className="relative">
                              {/* AI badge */}
                              <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: 'linear-gradient(135deg, #a78bfa, #22c55e)', color: '#000' }}>
                                <Sparkles size={9} /> {rec.matchScore}%
                              </div>
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                  style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}>
                                  {rec.tag}
                                </span>
                              </div>
                              <DriveCard drive={drive} showJoin={!joinedDrives.includes(drive.id)} onJoin={handleJoin}
                                joined={joinedDrives.includes(drive.id)} onViewDetails={openDriveDetail} />
                              <p className="text-xs text-center mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
                                💡 {rec.reason}
                              </p>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-4 mb-2">
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      <span className="text-xs text-muted">All Drives</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                  </motion.div>
                )}

                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} className="h-52 card" />
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDrives.map((drive, i) => (
                      <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <DriveCard drive={drive} showJoin={!joinedDrives.includes(drive.id)} onJoin={handleJoin} joined={joinedDrives.includes(drive.id)} onViewDetails={openDriveDetail} />
                      </motion.div>
                    ))}
                    {filteredDrives.length === 0 && (
                      <div className="col-span-3 card p-12 text-center">
                        <Search size={28} className="text-muted mx-auto mb-3" />
                        <p className="text-secondary text-sm">No drives found</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MY DRIVES ── */}
            {activeSection === 'mydrives' && (
              <motion.div key="mydrives" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                {/* ── ACTIVE DRIVES ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <h2 className="font-semibold text-primary">Active Drives</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
                      {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'active').length}
                    </span>
                  </div>

                  {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'active').length === 0 ? (
                    <div className="card p-10 text-center">
                      <Zap size={28} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary text-sm">No active drives joined yet.</p>
                      <button onClick={() => setActiveSection('drives')} className="text-green-400 text-sm mt-2 hover:text-green-300">Browse drives →</button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'active').map((drive, i) => {
                        const mySubmission = drive.volunteerSubmissions?.find(s => s.volunteerId === currentUser?.uid)
                        return (
                          <motion.div key={drive.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="card p-5 flex flex-col gap-3"
                            style={{ border: mySubmission ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)' }}>

                            {/* Drive header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-primary text-sm truncate">{drive.title}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <MapPin size={11} className="text-green-400 shrink-0" />
                                  <span className="text-xs text-secondary truncate">{drive.location || 'TBD'}</span>
                                </div>
                              </div>
                              {mySubmission ? (
                                <span className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 shrink-0 flex items-center gap-1 font-medium">
                                  <CheckCircle2 size={10} /> Submitted
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0 flex items-center gap-1 font-medium">
                                  <AlertCircle size={10} /> Pending
                                </span>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-xs text-secondary">
                              <span className="flex items-center gap-1"><Clock size={11} className="text-green-400" />{drive.duration || '2h'}</span>
                              <span className="flex items-center gap-1"><Users size={11} className="text-purple-400" />{drive.volunteersJoined || 0} joined</span>
                              <span className="capitalize px-2 py-0.5 rounded-md text-xs" style={{ background: 'var(--bg-input)' }}>{drive.category?.replace('_', ' ')}</span>
                            </div>

                            {/* Submission preview */}
                            {mySubmission && (
                              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                <div className="flex items-center gap-2">
                                  <Image size={12} className="text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">{mySubmission.photos?.length} photo{mySubmission.photos?.length > 1 ? 's' : ''} uploaded</span>
                                  {mySubmission.rating > 0 && (
                                    <span className="ml-auto text-xs text-yellow-400 flex items-center gap-0.5">
                                      {'★'.repeat(mySubmission.rating)}{'☆'.repeat(5 - mySubmission.rating)}
                                    </span>
                                  )}
                                </div>
                                {mySubmission.note && (
                                  <p className="text-xs text-secondary line-clamp-2 italic">"{mySubmission.note}"</p>
                                )}
                                <p className="text-xs text-muted">
                                  Submitted {new Date(mySubmission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  onClick={() => { setDetailDefaultTab('details'); setSelectedDrive(drive) }}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-theme text-secondary hover:text-primary transition-colors"
                                style={{ background: 'var(--bg-input)' }}>
                                View Details
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setCheckInDrive(drive)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                                style={{
                                  background: mySubmission ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                                  color: mySubmission ? '#4ade80' : '#000',
                                  border: mySubmission ? '1px solid rgba(34,197,94,0.3)' : 'none',
                                }}>
                                <Camera size={12} />
                                {mySubmission ? 'Update' : 'Check In'}
                              </motion.button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── PAST DRIVES ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History size={14} className="text-secondary" />
                    <h2 className="font-semibold text-primary">Past Drives</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-secondary border border-gray-500/20 font-medium">
                      {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'completed').length}
                    </span>
                  </div>

                  {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'completed').length === 0 ? (
                    <div className="card p-10 text-center">
                      <History size={28} className="text-muted mx-auto mb-3" />
                      <p className="text-secondary text-sm">No completed drives yet.</p>
                      <p className="text-muted text-xs mt-1">Completed drives will appear here with your impact data.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drives.filter(d => joinedDrives.includes(d.id) && d.status === 'completed').map((drive, i) => {
                        const mySubmission = drive.volunteerSubmissions?.find(s => s.volunteerId === currentUser?.uid)
                        const verified = drive.verification
                        return (
                          <motion.div key={drive.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="card p-5"
                            style={{ border: '1px solid rgba(100,116,139,0.2)' }}>
                            <div className="flex items-start gap-4">

                              {/* Left: icon */}
                              <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-green-400" />
                              </div>

                              {/* Center: info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-primary text-sm">{drive.title}</h3>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Completed</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-secondary flex-wrap">
                                  <span className="flex items-center gap-1"><MapPin size={10} className="text-green-400" />{drive.location}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} />{drive.duration}</span>
                                  <span className="capitalize">{drive.category?.replace('_', ' ')}</span>
                                </div>

                                {/* Impact data from NGO verification */}
                                {verified?.impact && (
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    {verified.impact.volunteersAttended && (
                                      <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        👥 {verified.impact.volunteersAttended} attended
                                      </span>
                                    )}
                                    {verified.impact.treesPlanted && (
                                      <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                                        🌱 {verified.impact.treesPlanted} trees
                                      </span>
                                    )}
                                    {verified.impact.wasteCollected && (
                                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        ♻️ {verified.impact.wasteCollected}kg waste
                                      </span>
                                    )}
                                    {verified.aiResult?.impactScore && (
                                      <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                        ⚡ Impact {verified.aiResult.impactScore}/10
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* My submission */}
                                {mySubmission && (
                                  <div className="mt-2 flex items-center gap-3 text-xs text-secondary">
                                    <span className="flex items-center gap-1 text-green-400">
                                      <Image size={11} /> {mySubmission.photos?.length} photo{mySubmission.photos?.length > 1 ? 's' : ''}
                                    </span>
                                    {mySubmission.rating > 0 && (
                                      <span className="text-yellow-400">{'★'.repeat(mySubmission.rating)}</span>
                                    )}
                                    {mySubmission.note && (
                                      <span className="italic truncate max-w-xs">"{mySubmission.note}"</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right: XP earned */}
                              <div className="text-right shrink-0">
                                <div className="text-sm font-black text-green-400">+{XP_PER_JOIN} XP</div>
                                <div className="text-xs text-muted">earned</div>
                                {mySubmission?.photos?.length > 0 && (
                                  <div className="mt-1">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden ml-auto">
                                      <img src={mySubmission.photos[0].url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ── MY PROFILE ── */}
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="max-w-3xl mx-auto space-y-5">

                  {/* Avatar + basic info */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                        <User size={18} className="text-green-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">Personal Info</h2>
                        <p className="text-xs text-secondary mt-0.5">Your public volunteer profile</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={editingProfile ? saveProfile : () => setEditingProfile(true)}
                        className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          editingProfile ? 'bg-green-500 text-black' : 'card border-theme text-secondary hover:text-primary'
                        }`}>
                        {editingProfile ? <><Save size={14} /> Save</> : <><Edit3 size={14} /> Edit</>}
                      </motion.button>
                    </div>

                    {/* Avatar row */}
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl font-black text-green-400 shrink-0">
                        {currentUser?.displayName?.[0]?.toUpperCase() || 'V'}
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-xl">{currentUser?.displayName || 'Volunteer'}</h3>
                        <p className="text-sm text-secondary mt-0.5">{currentUser?.email}</p>
                        {selectedType && (
                          <span className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 mt-2 ${selectedType.bg} ${selectedType.color}`}>
                            <selectedType.icon size={11} /> {selectedType.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-secondary mb-2 block">Location</label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                          <input value={location} onChange={e => setLocation(e.target.value)} disabled={!editingProfile}
                            placeholder="Your city or area" className="input-field w-full pl-10 pr-4 py-3 text-sm disabled:opacity-60" />
                        </div>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-xs font-medium text-secondary mb-2 block">Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} disabled={!editingProfile}
                          placeholder="Tell NGOs about yourself..." rows={2}
                          className="input-field w-full px-4 py-3 text-sm resize-none disabled:opacity-60" />
                      </div>
                    </div>

                    {editingProfile && (
                      <div className="flex justify-end mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={saveProfile}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2.5 rounded-xl text-sm">
                          <Save size={15} /> Save Profile
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Volunteer Type */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Briefcase size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">I am a...</h2>
                        <p className="text-xs text-secondary mt-0.5">Helps NGOs understand your background</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {volunteerTypes.map(({ value, label, icon: Icon, desc, color, bg }) => (
                        <motion.button key={value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setVolunteerType(value)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            volunteerType === value ? `${bg} border-current ${color}` : 'card border-theme text-secondary hover:text-primary'
                          }`}
                          style={volunteerType === value ? { borderColor: 'currentColor' } : {}}>
                          <div className="flex items-center justify-between mb-2">
                            <Icon size={16} />
                            {volunteerType === value && <CheckCircle size={13} />}
                          </div>
                          <p className="text-xs font-semibold">{label}</p>
                          <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Skills + Availability side by side */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="card p-8">
                      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                          <Zap size={18} className="text-green-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-primary">My Skills</h2>
                          <p className="text-xs text-secondary mt-0.5">{userSkills.length} selected</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skillOptions.map(skill => (
                          <motion.button key={skill} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              userSkills.includes(skill)
                                ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                : 'card border-theme text-secondary hover:text-primary'
                            }`}>
                            {userSkills.includes(skill) && <CheckCircle size={9} className="inline mr-1" />}
                            {skill}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="card p-8">
                      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                          <Calendar size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-primary">Availability</h2>
                          <p className="text-xs text-secondary mt-0.5">{availability.length} selected</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availabilityOptions.map(a => (
                          <motion.button key={a} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => toggleAvailability(a)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                              availability.includes(a)
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'card border-theme text-secondary hover:text-primary'
                            }`}>
                            {a}
                          </motion.button>
                        ))}
                      </div>

                      {/* Badges */}
                      <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                        <h3 className="text-xs font-semibold text-secondary mb-3 flex items-center gap-2"><Award size={13} className="text-yellow-400" /> Badges</h3>
                        <div className="space-y-2">
                          {getBadges(joinedDrives, drives, userSkills, streak).map(({ icon: Icon, label, desc, color, bg, earned, progress, total }) => (
                            <div key={label} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${earned ? 'border-green-500/20 bg-green-500/5' : 'border-theme opacity-50'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}><Icon size={14} /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-primary">{label}</p>
                                <p className="text-xs text-muted truncate">{desc}</p>
                                {!earned && (
                                  <div className="mt-1 w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
                                    <div className="h-full bg-green-500/50 rounded-full" style={{ width: `${(progress / total) * 100}%` }} />
                                  </div>
                                )}
                              </div>
                              {earned
                                ? <CheckCircle size={13} className="text-green-400 shrink-0" />
                                : <span className="text-xs text-muted shrink-0">{progress}/{total}</span>
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Score */}
                  <div className="card p-8">
                    <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                        <TrendingUp size={18} className="text-green-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-primary">XP & Progress</h2>
                        <p className="text-xs text-secondary mt-0.5">Your contribution so far</p>
                      </div>
                      <div className="ml-auto text-4xl font-black text-gradient">{xp}</div>
                    </div>

                    {/* XP bar to next level */}
                    {(() => {
                      const level = Math.floor(xp / 200) + 1
                      const xpInLevel = xp % 200
                      const xpToNext = 200
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs text-secondary mb-2">
                            <span className="font-semibold text-primary">Level {level}</span>
                            <span>{xpInLevel} / {xpToNext} XP to Level {level + 1}</span>
                          </div>
                          <div className="w-full h-3 rounded-full mb-5" style={{ background: 'var(--border)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                            />
                          </div>
                        </>
                      )
                    })()}

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Drives Joined', value: joinedDrives.length },
                        { label: 'Hours Given', value: `${joinedDrives.length * 3}h` },
                        { label: 'Total XP', value: xp },
                        { label: 'Streak', value: `${streak}d 🔥` },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--input-bg)' }}>
                          <div className="text-lg font-bold text-primary">{value}</div>
                          <div className="text-xs text-muted mt-0.5">{label}</div>
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

      <DriveDetailModal
        drive={selectedDrive}
        open={!!selectedDrive}
        onClose={() => { setSelectedDrive(null); setDetailDefaultTab('details') }}
        onJoin={handleJoin}
        joined={selectedDrive ? joinedDrives.includes(selectedDrive.id) : false}
        isNGO={false}
        defaultTab={detailDefaultTab}
      />

      <VolunteerCheckInModal
        drive={checkInDrive}
        open={!!checkInDrive}
        onClose={() => setCheckInDrive(null)}
        onSubmit={() => {
          setCheckInDrive(null)
          toast.success('Check-in saved! NGO will verify soon.')
        }}
      />
    </div>
  )
}