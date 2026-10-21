import { useState, type ReactNode } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { useAuth } from "./context/AuthContext"
import { RiderFigure } from "./components/RiderFigure"
import Login from "./pages/Login"
import Register from "./pages/Register"
import CustomerDashboard from "./pages/CustomerDashboard"
import RiderDashboard from "./pages/RiderDashboard"

type IconName = "arrow" | "bolt" | "check" | "clock" | "eye" | "location" | "mail" | "menu" | "phone" | "play" | "shield" | "star" | "user"

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M10 5h4M11 18h2" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    shield: (
      <>
        <path d="M12 3 4 6v5c0 5 3.4 8.2 8 10 4.6-1.8 8-5 8-10V6l-8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    star: (
      <path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8l3-6Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="Okada Connect"
    >
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

function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <div className={`eyebrow ${light ? "eyebrow-light" : ""}`}>
      <span /> {children}
    </div>
  )
}

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

function RiderIllustration() {
  return (
    <div
      className="hero-visual"
      aria-label="Okada rider travelling through the city"
    >
      <div className="sun" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="location-grid">
        <span>Central Market</span>
        <span>Victoria Ave.</span>
        <span>City Centre</span>
      </div>
      <div className="city">
        {[44, 72, 106, 62, 130, 82, 118, 55, 98, 70, 125, 88].map(
          (height, index) => (
            <i key={index} style={{ height }} />
          ),
        )}
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

const features = [
  {
    icon: "location" as IconName,
    title: "Live tracking",
    text: "Follow every turn in real time and share your trip with people you trust.",
    accent: "blue",
  },
  {
    icon: "shield" as IconName,
    title: "Safety first",
    text: "Every rider is verified, every trip is monitored, and support is always close.",
    accent: "red",
  },
  {
    icon: "bolt" as IconName,
    title: "Faster pickups",
    text: "Smart matching finds the closest available rider so you spend less time waiting.",
    accent: "yellow",
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
            <a href="#home">Home</a>
            <a href="#why">Why us</a>
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
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
            10K<span>+</span>
          </strong>
          <p>Active riders</p>
        </div>
        <div>
          <strong>
            50K<span>+</span>
          </strong>
          <p>Happy customers</p>
        </div>
        <div>
          <strong>
            98<span>%</span>
          </strong>
          <p>On-time arrivals</p>
        </div>
        <div>
          <strong>
            4.9<span>/5</span>
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
              <div className={`feature-icon ${feature.accent}`}>
                <Icon name={feature.icon} size={28} />
              </div>
              <span className="feature-number">0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
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
  )
}
