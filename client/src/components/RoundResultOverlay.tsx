import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface RoundResultOverlayProps {
  winnerId: string | null;
  userId: string;
  roundNumber: 1 | 2;
}

export function RoundResultOverlay({
  winnerId,
  userId,
  roundNumber,
}: RoundResultOverlayProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"darken" | "ink" | "text" | "done">("darken");

  const isWin  = winnerId !== null && winnerId === userId;
  const isDraw = winnerId === null;

  // Round 2 winner uses a different video and different text
  const videoSrc = isWin
    ? (roundNumber === 2 ? "/Round 2 winner.mp4" : "/victory round 1.mp4")
    : "/Defeated Round 1.mp4";

  const videoOpacity = isWin ? 0.72 : 0.50;

  const headline = isDraw
    ? "The Duel Ends in Silence"
    : isWin
    ? (roundNumber === 2 ? "One Step Closer to Becoming a Ronin" : "You Endure")
    : "The Path Ends Here.";

  const subline = isDraw
    ? "Neither warrior proved worthy. The trial claims you both."
    : isWin
    ? (roundNumber === 2 ? "The final trial awaits." : "The path continues…")
    : "Not all survive the trial.";

  // Stagger animation phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ink"),  400);
    const t2 = setTimeout(() => setPhase("text"), 1200);
    const t3 = setTimeout(() => setPhase("done"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Play video once; on defeat add 2s extra before navigating so subtext can be read
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 0.6;
    v.loop   = false;
    v.play().catch(() => {});

    let timer: ReturnType<typeof setTimeout>;
    const onEnd = () => {
      if (isWin) {
        navigate("/dashboard");
      } else {
        // 2 extra seconds so user can read defeat subtext
        timer = setTimeout(() => navigate("/dashboard"), 2000);
      }
    };
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("ended", onEnd);
      clearTimeout(timer);
    };
  }, [navigate, isWin]);

  const accentColor = isWin ? "#c9a227" : isDraw ? "#aaa" : "#c0392b";
  const glowColor   = isWin
    ? "rgba(201,162,39,0.7), 0 0 80px rgba(201,162,39,0.3)"
    : isDraw
    ? "rgba(150,150,150,0.5)"
    : "rgba(192,57,43,0.7), 0 0 80px rgba(192,57,43,0.3)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000", overflow: "hidden",
    }}>
      {/* Background video — play once */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transform: "scale(1.15)", // Scales up slightly to hide the VEO watermark
          opacity: phase === "darken" ? 0 : videoOpacity,
          transition: "opacity 1s ease",
        }}
      />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.72) 100%)",
      }} />

      {/* Ink-stroke sweep */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "50%", left: "-10%",
          height: "2px", transform: "translateY(-50%)",
          background: isWin
            ? "linear-gradient(90deg, transparent, #c9a227, transparent)"
            : "linear-gradient(90deg, transparent, #8b1a1a, transparent)",
          width: phase !== "darken" ? "120%" : "0%",
          transition: "width 0.85s cubic-bezier(0.77,0,0.18,1)",
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px",
        opacity: phase === "text" || phase === "done" ? 1 : 0,
        transform: phase === "text" || phase === "done" ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.9s ease, transform 0.9s ease",
      }}>
        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
          fontSize: "clamp(26px, 5vw, 62px)",
          fontWeight: 900, letterSpacing: "0.06em",
          color: accentColor,
          textShadow: `0 0 40px ${glowColor}`,
          margin: 0,
        }}>
          {headline}
        </h1>

        {/* Divider */}
        <div style={{
          width: "100px", height: "1px", margin: "18px auto",
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        {/* Subline */}
        <p style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "clamp(13px, 1.8vw, 18px)",
          color: "rgba(255,255,255,0.78)",
          letterSpacing: "0.04em", margin: 0,
          opacity: phase === "done" ? 1 : 0,
          transform: phase === "done" ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
        }}>
          {subline}
        </p>

        {/* Redirect hint */}
        <p style={{
          marginTop: "28px", fontSize: "11px",
          color: "rgba(255,255,255,0.30)",
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.14em", textTransform: "uppercase",
          opacity: phase === "done" ? 1 : 0,
          transition: "opacity 0.5s ease 1s",
        }}>
          Returning to dashboard…
        </p>
      </div>
    </div>
  );
}
