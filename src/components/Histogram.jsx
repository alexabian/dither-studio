import { useEffect, useRef } from 'react'

export default function Histogram({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    const { r, g, b } = data
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)

    const maxVal = Math.max(
      ...Array.from(r).slice(1,255),
      ...Array.from(g).slice(1,255),
      ...Array.from(b).slice(1,255),
    ) || 1

    const drawChannel = (hist, color) => {
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * W
        const y = H - (hist[i] / maxVal) * H * 0.92
        if (i === 0) ctx.lineTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }

    drawChannel(r, 'rgba(220,60,60,0.5)')
    drawChannel(g, 'rgba(60,180,60,0.5)')
    drawChannel(b, 'rgba(60,120,220,0.5)')
  }, [data])

  return (
    <div className="histogram-box">
      <canvas ref={canvasRef} className="histogram-canvas" width={258} height={60} />
    </div>
  )
}
