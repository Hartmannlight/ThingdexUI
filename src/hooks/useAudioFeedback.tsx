import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getRuntimeConfig } from "@/config/runtime";

export type AudioTone = "success" | "warning" | "error" | "info";

type AudioContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  play: (tone: AudioTone) => void;
};

const AudioFeedbackContext = createContext<AudioContextValue | null>(null);

const toneMap: Record<AudioTone, { freq: number; duration: number }> = {
  success: { freq: 880, duration: 0.12 },
  warning: { freq: 520, duration: 0.16 },
  error: { freq: 220, duration: 0.2 },
  info: { freq: 440, duration: 0.12 }
};

export const AudioFeedbackProvider = ({ children }: { children: ReactNode }) => {
  const { featureFlags, audio } = getRuntimeConfig();
  const [enabled, setEnabledState] = useState<boolean>(() => {
    const saved = window.localStorage.getItem("thingdex.audio.enabled");
    if (saved !== null) return saved === "true";
    return audio.enabled;
  });
  const contextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef<number>(audio.volume);

  useEffect(() => {
    volumeRef.current = audio.volume;
  }, [audio.volume]);

  useEffect(() => {
    window.localStorage.setItem("thingdex.audio.enabled", String(enabled));
  }, [enabled]);

  useEffect(() => {
    const unlock = () => {
      if (!featureFlags.audioFeedback) return;
      if (!contextRef.current) {
        contextRef.current = new AudioContext();
      }
      if (contextRef.current.state === "suspended") {
        void contextRef.current.resume();
      }
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [featureFlags.audioFeedback]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
  }, []);

  const play = useCallback(
    (tone: AudioTone) => {
      if (!featureFlags.audioFeedback || !enabled) return;
      if (!contextRef.current) return;

      const { freq, duration } = toneMap[tone];
      const context = contextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gain.gain.value = volumeRef.current;
      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    [enabled, featureFlags.audioFeedback]
  );

  const value = useMemo(() => ({ enabled, setEnabled, play }), [enabled, play, setEnabled]);

  return <AudioFeedbackContext.Provider value={value}>{children}</AudioFeedbackContext.Provider>;
};

export const useAudioFeedback = () => {
  const context = useContext(AudioFeedbackContext);
  if (!context) {
    throw new Error("useAudioFeedback must be used within AudioFeedbackProvider");
  }
  return context;
};
