import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthGuard } from "./hooks/useAuthGuard";
import { AdminGuard } from "./hooks/AdminGuard";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { Round1Page } from "./pages/Round1Page";
import { Round2Page } from "./pages/Round2Page";
import { Round3Page } from "./pages/Round3Page";

function App() {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Persist mute preference across reloads
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem("bgMuted") === "true"; } catch { return false; }
  });

  // Hide mute button while the VideoIntro is playing on the landing page
  const [videoIntroDone, setVideoIntroDone] = useState(false);

  const isLandingRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  // Reset intro state when we leave and come back to landing
  useEffect(() => {
    if (!isLandingRoute) setVideoIntroDone(false);
  }, [isLandingRoute]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    audio.muted = isMuted;

    if (!isLandingRoute) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    const handleFirstInteraction = () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isLandingRoute, isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      try { localStorage.setItem("bgMuted", String(nextMuted)); } catch {}
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
        if (!nextMuted && isLandingRoute && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
      return nextMuted;
    });
  };

  // Only show mute button after the video intro has finished
  const showMuteBtn = isLandingRoute && videoIntroDone;

  return (
    <>
      <audio ref={audioRef} src="/lofium-samurai-lofium-292016.mp3" loop />

      {showMuteBtn && (
        <button
          id="global-mute-btn"
          onClick={toggleMute}
          style={{
            position: "fixed", bottom: "32px", right: "32px", zIndex: 9999,
            background: "#110b08", border: "1px solid rgba(201,163,78,0.45)",
            color: "#f5eaca", width: "42px", height: "42px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", backdropFilter: "blur(4px)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
            transition: "background 200ms, transform 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1a120e"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#110b08"; e.currentTarget.style.transform = "translateY(0)"; }}
          title="Toggle Background Music"
          aria-label="Toggle Background Music"
        >
          {!isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </button>
      )}

      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage onVideoIntroDone={() => setVideoIntroDone(true)} />} />
        <Route path="/login"    element={<LandingPage onVideoIntroDone={() => setVideoIntroDone(true)} />} />
        <Route path="/register" element={<LandingPage onVideoIntroDone={() => setVideoIntroDone(true)} />} />
        <Route path="/about"    element={<AboutPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/round/1"   element={<Round1Page />} />
          <Route path="/round/2"   element={<Round2Page />} />
          <Route path="/round/3"   element={<Round3Page />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
