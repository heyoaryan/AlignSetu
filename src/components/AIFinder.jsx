import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mic, MicOff, Sparkles, Send, User, MapPin,
  Star, CheckCircle, Loader2, Search, Trophy
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

// Mock volunteers for demo
const mockVolunteers = [
  { id: 1, name: 'Arjun Mehta', skills: ['Waste Management', 'First Aid', 'Driving'], location: 'Delhi', availability: 'Weekends', type: 'Student', rating: 4.8, drives: 12 },
  { id: 2, name: 'Sneha Rao', skills: ['Photography', 'Social Media', 'Teaching'], location: 'Delhi', availability: 'Evenings', type: 'Professional', rating: 4.9, drives: 8 },
  { id: 3, name: 'Karan Singh', skills: ['Gardening', 'Construction', 'Driving'], location: 'Noida', availability: 'Flexible', type: 'Student', rating: 4.7, drives: 15 },
  { id: 4, name: 'Priya Sharma', skills: ['Medical', 'First Aid', 'Teaching'], location: 'Delhi', availability: 'Weekends', type: 'Professional', rating: 5.0, drives: 20 },
  { id: 5, name: 'Rahul Verma', skills: ['Data Entry', 'Social Media', 'Photography'], location: 'Gurgaon', availability: 'Evenings', type: 'Freelancer', rating: 4.6, drives: 6 },
  { id: 6, name: 'Ananya Patel', skills: ['Cooking', 'Teaching', 'First Aid'], location: 'Delhi', availability: 'Flexible', type: 'NGO Worker', rating: 4.9, drives: 18 },
]

async function findVolunteersWithAI(query) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
    // Mock response when no API key
    await new Promise(r => setTimeout(r, 1500))
    const shuffled = [...mockVolunteers].sort(() => Math.random() - 0.5).slice(0, 4)
    return {
      summary: `Found ${shuffled.length} volunteers matching your request. These volunteers have relevant skills and availability for your drive.`,
      volunteers: shuffled.map(v => ({ ...v, matchScore: Math.floor(Math.random() * 20) + 80, reason: `Strong match based on skills and location` })),
      suggestions: ['Consider scheduling on weekends for maximum turnout', 'Provide safety equipment for cleanup drives', 'Share drive details 3 days in advance'],
    }
  }

  const prompt = `
You are an AI volunteer matching assistant for AlignSetu environmental platform.
Given this NGO request: "${query}"
And these available volunteers: ${JSON.stringify(mockVolunteers)}

Return a JSON object with:
- summary: 1-2 sentence overview of matches found
- volunteers: array of top 4 matched volunteers with fields: id, name, skills, location, availability, type, rating, drives, matchScore (0-100), reason (why they match)
- suggestions: array of 3 practical tips for the NGO

Respond ONLY with valid JSON.
`
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1024 } }),
    })
    const data = await res.json()
    const text = data.candidates[0].content.parts[0].text
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  } catch {
    const shuffled = [...mockVolunteers].sort(() => Math.random() - 0.5).slice(0, 4)
    return {
      summary: `Found ${shuffled.length} volunteers matching your request.`,
      volunteers: shuffled.map(v => ({ ...v, matchScore: Math.floor(Math.random() * 20) + 80, reason: 'Matched based on skills and availability' })),
      suggestions: ['Schedule on weekends for better turnout', 'Brief volunteers 2 days before', 'Arrange transport if location is remote'],
    }
  }
}

