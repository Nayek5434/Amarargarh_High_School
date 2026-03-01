"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const introSeenKey = "amarargarh-intro-seen";
const INTRO_HIDE_DELAY_MS = 900;
const ROUTE_LOADER_SHOW_DELAY_MS = 450;
const ROUTE_LOADER_MAX_VISIBLE_MS = 10000;
const ROUTE_LOADER_MIN_VISIBLE_AFTER_PATH_MS = 180;
const FADE_OUT_MS = 220;

type LoadingMode = "intro" | "normal";

type LoadingOverlayUiProps = {
  fadeOut?: boolean;
  mode?: LoadingMode;
};

type LoaderState = {
  visible: boolean;
  fadeOut: boolean;
  mode: LoadingMode;
};

function getIntroSeen(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return localStorage.getItem(introSeenKey) === "1";
  } catch {
    return true;
  }
}

function setIntroSeen() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(introSeenKey, "1");
  } catch {
    // ignore storage errors
  }
}

function getInitialLoaderState(): LoaderState {
  if (typeof window === "undefined") {
    return { visible: false, fadeOut: false, mode: "normal" };
  }

  const introSeen = getIntroSeen();
  if (introSeen) {
    return { visible: false, fadeOut: false, mode: "normal" };
  }

  return { visible: true, fadeOut: false, mode: "intro" };
}

export function LoadingOverlayUi({ fadeOut = false, mode = "intro" }: LoadingOverlayUiProps) {
  return (
    <section
      className={`loading-screen${fadeOut ? " loading-screen-fade" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-glow loading-glow-a" />
      <div className="loading-glow loading-glow-b" />

      <div className="loading-panel">
        {mode === "intro" ? (
          <>
            <p className="loading-kicker">Please wait</p>
            <h2 className="loading-title">Amarargarh High School is loading...</h2>
            <p className="loading-subtitle">Customizing and building a better experience for you.</p>
          </>
        ) : (
          <>
            <p className="loading-kicker">Please wait</p>
            <h2 className="loading-title">Page is loading, please wait...</h2>
            <p className="loading-subtitle">Preparing content for you.</p>
          </>
        )}

        <div className="loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <p className="loading-text">Loading...</p>

        <div className="loading-progress" aria-hidden="true">
          <div className="loading-progress-bar" />
        </div>
      </div>
    </section>
  );
}

export function GlobalRouteLoader() {
  const pathname = usePathname();
  const [loader, setLoader] = useState<LoaderState>(getInitialLoaderState);
  const firstPath = useRef(true);
  const showDelayTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (showDelayTimerRef.current !== null) {
      window.clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const clearHideTimers = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const startNormalLoader = useCallback(() => {
    setLoader({ visible: true, fadeOut: false, mode: "normal" });
  }, []);

  const scheduleHide = useCallback((delayMs: number) => {
    clearHideTimers();
    hideTimerRef.current = window.setTimeout(() => {
      setLoader((prev) => ({ ...prev, fadeOut: true }));
      fadeTimerRef.current = window.setTimeout(() => {
        setLoader((prev) => ({ ...prev, visible: false, fadeOut: false }));
      }, FADE_OUT_MS);
    }, delayMs);
  }, [clearHideTimers]);

  useEffect(() => {
    if (loader.mode === "intro" && loader.visible) {
      setIntroSeen();
      scheduleHide(INTRO_HIDE_DELAY_MS);
    }
  }, [loader.mode, loader.visible, scheduleHide]);

  useEffect(() => {
    const startHandler = () => {
      clearAllTimers();
      showDelayTimerRef.current = window.setTimeout(() => {
        startNormalLoader();
        scheduleHide(ROUTE_LOADER_MAX_VISIBLE_MS);
      }, ROUTE_LOADER_SHOW_DELAY_MS);
    };

    window.addEventListener("amarargarh:route-loading-start", startHandler);

    return () => {
      clearAllTimers();
      window.removeEventListener("amarargarh:route-loading-start", startHandler);
    };
  }, [clearAllTimers, scheduleHide, startNormalLoader]);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }

    if (showDelayTimerRef.current !== null) {
      window.clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }

    if (loader.visible && loader.mode === "normal") {
      scheduleHide(ROUTE_LOADER_MIN_VISIBLE_AFTER_PATH_MS);
    }
  }, [loader.mode, loader.visible, pathname, scheduleHide]);

  if (!loader.visible) {
    return null;
  }

  return <LoadingOverlayUi fadeOut={loader.fadeOut} mode={loader.mode} />;
}
