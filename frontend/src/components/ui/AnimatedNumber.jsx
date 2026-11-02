import { useEffect, useRef, useState } from 'react'

// Counts smoothly from the previous value to the new one
function AnimatedNumber({ value, duration = 500, suffix = '' }) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    const finish = () => {
      fromRef.current = value
      setShown(value)
    }
    // No animation when nothing changed, motion is reduced, or the tab is hidden (rAF is paused there)
    if (from === value || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(from + (value - from) * eased)
      fromRef.current = current
      setShown(current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // Guarantee the final value even if animation frames stop being delivered
    const fallback = setTimeout(finish, duration + 100)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
    }
  }, [value, duration])

  return (
    <>
      {shown}
      {suffix}
    </>
  )
}

export default AnimatedNumber
