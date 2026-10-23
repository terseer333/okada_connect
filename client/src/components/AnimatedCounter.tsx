import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  end: number
  decimals?: number
  suffix?: string
  accentSuffix?: string
  durationMs?: number
}

export function AnimatedCounter({
  end,
  decimals = 0,
  suffix = '',
  accentSuffix = '',
  durationMs = 2000,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [complete, setComplete] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const startCounting = () => {
      if (hasAnimatedRef.current) return
      hasAnimatedRef.current = true

      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / durationMs, 1)

        // Ease-out cubic for a lively start that gently settles at the target
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const current = easeProgress * end

        setCount(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
          setComplete(true)
        }
      }

      requestAnimationFrame(animate)
    }

    // Trigger before the user fully reaches the stats section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startCounting()
          }
        })
      },
      {
        // 250px top margin allows numbers to load and animate before arriving at this point
        rootMargin: '250px 0px 100px 0px',
        threshold: 0.05,
      }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [end, durationMs])

  const formattedNumber =
    decimals > 0 ? count.toFixed(decimals) : Math.round(count).toString()

  return (
    <span
      ref={containerRef}
      className={`stat-counter ${complete ? 'stat-complete' : ''}`}
    >
      {formattedNumber}{suffix}
      {accentSuffix && <span>{accentSuffix}</span>}
    </span>
  )
}
