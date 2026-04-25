import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Sparkles, Zap, Users, Clock, Target, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { analyzeDrive } from '../services/gemini'
import AIResultPanel from './AIResultPanel'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

async function geocodeLocation(address) {
  if (!MAPS_API_KEY || !address) return null
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`
    )
    const data = await res.json()
    if (data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
  } catch {}
  return null
}

const STEPS = ['describe', 'ai-review', 'details']

export default function CreateDriveModal({ open, onClose, onSubmit }) {
  const [step, setStep] = useState('describe') // describe → ai-review → details
  const [form, setForm] = useState({ title: '', description: '', location: '', estimatedVolunteers: '', date: '' })
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) {
      // Reset on close
      setStep('describe')
      setForm({ title: '', description: '', location: '', estimatedVolunteers: '', date: '' })
      setAiResult(null)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Step 1 → 2: Run Gemini analysis
  const handleAnalyze = async () => {
    if (!form.description.trim() || form.description.trim().length < 20) {
      return toast.error('Write at least 20 characters describing the drive')
    }
    setAiLoading(true)
    setStep('ai-review')
    try {
      const result = await analyzeDrive(form.description)
      setAiResult(result)
      // Auto-fill fields from AI
      setForm(f => ({
        ...f,
        estimatedVolunteers: f.estimatedVolunteers || String(result.estimatedVolunteers || ''),
      }))
    } catch {
      toast.error('AI analysis failed — fill in details manually')
      setAiResult(null)
    } finally {
      setAiLoading(false)
    }
  }

  // Step 2 → 3
  const handleProceedToDetails = () => {
    setStep('details')
  }

  // Final submit
  const handleSubmit = async () => {
    if (!form.title || !form.location || !form.estimatedVolunteers) {
      return toast.error('Fill in title, location, and volunteer count')
    }
    setSubmitting(true)
    const coords = await geocodeLocation(form.location)
    onSubmit({
      ...form,
      estimatedVolunteers: parseInt(form.estimatedVolunteers) || 20,
      // Merge AI-analyzed fields
      ...(aiResult ? {
        category: aiResult.category,
        urgency: aiResult.urgency,
        requiredSkills: aiResult.requiredSkills,
        duration: aiResult.duration,
        impactScore: aiResult.impactScore,
        aiSummary: aiResult.summary,
        actionItems: aiResult.actionItems,
      } : {}),
      ...(coords || {}),
    })
    setSubmitting(false)
    onClose()
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="card rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Create New Drive</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  {['Describe', 'AI Review', 'Details'].map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                        i < stepIndex ? 'text-green-400' : i === stepIndex ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {i < stepIndex
                          ? <CheckCircle2 size={11} className="text-green-400" />
                          : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${i === stepIndex ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>{i + 1}</span>
                        }
                        {label}
                      </div>
                      {i < 2 && <ChevronRight size={10} className="text-gray-600" />}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-green-500/10" style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">

                {/* ── STEP 1: Describe ── */}
                {step === 'describe' && (
                  <motion.div key="describe" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <Sparkles size={15} className="text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Describe your environmental drive in detail. <span className="text-green-400 font-semibold">Gemini AI</span> will automatically analyze it — setting category, urgency, required skills, volunteer count, and action items.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Describe your drive <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g. We want to clean the Yamuna riverbank near ITO, Delhi. The area has accumulated plastic waste and industrial debris. We need volunteers who can carry waste bags, sort recyclables, and document the cleanup with photos for our impact report..."
                        rows={6}
                        className="input-field px-4 py-3 text-sm resize-none w-full"
                        autoFocus
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs" style={{ color: form.description.length < 20 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                          {form.description.length < 20 ? `${20 - form.description.length} more characters needed` : '✓ Ready for AI analysis'}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.description.length} chars</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={form.description.trim().length < 20}
                      className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                    >
                      <Sparkles size={16} /> Analyze with Gemini AI
                      <ChevronRight size={15} />
                    </motion.button>
                  </motion.div>
                )}

                {/* ── STEP 2: AI Review ── */}
                {step === 'ai-review' && (
                  <motion.div key="ai-review" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                    <AIResultPanel result={aiResult} loading={aiLoading} />

                    {!aiLoading && aiResult && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          AI has pre-filled your drive details. Review and proceed.
                        </p>

                        {/* Quick editable fields */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Target size={11} className="text-green-400" />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Category</span>
                            </div>
                            <span className="text-sm font-semibold capitalize text-green-400">{aiResult.category?.replace('_', ' ')}</span>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Zap size={11} className="text-orange-400" />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Urgency</span>
                            </div>
                            <span className={`text-sm font-semibold capitalize ${
                              aiResult.urgency === 'critical' ? 'text-red-400' :
                              aiResult.urgency === 'high' ? 'text-orange-400' :
                              aiResult.urgency === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                            }`}>{aiResult.urgency}</span>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users size={11} className="text-purple-400" />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Volunteers</span>
                            </div>
                            <span className="text-sm font-semibold text-purple-400">{aiResult.estimatedVolunteers}</span>
                          </div>
                          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock size={11} className="text-blue-400" />
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Duration</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-400">{aiResult.duration}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => { setStep('describe'); setAiResult(null) }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-colors"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
                          >
                            <RotateCcw size={13} /> Re-analyze
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleProceedToDetails}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                          >
                            Looks good — Add Details <ChevronRight size={14} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {!aiLoading && !aiResult && (
                      <div className="space-y-2">
                        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>AI analysis unavailable — fill in details manually</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleProceedToDetails}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black transition-all"
                        >
                          Continue Manually <ChevronRight size={14} />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 3: Details ── */}
                {step === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                    {aiResult && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                        <p className="text-xs text-green-400">AI analysis applied — category, urgency, skills auto-filled</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Drive Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Yamuna River Cleanup Drive"
                        className="input-field px-4 py-3 text-sm w-full"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-sm mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Location <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. Yamuna Ghat, Delhi"
                        className="input-field px-4 py-3 text-sm w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Volunteers Needed <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number" min="1"
                          value={form.estimatedVolunteers}
                          onChange={e => setForm({ ...form, estimatedVolunteers: e.target.value })}
                          placeholder={aiResult ? String(aiResult.estimatedVolunteers) : 'e.g. 25'}
                          className="input-field px-4 py-3 text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Drive Date <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={e => setForm({ ...form, date: e.target.value })}
                          className="input-field px-4 py-3 text-sm w-full"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                    >
                      {submitting
                        ? <><Loader2 size={16} className="animate-spin" /> Publishing...</>
                        : <><Send size={16} /> Publish Drive</>
                      }
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
