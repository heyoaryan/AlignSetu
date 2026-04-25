import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 16)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

export default function StatCard({ icon: Icon, value, label, suffix = '', color = 'green' }) {
  const { count, ref } = useCountUp(value)

  const colors = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="card p-6 hover:border-green-500/30 transition-all"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-black text-primary mb-0.5">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-secondary">{label}</div>
    </motion.div>
  )
}
