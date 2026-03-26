import { useEffect, useState } from "react";
import { getSocket } from "../socket/client";

export function useExamMode(roundLabel: string, roundNumber: number, active = true) {
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(Boolean(document.fullscreenElement));
  const [fullscreenExitLocked, setFullscreenExitLocked] = useState(false);

  // Tab switch blocking is disabled — no warnings or bans
  const violationLocked = false;
  const bannedMessage = "";

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullscreenExitLocked(false);
      return;
    }

    // Auto-request fullscreen on mount
    const requestFullscreen = async () => {
      if (document.fullscreenElement) {
        setFullscreenActive(true);
        return;
      }
      try {
        const el = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void> | void;
          msRequestFullscreen?: () => Promise<void> | void;
        };
        if (typeof el.requestFullscreen === "function") {
          await el.requestFullscreen();
        } else if (typeof el.webkitRequestFullscreen === "function") {
          await el.webkitRequestFullscreen();
        } else if (typeof el.msRequestFullscreen === "function") {
          await el.msRequestFullscreen();
        }
        setFullscreenActive(true);
        setFullscreenExitLocked(false);
        getSocket()?.emit("exam:status:update", {
          roundNumber,
          fullscreen: true,
          tabSwitchCount: 0,
          eventType: "STATUS",
        });
      } catch {
        setFullscreenActive(false);
      }
    };

    const onFullscreenChange = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      setFullscreenActive(fullscreen);
      setFullscreenExitLocked(!fullscreen);
      getSocket()?.emit("exam:status:update", {
        roundNumber,
        fullscreen,
        tabSwitchCount: 0,
        eventType: "STATUS",
      });
    };

    void requestFullscreen();
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [roundNumber, active]);

  const reEnterFullscreen = async () => {
    if (!active || document.fullscreenElement) return;
    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen();
      } else if (typeof el.webkitRequestFullscreen === "function") {
        await el.webkitRequestFullscreen();
      } else if (typeof el.msRequestFullscreen === "function") {
        await el.msRequestFullscreen();
      }
      setFullscreenActive(true);
      setFullscreenExitLocked(false);
    } catch {
      setFullscreenActive(false);
    }
  };

  return {
    fullscreenActive,
    fullscreenLockActive: fullscreenExitLocked,
    tabSwitchCount: 0,
    violationLocked,
    warningMessage: "",
    bannedMessage,
    fullscreenHelpMessage: "",
    clearWarning: () => {},
    warningText: `Exam mode is active for ${roundLabel}. Stay in fullscreen.`,
    reEnterFullscreen,
  };
}
