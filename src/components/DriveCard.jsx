import { motion } from 'framer-motion'
import { MapPin, Clock, Users, Zap, CheckCircle, Calendar, ExternalLink } from 'lucide-react'

const categoryColors = {
  cleanup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  plantation: 'bg-green-500/20 text-green-400 border-green-500/30',
  awareness: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  recycling: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  water_conservation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  wildlife: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const urgencyColors = {
  low: 'text-gray-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

function getCountdown(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target - now
  if (diff <= 0) return { label: 'Ongoing', color: 'text-green-400' }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return { label: `Starts in ${days}d ${hours}h`, color: days <= 2 ? 'text-orange-400' : 'text-blue-400' }
  return { label: `Starts in ${hours}h`, color: 'text-red-400' }
}

export default function DriveCard({ drive, onJoin, showJoin = false, joined = false, onViewDetails }) {
  const catColor = categoryColors[drive.category] || categoryColors.cleanup
  const pct = Math.min(((drive.volunteersJoined || 0) / (drive.estimatedVolunteers || 20)) * 100, 100)
  const countdown = getCountdown(drive.date)
  const hasUpdates = drive.updates?.length > 0

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="card p-5 hover:border-green-500/30 transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${catColor}`}>
          {drive.category?.replace('_', ' ')}
        </span>
        <span className={`text-xs font-medium flex items-center gap-1 ${urgencyColors[drive.urgency]}`}>
          <Zap size={11} />
          {drive.urgency}
        </span>
      </div>

      <h3 className="font-semibold text-primary mb-1 group-hover:text-green-400 transition-colors line-clamp-1">
        {drive.title}
      </h3>
      <p className="text-xs text-secondary mb-3 line-clamp-2 flex-1">{drive.description}</p>

      {/* Countdown timer */}
      {countdown && (
        <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 ${countdown.color}`}>
          <Calendar size={11} />
          {countdown.label}
        </div>
      )}

      {/* Updates badge */}
      {hasUpdates && (
        <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-3 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          {drive.updates.length} update{drive.updates.length > 1 ? 's' : ''} from NGO
        </div>
      )}

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-secondary">
          <MapPin size={12} className="text-green-400 shrink-0" />
          {drive.location || 'Location TBD'}
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Clock size={12} className="text-green-400 shrink-0" />
          {drive.duration || '2 hours'}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-secondary mb-1">
          <span className="flex items-center gap-1"><Users size={11} className="text-green-400" /> Volunteers</span>
          <span>{drive.volunteersJoined || 0}/{drive.estimatedVolunteers || 20}</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {drive.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {drive.requiredSkills.slice(0, 3).map(skill => (
            <span key={skill} className="text-xs px-2 py-0.5 rounded-md text-secondary border border-theme" style={{ background: 'var(--input-bg)' }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        {onViewDetails && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewDetails(drive)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-theme text-secondary hover:text-primary transition-colors"
            style={{ background: 'var(--bg-input)' }}
          >
            <ExternalLink size={11} /> Details
          </motion.button>
        )}

        {showJoin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onJoin?.(drive)}
            className={`py-2 rounded-xl text-sm font-semibold transition-colors ${onViewDetails ? 'flex-1' : 'w-full'} bg-green-500 hover:bg-green-400 text-black`}
          >
            Join Drive
          </motion.button>
        )}

        {joined && (
          <div className={`py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium flex items-center justify-center gap-1.5 ${onViewDetails ? 'flex-1' : 'w-full'}`}>
            <CheckCircle size={13} /> Joined
          </div>
        )}
      </div>
    </motion.div>
  )
}
