// App.js - interactive envelope invite with falling hearts + confetti + pop countdown
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

/* ------- CONFIG: set your wedding date/time here (local time) ------- */
const TARGET_DATE = new Date("2025-11-01T10:00:00");

/* utility: compute time left */
function computeTimeLeft() {
  const now = new Date();
  const diff = TARGET_DATE - now;
  if (diff <= 0) return null;
  const sec = Math.floor(diff / 1000) % 60;
  const min = Math.floor(diff / 1000 / 60) % 60;
  const hrs = Math.floor(diff / 1000 / 60 / 60) % 24;
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);
  return { days, hrs, min, sec };
}
function pad(n) {
  if (n == null) return "--";
  return String(n).padStart(2, "0");
}

/* Confetti canvas component (exposes `start()` via ref) */
const ConfettiCanvas = forwardRef(function ConfettiCanvas(_, ref) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useImperativeHandle(ref, () => ({
    start: (count = 80) => {
      initParticles(count);
      loop();
      // stop automatically after 5s
      setTimeout(() => stop(), 5000);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const onResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, []);

  function initParticles(count) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const colors = [
      "#ffd166",
      "#ef476f",
      "#06d6a0",
      "#118ab2",
      "#8e44ad",
      "#ff8aa0",
    ];
    particlesRef.current = [];
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * w,
        y: Math.random() * -30,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 6,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * Math.PI,
        tiltSpeed: 0.05 + Math.random() * 0.1,
        life: 0,
      });
    }
  }

  function loop() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tilt += p.tiltSpeed;
        p.life += 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.tilt) * 0.3);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // draw a small rounded rectangle / confetti piece
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // remove particles that are far below
      particlesRef.current = particlesRef.current.filter(
        (p) => p.y < canvas.height + 100 && p.life < 300
      );
      animRef.current = requestAnimationFrame(frame);
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(frame);
  }

  function stop() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    particlesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 9999,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
});

/* Falling hearts (pure CSS + small JS to randomize positions/durations) */
function FallingHearts({ count = 12 }) {
  // create an array to map and render hearts with randomized inline styles
  const hearts = Array.from({ length: count }).map((_, i) => {
    const left = Math.round(Math.random() * 90); // 0 to 90%
    const delay = Math.random() * -10; // negative to stagger initially
    const duration = 6 + Math.random() * 8; // 6-14s
    const scale = 0.6 + Math.random() * 0.8;
    const opacity = 0.12 + Math.random() * 0.28;
    return { id: i, left, delay, duration, scale, opacity };
  });

  return (
    <div className="falling-hearts" aria-hidden>
      {hearts.map((h) => (
        <div
          key={h.id}
          className="f-heart"
          style={{
            left: `${h.left}%`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            transform: `scale(${h.scale})`,
            opacity: h.opacity,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
}

/* Main App */
export default function App() {
  const [flapOpen, setFlapOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(computeTimeLeft());
  const confettiRef = useRef(null);

  useEffect(() => {
    let id = null;
    if (revealed) {
      setTimeLeft(computeTimeLeft());
      id = setInterval(() => setTimeLeft(computeTimeLeft()), 1000);
      // confetti blast immediately
      confettiRef.current &&
        confettiRef.current.start &&
        confettiRef.current.start(100);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [revealed]);

  const handleEnvelopeClick = () => {
    if (!flapOpen) setFlapOpen(true);
    else if (!revealed) setRevealed(true);
  };

  const closeCountdown = () => {
    setRevealed(false);
    setFlapOpen(false);
  };

  return (
    <div className="page-root fun">
      <ConfettiCanvas ref={confettiRef} />
      <FallingHearts count={14} />

      <div className="card responsive">
        <div
          className={`envelope ${flapOpen ? "open" : ""} ${
            revealed ? "revealed" : ""
          }`}
          onClick={handleEnvelopeClick}
          role="button"
          aria-label="Open invite envelope"
        >
          <div className="flap">
            <div className="flap-heart">♡</div>
          </div>

          <div className="body">
            <div className="invite-card">
              {!revealed && (
                <div className="overlay-text">
                  <h1>Seember ✦ Terver</h1>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="info">
          <h1>You're Invited!</h1>
          <p>
            Join us to celebrate the union of{" "}
            <strong>Seember Susan Uwua</strong> &amp;
            <strong> Terver Derek Iortyom</strong>
          </p>

          <div className="when">
            <div className="when-left">
              <div className="badge">Church Wedding</div>
              <div className="date">1st Nov 2025 — 10:00 AM</div>
              <div className="place">NKST Church Iortyer, Makurdi</div>
            </div>

            <div className="when-right">
              <button
                className="save-btn"
                onClick={() => {
                  setFlapOpen(true);
                  setRevealed(true);
                }}
              >
                Save the Date
              </button>
              <a className="download-btn" href="/Invite.jpg" download>
                Download Invite
              </a>
            </div>
          </div>

          <div className="colours">
            Colours of the day:{" "}
            <strong>Navy Blue • Gold • Wine • Sky Blue</strong>
          </div>
        </div>
      </div>

      {/* Countdown panel: pops in with scale animation */}
      {revealed && (
        <div
          className="countdown-panel pop"
          role="dialog"
          aria-label="Countdown to wedding"
        >
          <button className="close" onClick={closeCountdown}>
            ✕
          </button>
          <h3>Save the Date — Seember &amp; Terver</h3>
          <p className="small">Church wedding — 1st Nov 2025, 10:00 AM</p>

          <div className="time-grid">
            {timeLeft ? (
              <>
                <div className="pill bounce">
                  <div className="num">{pad(timeLeft.days)}</div>
                  <div className="label">Days</div>
                </div>
                <div className="pill bounce" style={{ animationDelay: "80ms" }}>
                  <div className="num">{pad(timeLeft.hrs)}</div>
                  <div className="label">Hrs</div>
                </div>
                <div
                  className="pill bounce"
                  style={{ animationDelay: "160ms" }}
                >
                  <div className="num">{pad(timeLeft.min)}</div>
                  <div className="label">Mins</div>
                </div>
                <div
                  className="pill bounce"
                  style={{ animationDelay: "240ms" }}
                >
                  <div className="num">{pad(timeLeft.sec)}</div>
                  <div className="label">Secs</div>
                </div>
              </>
            ) : (
              <div className="arrived">
                The day has arrived — congratulations!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
