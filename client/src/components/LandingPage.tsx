import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className="landing-page-wrapper">
      <section className="hero-section">
        {/* Background Video */}
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.webp"
        >
          <source
            src="/Creating_animated_AI_video_1080p_20260927052941.mp4"
            type="video/mp4"
          />
        </video>

        {/* Subtle Overlay for text readability */}
        <div className="hero-overlay"></div>

        {/* Hero Content */}
        <div className="hero-content">
          <span className="hero-eyebrow">AI-POWERED VOICE SECURITY</span>
          <h1 className="hero-headline">
            Real-time AI Defense<br />
            <span className="highlight">Against Voice Scams</span>
          </h1>
          <p className="hero-subtext">Don't trust the voice. Verify the action.</p>

          <div className="hero-buttons">
            <Link to="/app" className="btn btn-primary" id="try-dhwani-ai-btn">
              Try Dhwani AI &rarr;
            </Link>
            <a
              href="https://drive.google.com/drive/folders/1FW-ac9awRK2J0J1oe7HMyBwVmvjSl6MC"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <svg
                className="play-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              See How It Works
            </a>
          </div>

          {/* Compact Protection Flow */}
          <div className="protection-flow">
            <div className="flow-step highlight-step">DETECT Voice</div>
            <div className="flow-arrow">&rarr;</div>
            <div className="flow-step">SCORE</div>
            <div className="flow-arrow">&rarr;</div>
            <div className="flow-step">CHALLENGE</div>
            <div className="flow-arrow">&rarr;</div>
            <div className="flow-step">VERIFY</div>
            <div className="flow-arrow">&rarr;</div>
            <div className="flow-step">PROTECT</div>
          </div>
        </div>

        {/* Mute/Unmute Toggle */}
        <button
          id="mute-toggle"
          className="glass-mute-btn"
          aria-label="Toggle Mute"
          onClick={toggleMute}
          type="button"
        >
          {isMuted ? (
            /* SVG for Volume Muted */
            <svg
              id="icon-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            /* SVG for Volume High */
            <svg
              id="icon-unmuted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
      </section>
    </div>
  );
}
