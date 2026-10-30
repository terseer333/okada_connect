import type { ReactNode } from "react"

export type FeatureCardKind = "tracking" | "safety" | "pickup"

interface FeatureArtworkProps {
  kind: FeatureCardKind
  className?: string
}

export type FeatureIconName = "location" | "shield" | "bolt"

/**
 * Solid icon badges matching the reference design circles.
 */
export function FeatureBadgeIcon({ name }: { name: FeatureIconName }): ReactNode {
  switch (name) {
    case "location":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      )
    case "shield":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case "bolt":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Pixel-perfect SVG artwork for the Live Tracking feature card.
 * Features a tilted smartphone displaying a street map, live navigation route,
 * red destination pin with 2.4 km badge tooltip, and an okada rider.
 */
export function LiveTrackingArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`feature-art-svg ${className}`}
      viewBox="0 0 135 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Soft light-blue background blob */}
      <ellipse cx="84" cy="51" rx="48" ry="46" fill="#e0f2fe" opacity="0.95" />

      {/* Tilted phone mockup (-6 degrees) */}
      <g transform="translate(22, 0) rotate(-6 52 50)">
        {/* Dark phone chassis with shadow */}
        <rect
          x="20"
          y="3"
          width="68"
          height="95"
          rx="15"
          fill="#0f172a"
          filter="drop-shadow(0 4px 8px rgba(15, 23, 42, 0.15))"
        />
        <rect x="22.5" y="5.5" width="63" height="90" rx="12.5" fill="#f8fafc" />

        {/* Top speaker notch and camera dot */}
        <rect x="46" y="7" width="16" height="2.6" rx="1.3" fill="#0f172a" />
        <circle cx="40" cy="8.3" r="1.1" fill="#0f172a" />

        {/* Map display clipped to screen */}
        <clipPath id="feature-phone-screen-clip">
          <rect x="22.5" y="5.5" width="63" height="90" rx="12.5" />
        </clipPath>
        <g clipPath="url(#feature-phone-screen-clip)">
          {/* Map canvas */}
          <rect x="22.5" y="5.5" width="63" height="90" fill="#f1f5f9" />

          {/* Map street grid with soft perspective */}
          <path
            d="M 12 28 L 92 24 M 12 52 L 92 48 M 12 76 L 92 72"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 40 4 L 38 96 M 68 4 L 66 96"
            stroke="#ffffff"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d="M 26 4 L 78 96"
            stroke="#ffffff"
            strokeWidth="6"
            opacity="0.8"
          />

          {/* Blue navigation route */}
          <path
            d="M 37 72 Q 46 68 50 56 T 54 45 T 68 38"
            fill="none"
            stroke="#0066ff"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Red destination map pin */}
          <g transform="translate(63.5, 24)">
            <path
              d="M 6 0 C 2.7 0 0 2.7 0 6 C 0 10.5 6 16.5 6 16.5 C 6 16.5 12 10.5 12 6 C 12 2.7 9.3 0 6 0 Z"
              fill="#ef4444"
            />
            <circle cx="6" cy="5.8" r="2.2" fill="#ffffff" />
          </g>

          {/* 2.4 km badge tooltip pointing down to pin */}
          <g transform="translate(37, 7)">
            <rect x="0" y="0" width="46" height="17" rx="8.5" fill="#0066ff" />
            <polygon points="31,17 37,17 34,20" fill="#0066ff" />
            {/* Radar / bullseye icon */}
            <circle cx="7.5" cy="8.5" r="3.4" fill="#ffffff" />
            <circle cx="7.5" cy="8.5" r="1.6" fill="#0066ff" />
            <text
              x="14"
              y="12"
              fill="#ffffff"
              fontSize="7.8"
              fontWeight="800"
              fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
            >
              2.4 km
            </text>
          </g>

          {/* Okada rider on bike */}
          <g transform="translate(27, 62)">
            {/* Motorcycle wheels */}
            <circle cx="5" cy="13" r="4.5" fill="#1e293b" />
            <circle cx="5" cy="13" r="2.3" fill="#cbd5e1" />
            <circle cx="16" cy="10" r="4.5" fill="#1e293b" />
            <circle cx="16" cy="10" r="2.3" fill="#cbd5e1" />
            {/* Red bike body */}
            <path d="M 4 11 L 12 11 L 15 7 L 9 7 Z" fill="#ef4444" />
            {/* Handlebars */}
            <path
              d="M 11 6 L 12 10"
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Yellow rider shirt */}
            <path d="M 8 1 L 12 6 L 9 7 Z" fill="#facc15" />
            {/* Red helmet */}
            <circle cx="8.5" cy="-2" r="3.5" fill="#ef4444" />
          </g>
        </g>
      </g>
    </svg>
  )
}

