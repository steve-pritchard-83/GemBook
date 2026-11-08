"use client";

import React from "react";
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";

interface FlipbookHudProps {
  storyTitle: string;
  spreadLabel: string;
  showHud: boolean;
  isPlaying: boolean;
  isAutoplay: boolean;
  isAmbientOn: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isPortraitPhone: boolean;
  warmthLevel: number;
  exitHoldProgress: number;
  currentSpreadIndex: number;
  onStartExitHold: () => void;
  onCancelExitHold: () => void;
  onTogglePlay: () => void;
  onToggleAutoplay: () => void;
  onToggleAmbient: () => void;
  onToggleMute: () => void;
  onChangeWarmth: (val: number) => void;
  onToggleFullscreen: () => void;
  onJumpToSpread: (idx: number) => void;
}

export function FlipbookHud({
  storyTitle,
  spreadLabel,
  showHud,
  isPlaying,
  isAutoplay,
  isAmbientOn,
  isMuted,
  isFullscreen,
  isPortraitPhone,
  warmthLevel,
  exitHoldProgress,
  currentSpreadIndex,
  onStartExitHold,
  onCancelExitHold,
  onTogglePlay,
  onToggleAutoplay,
  onToggleAmbient,
  onToggleMute,
  onChangeWarmth,
  onToggleFullscreen,
  onJumpToSpread,
}: FlipbookHudProps) {
  const navTargets = isPortraitPhone
    ? [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    : [0, 2, 4, 6, 8, 10, 12];

  return (
    <>
      {/* Top Floating Bedtime HUD */}
      <header
        className={`fixed top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-4 sm:right-4 z-50 flex items-center justify-between gap-1.5 transition-all duration-500 ${
          showHud
            ? "translate-y-0 opacity-100"
            : "-translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        {/* Left: Back to Library Button */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={onStartExitHold}
            onMouseUp={onCancelExitHold}
            onMouseLeave={onCancelExitHold}
            onTouchStart={onStartExitHold}
            onTouchEnd={onCancelExitHold}
            className="relative overflow-hidden flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-[#12162b]/90 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-amber-100 shadow-lg backdrop-blur-md transition hover:border-amber-300/50 active:scale-95"
            title={
              isPlaying
                ? "Hold briefly to return to bookshelf"
                : "Return to bookshelf"
            }
          >
            <div
              className="absolute inset-y-0 left-0 bg-amber-400/30 transition-all duration-700"
              style={{ width: `${exitHoldProgress}%` }}
            />
            <ChevronLeft className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="truncate">
              {isPlaying
                ? isPortraitPhone
                  ? "Hold"
                  : "Hold for Library"
                : "Library"}
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-[#12162b]/80 px-4 py-1.5 text-xs text-amber-200/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-display tracking-wide">{storyTitle}</span>
            <span className="text-amber-300/40">•</span>
            <span className="text-amber-100/80">{spreadLabel}</span>
          </div>
        </div>

        {/* Right: Bedtime Comfort & Audio Controls */}
        <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-amber-300/20 bg-[#12162b]/90 p-1 sm:p-1.5 shadow-xl backdrop-blur-md">
          {/* Play / Pause Narrator */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3.5 text-xs sm:text-sm font-bold transition ${
              isPlaying
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>{isPortraitPhone ? "Pause" : "Pause Voice"}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>{isPortraitPhone ? "Read" : "Read Aloud"}</span>
              </>
            )}
          </button>

          {/* Auto-Flip Toggle */}
          <button
            onClick={onToggleAutoplay}
            className={`rounded-full px-2.5 py-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold transition ${
              isAutoplay
                ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40"
                : "text-amber-100/60 hover:text-amber-100"
            }`}
            title="Automatically turn pages only after voiceover finishes"
          >
            {isPortraitPhone
              ? `Auto: ${isAutoplay ? "ON" : "OFF"}`
              : `Auto-Turn: ${isAutoplay ? "ON" : "OFF"}`}
          </button>

          {/* Ambient Lullaby Music Box Toggle */}
          <button
            onClick={onToggleAmbient}
            className={`rounded-full p-1.5 sm:p-2 transition ${
              isAmbientOn
                ? "bg-amber-400/20 text-amber-300"
                : "text-amber-100/40 hover:text-amber-100/80"
            }`}
            title="Toggle soft bedtime music-box lullaby"
            aria-label="Toggle Lullaby Music"
          >
            <Music className="h-4 w-4" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="rounded-full p-1.5 sm:p-2 text-amber-200/80 hover:bg-white/10 hover:text-amber-100"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Mute"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-amber-300" />
            )}
          </button>

          {/* Warm Night Light Dimmer */}
          <div className="hidden md:flex items-center gap-1.5 px-2 border-l border-white/10">
            <Sun className="h-3.5 w-3.5 text-amber-300/70" />
            <input
              type="range"
              min={0}
              max={45}
              value={warmthLevel}
              onChange={(e) => onChangeWarmth(Number(e.target.value))}
              className="h-1.5 w-16 cursor-pointer accent-amber-400"
              title="Warm Bedtime Eye-Comfort Filter"
            />
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="rounded-full p-1.5 sm:p-2 text-amber-200/80 hover:bg-white/10 hover:text-amber-100"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Bottom Progress Bar / Dots */}
      <footer
        className={`fixed bottom-2 z-40 flex max-w-[95vw] items-center gap-1 sm:gap-2 overflow-x-auto rounded-full border border-white/10 bg-[#12162b]/85 px-3 py-1 sm:px-4 sm:py-1.5 backdrop-blur-md transition-all duration-500 ${
          showHud
            ? "translate-y-0 opacity-100"
            : "translate-y-12 opacity-0 pointer-events-none"
        }`}
      >
        {navTargets.map((targetIdx) => {
          const isCurrent = isPortraitPhone
            ? currentSpreadIndex === targetIdx ||
              (targetIdx === 0 && currentSpreadIndex === 1)
            : currentSpreadIndex === targetIdx;
          const label =
            targetIdx === 0
              ? "Cover"
              : targetIdx === 12
              ? "End"
              : isPortraitPhone
              ? `${targetIdx - 1}`
              : `${targetIdx - 1}-${targetIdx}`;
          return (
            <button
              key={targetIdx}
              onClick={() => onJumpToSpread(targetIdx)}
              className={`shrink-0 rounded-full px-2 py-0.5 sm:px-2.5 text-[10px] sm:text-[11px] font-semibold transition-all ${
                isCurrent
                  ? "bg-amber-400 text-slate-950 shadow-sm scale-105"
                  : "text-amber-200/60 hover:text-amber-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </footer>
    </>
  );
}
