import { motion } from 'framer-motion'
import { Sparkles, Target, Clock, Users, Zap, CheckCircle2 } from 'lucide-react'

const urgencyConfig = {
  low:      { color: 'text-gray-500',   bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
  medium:   { color: 'text-yellow-500', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)' },
  high:     { color: 'text-orange-500', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)' },
  critical: { color: 'text-red-500',    bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
}

export default function AIResultPanel({ result, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="flex items-center gap-3 mb-5">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 rounded-full border-2 border-green-500 border-t-transparent" />
          <span className="text-green-500 font-medium text-sm">Gemini is analyzing...</span>
        </div>
        <div className="space-y-2.5">
          {[80, 65, 90, 55].map((w, i) => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="h-3.5 rounded-lg" style={{ width: `${w}%`, background: 'var(--border)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!result) return null

  const urgency = urgencyConfig[result.urgency] || urgencyConfig.medium

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
          <Sparkles size={15} className="text-green-500" />
        </div>
        <span className="font-semibold text-green-500 text-sm">Gemini AI Analysis</span>
      </div>

      <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: Target, label: 'Category', value: result.category?.replace('_', ' '), color: 'text-green-500', bg: 'var(--bg-input)', border: 'var(--border)' },
          { icon: Zap, label: 'Urgency', value: result.urgency, color: urgency.color, bg: urgency.bg, border: urgency.border },
          { icon: Clock, label: 'Duration', value: result.duration, color: 'text-blue-500', bg: 'var(--bg-input)', border: 'var(--border)' },
          { icon: Users, label: 'Volunteers Needed', value: result.estimatedVolunteers, color: 'text-purple-500', bg: 'var(--bg-input)', border: 'var(--border)' },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={13} className={color} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <span className={`text-sm font-semibold capitalize ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {result.requiredSkills?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {result.requiredSkills.map(skill => (
              <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {result.actionItems?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Action Items</p>
          <div className="space-y-1.5">
            {result.actionItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Impact Score</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(result.impactScore / 10) * 100}%` }}
              transition={{ duration: 1, delay: 0.4 }} className="h-full bg-green-500 rounded-full" />
          </div>
          <span className="text-sm font-bold text-green-500">{result.impactScore}/10</span>
        </div>
      </div>
    </motion.div>
  )
}