/**
 * Pixel-perfect SVG artwork for the Safety First feature card.
 * Features a soft red aura, concentric ring, red sparks, and a 3D two-tone
 * red shield with a clean white halo and checkmark.
 */
export function SafetyFirstArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`feature-art-svg ${className}`}
      viewBox="0 0 135 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Soft red background blob */}
      <ellipse cx="78" cy="51" rx="46" ry="44" fill="#fee2e2" opacity="0.9" />

      {/* Concentric subtle red ring */}
      <ellipse
        cx="78"
        cy="51"
        rx="38"
        ry="38"
        fill="none"
        stroke="#fca5a5"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Radiating red sparks */}
      <line
        x1="106"
        y1="25"
        x2="114"
        y2="19"
        stroke="#ef2435"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <line
        x1="110"
        y1="34"
        x2="118"
        y2="34"
        stroke="#ef2435"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <line
        x1="41"
        y1="67"
        x2="49"
        y2="67"
        stroke="#ef2435"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="76"
        x2="52"
        y2="71"
        stroke="#ef2435"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* White protective halo border */}
      <path
        d="M 78 17 C 94 17, 102 23, 102 38 C 102 59, 78 75, 78 75 C 78 75, 54 59, 54 38 C 54 23, 62 17, 78 17 Z"
        fill="#ffffff"
        filter="drop-shadow(0 4px 10px rgba(239, 36, 53, 0.2))"
      />

      {/* Two-tone 3D red shield */}
      <g>
        {/* Left half: vivid red */}
        <path
          d="M 78 21 C 64 21, 58 26, 58 38 C 58 55, 78 70, 78 70 L 78 21 Z"
          fill="#ef2435"
        />
        {/* Right half: deeper rich red */}
        <path
          d="M 78 21 C 92 21, 98 26, 98 38 C 98 55, 78 70, 78 70 L 78 21 Z"
          fill="#dc2626"
        />
      </g>

      {/* Crisp white checkmark */}
      <path
        d="M 67 43.5 L 75 51.5 L 89 36.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Pixel-perfect SVG artwork for the Fast Pickup feature card.
 * Features an amber aura, 4 horizontal speed motion lines, and a golden orange
 * stopwatch showing rapid time.
 */
export function FastPickupArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`feature-art-svg ${className}`}
      viewBox="0 0 135 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Soft cream/amber background blob */}
      <ellipse cx="80" cy="51" rx="46" ry="44" fill="#fef3c7" opacity="0.95" />

      {/* 4 horizontal motion speed lines */}
      <line
        x1="28"
        y1="37"
        x2="52"
        y2="37"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="49"
        x2="57"
        y2="49"
        stroke="#f59e0b"
        strokeWidth="4.8"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="61"
        x2="52"
        y2="61"
        stroke="#f59e0b"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <line
        x1="35"
        y1="72"
        x2="50"
        y2="72"
        stroke="#f59e0b"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Golden stopwatch assembly */}
      <g transform="translate(83, 53)">
        {/* Crown button & stem */}
        <rect x="-4" y="-37" width="8" height="6.5" rx="1.6" fill="#f59e0b" />
        <path
          d="M -7 -37 L 7 -37"
          stroke="#f59e0b"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* 45-degree angled pusher */}
        <rect
          x="15"
          y="-30"
          width="5"
          height="7.5"
          rx="1.6"
          fill="#f59e0b"
          transform="rotate(38 17.5 -26)"
        />

        {/* Outer stopwatch ring */}
        <circle
          cx="0"
          cy="0"
          r="29"
          fill="#f59e0b"
          filter="drop-shadow(0 4px 10px rgba(245, 158, 11, 0.25))"
        />

        {/* Inner white dial */}
        <circle cx="0" cy="0" r="22" fill="#ffffff" />

        {/* Hour tick marks */}
        <line
          x1="0"
          y1="-20"
          x2="0"
          y2="-16"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="0"
          x2="16"
          y2="0"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="20"
          x2="0"
          y2="16"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="-20"
          y1="0"
          x2="-16"
          y2="0"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="-14" r="1.4" fill="#f59e0b" />
        <circle cx="14" cy="14" r="1.4" fill="#f59e0b" />
        <circle cx="-14" cy="14" r="1.4" fill="#f59e0b" />
        <circle cx="-14" cy="-14" r="1.4" fill="#f59e0b" />

        {/* Clock hands */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-15"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="12"
          y2="-8"
          stroke="#f59e0b"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="0" cy="0" r="3" fill="#d97706" />
      </g>
    </svg>
  )
}

/** Unified router component for feature card illustrations */
export function FeatureCardArtwork({ kind, className = "" }: FeatureArtworkProps) {
  switch (kind) {
    case "tracking":
      return <LiveTrackingArtwork className={className} />
    case "safety":
      return <SafetyFirstArtwork className={className} />
    case "pickup":
      return <FastPickupArtwork className={className} />
    default:
      return null
  }
}
