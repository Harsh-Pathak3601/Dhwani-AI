import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarBorder from './StarBorder';
// import TextLoop from './TextLoop'; will implement later!!
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
            <StarBorder
              as={Link}
              to="/app"
              id="try-dhwani-ai-btn"
              color="#fbbf24"
              trailColor="#f59e0b"
              duration={3.5}
              direction="clockwise"
              stars={1}
              trailLength={0.35}
              thickness={1.5}
              radius={14}
              glow={0.9}
              hover="lap"
              sparkle={true}
              clickPulse
              theme="dark"
              backgroundColor="rgba(255, 255, 255, 0.09)"
              textColor="#ffffff"
              borderColor="rgba(245, 158, 11, 0.3)"
              className="btn font-bold text-white shadow-[0_8px_32px_rgba(0,0,0,0.36),0_0_20px_rgba(245,158,11,0.25)] hover:bg-white/[0.16] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Try Dhwani AI</span>
              <span className="text-amber-400 font-semibold">&rarr;</span>
            </StarBorder>
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

        {/* Dynamic Wave Ribbon Slogan Banner */}
        {/* <div className="w-full overflow-hidden my-0 py-0 absolute bottom-2 left-0 right-0 z-10 pointer-events-auto">
          <TextLoop
            text="Don't trust the voice ✦ Verify the action"
            shape="wave"
            speed={60}
            direction="forward"
            separator="✦"
            curviness={24}
            fontSize={21}
            fontWeight={800}
            letterSpacing={2.5}
            uppercase
            ribbon={true}
            ribbonColor="rgba(42, 29, 8, 0.85)"
            ribbonWidth={52}
            viewHeight={95}
            color="#fcd34d"
            edgeFade={0.55}
            pauseOnHover={true}
            draggable={true}
          />
        </div> */}

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
