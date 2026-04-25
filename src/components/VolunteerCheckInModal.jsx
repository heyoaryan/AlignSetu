import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Camera, Upload, CheckCircle, MapPin, Clock, Users,
  Zap, Image, Trash2, Send, Star, MessageSquare, Loader2, Sparkles
} from 'lucide-react'
import { doc, updateDoc, db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { generateCheckInThankYou } from '../services/gemini'
import toast from 'react-hot-toast'

// Convert file to base64 data URL (mock "upload")
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

export default function VolunteerCheckInModal({ drive, open, onClose, onSubmit }) {
  const { currentUser } = useAuth()
  const fileInputRef = useRef(null)

  const [photos, setPhotos] = useState([])        // { url, name, size }
  const [note, setNote] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState('form')         // 'form' | 'success'
  const [aiThankYou, setAiThankYou] = useState(null)

  if (!open || !drive) return null

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) {
      toast.error('Max 5 photos allowed')
      return
    }
    const newPhotos = await Promise.all(
      files.map(async (f) => ({
        url: await fileToDataUrl(f),
        name: f.name,
        size: (f.size / 1024).toFixed(0) + ' KB',
      }))
    )
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (photos.length === 0) return toast.error('Please upload at least 1 photo')
    setSubmitting(true)
    try {
      const submission = {
        volunteerId: currentUser.uid,
        volunteerName: currentUser.displayName || currentUser.email?.split('@')[0],
        photos: photos.map(p => ({ name: p.name, size: p.size, url: p.url })),
        note: note.trim(),
        rating,
        submittedAt: new Date().toISOString(),
        status: 'pending', // NGO will verify
      }

      // Save to drive's volunteerSubmissions array
      const existing = drive.volunteerSubmissions || []
      // Remove old submission from same volunteer if exists
      const filtered = existing.filter(s => s.volunteerId !== currentUser.uid)
      await updateDoc(doc(db, 'drives', drive.id), {
        volunteerSubmissions: [...filtered, submission],
      })

      setStep('success')
      onSubmit?.(submission)
      // Generate AI thank-you in background
      generateCheckInThankYou({
        driveName: drive.title,
        category: drive.category,
        photosCount: photos.length,
        note: note.trim(),
        rating,
      }).then(ty => setAiThankYou(ty)).catch(() => {})
    } catch {
      toast.error('Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setPhotos([])
    setNote('')
    setRating(0)
    setStep('form')
    setAiThankYou(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="font-bold text-primary">Drive Check-In</h2>
                <p className="text-xs text-secondary mt-0.5 truncate max-w-xs">{drive.title}</p>
              </div>
              <button onClick={handleClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <AnimatePresence mode="wait">

              {/* ── FORM ── */}
              {step === 'form' && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

                  {/* Drive info strip */}
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                    <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{drive.location || 'Location TBD'}</p>
                      <p className="text-xs text-muted">{drive.duration || '2 hours'} · {drive.category?.replace('_', ' ')}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
                      Active
                    </span>
                  </div>

                  {/* Photo upload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Camera size={14} className="text-green-400" />
                        Upload Photos
                        <span className="text-xs text-muted font-normal">(required, max 5)</span>
                      </label>
                      <span className="text-xs text-muted">{photos.length}/5</span>
                    </div>

                    {/* Drop zone */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                      style={{ borderColor: 'var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e55'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <Upload size={22} className="text-muted mx-auto mb-2" />
                      <p className="text-sm text-secondary">Click to upload photos</p>
                      <p className="text-xs text-muted mt-1">JPG, PNG, WEBP · Max 5MB each</p>
                    </motion.div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Photo previews */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {photos.map((p, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-xl overflow-hidden aspect-square group">
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => removePhoto(i)}
                                className="p-1.5 rounded-lg bg-red-500/80 text-white">
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/50 rounded px-1 truncate">
                              {p.size}
                            </div>
                          </motion.div>
                        ))}
                        {photos.length < 5 && (
                          <motion.div whileHover={{ scale: 1.03 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}>
                            <Image size={20} className="text-muted" />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-blue-400" />
                      Your Note
                      <span className="text-xs text-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Share your experience, what you did, any observations..."
                      rows={3}
                      className="input-field w-full px-4 py-3 text-sm resize-none"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
                      <Star size={14} className="text-yellow-400" />
                      Rate this Drive
                      <span className="text-xs text-muted font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <motion.button
                          key={n}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              n <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </motion.button>
                      ))}
                      {rating > 0 && (
                        <span className="text-xs text-secondary ml-2">
                          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting || photos.length === 0}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000' }}
                  >
                    {submitting
                      ? <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                      : <><Send size={15} /> Submit Check-In</>
                    }
                  </motion.button>
                </motion.div>
              )}

              {/* ── SUCCESS ── */}
              {step === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle size={32} className="text-green-400" />
                  </motion.div>

                  {/* AI Thank-you or fallback */}
                  <AnimatePresence mode="wait">
                    {aiThankYou ? (
                      <motion.div key="ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <Sparkles size={12} className="text-purple-400" />
                          <span className="text-xs font-bold" style={{ background: 'linear-gradient(90deg, #a78bfa, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AlignSetu AI
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">{aiThankYou.headline}</h3>
                        <p className="text-sm text-secondary mb-2">{aiThankYou.message}</p>
                        <p className="text-xs text-green-400 mb-5 italic">{aiThankYou.impactLine}</p>
                      </motion.div>
                    ) : (
                      <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-lg font-bold text-primary mb-2">Check-In Submitted!</h3>
                        <p className="text-sm text-secondary mb-1">
                          Your photos and note have been sent to the NGO for verification.
                        </p>
                        <p className="text-xs text-muted mb-5">
                          Once verified, this will appear in your Past Drives and the NGO's impact report.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-center gap-3 text-xs text-secondary mb-6">
                    <span className="flex items-center gap-1"><Image size={12} className="text-green-400" /> {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
                    {note && <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-400" /> Note added</span>}
                    {rating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" /> {rating}/5 stars</span>}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all"
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
