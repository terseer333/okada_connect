import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'logo-light' : ''}`} aria-label="Okada Connect">
      <div className="logo-mark">
        <span className="logo-wheel logo-wheel-one" />
        <span className="logo-wheel logo-wheel-two" />
        <span className="logo-road" />
      </div>
      <div className="logo-type">
        <strong>
          <span>OKADA</span> CONNECT
        </strong>
        <small>FAST · SAFE · RELIABLE</small>
      </div>
    </div>
  )
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>
      <span /> {children}
    </div>
  )
}

/**
 * Animated hero artwork: a rider on a commuter motorcycle, an active route
 * and the live-tracking cards (README: location is core to the product).
 */
export function RiderIllustration() {
  return (
    <div className="hero-visual" aria-label="Live ride status cards">
      <div className="floating-card driver-card">
        <span className="avatar">AO</span>
        <span>
          <b>Ahmed is arriving</b>
          <small>Verified rider · 4.9</small>
        </span>
        <em>2 min</em>
      </div>
      <div className="floating-card safety-card">
        <span className="floating-icon">
          <Icon name="shield" />
        </span>
        <span>
          <b>Trip protected</b>
          <small>Live safety monitoring</small>
        </span>
      </div>
      <div className="floating-card live-location-card">
        <span className="live-location-icon">
          <Icon name="location" size={18} />
        </span>
        <span>
          <b>
            Location active <i />
          </b>
          <small>Updating now · City Centre</small>
        </span>
      </div>
    </div>
  )
}
