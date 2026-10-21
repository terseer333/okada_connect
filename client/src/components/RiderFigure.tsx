/**
 * The okada rider, drawn as a single inline SVG so the figure scales cleanly
 * and layers onto the motorcycle photograph.
 *
 * Brief: a man seen from the side three-quarter view, natural relaxed posture,
 * hands on the handlebars. Red full-face helmet with the visor up, yellow vest
 * with OKADA across the chest, dark trousers. Daylight shading with a
 * consistent light direction (from the upper left, matching the sun in the
 * scene). `viewBox` is the figure only — the parent positions it over the bike.
 */
export function RiderFigure({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`rider-figure ${className}`}
      viewBox="0 0 300 340"
      role="img"
      aria-label="An okada rider in a red helmet and yellow OKADA vest on a motorcycle"
    >
      <defs>
        {/* Skin: warm mid-tone with the light falling from the upper left. */}
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c98a5e" />
          <stop offset="55%" stopColor="#a86a41" />
          <stop offset="100%" stopColor="#7d4a2b" />
        </linearGradient>
        <linearGradient id="skinHand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b87a50" />
          <stop offset="100%" stopColor="#824f30" />
        </linearGradient>
        {/* Helmet shell: saturated red, deeper on the shadow side. */}
        <linearGradient id="helmet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4a55" />
          <stop offset="45%" stopColor="#e01526" />
          <stop offset="100%" stopColor="#9c0d1b" />
        </linearGradient>
        {/* Yellow safety vest, shadowed along the rider's back. */}
        <linearGradient id="vest" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd95c" />
          <stop offset="45%" stopColor="#f6c22f" />
          <stop offset="100%" stopColor="#cf9508" />
        </linearGradient>
        {/* Dark trousers. */}
        <linearGradient id="trouser" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a4b5c" />
          <stop offset="55%" stopColor="#22313f" />
          <stop offset="100%" stopColor="#141f2a" />
        </linearGradient>
        <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4fbff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bcd3e2" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* ---- Leg: hip forward to the peg, knee bent, foot on the peg -------- */}
      <g id="rider-leg">
        <path
          d="M104 214 C112 244 118 262 128 276 L128 296 C128 302 132 306 138 306 L166 306
             C172 306 175 302 173 296 L160 258 C154 240 148 226 142 214 Z"
          fill="url(#trouser)"
        />
        {/* Boot, toes forward over the peg. */}
        <path
          d="M126 292 L176 292 C184 292 189 296 189 302 L189 310 C189 316 184 320 176 320
             L126 320 C118 320 114 316 114 310 L114 302 C114 296 118 292 126 292 Z"
          fill="#101a24"
        />
        <path d="M116 300 L188 300" stroke="#2c3d4d" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* ---- Torso: leaning slightly forward, shoulders above the tank ------ */}
      <g id="rider-torso-group">
        <path
          d="M96 128 C104 108 128 96 152 98 C178 100 196 114 200 136
             C204 160 198 190 188 210 C180 226 166 234 148 234
             C126 234 108 222 100 200 C93 178 90 150 96 128 Z"
          fill="url(#vest)"
        />
        {/* Vest shading: the rider's back sits in shadow. */}
        <path
          d="M96 128 C104 108 128 96 152 98 C160 99 168 101 175 105
             C158 112 146 128 142 148 C137 172 139 200 148 234
             C126 234 108 222 100 200 C93 178 90 150 96 128 Z"
          fill="#b98206"
          opacity="0.35"
        />
        {/* Reflective bands across the vest. */}
        <path d="M104 168 L196 160" stroke="#ffffff" strokeWidth="5" strokeOpacity="0.55" strokeLinecap="round" />
        <path d="M108 192 L194 184" stroke="#ffffff" strokeWidth="5" strokeOpacity="0.4" strokeLinecap="round" />
        {/* Collar. */}
        <path
          d="M138 100 C150 94 166 96 176 104 C170 114 158 120 146 118 C140 112 137 106 138 100 Z"
          fill="#e0a81c"
        />
      </g>

      {/* ---- OKADA wordmark on the chest ----------------------------------- */}
      <text
        x="152"
        y="205"
        textAnchor="middle"
        fontFamily="Manrope, ui-sans-serif, system-ui, sans-serif"
        fontSize="21"
        fontWeight="800"
        letterSpacing="1"
        fill="#20343f"
        transform="rotate(-4 152 205)"
      >
        OKADA
      </text>

      {/* ---- Arm: shoulder to grip, elbow slightly bent ---------------------- */}
      <g id="rider-arm">
        <path
          d="M188 132 C206 138 222 152 236 170 L262 196
             C268 202 266 210 258 214 C251 217 244 216 239 210
             L210 180 C198 166 186 154 176 148 Z"
          fill="url(#vest)"
        />
        {/* Sleeve edge, then bare forearm. */}
        <path
          d="M196 146 C212 154 226 168 240 184 L258 202
             C262 206 262 210 258 214 C254 216 250 216 246 212
             L220 184 C208 170 198 158 190 152 Z"
          fill="url(#skin)"
        />
      </g>

      {/* ---- Hand gripping the bar ----------------------------------------- */}
      <g id="rider-hand">
        <path
          d="M252 196 C264 194 276 198 280 206 C284 214 280 222 268 224
             C258 226 250 220 248 212 C246 204 246 198 252 196 Z"
          fill="url(#skinHand)"
        />
        {/* Fingers curled over the grip. */}
        <path d="M256 202 C266 202 274 206 278 210" stroke="#6d4025" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M256 209 C266 209 274 212 277 216" stroke="#6d4025" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* ---- Neck ---------------------------------------------------------- */}
      <path
        d="M156 84 L180 84 C182 96 178 106 168 110 C158 112 152 106 152 96 Z"
        fill="url(#skin)"
      />

      {/* ---- Head: three-quarter profile facing forward -------------------- */}
      <g id="rider-head">
        {/* Cranium + jaw. */}
        <path
          d="M138 46 C152 26 182 24 198 40 C210 52 214 70 210 86
             C206 102 194 116 176 120 C158 124 142 116 134 100
             C126 84 128 62 138 46 Z"
          fill="url(#skin)"
        />
        {/* Face shading toward the back of the head. */}
        <path
          d="M140 50 C150 34 170 28 186 34 C170 40 158 54 152 72
             C147 88 148 104 154 118 C142 112 132 96 133 78 C134 66 136 57 140 50 Z"
          fill="#7d4a2b"
          opacity="0.3"
        />
      </g>

      {/* ---- Helmet: red full-face, visor raised --------------------------- */}
      <g id="rider-helmet">
        {/* Shell over the crown and back of the skull. */}
        <path
          d="M126 62 C130 32 156 14 184 18 C210 22 226 42 224 70
             C223 84 218 94 210 100 L198 56 C188 40 166 34 150 44
             C140 50 133 58 130 68 Z"
          fill="url(#helmet)"
        />
        {/* Visor aperture, dark interior. */}
        <path
          d="M186 40 C200 44 208 58 206 74 C204 86 198 94 190 96
             L186 74 C186 62 185 50 186 40 Z"
          fill="#24404f"
        />
        {/* Visor flipped up above the brow. */}
        <path
          d="M178 34 C194 30 210 34 218 44 C222 49 220 54 214 55
             C204 47 190 45 178 48 Z"
          fill="url(#visor)"
        />
        <path
          d="M178 34 C194 30 210 34 218 44"
          stroke="#ffffff"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Chin guard sweeping forward. */}
        <path
          d="M192 84 C206 86 218 94 222 104 C224 111 220 117 212 118
             L186 116 C182 105 184 92 192 84 Z"
          fill="url(#helmet)"
        />
        {/* Brand stripe along the shell. */}
        <path d="M132 66 C140 46 156 32 176 28" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
      </g>

      {/* ---- Cast shadow on the tank/seat keeps the figure grounded -------- */}
      <ellipse cx="160" cy="236" rx="74" ry="14" fill="#0b1c28" opacity="0.16" />
    </svg>
  )
}
