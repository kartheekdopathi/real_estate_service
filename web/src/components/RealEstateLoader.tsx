export default function RealEstateLoader() {
  return (
    <div className="loader-screen" role="status" aria-live="polite" aria-label="Loading page">
      <div className="loader-orb loader-orb-one" />
      <div className="loader-orb loader-orb-two" />

      <div className="loader-card">
        <div className="loader-icon-shell">
          <div className="loader-ping-ring" />
          <div className="loader-icon-core">
            <svg viewBox="0 0 96 96" className="loader-house" aria-hidden="true">
              <defs>
                <linearGradient id="houseGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <path
                d="M18 44.5 48 20l30 24.5"
                fill="none"
                stroke="url(#houseGlow)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28 41.5V72a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V41.5"
                fill="rgba(15,23,42,0.72)"
                stroke="url(#houseGlow)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42 76V56a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v20"
                fill="none"
                stroke="url(#houseGlow)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="56" y="50" width="8" height="8" rx="2" fill="#67e8f9" opacity="0.9" />
            </svg>
          </div>
        </div>

        <div className="loader-copy">
          <p className="loader-title">Real Estate Service</p>
          <p className="loader-subtitle">Opening your property experience...</p>
        </div>

        <div className="loader-progress">
          <span className="loader-progress-bar" />
        </div>
      </div>
    </div>
  );
}
