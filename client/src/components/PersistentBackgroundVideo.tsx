import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'

type Mode = 'home' | 'auth' | 'wiping' | 'hidden'

export function PersistentBackgroundVideo() {
  const location = useLocation()
  const path = location.pathname
  const videoRef = useRef<HTMLVideoElement>(null)
  const [heroHeight, setHeroHeight] = useState<number | null>(null)

  const [mode, setMode] = useState<Mode>(() => {
    if (path === '/') return 'home'
    if (path === '/login' || path === '/register') return 'auth'
    return 'hidden'
  })

  const prevPathRef = useRef(path)

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = path

    const isPrevAuth = prev === '/login' || prev === '/register'
    const isNowDash = path === '/customer' || path === '/rider'

    if (isPrevAuth && isNowDash) {
      // Trigger wipe-out transition when entering dashboard
      setMode('wiping')
      const timer = setTimeout(() => {
        setMode('hidden')
      }, 850)
      return () => clearTimeout(timer)
    }

    if (path === '/') {
      setMode('home')
    } else if (path === '/login' || path === '/register') {
      setMode('auth')
    } else if (isNowDash) {
      setMode('hidden')
    }
  }, [path])

  // Dynamically measure hero section height across all screen sizes
  useEffect(() => {
    if (mode !== 'home') return

    const measureHero = () => {
      const hero = document.querySelector('.hero-section')
      if (hero) {
        setHeroHeight(hero.getBoundingClientRect().height)
      }
    }

    measureHero()
    window.addEventListener('resize', measureHero)

    const hero = document.querySelector('.hero-section')
    let observer: ResizeObserver | null = null
    if (hero && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measureHero())
      observer.observe(hero)
    }

    return () => {
      window.removeEventListener('resize', measureHero)
      if (observer) observer.disconnect()
    }
  }, [mode])

  // Keep playback continuous and handle autoplay smoothly
  useEffect(() => {
    if (mode !== 'hidden' && videoRef.current) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay handled by muted/playsInline
        })
      }
    }
  }, [mode])

  if (mode === 'hidden') {
    return null
  }

  const containerStyle: CSSProperties = {}
  if (mode === 'home' && heroHeight) {
    containerStyle.height = `${heroHeight}px`
  }

  return (
    <div
      className={`persistent-video-wrap mode-${mode}`}
      style={containerStyle}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="persistent-video-element"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
      <div className={`persistent-video-overlay overlay-${mode}`} />
    </div>
  )
}
