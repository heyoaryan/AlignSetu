import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, Phone, FileText, ChevronRight, CheckCircle2,
  MapPin, Heart, Droplets, Trash2, TreePine, Recycle,
  Mic, MicOff, Send, ArrowLeft, Sparkles, X,
  Navigation, Loader2, Camera, ImagePlus, Zap, AlertTriangle, MessageSquare
} from 'lucide-react'
import { addDoc, collection, db, getDoc, doc } from '../config/firebase'
import { analyzePublicNeed, analyzeNeedPhoto } from '../services/gemini'
import toast from 'react-hot-toast'

const NEED_CATEGORIES = [
  { value: 'cleanup', label: 'Safai / Cleanup', icon: Trash2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { value: 'plantation', label: 'Ped Lagao / Plantation', icon: TreePine, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { value: 'water', label: 'Paani / Water Issue', icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { value: 'recycling', label: 'Recycling / Kachra', icon: Recycle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { value: 'health', label: 'Swasthya / Health', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { value: 'other', label: 'Kuch Aur / Other', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Thoda Zaruri', emoji: '🟡', desc: 'Kuch dino mein ho jaye' },
  { value: 'medium', label: 'Zaruri', emoji: '🟠', desc: 'Jaldi hona chahiye' },
  { value: 'high', label: 'Bahut Zaruri', emoji: '🔴', desc: 'Abhi zarurat hai' },
]

// ── Location Input with GPS detect ─────────────────────────
function LocationInput({ value, onChange }) {
  const [detecting, setDetecting] = useState(false)

  const detect = () => {
    if (!navigator.geolocation) return toast.error('GPS is not supported on this device')
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          // Reverse geocode using free Nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          )
          const data = await res.json()
          const addr = data.address || {}
          // Build a readable location string
          const parts = [
            addr.neighbourhood || addr.suburb || addr.village,
            addr.city || addr.town || addr.county,
            addr.state,
          ].filter(Boolean)
          const locationStr = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          onChange(locationStr)
          toast.success('Location detect ho gayi!')
        } catch {
          // Fallback to coordinates
          onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
          toast.success('Location detect ho gayi!')
        } finally {
          setDetecting(false)
        }
      },
      (err) => {
        setDetecting(false)
        if (err.code === 1) toast.error('Location permission denied. Please allow access.')
        else toast.error('Location detect nahi hua, manually likhein')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Mohalla, Colony, City..."
          className="w-full rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      </div>
      {/* GPS detect button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={detect}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
        style={{
          background: detecting ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.25)',
          color: '#4ade80',
        }}
      >
        {detecting ? (
          <><Loader2 size={15} className="animate-spin" /> Detect ho raha hai… / Detecting…</>
        ) : (
          <><Navigation size={15} /> Current Location Detect Karein / Use My Location</>
        )}
      </motion.button>
    </div>
  )
}

// ── Photo Preview + AI Result Card ─────────────────────────
function PhotoPreviewCard({ photo, photoAI, photoAnalyzing, onRemove }) {
  const urgencyColor = {
    high: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', emoji: '🔴' },
    medium: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', emoji: '🟠' },
    low: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', emoji: '🟡' },
  }
  const uc = urgencyColor[photoAI?.urgency] || urgencyColor.medium

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      {/* Photo preview */}
      <div className="relative">
        <img src={photo.preview} alt="Uploaded" className="w-full h-44 object-cover" />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
          <X size={14} />
        </button>
        {/* Analyzing overlay */}
        {photoAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.65)' }}>
            <span className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-2" />
            <p className="text-white text-xs font-medium">AI analyze kar raha hai…</p>
            <p className="text-gray-400 text-xs">AI is analyzing your photo</p>
          </div>
        )}
      </div>

      {/* AI result */}
      {photoAI && !photoAnalyzing && (
        <div className="p-3 space-y-2">
          {/* What AI sees */}
          <div className="flex items-start gap-2">
            <Zap size={13} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="text-purple-400 font-semibold">AI dekh raha hai: </span>
              {photoAI.whatISee}
            </p>
          </div>

          {/* Urgency badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${uc.bg} ${uc.border}`}>
            <span className="text-base">{uc.emoji}</span>
            <div className="flex-1">
              <p className={`text-xs font-bold ${uc.text}`}>
                AI Urgency: {photoAI.urgency?.toUpperCase()} ({photoAI.confidence}% confident)
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{photoAI.urgencyReason}</p>
            </div>
          </div>

          {/* Not legitimate warning */}
          {photoAI.isLegitimate === false && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10">
              <AlertTriangle size={13} className="text-orange-400 shrink-0" />
              <p className="text-xs text-orange-400">Photo relevant nahi lagti — description zaroor likhein</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PublicIntake() {
  const { ngoId } = useParams()
  const [step, setStep] = useState('intro') // intro → form → success
  const [mode, setMode] = useState(null) // 'form' | 'call'
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    category: '',
    urgency: 'medium',
    description: '',
    landmark: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [ngoName, setNgoName] = useState('AlignSetu NGO')
  const [submittedId, setSubmittedId] = useState(null)
  const [photo, setPhoto] = useState(null)           // { base64, mimeType, preview }
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false)
  const [photoAI, setPhotoAI] = useState(null)
  const [callSmsSent, setCallSmsSent] = useState(false)
  const photoInputRef = useRef(null)

  // ── Voice input ──
  const [voiceLang, setVoiceLang] = useState('hi-IN')
  const [listening, setListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const recognitionRef = useRef(null)

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Is browser mein voice support nahi hai')

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    setLiveTranscript('')
    const r = new SR()
    r.lang = voiceLang
    r.continuous = true
    r.interimResults = true

    let finalText = '' // accumulate final results here only

    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalText += t + ' '
        } else {
          interim += t
        }
      }
      // Show live preview: confirmed text + what's being spoken now
      setLiveTranscript((finalText + interim).trim())
    }

    r.onend = () => {
      setListening(false)
      const committed = finalText.trim()
      if (committed) {
        setForm(f => ({
          ...f,
          description: f.description ? f.description + ' ' + committed : committed
        }))
      }
      setLiveTranscript('')
      finalText = ''
    }

    r.onerror = (e) => {
      setListening(false)
      setLiveTranscript('')
      finalText = ''
      if (e.error === 'not-allowed') toast.error('Microphone permission do — browser settings mein')
      else if (e.error === 'no-speech') toast.error('Kuch suna nahi, dobara bolein')
    }

    r.start()
    recognitionRef.current = r
    setListening(true)
  }

  useEffect(() => {
    if (ngoId) {
      getDoc(doc(db, 'users', ngoId)).then(snap => {
        if (snap.exists()) setNgoName(snap.data()?.displayName || 'AlignSetu NGO')
      }).catch(() => {})
    }
  }, [ngoId])

  // ── Photo upload + AI Vision analysis ──
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('Photo 10MB se chhoti honi chahiye')

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      // dataUrl = "data:image/jpeg;base64,/9j/..."
      const [meta, base64] = dataUrl.split(',')
      const mimeType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg'

      setPhoto({ base64, mimeType, preview: dataUrl })
      setPhotoAI(null)
      setPhotoAnalyzing(true)

      try {
        const result = await analyzeNeedPhoto(base64, mimeType, form.description)
        setPhotoAI(result)
        // Auto-update urgency based on AI vision
        if (result.urgency && result.isLegitimate !== false) {
          setForm(f => ({ ...f, urgency: result.urgency }))
          if (result.urgency === 'high') toast('🔴 AI ne photo dekhi — High urgency detect hua!', { icon: '🤖' })
          else if (result.urgency === 'medium') toast('🟠 AI: Medium urgency', { icon: '🤖' })
          // Also auto-set category if AI is confident
          if (result.category && !form.category) {
            setForm(f => ({ ...f, category: result.category }))
          }
        }
      } catch {
        // Vision failed silently
      } finally {
        setPhotoAnalyzing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoAI(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!form.category) return toast.error('Apni zarurat chuniye')
    if (!form.description.trim() || form.description.trim().length < 10)
      return toast.error('Thoda aur batayein (kam se kam 10 akshar)')
    if (!form.location.trim()) return toast.error('Apni jagah batayein')
    if (!form.name.trim()) return toast.error('Naam zaroori hai / Name is required')
    if (!form.phone.trim()) return toast.error('Phone number zaroori hai / Phone is required')
    if (form.phone.trim().length !== 10) return toast.error('Phone number 10 digits ka hona chahiye')

    setSubmitting(true)
    try {
      // 1. Save the need immediately
      const ref = await addDoc(collection(db, 'publicNeeds'), {
        ngoId,
        name: form.name || 'Anonymous',
        phone: form.phone || '',
        location: form.location,
        landmark: form.landmark,
        category: form.category,
        urgency: form.urgency,
        description: form.description,
        status: 'pending',
        source: 'qr_scan',
        submittedAt: new Date().toISOString(),
        photoPreview: photo?.preview || null,   // store preview for dashboard
        photoAI: photoAI || null,               // vision analysis result
        aiAnalysis: null,
      })
      setSubmittedId(ref.id)
      setStep('success')

      // 2. Run full AI analysis in background
      try {
        const { onSnapshot: snap, query: q, collection: col, where: wh, db: database } = await import('../config/firebase')
        let ngoDrives = []
        await new Promise((resolve) => {
          const unsub = snap(
            q(col(database, 'drives'), wh('ngoId', '==', ngoId)),
            (snapshot) => {
              ngoDrives = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(d => d.status === 'active')
              unsub()
              resolve()
            }
          )
        })
        const aiResult = await analyzePublicNeed(
          { category: form.category, urgency: form.urgency, description: form.description, location: form.location },
          ngoDrives
        )
        const { updateDoc, doc: docRef } = await import('../config/firebase')
        await updateDoc(docRef(database, 'publicNeeds', ref.id), {
          aiAnalysis: aiResult,
          category: aiResult.confirmedCategory || form.category,
          urgency: aiResult.confirmedUrgency || form.urgency,
        })
      } catch { /* silent */ }
    } catch {
      toast.error('Submit nahi hua, dobara try karein')
      setSubmitting(false)
    }
  }

  // ── INTRO SCREEN ──
  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 50%, #0a0f0a 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <Leaf size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{ngoName}</h1>
            <p className="text-green-400 text-sm font-medium">AlignSetu Network</p>
          </div>

          {/* Welcome card */}
          <div className="rounded-2xl p-6 mb-5 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <h2 className="text-white font-bold text-lg mb-2">Namaste! 🙏</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Aap apni <span className="text-green-400 font-semibold">zarurat ya samasya</span> hum tak pahuncha sakte hain.
              Hum aapke area mein sabse sahi NGO ko connect karenge.
            </p>
            <p className="text-gray-500 text-xs mt-2 leading-relaxed">
              Share your <span className="text-green-400/80">need or problem</span> with us.
              We'll connect the right NGO in your area.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setMode('form'); setStep('form') }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-green-500/30 text-left transition-all"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={22} className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Form Bharein</p>
                <p className="text-green-300/70 text-xs font-medium">Fill the Form</p>
                <p className="text-gray-400 text-xs mt-0.5">Apni zarurat likhkar ya bolkar batayein</p>
                <p className="text-gray-600 text-xs">Write or speak your need</p>
              </div>
              <ChevronRight size={18} className="text-green-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setMode('call'); setStep('form') }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-blue-500/30 text-left transition-all"
              style={{ background: 'rgba(59,130,246,0.1)' }}
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={22} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Call Karein</p>
                <p className="text-blue-300/70 text-xs font-medium">Make a Call</p>
                <p className="text-gray-400 text-xs mt-0.5">Seedha baat karein NGO se</p>
                <p className="text-gray-600 text-xs">Talk directly to the NGO</p>
              </div>
              <ChevronRight size={18} className="text-blue-400" />
            </motion.button>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            Powered by AlignSetu • Free & Confidential
          </p>
        </motion.div>
      </div>
    )
  }

  // ── CALL MODE ──
  if (step === 'form' && mode === 'call') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 50%, #0a0f0a 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <button onClick={() => setStep('intro')} className="flex items-center gap-2 text-gray-400 text-sm mb-6 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Wapas jaayein
          </button>

          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${callSmsSent ? 'bg-green-500/20 border-green-500/40' : 'bg-blue-500/20 border-blue-500/40 animate-pulse'}`}>
              {callSmsSent ? <MessageSquare size={36} className="text-green-400" /> : <Phone size={36} className="text-blue-400" />}
            </div>
            <h2 className="text-white font-bold text-xl mb-1">
              {callSmsSent ? 'SMS Bheja Gaya! 📱' : 'Call Karein'}
            </h2>
            <p className="text-gray-400 text-sm">
              {callSmsSent ? 'Aapke number pe SMS aa gaya hoga' : `Seedha ${ngoName} se baat karein`}
            </p>
          </div>

          {/* Call button */}
          {!callSmsSent && (
            <a href="tel:+911800112345"
              onClick={() => {
                // Simulate SMS after call initiated
                setTimeout(() => setCallSmsSent(true), 1500)
              }}
              className="flex items-center justify-center gap-3 w-full text-center text-xl font-black text-white py-4 rounded-2xl border border-blue-500/40 mb-4 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              <Phone size={22} /> 1800-11-2345
            </a>
          )}

          {/* SMS received simulation */}
          <AnimatePresence>
            {callSmsSent && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-4"
              >
                {/* Fake SMS bubble */}
                <div className="rounded-2xl p-4 border border-green-500/25 mb-3"
                  style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-green-500/20 rounded-full flex items-center justify-center">
                      <MessageSquare size={13} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">AlignSetu NGO</p>
                      <p className="text-gray-500 text-xs">SMS • Abhi</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 border border-white/8"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      Namaste! 🙏 Aapki call receive hui.<br />
                      <span className="text-green-400 font-semibold">Behtar response ke liye</span> — apni samasya ki ek photo click karke is link pe bhejein:<br />
                      <span className="text-blue-400 underline text-xs break-all">
                        {window.location.origin}/intake/{ngoId}
                      </span>
                      <br />
                      <span className="text-gray-500 text-xs">Photo se AI turant urgency assess karega.</span>
                    </p>
                  </div>
                </div>

                {/* Photo upload after SMS */}
                <div className="rounded-2xl p-4 border border-yellow-500/20"
                  style={{ background: 'rgba(234,179,8,0.06)' }}>
                  <p className="text-yellow-400 text-xs font-semibold mb-3 flex items-center gap-1.5">
                    <Camera size={13} /> Photo bhejein — better response milega
                  </p>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="call-photo-input"
                  />
                  {!photo ? (
                    <label htmlFor="call-photo-input"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-yellow-500/30 text-yellow-400 text-sm font-medium cursor-pointer transition-all active:scale-95"
                      style={{ background: 'rgba(234,179,8,0.08)' }}>
                      <Camera size={16} /> Photo Click Karein / Upload Karein
                    </label>
                  ) : (
                    <PhotoPreviewCard
                      photo={photo}
                      photoAI={photoAI}
                      photoAnalyzing={photoAnalyzing}
                      onRemove={removePhoto}
                    />
                  )}
                </div>

                {/* Submit with photo */}
                {photo && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setMode('form'); setStep('form') }}
                    className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-white border border-green-500/30 transition-all"
                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                    Form bhi bharein (recommended)
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!callSmsSent && (
            <>
              <div className="rounded-2xl p-4 border border-white/10 mb-4"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-gray-400 text-xs text-center">
                  Call ke baad aapko SMS aayega jisme photo bhejne ka link hoga
                </p>
                <p className="text-gray-600 text-xs text-center mt-1">
                  After the call, you'll receive an SMS to send a photo
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setMode('form')}
                className="w-full py-3 rounded-xl text-sm font-semibold text-green-400 border border-green-500/30 transition-all"
                style={{ background: 'rgba(34,197,94,0.08)' }}>
                Form Bharein Instead
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  // ── FORM MODE ──
  if (step === 'form' && mode === 'form') {
    return (
      <div className="min-h-screen p-4 pb-10"
        style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 50%, #0a0f0a 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pt-4">
            <button onClick={() => setStep('intro')} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-white font-bold">Apni Zarurat Batayein</h2>
              <p className="text-gray-500 text-xs">{ngoName}</p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Category */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-3 block">
                Kis cheez ki zarurat hai? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {NEED_CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  const selected = form.category === cat.value
                  return (
                    <motion.button
                      key={cat.value}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? `${cat.bg} ${cat.border} ${cat.color}`
                          : 'border-white/10 text-gray-400'
                      }`}
                      style={{ background: selected ? undefined : 'rgba(255,255,255,0.03)' }}
                    >
                      <Icon size={16} className={selected ? cat.color : 'text-gray-500'} />
                      <span className="text-xs font-medium leading-tight">{cat.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Description with language toggle + voice */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Kya problem hai? <span className="text-red-400">*</span>
              </label>

              {/* Language selector */}
              <div className="flex gap-2 mb-2">
                {[
                  { code: 'hi-IN', label: 'हिंदी', sub: 'Hindi' },
                  { code: 'en-IN', label: 'English', sub: 'English' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setVoiceLang(lang.code)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      voiceLang === lang.code
                        ? 'border-green-500/50 text-green-400'
                        : 'border-white/10 text-gray-500'
                    }`}
                    style={{ background: voiceLang === lang.code ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }}
                  >
                    {lang.label} <span className="text-xs opacity-60">{lang.sub}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={voiceLang === 'hi-IN' ? 'Yahan likhein ya neeche mic dabake bolein...' : 'Type here or tap mic below to speak...'}
                rows={4}
                className="w-full rounded-xl p-3 text-sm text-white placeholder-gray-600 resize-none border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />

              {/* Voice button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={startVoice}
                className={`w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                  listening
                    ? 'border-red-500/50 text-red-400'
                    : 'border-white/15 text-gray-400 hover:border-green-500/30 hover:text-green-400'
                }`}
                style={{ background: listening ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)' }}
              >
                {listening ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
                    <MicOff size={16} /> Sun raha hoon… / Listening… (tap to stop)
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    {voiceLang === 'hi-IN' ? 'Bolke Batayein (Hindi)' : 'Speak in English'}
                  </>
                )}
              </motion.button>

              {/* Live transcript preview */}
              <AnimatePresence>
                {listening && liveTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 px-3 py-2.5 rounded-xl border border-red-500/20 text-sm text-white leading-relaxed"
                    style={{ background: 'rgba(239,68,68,0.07)' }}
                  >
                    <span className="text-red-400 text-xs font-medium block mb-1">Live preview:</span>
                    {liveTranscript}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Photo Upload (Optional) + AI Vision ── */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">
                Photo (Optional — AI analyze karega)
              </label>
              <p className="text-gray-600 text-xs mb-3">
                Photo se AI turant urgency detect karega • Photo is optional but helps
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="form-photo-input"
              />
              {!photo ? (
                <label htmlFor="form-photo-input"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-2 border-dashed border-white/15 text-gray-400 text-sm cursor-pointer transition-all active:scale-95 hover:border-green-500/30 hover:text-green-400"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <ImagePlus size={20} />
                  <div>
                    <p className="font-medium">Photo Click Karein / Upload Karein</p>
                    <p className="text-xs text-gray-600 mt-0.5">Take Photo / Choose from Gallery</p>
                  </div>
                </label>
              ) : (
                <PhotoPreviewCard
                  photo={photo}
                  photoAI={photoAI}
                  photoAnalyzing={photoAnalyzing}
                  onRemove={removePhoto}
                />
              )}
            </div>

            {/* Location */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Aapki jagah / Location <span className="text-red-400">*</span>
              </label>
              <LocationInput value={form.location} onChange={val => setForm(f => ({ ...f, location: val }))} />
            </div>

            {/* Landmark */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Koi landmark? (Optional)
              </label>
              <input
                value={form.landmark}
                onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
                placeholder="Jaise: School ke paas, Mandir ke samne..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-3 block">Kitni jaldi chahiye?</label>
              <div className="flex gap-2">
                {URGENCY_LEVELS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => setForm(f => ({ ...f, urgency: u.value }))}
                    className={`flex-1 py-2.5 px-2 rounded-xl border text-center transition-all ${
                      form.urgency === u.value
                        ? 'border-green-500/40 bg-green-500/10'
                        : 'border-white/10'
                    }`}
                    style={{ background: form.urgency === u.value ? undefined : 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-lg mb-0.5">{u.emoji}</div>
                    <div className={`text-xs font-medium ${form.urgency === u.value ? 'text-green-400' : 'text-gray-400'}`}>
                      {u.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone (required) */}
            <div className="rounded-xl p-4 border border-white/10 space-y-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-gray-300 text-xs font-medium">Aapka naam & number <span className="text-red-400">*</span></p>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Aapka naam / Your name"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
              <input
                value={form.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm(f => ({ ...f, phone: val }))
                }}
                placeholder="10-digit phone number"
                type="tel"
                maxLength={10}
                inputMode="numeric"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-bold text-black flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} /> Submit Karein
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── SUCCESS SCREEN ──
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0f0a 0%, #0d1f0d 50%, #0a0f0a 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/40">
            <CheckCircle2 size={48} className="text-green-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-3">Shukriya! 🙏</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Aapki zarurat hum tak pahunch gayi. Hum <span className="text-green-400 font-semibold">sabse sahi NGO</span> ko
            aapke area mein bhejenge.
          </p>

          <div className="rounded-2xl p-4 border border-green-500/20 mb-6"
            style={{ background: 'rgba(34,197,94,0.07)' }}>
            <p className="text-gray-400 text-xs mb-1">Reference ID</p>
            <p className="text-green-400 font-mono font-bold text-sm">{submittedId?.slice(-8).toUpperCase()}</p>
          </div>

          <div className="space-y-2 text-left">
            {[
              'Aapki request review ho rahi hai',
              'Sahi NGO ko assign kiya jayega',
              'Agar number diya hai toh callback milega',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-300 text-xs">{s}</p>
              </div>
            ))}
            {photo && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/20"
                style={{ background: 'rgba(168,85,247,0.07)' }}>
                <Camera size={14} className="text-purple-400 shrink-0" />
                <p className="text-gray-300 text-xs">
                  Photo ke saath AI analysis bhi submit hua
                  {photoAI && <span className="text-purple-400 font-medium"> — {photoAI.urgency} urgency detected</span>}
                </p>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-xs mt-6">Powered by AlignSetu</p>
        </motion.div>
      </div>
    )
  }

  return null
}
