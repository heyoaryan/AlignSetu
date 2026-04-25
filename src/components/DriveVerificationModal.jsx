import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, Image, TreePine, Trash2, Droplets, Users,
  MapPin, Sparkles, CheckCircle2, Loader2, Camera, FileCheck
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

async function generateImpactSummary(drive, impact) {
  const prompt = `
You are AlignSetu AI. Generate a short, inspiring impact report for a completed environmental drive.
Drive: "${drive.title}" (${drive.category})
Location: ${drive.location}
Impact Data:
- Volunteers attended: ${impact.volunteersAttended}
- Trees planted: ${impact.treesPlanted}
- Waste collected: ${impact.wasteCollected} kg
- Area covered: ${impact.areaCovered} sq meters
- Notes: ${impact.notes || 'None'}

Return a JSON object with:
- headline: one powerful sentence (max 12 words)
- summary: 2-sentence impact summary
- highlights: array of 3 short achievement strings
- impactScore: number 1-10

Respond ONLY with valid JSON.
`
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    })
    const data = await res.json()
    const text = data.candidates[0].content.parts[0].text
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  } catch {
    return {
      headline: `${drive.title} completed successfully!`,
      summary: `${impact.volunteersAttended} volunteers came together to make a real difference. This drive created lasting environmental impact in the community.`,
      highlights: [
        `${impact.treesPlanted} trees planted for a greener future`,
        `${impact.wasteCollected}kg of waste responsibly removed`,
        `${impact.areaCovered} sq meters of area restored`,
      ],
      impactScore: 8,
    }
  }
}

