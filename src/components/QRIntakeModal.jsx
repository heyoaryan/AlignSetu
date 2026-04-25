import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import {
  X, Download, Share2, Copy, CheckCircle2, Smartphone,
  Leaf, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Canvas Poster Generator ─────────────────────────────────
async function generatePosterPNG({ qrCanvas, ngoName, intakeUrl, helpline }) {
  const W = 800
  const H = 1100

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Background: dark green gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#052e16')
  bgGrad.addColorStop(0.5, '#064e3b')
  bgGrad.addColorStop(1, '#052e16')
  ctx.fillStyle = bgGrad
  roundRect(ctx, 0, 0, W, H, 32)
  ctx.fill()

  // ── Subtle dot pattern overlay ──
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let x = 0; x < W; x += 32) {
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Top accent bar ──
  const barGrad = ctx.createLinearGradient(0, 0, W, 0)
  barGrad.addColorStop(0, '#16a34a')
  barGrad.addColorStop(1, '#22c55e')
  ctx.fillStyle = barGrad
  roundRect(ctx, 0, 0, W, 90, { tl: 32, tr: 32, bl: 0, br: 0 })
  ctx.fill()

  // ── Leaf icon circle in top bar ──
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.arc(64, 45, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = 'bold 26px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🌿', 64, 46)

  // ── "AlignSetu" in top bar ──
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '500 18px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('AlignSetu', 102, 45)

  // ── NGO Name ──
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px Arial'
  wrapText(ctx, ngoName || 'My NGO', W / 2, 170, W - 80, 60)

  // ── Tagline Hindi ──
  ctx.fillStyle = '#86efac'
  ctx.font = 'bold 26px Arial'
  ctx.fillText('अपनी ज़रूरत हम तक पहुँचाएं', W / 2, 240)

  // ── Tagline English ──
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '22px Arial'
  ctx.fillText('Share your need with us — We will help', W / 2, 278)

  // ── Divider line ──
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 305)
  ctx.lineTo(W - 80, 305)
  ctx.stroke()

  // ── QR Code white card ──
  const qrCardSize = 340
  const qrCardX = (W - qrCardSize) / 2
  const qrCardY = 325
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, 24)
  ctx.fill()

  // subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 8
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, 24)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Draw QR inside card
  const qrPad = 20
  const qrSize = qrCardSize - qrPad * 2
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, qrCardX + qrPad, qrCardY + qrPad, qrSize, qrSize)
  }

  // ── "Scan Karein" arrow label ──
  ctx.fillStyle = '#22c55e'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('📱  Scan Karein  /  Scan Here', W / 2, qrCardY + qrCardSize + 44)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, qrCardY + qrCardSize + 68)
  ctx.lineTo(W - 80, qrCardY + qrCardSize + 68)
  ctx.stroke()

  // ── Two option boxes ──
  const boxY = qrCardY + qrCardSize + 88
  const boxH = 110
  const boxGap = 20
  const boxW = (W - 80 - 80 - boxGap) / 2

  // Box 1 — Form
  const box1Grad = ctx.createLinearGradient(80, boxY, 80, boxY + boxH)
  box1Grad.addColorStop(0, 'rgba(34,197,94,0.25)')
  box1Grad.addColorStop(1, 'rgba(34,197,94,0.08)')
  ctx.fillStyle = box1Grad
  roundRect(ctx, 80, boxY, boxW, boxH, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(34,197,94,0.5)'
  ctx.lineWidth = 1.5
  roundRect(ctx, 80, boxY, boxW, boxH, 16)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('📝', 80 + boxW / 2, boxY + 38)
  ctx.font = 'bold 18px Arial'
  ctx.fillStyle = '#4ade80'
  ctx.fillText('Form Bharein', 80 + boxW / 2, boxY + 66)
  ctx.font = '14px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('Fill the Form', 80 + boxW / 2, boxY + 86)
  ctx.font = '13px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText('Likhein ya bolein', 80 + boxW / 2, boxY + 104)

  // Box 2 — Call
  const box2X = 80 + boxW + boxGap
  const box2Grad = ctx.createLinearGradient(box2X, boxY, box2X, boxY + boxH)
  box2Grad.addColorStop(0, 'rgba(59,130,246,0.25)')
  box2Grad.addColorStop(1, 'rgba(59,130,246,0.08)')
  ctx.fillStyle = box2Grad
  roundRect(ctx, box2X, boxY, boxW, boxH, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(59,130,246,0.5)'
  ctx.lineWidth = 1.5
  roundRect(ctx, box2X, boxY, boxW, boxH, 16)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('📞', box2X + boxW / 2, boxY + 38)
  ctx.font = 'bold 18px Arial'
  ctx.fillStyle = '#60a5fa'
  ctx.fillText('Call Karein', box2X + boxW / 2, boxY + 66)
  ctx.font = '14px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('Make a Call', box2X + boxW / 2, boxY + 86)
  ctx.font = '13px Arial'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText('Seedha baat karein', box2X + boxW / 2, boxY + 104)

  // ── Helpline number ──
  const phoneY = boxY + boxH + 44
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, 80, phoneY - 28, W - 160, 60, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  roundRect(ctx, 80, phoneY - 28, W - 160, 60, 14)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Helpline / Toll Free', W / 2, phoneY - 4)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px Arial'
  ctx.fillText(helpline || '1800-11-2345', W / 2, phoneY + 24)

  // ── Bottom branding ──
  const brandY = H - 52
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, brandY - 16)
  ctx.lineTo(W - 80, brandY - 16)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '15px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Powered by  AlignSetu  •  Free & Confidential  •  alignsetu.ai', W / 2, brandY + 8)

  return canvas.toDataURL('image/png')
}

