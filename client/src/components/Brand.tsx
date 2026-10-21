import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { RiderFigure } from './RiderFigure'

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
    <div className="hero-visual" aria-label="Okada rider travelling through the city">
      <div className="sun" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="location-grid">
        <span>Central Market</span>
        <span>Victoria Ave.</span>
        <span>City Centre</span>
      </div>
      <div className="city">
        {[44, 72, 106, 62, 130, 82, 118, 55, 98, 70, 125, 88].map((height, index) => (
          <i key={index} style={{ height }} />
        ))}
      </div>
      <div className="route-line">
        <span />
        <span />
        <span />
        <i className="moving-location">
          <Icon name="location" size={15} />
        </i>
      </div>
      <div className="ground-road">
        <i />
        <i />
        <i />
      </div>
      <div className="rider">
        <img
          className="motorcycle-photo"
          src="/commuter-motorcycle-reference.png"
          alt="Red commuter motorcycle"
        />
        <div className="mounted-rider">
          <RiderFigure />
        </div>
      </div>
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
