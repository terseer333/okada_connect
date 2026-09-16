import { useRef, useState } from 'react';

const VROOMS = ['VROOM! 💨', 'FAST RIDE! ⚡', 'ZOOM! 🏍️', 'LET’S GO! 🟢'];

/**
 * Animated street scene: a bike rides across on a loop.
 * Click/tap the bike for a turbo boost (easter egg).
 */
export default function BikeScene() {
  const [turbo, setTurbo] = useState(false);
  const [vroom, setVroom] = useState(null); // { id, text }
  const vroomCount = useRef(0);

  function boost() {
    setVroom({ id: vroomCount.current++, text: VROOMS[vroomCount.current % VROOMS.length] });
    if (!turbo) {
      setTurbo(true);
      setTimeout(() => setTurbo(false), 2600);
    }
  }

  return (
    <div
      className={`road-scene relative h-40 overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-b from-sky-100 via-sky-50 to-green-50 shadow-inner ${
        turbo ? 'turbo' : ''
      }`}
    >
      {/* Skyline backdrop */}
      <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex items-end justify-around text-2xl text-emerald-900/15" aria-hidden>
        <span>🏥</span><span>🏢</span><span>🏬</span><span>🕌</span><span>🏭</span><span>🏢</span><span>🏬</span>
      </div>
      {/* Sun */}
      <div className="pointer-events-none absolute right-6 top-4 h-8 w-8 rounded-full bg-yellow-300 shadow-[0_0_24px_6px_rgba(253,224,71,0.8)]" aria-hidden />

      {/* Vroom bubble */}
      {vroom && (
        <div
          key={vroom.id}
          className="vroom pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-sm font-bold text-okada shadow-md"
        >
          {vroom.text}
        </div>
      )}

      {/* The bike (interactive) */}
      <button
        type="button"
        onClick={boost}
        aria-label="Turbo boost the bike"
        className="bike z-10 cursor-pointer select-none border-0 bg-transparent p-0 text-5xl focus:outline-none"
      >
        <span className="bike-body relative inline-block">
          🏍️
          <span className="trail absolute left-0 top-1/2 -z-10 -translate-y-1/2 whitespace-nowrap text-2xl" aria-hidden>
            💨💨💨
          </span>
        </span>
      </button>

      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-11 bg-gray-700">
        <div className="road-line absolute top-1/2 left-0 right-0 -translate-y-1/2" aria-hidden />
      </div>
    </div>
  );
}
