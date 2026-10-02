import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Volume2, VolumeX, Sparkles, Play } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'particles' | 'circuits' | 'logo' | 'complete'>('particles');
  const [isMuted, setIsMuted] = useState(false);
  const [customVideoSrc, setCustomVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check if a custom uploaded intro video exists in localStorage
  useEffect(() => {
    const savedVideo = localStorage.getItem('innolink_intro_video');
    if (savedVideo) {
      setCustomVideoSrc(savedVideo);
    }
  }, []);

  // Web Audio Synth for futuristic power-up sound
  const playCyberSound = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Deep sub-bass sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 1.8);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 3.5);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4.5);

      // High-tech circuit chime at 2.2s (logo reveal)
      setTimeout(() => {
        if (!ctx || ctx.state === 'closed') return;
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(660, ctx.currentTime);
        chimeOsc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.4);
        chimeGain.gain.setValueAtTime(0.2, ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chimeOsc.start();
        chimeOsc.stop(ctx.currentTime + 1.0);
      }, 2000);
    } catch (e) {
      // Audio autoplay policy handled silently
    }
  };

  useEffect(() => {
    playCyberSound();

    const startTime = Date.now();
    const duration = 4500; // 4.5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < 1200) {
        setPhase('particles');
      } else if (elapsed < 2400) {
        setPhase('circuits');
      } else if (elapsed < 4200) {
        setPhase('logo');
      } else {
        setPhase('complete');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden select-none">
      {/* Background Animated Circuit Nodes & Grids */}
      <div className="absolute inset-0 bg-circuit-pattern opacity-40 pointer-events-none" />

      {/* Cybernetic Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* If custom video is present, display video tag */}
      {customVideoSrc ? (
        <div className="relative w-full max-w-4xl max-h-[80vh] flex items-center justify-center p-4">
          <video
            ref={videoRef}
            src={customVideoSrc}
            autoPlay
            playsInline
            muted={isMuted}
            onEnded={onComplete}
            className="w-full h-auto rounded-3xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 object-contain"
          />
        </div>
      ) : (
        /* Cinematic High-Tech InnoLink Logo & Circuit Sequence */
        <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-lg text-center">
          {/* Glowing Infinity Circuit Logo (Robot + Code) */}
          <div className="relative mb-6 transform transition-all duration-700">
            {/* Pulsing ring */}
            <div className="absolute -inset-6 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />

            <div className="relative w-36 h-24 sm:w-48 sm:h-32 flex items-center justify-center">
              <svg
                viewBox="0 0 200 100"
                className="w-full h-full drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]"
              >
                <defs>
                  <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Circuit Background Traces */}
                <path
                  d="M 10 50 H 40 M 160 50 H 190 M 50 10 V 30 M 150 70 V 90"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* The Infinity Loop (Path) */}
                <path
                  d="M 50 50 C 25 25, 25 75, 50 50 C 75 25, 125 75, 150 50 C 175 25, 175 75, 150 50 C 125 25, 75 75, 50 50 Z"
                  fill="none"
                  stroke="url(#circuitGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000"
                />

                {/* Robot Node on Left Loop */}
                <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="45" cy="48" r="2.5" fill="#38bdf8" />
                <circle cx="55" cy="48" r="2.5" fill="#38bdf8" />
                <path d="M 46 56 Q 50 59 54 56" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <line x1="50" y1="36" x2="50" y2="30" stroke="#06b6d4" strokeWidth="2" />
                <circle cx="50" cy="28" r="2" fill="#38bdf8" />

                {/* Code Node < > on Right Loop */}
                <circle cx="150" cy="50" r="14" fill="#0f172a" stroke="#10b981" strokeWidth="3" />
                <path d="M 145 45 L 140 50 L 145 55" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 155 45 L 160 50 L 155 55" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />

                {/* Circuit board copper trace pins joining the loops */}
                <line x1="90" y1="46" x2="110" y2="46" stroke="#fbbf24" strokeWidth="2" />
                <line x1="90" y1="54" x2="110" y2="54" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="90" cy="46" r="1.5" fill="#f59e0b" />
                <circle cx="110" cy="46" r="1.5" fill="#f59e0b" />
                <circle cx="90" cy="54" r="1.5" fill="#f59e0b" />
                <circle cx="110" cy="54" r="1.5" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          {/* Title: InnoLink TECHNOLOGIES */}
          <div className="space-y-1.5 transition-all duration-700">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              InnoLink
            </h1>
            <div className="text-xs sm:text-sm font-bold tracking-[0.35em] text-cyan-400 uppercase">
              Technologies
            </div>
            <div className="text-[11px] font-medium tracking-widest text-slate-400 pt-2 flex items-center justify-center gap-1.5">
              <span>Powered by</span>
              <span className="text-emerald-400 font-semibold tracking-wider">MK Solutions</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls & Progress Loading Bar */}
      <div className="absolute bottom-10 left-0 right-0 max-w-md mx-auto px-6 flex flex-col items-center gap-4 z-20">
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span>Initializing InnoLink Electronics Platform...</span>
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between w-full pt-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 transition cursor-pointer group"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