// Helper: rounded rect path
function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, bl: r, br: r }
  ctx.beginPath()
  ctx.moveTo(x + r.tl, y)
  ctx.lineTo(x + w - r.tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr)
  ctx.lineTo(x + w, y + h - r.br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h)
  ctx.lineTo(x + r.bl, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl)
  ctx.lineTo(x, y + r.tl)
  ctx.quadraticCurveTo(x, y, x + r.tl, y)
  ctx.closePath()
}

// Helper: wrap long text
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineH
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, currentY)
}

// ── Component ───────────────────────────────────────────────
export default function QRIntakeModal({ open, onClose, ngoId, ngoName }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const qrCanvasRef = useRef(null)

  const baseUrl = window.location.origin
  const intakeUrl = `${baseUrl}/intake/${ngoId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(intakeUrl).then(() => {
      setCopied(true)
      toast.success('Link copy ho gaya!')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // qrcode.react renders a <canvas> when using QRCodeCanvas
      const qrCanvas = qrCanvasRef.current
      const dataUrl = await generatePosterPNG({
        qrCanvas,
        ngoName: ngoName || 'My NGO',
        intakeUrl,
        helpline: '1800-11-2345',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `AlignSetu-Poster-${(ngoName || 'NGO').replace(/\s+/g, '-')}.png`
      a.click()
    } catch (e) {
      console.error(e)
      toast.error('Download nahi hua, dobara try karein')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ngoName} – AlignSetu`,
          text: 'Apni zarurat batayein – scan karein ya link kholen',
          url: intakeUrl,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md rounded-3xl overflow-hidden overflow-y-auto"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '92vh',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
                <Smartphone size={18} className="text-green-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>QR Code – Data Intake</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Poster download karein ya share karein</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">

            {/* ── Poster Preview ── */}
            <div className="rounded-2xl overflow-hidden border border-white/8"
              style={{ background: 'linear-gradient(135deg, #052e16, #064e3b, #052e16)' }}>

              {/* Green top bar */}
              <div className="flex items-center gap-3 px-5 py-3"
                style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}>
                <span className="text-lg">🌿</span>
                <span className="text-white/80 text-sm font-medium">AlignSetu</span>
              </div>

              <div className="px-5 pt-5 pb-4 text-center">
                {/* NGO Name */}
                <p className="text-white font-black text-xl leading-tight mb-1">
                  {ngoName || 'My NGO'}
                </p>
                <p className="text-green-300 text-sm font-semibold mb-0.5">अपनी ज़रूरत हम तक पहुँचाएं</p>
                <p className="text-white/40 text-xs mb-4">Share your need with us — We will help</p>

                {/* QR Code */}
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-white rounded-2xl shadow-2xl shadow-black/50">
                    {/* Hidden canvas for download */}
                    <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                      <QRCodeCanvas
                        ref={qrCanvasRef}
                        value={intakeUrl}
                        size={300}
                        level="H"
                        marginSize={1}
                      />
                    </div>
                    {/* Visible QR */}
                    <QRCodeCanvas
                      value={intakeUrl}
                      size={160}
                      level="H"
                      marginSize={1}
                    />
                  </div>
                </div>

                <p className="text-green-400 text-sm font-bold mb-4">
                  📱 Scan Karein &nbsp;/&nbsp; Scan Here
                </p>

                {/* Two option boxes */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl py-3 px-2 border border-green-500/40"
                    style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <div className="text-xl mb-1">📝</div>
                    <p className="text-green-400 font-bold text-xs">Form Bharein</p>
                    <p className="text-white/50 text-xs">Fill the Form</p>
                    <p className="text-white/30 text-xs mt-0.5">Likhein ya bolein</p>
                  </div>
                  <div className="rounded-xl py-3 px-2 border border-blue-500/40"
                    style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <div className="text-xl mb-1">📞</div>
                    <p className="text-blue-400 font-bold text-xs">Call Karein</p>
                    <p className="text-white/50 text-xs">Make a Call</p>
                    <p className="text-white/30 text-xs mt-0.5">Seedha baat karein</p>
                  </div>
                </div>

                {/* Helpline */}
                <div className="rounded-xl py-2.5 px-4 border border-white/10 mb-3"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-white/40 text-xs mb-0.5">Helpline / Toll Free</p>
                  <p className="text-white font-black text-lg tracking-wide">1800-11-2345</p>
                </div>

                <p className="text-white/25 text-xs">
                  Powered by AlignSetu • Free & Confidential
                </p>
              </div>
            </div>

            {/* URL bar */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-white/8"
              style={{ background: 'var(--bg-input)' }}>
              <ExternalLink size={13} className="text-green-400 shrink-0" />
              <p className="text-xs flex-1 truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
                {intakeUrl}
              </p>
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
                style={{ color: copied ? undefined : 'var(--text-secondary)' }}
              >
                {copied ? <><CheckCircle2 size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                disabled={downloading}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-blue-500/25 hover:bg-blue-500/10 transition-all disabled:opacity-60"
                style={{ background: 'rgba(59,130,246,0.08)' }}
              >
                {downloading
                  ? <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  : <Download size={16} className="text-blue-400" />
                }
                <span className="text-xs font-medium text-blue-400">
                  {downloading ? 'Bana raha…' : 'Download'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-purple-500/25 hover:bg-purple-500/10 transition-all"
                style={{ background: 'rgba(168,85,247,0.08)' }}
              >
                <Share2 size={16} className="text-purple-400" />
                <span className="text-xs font-medium text-purple-400">Share</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => window.open(intakeUrl, '_blank')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-green-500/25 hover:bg-green-500/10 transition-all"
                style={{ background: 'rgba(34,197,94,0.08)' }}
              >
                <ExternalLink size={16} className="text-green-400" />
                <span className="text-xs font-medium text-green-400">Preview</span>
              </motion.button>
            </div>

            {/* How it works */}
            <div className="rounded-xl p-4 border border-green-500/15"
              style={{ background: 'rgba(34,197,94,0.05)' }}>
              <p className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                <Leaf size={12} /> Kaise kaam karta hai?
              </p>
              <div className="space-y-2">
                {[
                  'Public QR scan karta hai apne phone se',
                  'Form bharke ya bolke apni zarurat batata hai',
                  'Data aapke NGO dashboard mein aata hai',
                  'Aap best drive start karte hain us area mein',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
