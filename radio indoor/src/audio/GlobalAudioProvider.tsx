import React, { createContext, useContext, useMemo, useRef, useState } from "react";

type GlobalAudioCtx = {
  audioRef: React.RefObject<HTMLAudioElement>;
  announcementRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
};

const Ctx = createContext<GlobalAudioCtx | null>(null);

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const announcementRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const value = useMemo(
    () => ({ audioRef, announcementRef, isPlaying, setIsPlaying }),
    [isPlaying]
  );

  return (
    <Ctx.Provider value={value}>
      {/* ✅ ÁUDIO FICA AQUI (NUNCA DESMONTA AO TROCAR DE ROTA) */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <audio ref={announcementRef} />
      {children}
    </Ctx.Provider>
  );
}

export function useGlobalAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalAudio must be used inside GlobalAudioProvider");
  return ctx;
}
