import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { ArrowDown } from 'lucide-react';
import { sound } from '../utils/soundEffects';

const VIDEO_URL = '/videos/robot_clean.mp4'; // 3.7MB optimized seekable video stream
const FALLBACK_VIDEO_URL = '/videos/robot_fast.mp4';
const TERTIARY_VIDEO_URL = '/videos/robot.mp4';

// Authentic aerodynamics chapters from user repository
const CHAPTERS = [
  {
    id: 1,
    kicker: 'AI-Powered Fluid Dynamics',
    leadIn: 'Simulate the',
    wordLeft: 'FL',
    wordRight: 'OW',
    name: 'FLOW',
    description:
      'Fifty years of computational fluid physics distilled into real-time neural operators. Simulate boundary layers, turbulent kinetic energy, and pressure fields at supersonic speeds.',
    specs: [
      { label: 'Airspeed', value: 'Mach 0.84' },
      { label: 'Reynolds', value: '4.2 × 10⁶' },
      { label: 'Residual', value: '1.4 × 10⁻⁶' },
    ],
  },
  {
    id: 2,
    kicker: 'Digital Wind Tunnel',
    leadIn: 'Governing the',
    wordLeft: 'AE',
    wordRight: 'RO',
    name: 'AERO',
    description:
      'Industrial boundary layers computed instantaneously through Fourier Neural Operators. Eliminate multi-week wind tunnel prototyping with sub-second aerodynamic polar predictions.',
    specs: [
      { label: 'Lift to Drag', value: 'L/D 18.6' },
      { label: 'Pressure', value: '101.3 kPa' },
      { label: 'Grid Mesh', value: '4.8M Cells' },
    ],
  },
  {
    id: 3,
    kicker: 'Solver Engine',
    leadIn: 'Command the',
    wordLeft: 'WI',
    wordRight: 'ND',
    name: 'WIND',
    description:
      'Turbulence closure accelerated by tensor cores. Predict wake vortex detachment, buffet onset, and pressure drag with empirical aerodynamic validation across high angles of attack.',
    specs: [
      { label: 'Vortex Yaw', value: '14.2° Detached' },
      { label: 'Inference', value: '4.2 ms / Polar' },
      { label: 'Turbulence', value: 'k = 0.85 m²/s²' },
    ],
  },
  {
    id: 4,
    kicker: 'Aerodynamic Workflow',
    leadIn: 'Mastering',
    wordLeft: 'CO',
    wordRight: 'RE',
    name: 'CORE',
    description:
      'An end-to-end aerodynamic pipeline: automated surface mesh healing, boundary condition validation, residual convergence tracking, and instant solver export.',
    specs: [
      { label: 'Standard', value: 'Aero Spec Part-25' },
      { label: 'Solver', value: 'CFD simpleFoam' },
      { label: 'Pipeline', value: 'HDF5 / VTK' },
    ],
  },
];

