import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const video = document.getElementById('home-bg-video') as HTMLVideoElement | null;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className="landing-page-wrapper">
      <section className="hero-section">

        {/* Hero Content */}
        <div className="hero-content">
          <span className="hero-eyebrow font-kaushan text-emerald-400 tracking-widest text-sm">
            AI-POWERED VOICE SECURITY
          </span>
          <h1 className="hero-headline">
            Real-time AI Defense<br />
            <span className="font-serif italic font-normal text-cyan-300 tracking-wide">Against Voice Scams</span>
          </h1>
          <p className="hero-subtext font-satisfy text-xl sm:text-2xl text-teal-200/95 font-normal tracking-wide">
            &ldquo;Don&apos;t trust the voice. Verify the action.&rdquo;
          </p>

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

        <button
          id="mute-toggle"
          className="glass-mute-btn"
          aria-label="Toggle Mute"
          onClick={toggleMute}
          type="button"
        >
          {isMuted ? (
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
