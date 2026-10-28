import { useState, type ReactNode } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { useAuth } from "./context/AuthContext"
import { PersistentBackgroundVideo } from "./components/PersistentBackgroundVideo"
import { AnimatedCounter } from "./components/AnimatedCounter"
import { Icon, type IconName } from "./components/Icon"
import { Logo, Eyebrow, RiderIllustration } from "./components/Brand"
import { FeatureRiderArtwork, type FeatureGoalKind } from "./components/FeatureRiderArtwork"
import Login from "./pages/Login"
import Register from "./pages/Register"
import CustomerDashboard from "./pages/CustomerDashboard"
import RiderDashboard from "./pages/RiderDashboard"

function Button({
  children,
  secondary = false,
  onClick,
}: {
  children: ReactNode
  secondary?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`button ${secondary ? "button-secondary" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface Feature {
  icon: IconName
  title: string
  text: string
  accent: "blue" | "red" | "yellow"
  goalKind: FeatureGoalKind
  badge: string
  goalTitle: string
  goalDescription: string
}

const features: Feature[] = [
  {
    icon: "location",
    title: "Live tracking",
    text: "Follow every turn in real time and share your trip with people you trust.",
    accent: "blue",
    goalKind: "tracking",
    badge: "Live GPS Active",
    goalTitle: "100% Real-Time Visibility",
    goalDescription: "Follow exact route milestones with real-time GPS tracking and live journey sharing with trusted contacts.",
  },
  {
    icon: "shield",
    title: "Safety first",
    text: "Every rider is verified, every trip is monitored, and support is always close.",
    accent: "red",
    goalKind: "safety",
    badge: "100% Verified",
    goalTitle: "Zero-Compromise Protection",
    goalDescription: "Vetted riders, mandatory helmet compliance, and 24/7 security monitoring protect every single kilometer.",
  },
  {
    icon: "bolt",
    title: "Fast pickup",
    text: "Smart matching finds the closest available rider so you spend less time waiting.",
    accent: "yellow",
    goalKind: "pickup",
    badge: "Under 3-Min Arrival",
    goalTitle: "Lightning-Fast Dispatch",
    goalDescription: "Smart proximity matching connects you to the nearest active rider to get you moving in under 3 minutes.",
  },
]

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  // Navigate in-app (keeps history + hash links working) then scroll up.
  const go = (path: string) => {
    navigate(path)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="site-shell">
      <section className="hero-section" id="home">
        <header className="nav container">
          <Logo />
          <nav
            className={menuOpen ? "nav-links open" : "nav-links"}
            aria-label="Main navigation"
          >
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#why" onClick={() => setMenuOpen(false)}>Why us</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#safety" onClick={() => setMenuOpen(false)}>Safety</a>
            <div className="mobile-nav-cta">
              <button
                className="text-button"
                onClick={() => {
                  setMenuOpen(false)
                  go("/login")
                }}
              >
                Sign in
              </button>
              <Button
                onClick={() => {
                  setMenuOpen(false)
                  go("/login?role=customer")
                }}
              >
                Book a ride <Icon name="arrow" size={17} />
              </Button>
            </div>
          </nav>
          <div className="nav-actions">
            <button className="text-button" onClick={() => go("/login")}>
              Sign in
            </button>
            <Button onClick={() => go("/login?role=customer")}>
              Book a ride <Icon name="arrow" size={17} />
            </Button>
          </div>
          <button
            className="menu-button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name="menu" />
          </button>
        </header>

        <div className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> Moving your city, safely
            </div>
            <h1>
              Your fastest way <br />
              to <span>move forward.</span>
            </h1>
            <p>
              Reliable rides, verified riders, and real-time tracking—everything
              you need to get there with confidence.
            </p>
            <div className="hero-actions">
              <Button onClick={() => go("/login?role=customer")}>
                Get moving <Icon name="arrow" size={18} />
              </Button>
              <button className="watch-button">
                <span>
                  <Icon name="play" size={18} />
                </span>{" "}
                See how it works
              </button>
            </div>
            <div className="trust-row">
              <div className="avatar-stack">
                <span>A</span>
                <span>K</span>
                <span>T</span>
                <span>+</span>
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <b>Trusted by 50,000+ riders</b>
              </div>
            </div>
          </div>
          <RiderIllustration />
        </div>
        <div className="hero-bottom-wave" />
      </section>

      <section
        className="stats container"
        aria-label="Okada Connect statistics"
      >
        <div>
          <strong>
            <AnimatedCounter end={10} suffix="K" accentSuffix="+" durationMs={1800} />
          </strong>
          <p>Active riders</p>
        </div>
        <div>
          <strong>
            <AnimatedCounter end={50} suffix="K" accentSuffix="+" durationMs={2000} />
          </strong>
          <p>Happy customers</p>
        </div>
        <div>
          <strong>
            <AnimatedCounter end={98} accentSuffix="%" durationMs={2100} />
          </strong>
          <p>On-time arrivals</p>
        </div>
        <div>
          <strong>
            <AnimatedCounter end={4.9} decimals={1} accentSuffix="/5" durationMs={1900} />
          </strong>
          <p>Average rating</p>
        </div>
      </section>

      <section className="why-section container" id="why">
        <div className="section-heading">
          <Eyebrow>Built around your journey</Eyebrow>
          <h2>
            More than a ride.
            <br />
            <span>Peace of mind.</span>
          </h2>
          <p>
            From the moment you book until you arrive, every detail is designed
            to make your journey effortless.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card-header">
                <div className={`feature-icon ${feature.accent}`}>
                  <Icon name={feature.icon} size={26} />
                </div>
                <span className="feature-number">0{index + 1}</span>
              </div>

              <div className="feature-media">
                <div className="feature-image-wrapper">
                  <FeatureRiderArtwork kind={feature.goalKind} />
                  <span className={`feature-media-badge ${feature.accent}`}>
                    {feature.badge}
                  </span>
                </div>
                <figure className="feature-image-caption">
                  <div className="caption-tag-row">
                    <span className="caption-tag">Goal Achieved</span>
                    <strong className="goal-title">{feature.goalTitle}</strong>
                  </div>
                  <p>{feature.goalDescription}</p>
                </figure>
              </div>

              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>

              <button className="learn-button">
                Learn more <Icon name="arrow" size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="container how-grid">
          <div className="phone-scene">
            <div className="map-lines" />
            <div className="phone-mockup">
              <div className="phone-top" />
              <div className="app-map">
                <Logo />
                <div className="mini-route">
                  <i />
                  <i />
                  <i />
                </div>
                <span className="mini-pin start">
                  <Icon name="location" size={16} />
                </span>
                <span className="mini-pin end">
                  <Icon name="location" size={16} />
                </span>
              </div>
              <div className="ride-panel">
                <small>YOUR RIDE</small>
                <b>Where are you going?</b>
                <div>
                  <span className="red-dot" /> Current location
                </div>
                <button>
                  Choose destination <Icon name="arrow" size={15} />
                </button>
              </div>
            </div>
            <div className="eta-badge">
              <Icon name="clock" />
              <span>
                <b>3 min</b>
                <small>Pickup time</small>
              </span>
            </div>
          </div>
          <div className="how-copy">
            <Eyebrow>Simple by design</Eyebrow>
            <h2>
              Your next ride is
              <br />
              <span>three taps away.</span>
            </h2>
            <div className="steps">
              <div>
                <b>1</b>
                <span>
                  <strong>Set your destination</strong>
                  <p>Tell us where you are and where you want to go.</p>
                </span>
              </div>
              <div>
                <b>2</b>
                <span>
                  <strong>Meet your rider</strong>
                  <p>Get matched instantly and track their arrival live.</p>
                </span>
              </div>
              <div>
                <b>3</b>
                <span>
                  <strong>Ride with confidence</strong>
                  <p>Enjoy a safe journey and pay your way.</p>
                </span>
              </div>
            </div>
            <Button onClick={() => go("/login?role=customer")}>
              Book your first ride <Icon name="arrow" size={18} />
            </Button>
          </div>
        </div>
      </section>

      <section className="safety-section container" id="safety">
        <div className="safety-card-main">
          <div className="safety-copy">
            <Eyebrow light>Your safety comes first</Eyebrow>
            <h2>
              Protected at every
              <br />
              point of the journey.
            </h2>
            <p>
              Every rider is identity-verified and every trip can be shared live
              with your trusted contacts.
            </p>
            <ul>
              <li>
                <Icon name="check" size={16} /> Verified and trained riders
              </li>
              <li>
                <Icon name="check" size={16} /> Live trip sharing
              </li>
              <li>
                <Icon name="check" size={16} /> 24/7 emergency support
              </li>
            </ul>
          </div>
          <div className="safety-orbit">
            <div className="shield-core">
              <Icon name="shield" size={54} />
            </div>
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="safety-chip chip-one">
              <Icon name="eye" />
              <span>
                <b>Always visible</b>
                <small>Real-time tracking</small>
              </span>
            </div>
            <div className="safety-chip chip-two">
              <Icon name="phone" />
              <span>
                <b>Always connected</b>
                <small>24/7 support</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <span>Ready when you are</span>
            <h2>Where to next?</h2>
            <p>Your reliable ride is only a few taps away.</p>
          </div>
          <Button secondary onClick={() => go("/login?role=customer")}>
            Book your ride <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <Logo light />
            <p>
              Fast. Safe. Reliable rides for the city that never stops moving.
            </p>
          </div>
          <div>
            <b>Company</b>
            <a href="#why">About us</a>
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
          </div>
          <div>
            <b>Support</b>
            <a href="#help">Help center</a>
            <a href="#contact">Contact us</a>
            <a href="#terms">Terms</a>
          </div>
          <div>
            <b>Get the app</b>
            <button className="store-button">
              <Icon name="phone" />
              <span>
                <small>AVAILABLE ON</small>App Store & Google Play
              </span>
            </button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2025 Okada Connect. All rights reserved.</span>
          <span>Built to move cities forward.</span>
        </div>
      </footer>
    </main>
  )
}

function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === "rider" ? "/rider" : "/customer"} replace />
  return <LandingPage />
}

/** Gate a route behind authentication (and optionally a single role). */
function Protected({ roles, children }: { roles?: Array<"customer" | "rider">; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-loading">
        <p>Loading…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "rider" ? "/rider" : "/customer"} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <div className="app-shell-root">
      <PersistentBackgroundVideo />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/customer"
          element={
            <Protected roles={["customer"]}>
              <CustomerDashboard />
            </Protected>
          }
        />
        <Route
          path="/rider"
          element={
            <Protected roles={["rider"]}>
              <RiderDashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