export const RobotWalkthroughPage: React.FC = () => {
  const { setPage } = usePlatform();
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_URL);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [characterXOffset, setCharacterXOffset] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasTransitionedRef = useRef<boolean>(false);

  // Ultra-smooth seekable frame sync guarded against browser decoder thrashing
  const requestFrameSync = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;
    if (isSeekingRef.current) return;

    const diff = targetTimeRef.current - video.currentTime;
    if (Math.abs(diff) > 0.02) {
      isSeekingRef.current = true;
      try {
        video.currentTime = targetTimeRef.current;
      } catch {
        isSeekingRef.current = false;
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;

    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
    setScrollProgress(progress);

    const video = videoRef.current;
    if (video && video.duration && !Number.isNaN(video.duration)) {
      targetTimeRef.current = progress * video.duration;
      requestFrameSync();
    }

    // Natural character sway tracking: follows the character's walking stride
    const sway = Math.sin(progress * Math.PI * 6) * 14;
    setCharacterXOffset(sway);

    // When scrolling reaches the end, seamlessly open the LIMITS component
    if (progress >= 0.985 && !hasTransitionedRef.current) {
      hasTransitionedRef.current = true;
      sound.playClick();
      setPage('limits');
    } else if (progress < 0.92) {
      hasTransitionedRef.current = false;
    }
  }, [requestFrameSync, setPage]);

  useEffect(() => {
    let animId: number;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const onSeeked = () => {
      isSeekingRef.current = false;
      requestFrameSync();
    };

    if (video) {
      video.addEventListener('seeked', onSeeked);
    }

    const onScroll = () => {
      handleScroll();
    };

    const loop = () => {
      requestFrameSync();
      animId = requestAnimationFrame(loop);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(loop);

    return () => {
      if (video) {
        video.removeEventListener('seeked', onSeeked);
      }
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animId);
    };
  }, [handleScroll, requestFrameSync]);

  // Virtual index for sequential chapter transitions (0 to 3)
  const virtualIndex = scrollProgress * (CHAPTERS.length - 1);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] text-white select-none overflow-y-auto overflow-x-hidden font-sans bg-black"
    >
      {/* Fixed Full-Screen Background Video: Synchronized with scroll */}
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onError={() => {
          if (videoSrc === VIDEO_URL) {
            setVideoSrc(FALLBACK_VIDEO_URL);
          } else if (videoSrc === FALLBACK_VIDEO_URL) {
            setVideoSrc(TERTIARY_VIDEO_URL);
          }
        }}
        onLoadedMetadata={() => {
          handleScroll();
        }}
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      />

      {/* Subtle Vignette for cinematic focus */}
      <div className="fixed inset-0 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none z-1" />

      {/* CHAPTER STAGES: Monumental Split Text (2 letters left, 2 letters right) & Specs */}
      <div
        className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
        aria-label="Aerodynamics Chapters"
      >
        {CHAPTERS.map((ch, idx) => {
          const delta = idx - virtualIndex;
          if (Math.abs(delta) > 1.2) return null;

          // Vertical transition: delta < 0 moves UP (-), delta > 0 moves DOWN (+)
          const yShiftPercent = delta * 115;
          // Smooth fade in and out
          const opacity = Math.max(0, Math.min(1, 1 - Math.abs(delta) * 1.6));

          return (
            <div
              key={ch.id}
              className="absolute inset-0 pointer-events-none will-change-transform"
              style={{
                transform: `translateY(${yShiftPercent}%)`,
                opacity,
                transition: 'opacity 0.06s linear',
              }}
            >
              {/* TOP-LEFT LEAD-IN FOR THIS CHAPTER */}
              <div className="absolute top-12 sm:top-16 left-6 sm:left-12 flex flex-col items-start drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.22em] text-white/70 mb-1">
                  {ch.kicker}
                </span>
                <span className="text-3xl sm:text-5xl md:text-6xl font-serif italic text-white/95 tracking-wide">
                  {ch.leadIn}
                </span>
              </div>

              {/* MONUMENTAL SPLIT TEXT: 2 LETTERS LEFT, 2 LETTERS RIGHT */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Left Pair: positioned to left of character */}
                <div
                  className="absolute top-1/2 flex items-center justify-end select-none will-change-transform"
                  style={{
                    right: `calc(100% - 47.5% - ${characterXOffset}px)`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span
                    className="text-[110px] sm:text-[170px] md:text-[230px] lg:text-[290px] xl:text-[350px] font-black tracking-[-0.04em] leading-none text-right inline-block text-white"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      textShadow: '0 4px 35px rgba(0, 0, 0, 0.95), 0 0 60px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {ch.wordLeft}
                  </span>
                </div>

                {/* Right Pair: positioned to right of character */}
                <div
                  className="absolute top-1/2 flex items-center justify-start select-none will-change-transform"
                  style={{
                    left: `calc(67.5% + ${characterXOffset}px)`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span
                    className="text-[110px] sm:text-[170px] md:text-[230px] lg:text-[290px] xl:text-[350px] font-black tracking-[-0.04em] leading-none text-left inline-block text-white"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      textShadow: '0 4px 35px rgba(0, 0, 0, 0.95), 0 0 60px rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {ch.wordRight}
                  </span>
                </div>
              </div>

              {/* CHAPTER EDITORIAL INFORMATION */}
              <div className="absolute left-6 sm:left-12 bottom-24 sm:bottom-28 max-w-[320px] sm:max-w-md flex flex-col gap-2.5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                <p className="text-xs sm:text-[13.5px] leading-relaxed text-white/90 font-normal">
                  {ch.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
                  {ch.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-1.5">
                      <span className="text-white/50 uppercase tracking-wider">{spec.label}:</span>
                      <span className="text-white font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCROLL HELPER HINT IN CENTER BOTTOM */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 pointer-events-none flex flex-col items-center gap-1 ${
          scrollProgress < 0.85 ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/60 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
          <span>Scroll down to walk with character</span>
          <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce" />
        </span>
      </div>

      {/* BOTTOM CREDITS (Clean and minimal as in user's original repo) */}
      <div
        className={`fixed bottom-6 right-6 sm:right-12 z-20 transition-all duration-300 pointer-events-auto flex flex-col items-end gap-1 ${
          scrollProgress > 0.65 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-0.5 text-right text-xs font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          <div>
            <span className="text-white/50">Website Admin: </span>
            <span className="text-white font-bold tracking-wide">RIM</span>
          </div>
          <div>
            <span className="text-white/50">Website Developer: </span>
            <span className="text-white font-bold tracking-wide">AKHIL</span>
          </div>
          <div>
            <span className="text-white/50">Contact Email: </span>
            <a
              href="mailto:akkeduc01@gmail.com"
              className="text-white/90 hover:text-white underline cursor-pointer"
            >
              akkeduc01@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Track: 320vh height to drive rich, high-fidelity walking scrub */}
      <div className="relative w-full h-[320vh] pointer-events-none" aria-hidden="true" />
    </div>
  );
};
