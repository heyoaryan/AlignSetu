import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Leaf, ArrowRight, Sparkles, MapPin, Users, Shield,
  TreePine, Droplets, Wind, Recycle, Globe, ChevronDown,
  Zap, BarChart3, CheckCircle, Star, TrendingUp, Award, Clock, AlertTriangle
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import { generateCommunityReport } from '../services/gemini'

// ── Typing effect hook ────────────────────────────────────
function useTypingEffect(words, { typingSpeed = 80, deletingSpeed = 45, pauseMs = 1800 } = {}) {
  const [display, setDisplay] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState('typing') // typing | pausing | deleting

  useEffect(() => {
    const word = words[wordIdx]
    let timeout

    if (phase === 'typing') {
      if (display.length < word.length) {
        timeout = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), typingSpeed)
      } else {
        timeout = setTimeout(() => setPhase('pausing'), pauseMs)
      }
    } else if (phase === 'pausing') {
      setPhase('deleting')
    } else if (phase === 'deleting') {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(display.slice(0, -1)), deletingSpeed)
      } else {
        setWordIdx((i) => (i + 1) % words.length)
        setPhase('typing')
      }
    }
    return () => clearTimeout(timeout)
  }, [display, phase, wordIdx, words, typingSpeed, deletingSpeed, pauseMs])

  return { display, isTyping: phase === 'typing' }
}

// ── Floating particle ─────────────────────────────────────
function Particle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full bg-green-400 pointer-events-none"
      style={style}
      animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
      transition={{ duration: style.duration, repeat: Infinity, delay: style.delay, ease: 'easeInOut' }}
    />
  )
}

const ROTATING_WORDS = [
  'the Environment',
  'the Future',
  'Our Planet',
  'Every Drive',
  'Real Impact',
]