export default function DriveVerificationModal({ open, onClose, drive, onSubmit }) {
  const { isDark } = useTheme()
  const fileInputRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [dragging, setDragging] = useState(false)
  const [impact, setImpact] = useState({
    volunteersAttended: drive?.volunteersJoined || '',
    treesPlanted: '',
    wasteCollected: '',
    areaCovered: '',
    notes: '',
  })
  const [aiResult, setAiResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1) // 1: photos+impact, 2: ai result

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    valid.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => prev.length < 6 ? [...prev, { url: e.target.result, name: file.name }] : prev)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const removePhoto = (i) => setPhotos(p => p.filter((_, idx) => idx !== i))

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const result = await generateImpactSummary(drive, impact)
    setAiResult(result)
    setAnalyzing(false)
    setStep(2)
  }

  const handleSubmit = () => {
    onSubmit?.({ impact, photos: photos.map(p => p.url), aiResult })
    setSubmitted(true)
    setTimeout(() => {
      onClose()
      // reset
      setPhotos([])
      setImpact({ volunteersAttended: drive?.volunteersJoined || '', treesPlanted: '', wasteCollected: '', areaCovered: '', notes: '' })
      setAiResult(null)
      setStep(1)
      setSubmitted(false)
    }, 1800)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setPhotos([])
      setImpact({ volunteersAttended: drive?.volunteersJoined || '', treesPlanted: '', wasteCollected: '', areaCovered: '', notes: '' })
      setAiResult(null)
      setStep(1)
      setSubmitted(false)
    }, 300)
  }

  if (!drive) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: isDark ? 'rgba(13,17,23,0.98)' : 'rgba(255,255,255,0.99)',
                border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.25)'}`,
                boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
                  <FileCheck size={18} className="text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Drive Verification</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by</span>
                    <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #4285F4, #9B72CB, #D96570)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gemini AI</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+</span>
                    <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AlignSetu</span>
                  </div>
                </div>
                {/* Steps */}
                <div className="ml-auto flex items-center gap-2 mr-3">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step >= s ? 'bg-green-500 text-black' : 'text-secondary border border-theme'
                      }`} style={step < s ? { background: 'var(--bg-card)' } : {}}>
                        {step > s ? <CheckCircle2 size={13} /> : s}
                      </div>
                      {s < 2 && <div className={`w-6 h-0.5 rounded-full transition-all ${step > s ? 'bg-green-500' : 'bg-gray-700'}`} />}
                    </div>
                  ))}
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Drive title pill */}
              <div className="px-6 pt-4 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <MapPin size={13} className="text-green-400 shrink-0" />
                  <span className="text-sm font-semibold text-green-400 truncate">{drive.title}</span>
                  <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{drive.location}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                {/* ── STEP 1 ── */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

                    {/* Photo Upload */}
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Camera size={13} className="text-green-400" /> Verification Photos
                        <span className="ml-auto font-normal" style={{ color: 'var(--text-muted)' }}>{photos.length}/6</span>
                      </p>

                      {/* Drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => photos.length < 6 && fileInputRef.current?.click()}
                        className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center py-6"
                        style={{
                          borderColor: dragging ? '#22c55e' : 'var(--border)',
                          background: dragging ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)',
                        }}
                      >
                        <Upload size={20} className={dragging ? 'text-green-400' : 'text-gray-500'} />
                        <p className="text-sm mt-2" style={{ color: dragging ? '#4ade80' : 'var(--text-muted)' }}>
                          {dragging ? 'Drop photos here' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG — max 6 photos</p>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                      </div>

                      {/* Photo previews */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {photos.map((p, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                              className="relative rounded-xl overflow-hidden aspect-video group">
                              <img src={p.url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => removePhoto(i)} className="p-1.5 bg-red-500/80 rounded-lg">
                                  <Trash2 size={13} className="text-white" />
                                </button>
                              </div>
                              <div className="absolute bottom-1 left-1 text-xs bg-black/60 px-1.5 py-0.5 rounded text-white">
                                <Image size={10} className="inline mr-1" />{i + 1}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Impact Metrics */}
                    <div>
                      <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Sparkles size={13} className="text-green-400" /> Impact Metrics
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'volunteersAttended', label: 'Volunteers Attended', icon: Users, placeholder: '0', color: 'text-purple-400', unit: 'people' },
                          { key: 'treesPlanted', label: 'Trees Planted', icon: TreePine, placeholder: '0', color: 'text-green-400', unit: 'trees' },
                          { key: 'wasteCollected', label: 'Waste Collected', icon: Trash2, placeholder: '0', color: 'text-blue-400', unit: 'kg' },
                          { key: 'areaCovered', label: 'Area Covered', icon: MapPin, placeholder: '0', color: 'text-orange-400', unit: 'sq m' },
                        ].map(({ key, label, icon: Icon, placeholder, color, unit }) => (
                          <div key={key} className="rounded-xl p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Icon size={13} className={color} />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={impact[key]}
                                onChange={e => setImpact(p => ({ ...p, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className="flex-1 bg-transparent text-lg font-black outline-none w-0"
                                style={{ color: 'var(--text-primary)' }}
                              />
                              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      <div className="mt-3">
                        <textarea
                          rows={2}
                          value={impact.notes}
                          onChange={e => setImpact(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Any additional notes about the drive outcome..."
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none input-field"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2 — AI Impact Report ── */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

                    {analyzing ? (
                      <div className="rounded-2xl p-6" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
                          <span className="text-sm font-medium text-green-400">Gemini AI analyzing impact...</span>
                        </div>
                        <motion.div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(34,197,94,0.15)' }}>
                          <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'easeInOut' }}
                            className="h-full bg-green-500 rounded-full" />
                        </motion.div>
                        {[70, 50, 85].map((w, i) => (
                          <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            className="h-3 rounded-lg mt-3" style={{ width: `${w}%`, background: 'var(--border)' }} />
                        ))}
                      </div>
                    ) : aiResult && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                        {/* Headline */}
                        <div className="rounded-2xl p-5 text-center relative overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))', border: '1px solid rgba(34,197,94,0.25)' }}>
                          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
                          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                            className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={22} className="text-green-400" />
                          </motion.div>
                          <p className="text-base font-black mb-2" style={{ color: 'var(--text-primary)' }}>{aiResult.headline}</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiResult.summary}</p>
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Impact Score</span>
                            <span className="text-lg font-black text-green-400">{aiResult.impactScore}/10</span>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-2">
                          {aiResult.highlights?.map((h, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                              <div className="w-5 h-5 bg-green-500/15 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle2 size={11} className="text-green-400" />
                              </div>
                              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{h}</span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Metrics summary */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Volunteers', value: impact.volunteersAttended || 0, icon: Users, color: 'text-purple-400' },
                            { label: 'Trees', value: impact.treesPlanted || 0, icon: TreePine, color: 'text-green-400' },
                            { label: 'Waste (kg)', value: impact.wasteCollected || 0, icon: Trash2, color: 'text-blue-400' },
                            { label: 'Area (m²)', value: impact.areaCovered || 0, icon: MapPin, color: 'text-orange-400' },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                              <Icon size={14} className={`${color} mx-auto mb-1`} />
                              <p className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Photos count */}
                        {photos.length > 0 && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <Camera size={14} className="text-green-400" />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{photos.length} verification photo{photos.length > 1 ? 's' : ''} attached</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
                {step === 2 && !analyzing && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border-theme card"
                    style={{ color: 'var(--text-secondary)' }}>
                    Back
                  </motion.button>
                )}
                <div className="flex-1" />
                {step === 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAnalyze}
                    disabled={!impact.volunteersAttended}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                  >
                    <Sparkles size={14} /> Analyze with AI
                  </motion.button>
                ) : !analyzing && (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitted}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                  >
                    {submitted
                      ? <><CheckCircle2 size={14} /> Verified!</>
                      : <><FileCheck size={14} /> Submit Verification</>
                    }
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
