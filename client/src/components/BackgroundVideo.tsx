import { useState } from 'react'

interface BackgroundVideoProps {
  src?: string
  className?: string
  overlayClassName?: string
}

export function BackgroundVideo({
  src = '/background-video.mp4',
  className = '',
  overlayClassName = '',
}: BackgroundVideoProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`background-video-container ${className}`} aria-hidden="true">
      {!hasError && (
        <video
          className="background-video-element"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
        >
          <source src={src} type="video/mp4" />
          <source src={src.replace(/\.[^/.]+$/, '.webm')} type="video/webm" />
        </video>
      )}
      <div className={`background-video-overlay ${overlayClassName}`} />
    </div>
  )
}