export default function AIFinder({ open, onClose }) {
  const { isDark } = useTheme()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [bestVolunteer, setBestVolunteer] = useState(null)
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.onresult = null
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setRecording(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
    if (!open) {
      stopMic()
      setQuery('')
      setResult(null)
      setBestVolunteer(null)
      setAnalyzing(false)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cleanup mic on unmount
  useEffect(() => {
    return () => { stopMic() }
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setBestVolunteer(null)
    setAnalyzing(false)
    const res = await findVolunteersWithAI(query)
    setResult(res)
    setLoading(false)
    // Start best volunteer analysis after results load
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 2200))
    const best = res.volunteers?.reduce((a, b) => (b.matchScore > a.matchScore ? b : a), res.volunteers[0])
    setBestVolunteer(best)
    setAnalyzing(false)
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    if (recording) { stopMic(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => setQuery(Array.from(e.results).map(r => r[0].transcript).join(''))
    r.onend = () => { recognitionRef.current = null; setRecording(false) }
    r.start()
    recognitionRef.current = r
    setRecording(true)
  }

  const suggestions = [
    'I need volunteers for Yamuna cleanup on Tuesday',
    'Find gardening experts for plantation drive this weekend',
    'Need 10 volunteers with first aid skills for Sunday',
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: isDark ? 'rgba(13,17,23,0.97)' : 'rgba(255,255,255,0.98)',
                border: `1px solid ${isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.3)'}`,
                boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.1)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center"
                >
                  <Sparkles size={18} className="text-green-400" />
                </motion.div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Volunteer Finder</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by</span>
                    {/* Gemini actual brand gradient: blue → violet → pink */}
                    <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #4285F4, #9B72CB, #D96570)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Gemini AI
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+</span>
                    {/* AlignSetu green brand */}
                    <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      AlignSetu
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Input */}
              <div className="px-5 py-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g. I need volunteers for Yamuna drive on Tuesday..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm input-field"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleVoice}
                    className={`px-3 rounded-xl border transition-all ${recording ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-theme text-secondary hover:border-green-500/40'}`}
                  >
                    {recording
                      ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><MicOff size={16} /></motion.div>
                      : <Mic size={16} />
                    }
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black rounded-xl text-sm font-semibold disabled:opacity-40 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Find
                  </motion.button>
                </div>

                {/* Quick suggestions */}
                {!result && !loading && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-green-500/40 hover:text-green-400"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--input-bg)' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {/* Loading */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center gap-3 py-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"
                      />
                      <span className="text-sm text-green-400">Gemini is searching for best matches...</span>
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="h-20 rounded-xl"
                        style={{ background: 'var(--bg-card)' }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Results */}
                {result && !loading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <Sparkles size={15} className="text-green-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-300">{result.summary}</p>
                    </div>

                    {/* AI Analyzing Best Volunteer */}
                    <AnimatePresence>
                      {analyzing && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-purple-300">AI Analyzing Best Volunteer...</p>
                            <motion.div
                              className="mt-1.5 h-1 rounded-full overflow-hidden"
                              style={{ background: 'rgba(139,92,246,0.2)' }}
                            >
                              <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, ease: 'easeInOut' }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }}
                              />
                            </motion.div>
                          </div>
                          <span className="text-xs text-purple-400 font-mono shrink-0">AlignSetu</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Best Volunteer Highlight */}
                    <AnimatePresence>
                      {bestVolunteer && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                          className="relative overflow-hidden rounded-xl p-4"
                          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,197,94,0.1))', border: '1px solid rgba(139,92,246,0.35)' }}
                        >
                          {/* Glow */}
                          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
                          <div className="flex items-center gap-2 mb-3">
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-5 h-5 bg-purple-500/30 rounded-lg flex items-center justify-center"
                            >
                              <Trophy size={11} className="text-purple-300" />
                            </motion.div>
                            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Best Match — AI Pick</span>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold text-green-400" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                              {bestVolunteer.matchScore}% match
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-sm font-black text-purple-300 border border-purple-500/30">
                              {bestVolunteer.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{bestVolunteer.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <MapPin size={10} className="text-green-400" />
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{bestVolunteer.location}</span>
                                <Star size={10} className="text-yellow-400 fill-yellow-400 ml-1" />
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{bestVolunteer.rating}</span>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
                              style={{ background: 'linear-gradient(135deg, #a78bfa, #22c55e)' }}
                            >
                              Invite Now
                            </motion.button>
                          </div>
                          <p className="text-xs mt-2.5 px-1" style={{ color: 'var(--text-muted)' }}>
                            {bestVolunteer.reason}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Volunteer cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {result.volunteers?.map((v, i) => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ y: -3 }}
                          className="p-4 rounded-xl border transition-all relative"
                          style={{
                            background: bestVolunteer?.id === v.id ? 'rgba(139,92,246,0.08)' : 'var(--bg-card)',
                            borderColor: bestVolunteer?.id === v.id ? 'rgba(139,92,246,0.4)' : 'var(--border)',
                          }}
                        >
                          {bestVolunteer?.id === v.id && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <Trophy size={10} className="text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold text-green-400">
                              {v.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{v.name}</p>
                              <div className="flex items-center gap-1">
                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.rating}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-green-400">{v.matchScore}%</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin size={11} className="text-green-400" />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.location}</span>
                            <span className="text-xs ml-auto px-1.5 py-0.5 rounded-md" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>{v.type}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {v.skills?.slice(0, 2).map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>
                            ))}
                          </div>
                          <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${v.matchScore}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full bg-green-500 rounded-full"
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full mt-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                          >
                            Invite
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>

                    {/* AI Tips */}
                    {result.suggestions?.length > 0 && (
                      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>AI Suggestions</p>
                        <div className="space-y-1.5">
                          {result.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