const features = [
  { icon: Sparkles, title: 'Gemini AI Analysis', desc: 'AI converts drive descriptions into structured action plans with urgency scoring and skill matching.', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { icon: MapPin, title: 'Google Maps Integration', desc: 'Volunteers discover nearby drives on an interactive map with real-time markers and location data.', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Users, title: 'Smart Volunteer Matching', desc: 'AI matches volunteers to drives based on skills, location, and availability for maximum impact.', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  { icon: Shield, title: 'NGO Verification', desc: 'Admin panel with AI-powered flagging ensures only legitimate NGOs operate on the platform.', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards track environmental impact, volunteer hours, and drive completion rates.', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: Recycle, title: 'Multi-category Drives', desc: 'Support for cleanups, plantation, water conservation, wildlife protection, and awareness campaigns.', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
]

const stats = [
  { value: 50000, label: 'Volunteers to Mobilise', suffix: '+', icon: Users },
  { value: 5000, label: 'Drives to Coordinate', suffix: '+', icon: CheckCircle },
  { value: 1000, label: 'NGOs to Onboard', suffix: '+', icon: Shield },
  { value: 10000000, label: 'Trees to be Planted', suffix: '+', icon: TreePine },
]

// Live impact numbers (simulated from mock data)
const liveImpact = [
  { value: 1247, label: 'Volunteers Mobilised', suffix: '', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { value: 89, label: 'Drives Completed', suffix: '', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 42, label: 'NGOs Active', suffix: '', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 18600, label: 'Trees Planted', suffix: '+', icon: TreePine, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 340, label: 'Tonnes Waste Cleared', suffix: 'T', icon: Recycle, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { value: 9800, label: 'Lives Impacted', suffix: '+', icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
]

// Demo drives for community report (mirrors mock firebase seed data)
const demoDrives = [
  { title: 'Yamuna Cleanup Drive', category: 'cleanup', urgency: 'critical', location: 'Delhi', estimatedVolunteers: 30, volunteersJoined: 12, description: 'Clean plastic waste from Yamuna riverbank' },
  { title: 'Aravalli Plantation', category: 'plantation', urgency: 'high', location: 'Gurgaon', estimatedVolunteers: 50, volunteersJoined: 38, description: 'Plant native trees in Aravalli hills' },
  { title: 'Plastic Awareness Campaign', category: 'awareness', urgency: 'medium', location: 'Noida', estimatedVolunteers: 20, volunteersJoined: 15, description: 'Educate communities about plastic reduction' },
  { title: 'Wetland Conservation', category: 'water_conservation', urgency: 'high', location: 'Delhi', estimatedVolunteers: 25, volunteersJoined: 8, description: 'Restore wetland ecosystem near Okhla' },
  { title: 'E-Waste Recycling Drive', category: 'recycling', urgency: 'medium', location: 'Faridabad', estimatedVolunteers: 15, volunteersJoined: 11, description: 'Collect and recycle electronic waste' },
]

const driveTypes = [
  { icon: Recycle, label: 'Cleanup', color: 'text-blue-500' },
  { icon: TreePine, label: 'Plantation', color: 'text-green-500' },
  { icon: Droplets, label: 'Water Conservation', color: 'text-cyan-500' },
  { icon: Wind, label: 'Awareness', color: 'text-yellow-500' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'NGO Director, GreenIndia', text: 'AlignSetu transformed how we coordinate volunteers. The AI analysis saves us hours of planning.', avatar: 'PS' },
  { name: 'Rahul Verma', role: 'Environmental Volunteer', text: 'Found 3 drives near me within minutes. The map view is incredibly intuitive.', avatar: 'RV' },
  { name: 'Ananya Patel', role: 'NGO Coordinator', text: 'The Gemini AI suggestions are spot-on. It even predicted the volunteer count we needed.', avatar: 'AP' },
]

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let current = 0
    const step = value / 60
    const timer = setInterval(() => {
      current += step
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 2000 / 60)
    return () => clearInterval(timer)
  }, [inView, value])
  const display = value >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : value >= 1000 ? (count / 1000).toFixed(1) + 'K' : count.toString()
  return <span ref={ref}>{display}{suffix}</span>
}

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const iv = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } }

export default function Landing() {
  const { isDark } = useTheme()
  const heroRef = useRef(null)

  // Scroll-based transforms
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const gridOpacity    = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  const { display: typedWord } = useTypingEffect(ROTATING_WORDS)

  // Community needs report state
  const [communityReport, setCommunityReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const reportRef = useRef(null)
  const reportInView = useInView(reportRef, { once: true })

  useEffect(() => {
    if (!reportInView || communityReport || reportLoading) return
    setReportLoading(true)
    generateCommunityReport(demoDrives)
      .then(r => setCommunityReport(r))
      .catch(() => setCommunityReport(null))
      .finally(() => setReportLoading(false))
  }, [reportInView])

  // Stable particles (useMemo-like via useState init)
  const [particles] = useState(() =>
    Array.from({ length: 14 }, () => ({
      width:    Math.random() * 4 + 2,
      height:   Math.random() * 4 + 2,
      left:     `${Math.random() * 100}%`,
      top:      `${Math.random() * 100}%`,
      duration: Math.random() * 4 + 4,
      delay:    Math.random() * 6,
    }))
  )

  return (
    <div className="min-h-screen bg-page overflow-x-hidden transition-colors duration-300">
      <Navbar />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Grid bg — fades on scroll */}
        <motion.div
          style={{ opacity: gridOpacity }}
          className="absolute inset-0 pointer-events-none bg-grid"
        />

        {/* Orb 1 — top left */}
        <motion.div
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -80, left: -160,
            width: 500, height: 500,
            borderRadius: '50%', filter: 'blur(80px)',
            background: '#22c55e', opacity: 'var(--orb-opacity)',
            pointerEvents: 'none',
          }}
        />

        {/* Orb 2 — bottom right */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: -60, right: -100,
            width: 380, height: 380,
            borderRadius: '50%', filter: 'blur(80px)',
            background: '#34d399', opacity: 'var(--orb-opacity)',
            pointerEvents: 'none',
          }}
        />

        {/* Orb 3 — right side */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{
            position: 'absolute', top: '30%', right: '18%',
            width: 280, height: 280,
            borderRadius: '50%', filter: 'blur(70px)',
            background: '#2dd4bf', opacity: 'var(--orb-opacity)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating particles */}
        {particles.map((p, i) => <Particle key={i} style={p} />)}

        {/* ── Main content ── */}
        <motion.div
          style={{ opacity: contentOpacity }}
          className="relative z-10 w-full text-center px-5 sm:px-8"
        >
          <div className="max-w-4xl mx-auto">

            {/* Powered by Google badge */}
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(34,197,94,0.28)',
                boxShadow: '0 2px 16px rgba(34,197,94,0.10)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Powered by</span>
              {'Google'.split('').map((ch, i) => (
                <span key={i} className="text-xs font-black" style={{
                  color: ['#4285F4','#EA4335','#FFA000','#4285F4','#34A853','#EA4335'][i]
                }}>{ch}</span>
              ))}
            </motion.div>

            {/* Headline line 1 */}
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-black tracking-tight leading-[1.05] mb-1"
              style={{
                fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
                color: 'var(--hero-text)',
              }}
            >
              That Cares for
            </motion.h1>

            {/* Headline line 2 — typing */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              className="font-black tracking-tight leading-[1.1] mb-6 flex items-center justify-center"
              style={{ fontSize: 'clamp(2.4rem, 7vw, 5.5rem)', minHeight: '1.15em' }}
            >
              <span className="text-gradient">{typedWord}</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                style={{
                  display: 'inline-block',
                  width: 'clamp(3px, 0.5vw, 5px)',
                  height: '0.75em',
                  background: '#22c55e',
                  borderRadius: 2,
                  marginLeft: 6,
                  verticalAlign: 'middle',
                  flexShrink: 0,
                }}
              />
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="max-w-xl mx-auto mb-10 leading-relaxed"
              style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                color: 'var(--hero-sub)',
              }}
            >
              India's environmental data is scattered — NGOs work in silos, volunteers go
              unmatched, and impact goes unmeasured. AlignSetu fixes that with one AI-powered
              platform that organises drives, connects the right people, and tracks every drive.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.56 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth?role=ngo"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-7 py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-green-500/25 whitespace-nowrap"
                >
                  <Shield size={17} /> Start as NGO <ArrowRight size={15} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/auth?role=volunteer"
                  className="flex items-center gap-2 font-semibold px-7 py-3.5 rounded-2xl text-sm sm:text-base transition-all whitespace-nowrap"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Users size={17} /> Join as Volunteer
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 pointer-events-none"
          style={{ color: 'var(--text-muted)', opacity: contentOpacity }}
        >
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── Gap & Solution ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-sm text-green-500 font-semibold tracking-wider uppercase">The Problem & Solution</span>
            <h2 className="text-3xl md:text-4xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
              What's broken — and how <span className="text-gradient">AlignSetu fixes it</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left — Existing Gaps */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}
              className="card rounded-2xl p-7"
              style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/15">
                  <span className="text-lg">⚠️</span>
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Existing Gaps in India</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'NGOs work in silos', desc: 'Thousands of NGOs operate independently with no shared platform to coordinate drives or share resources.' },
                  { title: 'Volunteers go unmatched', desc: 'Willing volunteers have no easy way to discover nearby drives that match their skills and availability.' },
                  { title: 'Data is scattered', desc: 'Environmental impact data lives in spreadsheets, WhatsApp groups, and emails — never aggregated.' },
                  { title: 'No verification system', desc: 'Fake or inactive NGOs waste volunteer time with no accountability or trust layer in place.' },
                ].map(({ title, desc }, i) => (
                  <motion.div key={title} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — AlignSetu fills it */}
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}
              className="card rounded-2xl p-7"
              style={{ borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.03)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/15">
                  <Sparkles size={16} className="text-green-500" />
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>How AlignSetu fills the gap</h3>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'One unified platform', desc: 'NGOs create and manage drives in one place. Volunteers discover, join, and track everything from a single dashboard.', icon: '🌐' },
                  { title: 'AI-powered matching', desc: 'Gemini AI reads drive descriptions and matches the right volunteers by skill, location, and availability — automatically.', icon: '🤖' },
                  { title: 'Organised impact data', desc: 'Every drive, volunteer hour, and outcome is tracked in real-time. Admins get live analytics across the entire platform.', icon: '📊' },
                  { title: 'NGO verification layer', desc: 'Admin panel with AI-flagging ensures only legitimate, active NGOs operate — building trust for every volunteer.', icon: '✅' },
                ].map(({ title, desc, icon }, i) => (
                  <motion.div key={title} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-sm text-green-500 font-semibold tracking-wider uppercase">Platform Features</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4" style={{ color: 'var(--text-primary)' }}>
              Built for <span className="text-gradient">Real Impact</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Every feature is designed to reduce friction between environmental intent and action.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={cv}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <motion.div key={title} variants={iv} whileHover={{ y: -8, scale: 1.02 }}
                className="card rounded-2xl p-6 hover:border-green-500/30 group transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${bg} group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold mb-2 group-hover:text-green-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-sm text-green-500 font-semibold tracking-wider uppercase">How It Works</span>
            <h2 className="text-4xl font-black mt-3" style={{ color: 'var(--text-primary)' }}>Three steps to impact</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Shield, title: 'NGO Creates Drive', desc: 'Describe your environmental drive. Gemini AI instantly analyzes and structures it.', color: 'text-green-500' },
              { step: '02', icon: Zap, title: 'AI Matches Volunteers', desc: 'Smart matching connects the right volunteers based on skills and proximity.', color: 'text-yellow-500' },
              { step: '03', icon: Globe, title: 'Track Real Impact', desc: 'Monitor progress, volunteer hours, and environmental outcomes in real-time.', color: 'text-blue-500' },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="card rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="text-6xl font-black absolute top-3 right-4 select-none" style={{ color: 'var(--border)' }}>{step}</div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${color}`}
                  style={{ background: 'var(--bg-input)' }}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Impact Numbers ── */}
      <section id="impact" className="py-20 px-6" style={{ background: isDark ? 'rgba(34,197,94,0.03)' : 'rgba(34,197,94,0.02)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live Platform Impact</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
              Real numbers. <span className="text-gradient">Real change.</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              Every drive, every volunteer hour, every tree — tracked and measured in real time.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {liveImpact.map(({ value, label, suffix, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -5, scale: 1.03 }}
                className="card rounded-2xl p-5 text-center hover:border-green-500/30 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border ${bg} ${color}`}>
                  <Icon size={18} />
                </div>
                <div className={`text-2xl font-black mb-1 ${color}`}>
                  <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Community Needs Report ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto" ref={reportRef}>
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Gemini AI · Community Intelligence</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
              What your community <span className="text-gradient">needs most</span>
            </h2>
            <p className="mt-3 max-w-lg mx-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
              AlignSetu gathers scattered NGO data and uses Gemini AI to surface the most urgent local environmental needs — in real time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.25)', background: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.02)' }}
          >
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.08)' }}>
              <motion.div
                animate={reportLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: reportLoading ? Infinity : 0, ease: 'linear' }}
                className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"
              >
                <Sparkles size={15} className="text-purple-400" />
              </motion.div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Community Needs Report</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generated from {demoDrives.length} active drives · Updated live</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </div>
            </div>

            <div className="p-6">
              {reportLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full shrink-0" />
                    <span className="text-sm text-purple-400">Gemini is analyzing community data...</span>
                  </div>
                  {[90, 70, 80].map((w, i) => (
                    <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="h-4 rounded-lg" style={{ width: `${w}%`, background: 'var(--border)' }} />
                  ))}
                </div>
              )}

              {!reportLoading && communityReport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <AlertTriangle size={16} className="text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{communityReport.headline}</p>
                  </div>

                  {communityReport.topNeeds?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Top Community Needs</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {communityReport.topNeeds.map((need, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl text-center"
                            style={{
                              background: need.urgencyLevel === 'high' ? 'rgba(239,68,68,0.07)' : need.urgencyLevel === 'medium' ? 'rgba(234,179,8,0.07)' : 'rgba(34,197,94,0.07)',
                              border: `1px solid ${need.urgencyLevel === 'high' ? 'rgba(239,68,68,0.2)' : need.urgencyLevel === 'medium' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}`,
                            }}
                          >
                            <div className="text-2xl mb-2">{need.icon}</div>
                            <p className="text-sm font-bold capitalize mb-1" style={{ color: 'var(--text-primary)' }}>{need.need}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{need.count} active drive{need.count !== 1 ? 's' : ''}</p>
                            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                              need.urgencyLevel === 'high' ? 'bg-red-500/15 text-red-400' :
                              need.urgencyLevel === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                              'bg-green-500/15 text-green-400'
                            }`}>{need.urgencyLevel} urgency</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {communityReport.urgentAreas?.length > 0 && (
                      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={13} className="text-red-400" />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Areas Needing Help</p>
                        </div>
                        <div className="space-y-2">
                          {communityReport.urgentAreas.map((area, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={13} className="text-green-400" />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>AI Insight</p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{communityReport.insight}</p>
                    </div>
                  </div>

                  {communityReport.recommendedAction && (
                    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <Zap size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-400 mb-1">Recommended Action</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{communityReport.recommendedAction}</p>
                      </div>
                      <Link to="/auth?role=volunteer" className="ml-auto shrink-0 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-black text-xs font-bold transition-colors whitespace-nowrap">
                        Join Now
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {!reportLoading && !communityReport && (
                <div className="text-center py-6">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Community report unavailable — sign in to see live data</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{ background: isDark ? 'rgba(34,197,94,0.07)' : '#f0fdf4', border: '1px solid rgba(34,197,94,0.25)' }}>
            <motion.div animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }} transition={{ duration: 7, repeat: Infinity }}
              className="absolute w-64 h-64 bg-green-500 rounded-full blur-3xl -top-20 -right-20 orb pointer-events-none" />
            <div className="relative z-10">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="inline-block mb-4">
                <Leaf size={44} className="text-green-500" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
                Ready to make a <span className="text-gradient">difference?</span>
              </h2>
              <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Join thousands of volunteers and NGOs already coordinating environmental action on AlignSetu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/auth?role=ngo"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-green-500/25">
                    <Shield size={18} /> Register your NGO <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/auth?role=volunteer"
                    className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <Users size={18} /> Volunteer Now
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Leaf size={16} className="text-black" />
              </div>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>AlignSetu</span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              {['Features', 'Impact', 'About'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-green-500 transition-colors">{item}</a>
              ))}
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 AlignSetu · Built for Google Solution Challenge</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by Gemini AI · Firebase · Google Maps</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
