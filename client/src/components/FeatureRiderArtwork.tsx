import type { ReactNode } from "react"

export type FeatureGoalKind = "tracking" | "safety" | "pickup"

interface FeatureRiderArtworkProps {
  kind: FeatureGoalKind
}

/**
 * Signature Okada Connect Motorcycle & Rider.
 * Kept strictly identical across all feature cards to maintain brand
 * consistency and a unified character design.
 */
function SignatureMotorcycleAndRider() {
  return (
    <g id="signature-bike-and-rider" className="signature-bike-rider">
      {/* Shadow under tires and chassis */}
      <ellipse cx="240" cy="226" rx="145" ry="10" fill="rgba(16, 44, 66, 0.18)" />

      {/* REAR WHEEL ASSEMBLY */}
      <g id="rear-wheel">
        {/* Tire */}
        <circle cx="150" cy="195" r="34" fill="#1e293b" />
        <circle cx="150" cy="195" r="25" fill="#334155" />
        <circle cx="150" cy="195" r="23" fill="#0f172a" />
        {/* Rim & spokes */}
        <circle cx="150" cy="195" r="18" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="150" y1="177" x2="150" y2="213" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="132" y1="195" x2="168" y2="195" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="137" y1="182" x2="163" y2="208" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="137" y1="208" x2="163" y2="182" stroke="#cbd5e1" strokeWidth="1.8" />
        {/* Brake Disc & Caliper */}
        <circle cx="150" cy="195" r="11" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
        <rect x="156" y="188" width="7" height="10" rx="2" fill="#e14949" />
        {/* Center Axle Nut */}
        <circle cx="150" cy="195" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
      </g>

      {/* FRONT WHEEL ASSEMBLY */}
      <g id="front-wheel">
        {/* Tire */}
        <circle cx="335" cy="195" r="34" fill="#1e293b" />
        <circle cx="335" cy="195" r="25" fill="#334155" />
        <circle cx="335" cy="195" r="23" fill="#0f172a" />
        {/* Rim & spokes */}
        <circle cx="335" cy="195" r="18" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="335" y1="177" x2="335" y2="213" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="317" y1="195" x2="353" y2="195" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="322" y1="182" x2="348" y2="208" stroke="#cbd5e1" strokeWidth="1.8" />
        <line x1="322" y1="208" x2="348" y2="182" stroke="#cbd5e1" strokeWidth="1.8" />
        {/* Brake Disc & Caliper */}
        <circle cx="335" cy="195" r="12" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
        <rect x="323" y="188" width="7" height="10" rx="2" fill="#e14949" />
        {/* Center Axle Nut */}
        <circle cx="335" cy="195" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
      </g>

      {/* EXHAUST SYSTEM */}
      <path
        d="M 230 196 C 215 204, 185 208, 140 205"
        fill="none"
        stroke="#475569"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 195 203 L 135 204"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 142 201 L 135 204"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="7"
      />

      {/* SWINGARM & REAR SUSPENSION */}
      <path
        d="M 150 195 L 210 185"
        stroke="#334155"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Rear mono-shock / dual-shock coil spring */}
      <line x1="165" y1="190" x2="195" y2="155" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
      <line x1="165" y1="190" x2="195" y2="155" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="3 3" />

      {/* ENGINE BLOCK & TRANSMISSION */}
      <path
        d="M 210 168 L 260 168 L 265 198 L 215 202 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="2"
      />
      {/* Engine Cooling Fins */}
      <line x1="220" y1="174" x2="255" y2="174" stroke="#475569" strokeWidth="2" />
      <line x1="220" y1="180" x2="257" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="222" y1="186" x2="258" y2="186" stroke="#475569" strokeWidth="2" />
      <line x1="225" y1="192" x2="255" y2="192" stroke="#475569" strokeWidth="2" />
      {/* Crankcase badge */}
      <circle cx="236" cy="186" r="6" fill="#e14949" />

      {/* MAIN FRAME / CHASSIS */}
      <path
        d="M 205 180 L 285 130"
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 160 152 L 235 152 L 285 130"
        fill="none"
        stroke="#1e293b"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* FRONT TELESCOPIC FORK */}
      <line x1="290" y1="126" x2="335" y2="195" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
      <line x1="293" y1="130" x2="320" y2="172" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
      {/* Front Mudguard */}
      <path
        d="M 315 170 C 330 160, 355 165, 360 178"
        fill="none"
        stroke="#102c42"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* FUEL TANK - Okada Connect Signature Red & Navy */}
      <path
        d="M 230 148 C 235 128, 260 120, 288 128 C 290 138, 280 152, 235 152 Z"
        fill="#e14949"
        stroke="#991b1b"
        strokeWidth="1.5"
      />
      {/* Tank Livery Accent */}
      <path
        d="M 245 136 C 260 130, 275 132, 283 138 C 278 145, 262 148, 245 146 Z"
        fill="#102c42"
      />
      <path
        d="M 252 138 C 265 135, 275 137, 280 141"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* DUAL SEAT (Rider + Passenger Pillion) */}
      <path
        d="M 160 148 C 170 145, 185 145, 205 145 C 220 145, 235 148, 240 152 C 225 155, 175 154, 160 148 Z"
        fill="#0f172a"
      />
      {/* Passenger Grab Rail & Tail Light */}
      <path
        d="M 152 147 C 158 142, 165 142, 172 144"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Rear Tail Light */}
      <rect x="146" y="148" width="5" height="7" rx="1.5" fill="#ef4444" />

      {/* HANDLEBARS & CONTROLS */}
      <line x1="288" y1="126" x2="280" y2="108" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
      <line x1="272" y1="108" x2="295" y2="108" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
      {/* Left & Right Grips */}
      <rect x="270" y="106" width="6" height="5" rx="1" fill="#475569" />
      <rect x="290" y="106" width="6" height="5" rx="1" fill="#475569" />
      {/* Rearview Mirror */}
      <line x1="275" y1="108" x2="270" y2="96" stroke="#64748b" strokeWidth="2" />
      <ellipse cx="270" cy="94" rx="4" ry="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
      {/* Phone Navigation Mount on Handlebar */}
      <rect x="282" y="101" width="6" height="9" rx="1" fill="#0284c7" stroke="#0f172a" strokeWidth="1" />
      <rect x="283" y="102" width="4" height="7" fill="#38bdf8" />

      {/* HEADLIGHT COWL & VISOR */}
      <path
        d="M 292 124 L 310 120 L 314 133 L 295 134 Z"
        fill="#e14949"
      />
      {/* Bright LED Headlight */}
      <path
        d="M 310 121 C 314 125, 314 130, 311 133"
        fill="none"
        stroke="#fef08a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* ======================================================== */}
      {/* RIDER CHARACTER (Identical in every card)                */}
      {/* ======================================================== */}
      <g id="rider-body">
        {/* Foot & Lower Leg */}
        <path
          d="M 215 195 L 222 195 L 224 186 L 236 168 L 224 168 L 215 186 Z"
          fill="#0f172a"
        />
        {/* Footpeg */}
        <rect x="210" y="193" width="7" height="4" rx="1" fill="#94a3b8" />

        {/* Thigh & Riding Pants */}
        <path
          d="M 198 143 C 210 143, 230 152, 238 168 L 223 170 C 213 158, 204 153, 196 150 Z"
          fill="#1e293b"
        />

        {/* TORSO & OKADA CONNECT UNIFORM JACKET */}
        <path
          d="M 196 145 C 205 130, 222 105, 235 98 C 248 102, 255 116, 245 138 C 235 147, 215 148, 196 145 Z"
          fill="#102c42"
        />
        {/* High-Vis Okada Red & Silver Safety Stripe */}
        <path
          d="M 216 122 C 228 112, 238 111, 246 114 L 243 124 C 235 121, 225 122, 214 132 Z"
          fill="#e14949"
        />
        <path
          d="M 218 126 C 228 118, 237 118, 244 120"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="1.8"
        />

        {/* RIDER ARM & SLEEVE */}
        <path
          d="M 235 98 C 248 102, 266 108, 284 108 L 282 115 C 265 116, 248 110, 235 106 Z"
          fill="#102c42"
        />
        {/* Sleeve Safety Ring */}
        <path
          d="M 264 108 L 268 114"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Riding Glove on handlebar */}
        <ellipse cx="284" cy="111" rx="5" ry="4" fill="#0f172a" />

        {/* NECK */}
        <path d="M 237 92 L 244 88 L 248 94 Z" fill="#92400e" />

        {/* CERTIFIED SAFETY HELMET */}
        <g id="certified-helmet">
          {/* Main helmet shell */}
          <path
            d="M 230 84 C 228 66, 245 56, 260 58 C 269 60, 273 70, 270 82 C 260 88, 240 89, 230 84 Z"
            fill="#102c42"
          />
          {/* Okada Red Racing Decal Stripe on Helmet */}
          <path
            d="M 234 76 C 245 64, 258 64, 266 70 C 264 74, 255 71, 235 81 Z"
            fill="#e14949"
          />
          {/* Helmet Chin Guard */}
          <path
            d="M 252 82 C 260 83, 268 83, 270 80 L 268 86 C 262 88, 254 86, 252 82 Z"
            fill="#0f172a"
          />
          {/* Visor - Glossy Smoke Tint with Reflection */}
          <path
            d="M 256 68 C 266 69, 272 73, 270 78 C 264 79, 256 78, 254 74 Z"
            fill="#38bdf8"
            opacity="0.9"
          />
          <path
            d="M 259 70 C 265 71, 269 73, 268 76"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  )
}

