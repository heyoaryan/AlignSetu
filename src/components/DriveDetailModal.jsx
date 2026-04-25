import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, Clock, Users, Zap, Calendar, CheckCircle,
  MessageSquare, Send, Info, ChevronRight, Navigation,
  ExternalLink, Loader2, Sparkles
} from 'lucide-react'
import { doc, updateDoc, db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import MapView from './MapView'
import toast from 'react-hot-toast'

const categoryColors = {
  cleanup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  plantation: 'bg-green-500/20 text-green-400 border-green-500/30',
  awareness: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  recycling: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  water_conservation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  wildlife: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const urgencyColors = {
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function getCountdown(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target - now
  if (diff <= 0) return { label: 'Started', color: 'text-green-400' }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return { label: `Starts in ${days}d ${hours}h`, color: days <= 2 ? 'text-orange-400' : 'text-blue-400' }
  return { label: `Starts in ${hours}h`, color: 'text-red-400' }
}

export default function DriveDetailModal({
  drive, open, onClose, onJoin, joined, isNGO = false,
  // when true, open directly on updates tab (e.g. after joining)
  defaultTab = 'details',
}) {
  const { currentUser } = useAuth()
  const [updates, setUpdates] = useState([])
  const [newUpdate, setNewUpdate] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [gettingDir, setGettingDir] = useState(false)
  const prevJoined = useRef(joined)

  // Sync updates when drive changes
  useEffect(() => {
    if (!drive) return
    setUpdates(drive.updates || [])
  }, [drive])

  // Reset tab when modal opens
  useEffect(() => {
    if (open) setActiveTab(defaultTab)
  }, [open, defaultTab])

  // When volunteer just joined → switch to updates tab
  useEffect(() => {
    if (!prevJoined.current && joined && open) {
      setActiveTab('updates')
    }
    prevJoined.current = joined
  }, [joined, open])

  if (!open || !drive) return null

  const catColor = categoryColors[drive.category] || categoryColors.cleanup
  const urgColor = urgencyColors[drive.urgency] || urgencyColors.medium
  const pct = Math.min(((drive.volunteersJoined || 0) / (drive.estimatedVolunteers || 20)) * 100, 100)
  const countdown = getCountdown(drive.date)
  const driveForMap = drive.lat && drive.lng ? [drive] : []

  // Tabs: volunteers only see updates after joining
  const tabs = ['details']
  if (joined || isNGO) tabs.push('updates')
  tabs.push('map')

  const handlePostUpdate = async () => {
    if (!newUpdate.trim()) return
    setPostingUpdate(true)
    try {
      const update = {
        text: newUpdate.trim(),
        author: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'NGO',
        timestamp: new Date().toISOString(),
      }
      const updatedList = [...updates, update]
      await updateDoc(doc(db, 'drives', drive.id), { updates: updatedList })
      setUpdates(updatedList)
      setNewUpdate('')
      toast.success('Update posted!')
    } catch {
      toast.error('Failed to post update')
    } finally {
      setPostingUpdate(false)
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // Open Google Maps directions from current location to drive
  const handleGetDirections = () => {
    const dest = drive.lat && drive.lng
      ? `${drive.lat},${drive.lng}`
      : encodeURIComponent(drive.location || '')

    if (!dest) return toast.error('No location available for this drive')

    setGettingDir(true)

    // Try to get current location for origin
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingDir(false)
          const origin = `${pos.coords.latitude},${pos.coords.longitude}`
          const url = `https://www.google.com/maps/dir/${origin}/${dest}`
          window.open(url, '_blank')
        },
        () => {
          setGettingDir(false)
          // Fallback: open destination only, Google Maps will ask for origin
          const url = drive.lat && drive.lng
            ? `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
            : `https://www.google.com/maps/search/${dest}`
          window.open(url, '_blank')
          toast('Location access denied — opening destination only', { icon: '📍' })
        },
        { timeout: 5000 }
      )
    } else {
      setGettingDir(false)
      const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 flex items-start justify-between p-5 pb-4"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${catColor}`}>
                    {drive.category?.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${urgColor}`}>
                    <Zap size={10} /> {drive.urgency}
                  </span>
                  {drive.status === 'completed' && (
                    <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                      <CheckCircle size={10} /> Completed
                    </span>
                  )}
                  {joined && (
                    <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                      <CheckCircle size={10} /> Joined
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-primary leading-tight">{drive.title}</h2>
              </div>
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 px-5 pt-4 pb-0">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-secondary hover:text-primary'
                  }`}>
                  {tab}
                  {tab === 'updates' && updates.length > 0 && (
                    <span className="ml-1.5 bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full">
                      {updates.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Lock hint for non-joined volunteers */}
              {!joined && !isNGO && (
                <span className="ml-auto text-xs text-muted flex items-center gap-1 self-center">
                  🔒 Join to see updates
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              <AnimatePresence mode="wait">

                {/* ── DETAILS TAB ── */}
                {activeTab === 'details' && (
                  <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                    {/* Countdown */}
                    {countdown && (
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${countdown.color}`}
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                        <Calendar size={15} />
                        {countdown.label}
                        {drive.date && (
                          <span className="ml-auto text-xs font-normal text-secondary">
                            {new Date(drive.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-input)' }}>
                      <p className="text-sm text-secondary leading-relaxed">{drive.description || 'No description provided.'}</p>
                    </div>

                    {/* AI Summary — shown when drive was created with Gemini analysis */}
                    {drive.aiSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,197,94,0.06))', border: '1px solid rgba(139,92,246,0.2)' }}
                      >
                        <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={13} className="text-purple-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block mb-1" style={{ background: 'linear-gradient(90deg, #a78bfa, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AlignSetu AI Summary
                          </span>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{drive.aiSummary}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Action Items — shown when drive was AI-analyzed */}
                    {drive.actionItems?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-secondary mb-2 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-purple-400" /> AI Action Plan
                        </p>
                        <div className="space-y-1.5">
                          {drive.actionItems.map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                              className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <CheckCircle size={13} className="text-green-400 mt-0.5 shrink-0" />
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: MapPin, label: 'Location', value: drive.location || 'TBD', color: 'text-green-400' },
                        { icon: Clock, label: 'Duration', value: drive.duration || '2 hours', color: 'text-blue-400' },
                        { icon: Users, label: 'Volunteers', value: `${drive.volunteersJoined || 0} / ${drive.estimatedVolunteers || 20}`, color: 'text-purple-400' },
                        { icon: Zap, label: 'Urgency', value: drive.urgency || 'normal', color: 'text-yellow-400' },
                      ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                          <Icon size={15} className={color} />
                          <div>
                            <p className="text-xs text-muted">{label}</p>
                            <p className="text-sm font-medium text-primary capitalize">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Volunteer progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-secondary mb-2">
                        <span className="flex items-center gap-1"><Users size={11} className="text-green-400" /> Volunteer Slots</span>
                        <span className="font-semibold text-primary">{Math.round(pct)}% filled</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: 'var(--border)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted mt-1">
                        <span>{drive.volunteersJoined || 0} joined</span>
                        <span>{(drive.estimatedVolunteers || 20) - (drive.volunteersJoined || 0)} spots left</span>
                      </div>
                    </div>

                    {/* Required skills */}
                    {drive.requiredSkills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-secondary mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {drive.requiredSkills.map(skill => (
                            <span key={skill} className="text-xs px-3 py-1.5 rounded-lg text-secondary border border-theme"
                              style={{ background: 'var(--bg-input)' }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Updates preview — only for joined volunteers */}
                    {joined && updates.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        onClick={() => setActiveTab('updates')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-left">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-400">Latest NGO Update</p>
                          <p className="text-xs text-secondary truncate">{updates[updates.length - 1].text}</p>
                        </div>
                        <ChevronRight size={13} className="text-muted shrink-0" />
                      </motion.button>
                    )}

                    {/* Join / Joined + Get Directions */}
                    {!isNGO && drive.status !== 'completed' && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: joined ? 1 : 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (!joined) {
                              onJoin?.(drive)
                            } else {
                              setActiveTab('updates')
                            }
                          }}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            joined
                              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                              : 'bg-green-500 hover:bg-green-400 text-black'
                          }`}
                        >
                          {joined
                            ? <><MessageSquare size={14} /> View Updates</>
                            : 'Join This Drive'
                          }
                        </motion.button>

                        {joined && (
                          <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={handleGetDirections}
                            disabled={gettingDir}
                            className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                          >
                            {gettingDir
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Navigation size={15} />
                            }
                            Directions
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── UPDATES TAB (joined volunteers + NGO only) ── */}
                {activeTab === 'updates' && (joined || isNGO) && (
                  <motion.div key="updates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                    {/* NGO post update form */}
                    {isNGO && drive.status !== 'completed' && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold text-secondary flex items-center gap-2">
                          <Send size={12} className="text-green-400" /> Post an Update to Volunteers
                        </p>
                        <textarea
                          value={newUpdate}
                          onChange={e => setNewUpdate(e.target.value)}
                          placeholder='e.g. "Venue changed to Gate 2", "Please bring gloves", "Starting 30 mins late"...'
                          rows={3}
                          className="input-field w-full px-4 py-3 text-sm resize-none"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handlePostUpdate}
                          disabled={!newUpdate.trim() || postingUpdate}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-400 text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Send size={13} />
                          {postingUpdate ? 'Posting...' : 'Post Update'}
                        </motion.button>
                      </div>
                    )}

                    {/* Volunteer: get directions CTA inside updates tab */}
                    {joined && !isNGO && (drive.lat || drive.location) && (
                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={handleGetDirections}
                        disabled={gettingDir}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all"
                        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                          {gettingDir
                            ? <Loader2 size={15} className="text-blue-400 animate-spin" />
                            : <Navigation size={15} className="text-blue-400" />
                          }
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-blue-400">Get Directions</p>
                          <p className="text-xs text-secondary">{drive.location || 'Opens Google Maps from your location'}</p>
                        </div>
                        <ExternalLink size={13} className="text-blue-400/60 shrink-0" />
                      </motion.button>
                    )}

                    {/* Updates list */}
                    {updates.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageSquare size={28} className="text-muted mx-auto mb-3" />
                        <p className="text-secondary text-sm">No updates yet</p>
                        {isNGO
                          ? <p className="text-muted text-xs mt-1">Post updates to keep volunteers informed</p>
                          : <p className="text-muted text-xs mt-1">NGO will post updates here — check back before the drive</p>
                        }
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...updates].reverse().map((update, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-3 p-4 rounded-xl"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                              <Info size={14} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-primary">{update.author}</span>
                                <span className="text-xs text-muted">{formatTime(update.timestamp)}</span>
                              </div>
                              <p className="text-sm text-secondary leading-relaxed">{update.text}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── MAP TAB ── */}
                {activeTab === 'map' && (
                  <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

                    {driveForMap.length > 0 ? (
                      <div className="rounded-xl overflow-hidden" style={{ height: '320px', border: '1px solid var(--border)' }}>
                        <MapView
                          drives={driveForMap}
                          mode="ngo"
                          center={{ lat: drive.lat, lng: drive.lng }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl" style={{ background: 'var(--bg-input)' }}>
                        <MapPin size={28} className="text-muted mx-auto mb-3" />
                        <p className="text-secondary text-sm">No map coordinates for this drive</p>
                      </div>
                    )}

                    {/* Location row */}
                    <div className="flex items-center gap-2 px-1">
                      <MapPin size={14} className="text-green-400 shrink-0" />
                      <span className="text-sm text-secondary flex-1">{drive.location || 'Location not specified'}</span>
                    </div>

                    {/* Get Directions button — full width, prominent */}
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={handleGetDirections}
                      disabled={gettingDir || (!drive.lat && !drive.location)}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))',
                        color: '#60a5fa',
                        border: '1px solid rgba(59,130,246,0.35)',
                      }}
                    >
                      {gettingDir
                        ? <><Loader2 size={16} className="animate-spin" /> Getting your location...</>
                        : <><Navigation size={16} /> Get Directions in Google Maps</>
                      }
                    </motion.button>

                    <p className="text-xs text-muted text-center">
                      Opens Google Maps with turn-by-turn directions from your current location
                    </p>
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
