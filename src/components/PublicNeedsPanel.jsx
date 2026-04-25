import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, MapPin, Clock, Phone, User, Trash2, TreePine,
  Droplets, Recycle, Heart, Sparkles, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Filter,
  Zap, ArrowRight, QrCode, X, Plus, Brain, Link2
} from 'lucide-react'
import { collection, onSnapshot, query, where, db, updateDoc, doc } from '../config/firebase'
import toast from 'react-hot-toast'

const CATEGORY_META = {
  cleanup:    { label: 'Cleanup',     icon: Trash2,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  plantation: { label: 'Plantation',  icon: TreePine,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25' },
  water:      { label: 'Water',       icon: Droplets,  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/25' },
  recycling:  { label: 'Recycling',   icon: Recycle,   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  health:     { label: 'Health',      icon: Heart,     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25' },
  other:      { label: 'Other',       icon: Sparkles,  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
}

const URGENCY_META = {
  low:    { label: 'Low',    emoji: '🟡', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  medium: { label: 'Medium', emoji: '🟠', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  high:   { label: 'High',   emoji: '🔴', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25' },
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  reviewed: { label: 'Reviewed', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  actioned: { label: 'Actioned', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Abhi'
  if (mins < 60) return `${mins}m pehle`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h pehle`
  return `${Math.floor(hrs / 24)}d pehle`
}

function NeedCard({ need, onStatusChange, drives }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORY_META[need.category] || CATEGORY_META.other
  const urg = URGENCY_META[need.urgency] || URGENCY_META.medium
  const sta = STATUS_META[need.status] || STATUS_META.pending
  const CatIcon = cat.icon

  const ai = need.aiAnalysis
  const matchedDrive = ai?.matchedDriveId
    ? drives.find(d => d.id === ai.matchedDriveId)
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card rounded-2xl overflow-hidden"
      style={{
        border: need.urgency === 'high'
          ? '1px solid rgba(239,68,68,0.25)'
          : '1px solid rgba(255,255,255,0.07)'
      }}
    >
      {/* Top row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg}`}>
            <CatIcon size={18} className={cat.color} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${cat.bg} ${cat.color} border ${cat.border}`}>
                {cat.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${urg.bg} ${urg.color} border ${urg.border}`}>
                {urg.emoji} {urg.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${sta.bg} ${sta.color} border ${sta.border} ml-auto`}>
                {sta.label}
              </span>
            </div>

            {/* AI summary if available, else raw description */}
            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
              {ai?.summary || (expanded ? need.description : need.description?.slice(0, 80) + (need.description?.length > 80 ? '…' : ''))}
            </p>

            {/* Location */}
            <div className="flex items-center gap-1 mt-1.5">
              <MapPin size={11} className="text-green-400 shrink-0" />
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {need.location}{need.landmark ? ` • ${need.landmark}` : ''}
              </span>
            </div>
          </div>

          {/* Photo thumbnail if exists */}
          {need.photoPreview && (
            <div className="shrink-0">
              <img
                src={need.photoPreview}
                alt="Need photo"
                className="w-16 h-16 rounded-xl object-cover border border-white/10"
              />
            </div>
          )}
        </div>

        {/* AI Insight strip — show spinner if AI still analyzing */}
        {!ai && need.status === 'pending' && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl border border-white/8"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin shrink-0" />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI analysis ho rahi hai…</p>
          </div>
        )}
        {ai && (
          <div className="mt-3">
            {matchedDrive ? (
              // Matched to existing drive
              <div className="flex items-start gap-2 p-2.5 rounded-xl border border-green-500/20"
                style={{ background: 'rgba(34,197,94,0.07)' }}>
                <Link2 size={13} className="text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-400">
                    AI Match: "{matchedDrive.title}"
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {ai.matchReason} • {ai.matchScore}% match
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/25 shrink-0 font-bold">
                  {ai.matchScore}%
                </span>
              </div>
            ) : (
              // No match — suggest new drive
              <div className="flex items-start gap-2 p-2.5 rounded-xl border border-yellow-500/20"
                style={{ background: 'rgba(234,179,8,0.07)' }}>
                <Brain size={13} className="text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-yellow-400">
                    AI Suggest: "{ai.suggestedDriveTitle}"
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {ai.actionable}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 shrink-0 font-medium">
                  New
                </span>
              </div>
            )}
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs hover:text-primary transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-3">
            {need.name && need.name !== 'Anonymous' && (
              <span className="flex items-center gap-1"><User size={10} /> {need.name}</span>
            )}
            {need.phone && (
              <span className="flex items-center gap-1"><Phone size={10} /> {need.phone}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(need.submittedAt)}</span>
          </div>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
              {/* Full description */}
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {need.description}
              </p>

              {/* Photo AI vision result */}
              {need.photoAI && (
                <div className="rounded-xl overflow-hidden border border-purple-500/20">
                  {need.photoPreview && (
                    <img src={need.photoPreview} alt="" className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3 space-y-1.5" style={{ background: 'rgba(168,85,247,0.07)' }}>
                    <p className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <Zap size={11} /> AI Vision Analysis
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {need.photoAI.whatISee}
                    </p>
                    <p className="text-xs text-purple-300 font-medium">
                      {need.photoAI.urgencyReason} • {need.photoAI.confidence}% confident
                    </p>
                  </div>
                </div>
              )}

              {/* AI full suggestion */}
              {ai?.suggestedDriveDesc && !matchedDrive && (
                <div className="p-3 rounded-xl border border-yellow-500/15"
                  style={{ background: 'rgba(234,179,8,0.05)' }}>
                  <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                    <Brain size={11} /> Suggested Drive
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ai.suggestedDriveDesc}</p>
                </div>
              )}

              {/* Status update buttons */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Status update karein:</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => onStatusChange(need.id, key)}
                      disabled={need.status === key}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        need.status === key
                          ? `${meta.bg} ${meta.color} ${meta.border}`
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                      style={{ color: need.status === key ? undefined : 'var(--text-secondary)' }}
                    >
                      {need.status === key && <CheckCircle2 size={10} className="inline mr-1" />}
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PublicNeedsPanel({ ngoId, onOpenQR }) {
  const [needs, setNeeds] = useState([])
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    if (!ngoId) return

    // Listen to public needs for this NGO
    const needsQ = query(collection(db, 'publicNeeds'), where('ngoId', '==', ngoId))
    const unsubNeeds = onSnapshot(needsQ, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => {
        const urgOrder = { high: 0, medium: 1, low: 2 }
        if (urgOrder[a.urgency] !== urgOrder[b.urgency]) return urgOrder[a.urgency] - urgOrder[b.urgency]
        return new Date(b.submittedAt) - new Date(a.submittedAt)
      })
      setNeeds(docs)
      setLoading(false)
    })

    // Also listen to NGO's drives (for AI match display)
    const drivesQ = query(collection(db, 'drives'), where('ngoId', '==', ngoId))
    const unsubDrives = onSnapshot(drivesQ, snap => {
      setDrives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubNeeds(); unsubDrives() }
  }, [ngoId])

  const handleStatusChange = async (needId, newStatus) => {
    try {
      await updateDoc(doc(db, 'publicNeeds', needId), { status: newStatus })
      toast.success(`Status: ${STATUS_META[newStatus].label}`)
    } catch {
      toast.error('Update nahi hua')
    }
  }

  const filtered = needs
    .filter(n => filter === 'all' || n.status === filter)
    .filter(n => catFilter === 'all' || n.category === catFilter)

  const pendingCount = needs.filter(n => n.status === 'pending').length
  const highUrgencyCount = needs.filter(n => n.urgency === 'high' && n.status === 'pending').length

  // Category breakdown
  const catCounts = needs.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center rounded-2xl">
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{needs.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Total Requests</p>
        </div>
        <div className="card p-4 text-center rounded-2xl" style={{ border: pendingCount > 0 ? '1px solid rgba(249,115,22,0.25)' : undefined }}>
          <p className="text-2xl font-black text-orange-400">{pendingCount}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pending</p>
        </div>
        <div className="card p-4 text-center rounded-2xl" style={{ border: highUrgencyCount > 0 ? '1px solid rgba(239,68,68,0.25)' : undefined }}>
          <p className="text-2xl font-black text-red-400">{highUrgencyCount}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>High Urgency</p>
        </div>
      </div>

      {/* QR Code CTA */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={onOpenQR}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-green-500/25 text-left transition-all"
        style={{ background: 'rgba(34,197,94,0.06)' }}
      >
        <div className="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center shrink-0 border border-green-500/25">
          <QrCode size={22} className="text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Apna QR Code Dekhen</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Print karein, share karein — public scan karke zarurat batayegi
          </p>
        </div>
        <ArrowRight size={16} className="text-green-400 shrink-0" />
      </motion.button>

      {/* Category breakdown */}
      {Object.keys(catCounts).length > 0 && (
        <div className="card p-4 rounded-2xl">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Category Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(catCounts).map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.other
              const Icon = meta.icon
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    catFilter === cat ? `${meta.bg} ${meta.color} ${meta.border}` : 'border-white/10 hover:bg-white/5'
                  }`}
                  style={{ color: catFilter === cat ? undefined : 'var(--text-secondary)' }}
                >
                  <Icon size={12} className={catFilter === cat ? meta.color : 'text-gray-500'} />
                  {meta.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${catFilter === cat ? meta.bg : 'bg-white/5'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
            {catFilter !== 'all' && (
              <button onClick={() => setCatFilter('all')} className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-white/10 text-xs hover:bg-white/5 transition-all"
                style={{ color: 'var(--text-muted)' }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-muted" />
        {[
          { key: 'all', label: 'Sab', count: needs.length },
          { key: 'pending', label: 'Pending', count: needs.filter(n => n.status === 'pending').length },
          { key: 'reviewed', label: 'Reviewed', count: needs.filter(n => n.status === 'reviewed').length },
          { key: 'actioned', label: 'Actioned', count: needs.filter(n => n.status === 'actioned').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              filter === key
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'card border-theme text-secondary hover:text-primary'
            }`}
          >
            {label}
            <span className="ml-1 opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Needs list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="h-28 card rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center rounded-2xl">
          <Inbox size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {needs.length === 0 ? 'Abhi koi request nahi aayi' : 'Is filter mein kuch nahi'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {needs.length === 0
              ? 'QR code share karein taaki public apni zarurat bata sake'
              : 'Doosra filter try karein'}
          </p>
          {needs.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onOpenQR}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <QrCode size={15} /> QR Code Generate Karein
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(need => (
            <NeedCard key={need.id} need={need} drives={drives} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