/**
 * Goal-specific visual overlays applied to the exact same bike and rider.
 */
export function FeatureRiderArtwork({ kind }: FeatureRiderArtworkProps) {
  return (
    <svg
      viewBox="0 0 480 270"
      className="feature-rider-artwork-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        {/* Background Gradients */}
        <linearGradient id="bg-tracking" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f4fc" />
          <stop offset="50%" stopColor="#ecf8fc" />
          <stop offset="100%" stopColor="#d5eff9" />
        </linearGradient>

        <linearGradient id="bg-safety" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef0f2" />
          <stop offset="50%" stopColor="#fff5f6" />
          <stop offset="100%" stopColor="#fde4e7" />
        </linearGradient>

        <linearGradient id="bg-pickup" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9eb" />
          <stop offset="50%" stopColor="#fffcf2" />
          <stop offset="100%" stopColor="#fcedcf" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* BACKGROUND SCENE */}
      {kind === "tracking" && (
        <g id="bg-scene-tracking">
          <rect width="480" height="270" rx="14" fill="url(#bg-tracking)" />
          {/* Stylized digital map grid */}
          <line x1="0" y1="70" x2="480" y2="70" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <line x1="0" y1="130" x2="480" y2="130" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <line x1="0" y1="190" x2="480" y2="190" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <line x1="120" y1="0" x2="120" y2="270" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="240" y1="0" x2="240" y2="270" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="360" y1="0" x2="360" y2="270" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />

          {/* Glowing GPS Route Path underneath the rider */}
          <path
            d="M 20 226 C 90 226, 170 226, 270 226 C 360 226, 410 220, 440 185"
            stroke="#0284c7"
            strokeWidth="8"
            strokeLinecap="round"
            strokeOpacity="0.85"
            filter="url(#glow-blue)"
          />
          <path
            d="M 20 226 C 90 226, 170 226, 270 226 C 360 226, 410 220, 440 185"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />

          {/* Destination Pin Marker */}
          <g transform="translate(434, 155)">
            <ellipse cx="6" cy="28" rx="8" ry="3" fill="rgba(2, 132, 199, 0.25)" />
            <path
              d="M 6 0 C 1 0, -3 4, -3 10 C -3 16, 6 26, 6 26 C 6 26, 15 16, 15 10 C 15 4, 11 0, 6 0 Z"
              fill="#e14949"
            />
            <circle cx="6" cy="9" r="3.5" fill="#ffffff" />
          </g>
        </g>
      )}

      {kind === "safety" && (
        <g id="bg-scene-safety">
          <rect width="480" height="270" rx="14" fill="url(#bg-safety)" />
          {/* Concentric safety protection aura */}
          <circle cx="250" cy="135" r="120" stroke="#fecdd3" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.6" />
          <circle cx="250" cy="135" r="95" stroke="#fecdd3" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.5" />
          {/* Road */}
          <rect x="0" y="222" width="480" height="48" fill="#fce7ec" opacity="0.6" />
          <line x1="0" y1="222" x2="480" y2="222" stroke="#fda4af" strokeWidth="2" />
        </g>
      )}

      {kind === "pickup" && (
        <g id="bg-scene-pickup">
          <rect width="480" height="270" rx="14" fill="url(#bg-pickup)" />
          {/* Sonar / Radar rings radiating outward */}
          <circle cx="240" cy="175" r="70" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4 6" fill="none" opacity="0.6" />
          <circle cx="240" cy="175" r="110" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="6 8" fill="none" opacity="0.4" />
          <circle cx="240" cy="175" r="150" stroke="#fcd34d" strokeWidth="1" strokeDasharray="8 10" fill="none" opacity="0.25" />

          {/* Road with speed streaks */}
          <rect x="0" y="222" width="480" height="48" fill="#fef3c7" opacity="0.5" />
          <line x1="0" y1="222" x2="480" y2="222" stroke="#f59e0b" strokeWidth="2" />
          <line x1="40" y1="210" x2="110" y2="210" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="20" y1="200" x2="80" y2="200" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <line x1="50" y1="188" x2="100" y2="188" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
        </g>
      )}

      {/* ======================================================== */}
      {/* THE SAME MOTORCYCLE AND RIDER IN ALL CARDS              */}
      {/* ======================================================== */}
      <SignatureMotorcycleAndRider />

      {/* ======================================================== */}
      {/* GOAL-SPECIFIC HUD CARDS & ANNOTATIONS                   */}
      {/* ======================================================== */}

      {/* 1. LIVE TRACKING GOAL OVERLAYS */}
      {kind === "tracking" && (
        <g id="hud-tracking">
          {/* Telemetry HUD card (top right) */}
          <g transform="translate(290, 20)">
            <rect width="170" height="56" rx="10" fill="rgba(255, 255, 255, 0.94)" stroke="#bae6fd" strokeWidth="1.2" />
            <circle cx="16" cy="18" r="4" fill="#0284c7" />
            <text x="26" y="22" fill="#0369a1" fontSize="10.5" fontWeight="800" letterSpacing="0.4">
              LIVE ROUTE ACTIVE
            </text>
            <text x="14" y="44" fill="#0f172a" fontSize="12" fontWeight="800">
              ETA: 4 MIN <tspan fill="#64748b" fontSize="10.5" fontWeight="500">· 1.6 km</tspan>
            </text>
          </g>

          {/* Live GPS Coordinates Pill (top left) */}
          <g transform="translate(20, 20)">
            <rect width="138" height="26" rx="13" fill="rgba(255, 255, 255, 0.92)" stroke="#e0f2fe" strokeWidth="1" />
            <circle cx="12" cy="13" r="3.5" fill="#10b981" />
            <text x="22" y="17" fill="#334155" fontSize="9.5" fontWeight="700">
              Turn-by-turn GPS
            </text>
          </g>
        </g>
      )}

      {/* 2. SAFETY FIRST GOAL OVERLAYS */}
      {kind === "safety" && (
        <g id="hud-safety">
          {/* Certified Rider & Safety Shield HUD (top right) */}
          <g transform="translate(285, 20)">
            <rect width="175" height="56" rx="10" fill="rgba(255, 255, 255, 0.94)" stroke="#fecdd3" strokeWidth="1.2" />
            {/* Shield Icon */}
            <path
              d="M 18 13 L 26 10 L 34 13 C 34 22, 26 27, 26 27 C 26 27, 18 22, 18 13 Z"
              fill="#e14949"
            />
            <path d="M 23 18 L 25 20 L 29 15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="40" y="21" fill="#991b1b" fontSize="10.5" fontWeight="800" letterSpacing="0.4">
              TRIP PROTECTED
            </text>
            <text x="14" y="44" fill="#0f172a" fontSize="12" fontWeight="800">
              100% Verified <tspan fill="#64748b" fontSize="10.5" fontWeight="500">· 24/7 SOS</tspan>
            </text>
          </g>

          {/* Helmet Compliance Callout */}
          <g transform="translate(140, 20)">
            <rect width="128" height="26" rx="13" fill="rgba(255, 255, 255, 0.92)" stroke="#fecdd3" strokeWidth="1" />
            <circle cx="12" cy="13" r="3.5" fill="#e14949" />
            <text x="21" y="17" fill="#881337" fontSize="9.5" fontWeight="700">
              ✓ Helmet & ID Checked
            </text>
          </g>
        </g>
      )}

      {/* 3. FAST PICKUP GOAL OVERLAYS */}
      {kind === "pickup" && (
        <g id="hud-pickup">
          {/* Instant Dispatch HUD (top right) */}
          <g transform="translate(285, 20)">
            <rect width="175" height="56" rx="10" fill="rgba(255, 255, 255, 0.94)" stroke="#fde68a" strokeWidth="1.2" />
            {/* Lightning Icon */}
            <path d="M 23 10 L 17 21 L 23 21 L 21 28 L 29 17 L 23 17 Z" fill="#d97706" />
            <text x="36" y="21" fill="#92400e" fontSize="10.5" fontWeight="800" letterSpacing="0.4">
              SMART DISPATCH
            </text>
            <text x="14" y="44" fill="#0f172a" fontSize="12" fontWeight="800">
              Arrival: &lt; 2 MIN <tspan fill="#64748b" fontSize="10.5" fontWeight="500">· 250m away</tspan>
            </text>
          </g>

          {/* Speed Match Pill */}
          <g transform="translate(145, 20)">
            <rect width="124" height="26" rx="13" fill="rgba(255, 255, 255, 0.92)" stroke="#fde68a" strokeWidth="1" />
            <circle cx="12" cy="13" r="3.5" fill="#d97706" />
            <text x="21" y="17" fill="#78350f" fontSize="9.5" fontWeight="700">
              ⚡ Matched in 12s
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
