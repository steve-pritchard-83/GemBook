"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HTMLFlipBook from "react-pageflip";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Story, StoryPage } from "@/data/stories";
import { soundEngine } from "@/utils/soundEffects";
import { FlipbookHud } from "@/components/FlipbookHud";
import { ColorByNumbersCanvas } from "@/components/ColorByNumbersCanvas";

interface StoryFlipbookProps {
  story: Story;
  initialAutoplay?: boolean;
  onExit: () => void;
  onStoryComplete?: (storyId: string) => void;
}

// ForwardRef wrapper required by react-pageflip for each page child
interface FlipPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageWrapperProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-full w-full select-none overflow-hidden ${className}`}
      >
        {children}
      </div>
    );
  }
);
FlipPage.displayName = "FlipPage";

/**
 * Splits a page paragraph into natural sentences for real-time bedtime karaoke highlighting
 */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [text];
}

export function StoryFlipbook({
  story,
  initialAutoplay = true,
  onExit,
  onStoryComplete,
}: StoryFlipbookProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Monotonically increasing playback session token so stale callbacks NEVER trigger a premature page flip
  const playbackRunIdRef = useRef<number>(0);

  // Flipbook size & orientation state (auto-adapts between Landscape 2-page spread & Portrait 1-page phone view)
  const [dimensions, setDimensions] = useState({ width: 520, height: 640 });
  const [isPortraitPhone, setIsPortraitPhone] = useState(false);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [activeReadingPageIdx, setActiveReadingPageIdx] = useState<
    number | null
  >(null); // 0..13
  const [activeReadingProgress, setActiveReadingProgress] = useState(0); // 0..1 audio progress for sentence highlight
  const [isPlaying, setIsPlaying] = useState(initialAutoplay);
  const [isAutoplay, setIsAutoplay] = useState(initialAutoplay);
  const [isMuted, setIsMuted] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warmthLevel, setWarmthLevel] = useState(15); // 0 to 45 warm bedtime dimmer
  const [showHud, setShowHud] = useState(true);
  const [exitHoldProgress, setExitHoldProgress] = useState(0);
  const [sleepDimmed, setSleepDimmed] = useState(false);

  // Pre-split sentences per page for smooth karaoke highlighting
  const pageSentences = useMemo(() => {
    return story.pages.map((p) => splitIntoSentences(p.text));
  }, [story.pages]);

  // Ask Service Worker to cache all images & audio for this story in the background
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const urls = [
        story.coverImage,
        story.coloringActivity.imageUrl,
        story.coverAudioUrl || `/audio/${story.id}/cover.mp3`,
        story.closingAudioUrl || `/audio/${story.id}/closing.mp3`,
        ...story.pages.flatMap((p) => [p.image, p.audioUrl]),
      ];
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_STORY_ASSETS",
        urls,
      });
    }
  }, [story]);

  // Compute responsive book page dimensions for both Landscape Tablet (2-page) & Portrait Phone (1-page)
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const portraitMode = vh > vw || vw < 680;
      setIsPortraitPhone(portraitMode);

      if (portraitMode) {
        const pageWidth = Math.min(Math.floor(vw * 0.92), 480);
        const pageHeight = Math.min(Math.floor(vh * 0.8), 760);
        setDimensions({
          width: Math.max(270, pageWidth),
          height: Math.max(420, pageHeight),
        });
      } else {
        const maxBookWidth = Math.min(vw * 0.94, 1440);
        const maxBookHeight = Math.min(vh * 0.88, 860);

        let pageWidth = Math.floor(maxBookWidth / 2);
        let pageHeight = Math.floor(maxBookHeight);

        if (pageWidth / pageHeight > 0.92) {
          pageWidth = Math.floor(pageHeight * 0.88);
        } else if (pageWidth / pageHeight < 0.68) {
          pageHeight = Math.floor(pageWidth / 0.72);
        }

        setDimensions({
          width: Math.max(280, pageWidth),
          height: Math.max(360, pageHeight),
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Screen Wake Lock API so Galaxy Tab / Phone never dims/locks mid-story
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && isPlaying && !sleepDimmed) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // WakeLock may fail quietly on unsupported browsers
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isPlaying, sleepDimmed]);

  // Ambient music-box lullaby controller
  useEffect(() => {
    if (isPlaying && isAmbientOn && !isMuted && !sleepDimmed) {
      soundEngine.startAmbientLullaby();
    } else {
      soundEngine.stopAmbientLullaby();
    }
    return () => {
      soundEngine.stopAmbientLullaby();
    };
  }, [isPlaying, isAmbientOn, isMuted, sleepDimmed]);

  // Sync fullscreen state listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    setIsFullscreen(Boolean(document.fullscreenElement));
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Auto-hide HUD after 4 seconds of inactivity while playing
  const resetHudTimer = useCallback(() => {
    setShowHud(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowHud(false);
      }
    }, 4200);
  }, [isPlaying]);

  useEffect(() => {
    resetHudTimer();
    return () => {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, [resetHudTimer]);

  // Stop any current audio or speech synthesis and invalidate any pending flip timers
  const stopCurrentAudio = useCallback(() => {
    playbackRunIdRef.current += 1;
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    if (speechWatchdogRef.current) {
      clearInterval(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Preload upcoming audio track into browser cache so the next page starts with zero buffering
  const preloadNextAudio = useCallback((nextUrl?: string) => {
    if (!nextUrl || typeof window === "undefined") return;
    try {
      const preload = new Audio();
      preload.preload = "auto";
      preload.src = nextUrl;
      preloadAudioRef.current = preload;
    } catch {
      // Ignore
    }
  }, []);

  // Fallback Web Speech API with strict completion verification so it NEVER completes prematurely
  const speakWithWebSpeechFallback = useCallback(
    (text: string, runId: number, onComplete: () => void) => {
      if (runId !== playbackRunIdRef.current) return;

      // Minimum realistic reading time (~55ms per character at slow bedtime rate) as a safety floor
      const minReadingDurationMs = Math.max(2500, text.length * 52);
      const startTime = Date.now();

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        sequenceTimeoutRef.current = setTimeout(() => {
          if (runId === playbackRunIdRef.current) onComplete();
        }, minReadingDurationMs);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang === "en-AU" &&
            (v.name.toLowerCase().includes("natasha") ||
              v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("karen") ||
              v.name.toLowerCase().includes("catherine"))
        ) ||
        voices.find((v) => v.lang === "en-AU") ||
        voices.find((v) => v.lang === "en-GB");

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.85;
      utterance.pitch = 0.98;
      utterance.volume = isMuted ? 0 : 1;

      let finished = false;
      const finishSafely = () => {
        if (finished || runId !== playbackRunIdRef.current) return;
        finished = true;
        if (speechWatchdogRef.current) {
          clearInterval(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }
        const elapsed = Date.now() - startTime;
        const remainingFloor = Math.max(0, minReadingDurationMs - elapsed);
        // If speechSynthesis fired onend/onerror suspiciously early (< 40% of expected duration), wait out the floor
        if (elapsed < minReadingDurationMs * 0.4) {
          sequenceTimeoutRef.current = setTimeout(() => {
            if (runId === playbackRunIdRef.current) onComplete();
          }, remainingFloor);
        } else {
          onComplete();
        }
      };

      utterance.onboundary = (event) => {
        if (runId !== playbackRunIdRef.current) return;
        if (typeof event.charIndex === "number" && text.length > 0) {
          setActiveReadingProgress(
            Math.min(0.99, event.charIndex / text.length)
          );
        }
      };

      utterance.onend = finishSafely;
      utterance.onerror = finishSafely;

      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  /**
   * Plays an MP3 audio clip and ONLY invokes `onDone` when the audio file has genuinely finished playing to the end
   * (verified via `audio.ended` / `currentTime >= duration - 0.15` and guarded by `playbackRunIdRef`).
   */
  const playAudioClip = useCallback(
    (
      audioUrl: string,
      fallbackText: string,
      runId: number,
      onDone: () => void
    ) => {
      if (runId !== playbackRunIdRef.current) return;

      setActiveReadingProgress(0);
      const audio = new Audio(audioUrl);
      audio.preload = "auto";
      audio.volume = isMuted ? 0 : 1;
      audioRef.current = audio;

      let completed = false;

      // Track live playback progress for sentence karaoke highlighting
      audio.ontimeupdate = () => {
        if (runId !== playbackRunIdRef.current) return;
        if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
          setActiveReadingProgress(
            Math.min(1, audio.currentTime / audio.duration)
          );
        }
      };

      // Strictly verify the audio truly reached the end before allowing the page turn callback
      audio.onended = () => {
        if (completed || runId !== playbackRunIdRef.current) return;
        // Guard against any browser firing `ended` prematurely while currentTime is far before duration
        if (
          audio.duration &&
          Number.isFinite(audio.duration) &&
          audio.duration > 1 &&
          audio.currentTime < audio.duration - 0.35
        ) {
          audio.play().catch(() => {
            completed = true;
            onDone();
          });
          return;
        }
        completed = true;
        setActiveReadingProgress(1);
        onDone();
      };

      audio.onerror = () => {
        if (completed || runId !== playbackRunIdRef.current) return;
        completed = true;
        speakWithWebSpeechFallback(fallbackText, runId, onDone);
      };

      audio.play().catch(() => {
        if (completed || runId !== playbackRunIdRef.current) return;
        completed = true;
        speakWithWebSpeechFallback(fallbackText, runId, onDone);
      });
    },
    [isMuted, speakWithWebSpeechFallback]
  );

  // Update mute on live audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Helper to turn to next page or spread
  const flipToNextSpread = useCallback(() => {
    if (!flipBookRef.current) return;
    const pageFlip = flipBookRef.current.pageFlip();
    if (pageFlip) {
      soundEngine.playPageFlip();
      pageFlip.flipNext();
    }
  }, []);

  const flipToPrevSpread = useCallback(() => {
    if (!flipBookRef.current) return;
    const pageFlip = flipBookRef.current.pageFlip();
    if (pageFlip) {
      soundEngine.playPageFlip();
      pageFlip.flipPrev();
    }
  }, []);

  // Main synchronized voiceover + auto-page-flip state machine
  // Strictly waits for the current page's audio (or both pages in 2-page landscape spread) to finish 100% before turning
  useEffect(() => {
    stopCurrentAudio();

    if (!isPlaying) {
      setActiveReadingPageIdx(null);
      setActiveReadingProgress(0);
      return;
    }

    const currentRunId = playbackRunIdRef.current;

    // Cover & Dedication (indices 0 or 1)
    if (
      currentSpreadIndex === 0 ||
      (isPortraitPhone && currentSpreadIndex === 1)
    ) {
      setSleepDimmed(false);
      setActiveReadingPageIdx(currentSpreadIndex);
      const coverAudio =
        story.coverAudioUrl || `/audio/${story.id}/cover.mp3`;
      const coverText = `${story.title}. ${story.subtitle}. ${story.dedicatedTo}.`;

      preloadNextAudio(story.pages[0]?.audioUrl);

      playAudioClip(coverAudio, coverText, currentRunId, () => {
        if (currentRunId !== playbackRunIdRef.current) return;
        if (!isAutoplay) {
          setIsPlaying(false);
          setActiveReadingPageIdx(null);
          return;
        }
        sequenceTimeoutRef.current = setTimeout(() => {
          if (currentRunId !== playbackRunIdRef.current) return;
          if (
            isPortraitPhone &&
            currentSpreadIndex === 0 &&
            flipBookRef.current
          ) {
            soundEngine.playPageFlip();
            flipBookRef.current.pageFlip().flip(2);
          } else {
            flipToNextSpread();
          }
        }, 1200);
      });
      return;
    }

    // Story Pages 1..10 (indices 2..11)
    if (currentSpreadIndex >= 2 && currentSpreadIndex <= 11) {
      setSleepDimmed(false);

      // PORTRAIT PHONE MODE: Read the single visible page completely, then flip to the next single page
      if (isPortraitPhone) {
        const storyPageIndex = currentSpreadIndex - 2; // 0..9
        const singlePage: StoryPage | undefined = story.pages[storyPageIndex];
        if (!singlePage) return;

        preloadNextAudio(
          story.pages[storyPageIndex + 1]?.audioUrl || story.closingAudioUrl
        );

        setActiveReadingPageIdx(currentSpreadIndex);
        playAudioClip(
          singlePage.audioUrl,
          singlePage.text,
          currentRunId,
          () => {
            if (currentRunId !== playbackRunIdRef.current) return;
            setActiveReadingPageIdx(null);
            if (!isAutoplay) {
              setIsPlaying(false);
              return;
            }
            sequenceTimeoutRef.current = setTimeout(() => {
              if (currentRunId !== playbackRunIdRef.current) return;
              flipToNextSpread();
            }, 1400);
          }
        );
        return;
      }

      // LANDSCAPE TABLET MODE: Read Left Page completely -> 1.4s breath -> Read Right Page completely -> 1.6s pause -> Flip!
      const spreadStartIndex =
        currentSpreadIndex % 2 === 0
          ? currentSpreadIndex
          : currentSpreadIndex - 1;
      const leftStoryPageIndex = spreadStartIndex - 2; // 0, 2, 4, 6, 8
      const rightStoryPageIndex = leftStoryPageIndex + 1; // 1, 3, 5, 7, 9

      const leftPage: StoryPage | undefined = story.pages[leftStoryPageIndex];
      const rightPage: StoryPage | undefined = story.pages[rightStoryPageIndex];

      if (!leftPage) return;

      preloadNextAudio(rightPage?.audioUrl);

      // Step 1: Read Left Page until its audio file completely ends
      setActiveReadingPageIdx(spreadStartIndex);
      playAudioClip(leftPage.audioUrl, leftPage.text, currentRunId, () => {
        if (currentRunId !== playbackRunIdRef.current) return;

        // Calm 1.4-second bedtime breath between Left Page and Right Page
        sequenceTimeoutRef.current = setTimeout(() => {
          if (currentRunId !== playbackRunIdRef.current) return;

          if (!rightPage) {
            if (isAutoplay) flipToNextSpread();
            return;
          }

          // Preload the first page of the NEXT spread while reading the Right Page
          preloadNextAudio(
            story.pages[rightStoryPageIndex + 1]?.audioUrl ||
              story.closingAudioUrl
          );

          // Step 2: Read Right Page until its audio file completely ends
          setActiveReadingPageIdx(spreadStartIndex + 1);
          playAudioClip(
            rightPage.audioUrl,
            rightPage.text,
            currentRunId,
            () => {
              if (currentRunId !== playbackRunIdRef.current) return;
              setActiveReadingPageIdx(null);

              if (!isAutoplay) {
                setIsPlaying(false);
                return;
              }
              // Calm 1.6-second pause after finishing both pages on the spread before turning page
              sequenceTimeoutRef.current = setTimeout(() => {
                if (currentRunId !== playbackRunIdRef.current) return;
                flipToNextSpread();
              }, 1600);
            }
          );
        }, 1400);
      });
      return;
    }

    // Closing Goodnight & Colour-by-Numbers Spread (indices 12 & 13)
    if (currentSpreadIndex >= 12) {
      setActiveReadingPageIdx(12);
      onStoryComplete?.(story.id);

      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#fde68a", "#f59e0b", "#c4b5fd", "#ffffff"],
        });
      } catch {
        // Ignore
      }

      const closingAudio =
        story.closingAudioUrl || `/audio/${story.id}/closing.mp3`;
      const closingText = `${story.closingTitle || "Goodnight, Charlotte"}. ${
        story.closingMessage || "Sleep tight and have magical dreams."
      }`;

      playAudioClip(closingAudio, closingText, currentRunId, () => {
        if (currentRunId !== playbackRunIdRef.current) return;
        setActiveReadingPageIdx(null);
        setIsPlaying(false);
        // Keep the screen bright so Charlotte can use her Galaxy Tab stylus on the Colour-by-Numbers page!
      });
    }

    return () => {
      stopCurrentAudio();
    };
  }, [
    currentSpreadIndex,
    isPlaying,
    isAutoplay,
    isPortraitPhone,
    story,
    playAudioClip,
    preloadNextAudio,
    flipToNextSpread,
    stopCurrentAudio,
    onStoryComplete,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      soundEngine.stopAmbientLullaby();
    };
  }, [stopCurrentAudio]);

  // Jump straight to Story Page 1 (index 2) when opening if initialAutoplay is true
  const handleBookInit = useCallback(() => {
    if (initialAutoplay && flipBookRef.current && currentSpreadIndex === 0) {
      setTimeout(() => {
        try {
          const pf = flipBookRef.current?.pageFlip();
          if (pf) {
            soundEngine.playPageFlip();
            pf.flip(2); // Open directly to Page 1!
          }
        } catch {
          // Ignore
        }
      }, 650);
    }
  }, [initialAutoplay, currentSpreadIndex]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen restriction
    }
  };

  const handleRestartStory = () => {
    setSleepDimmed(false);
    stopCurrentAudio();
    if (flipBookRef.current) {
      const pf = flipBookRef.current.pageFlip();
      if (pf) {
        soundEngine.playPageFlip();
        pf.flip(2);
      }
    }
    setIsPlaying(true);
  };

  // Read a specific single page when Charlotte taps its "Listen" speaker button
  const handleReadSinglePage = (pageIdx: number, page: StoryPage) => {
    setSleepDimmed(false);
    setIsAutoplay(false);
    setIsPlaying(false);
    stopCurrentAudio();

    const singleRunId = playbackRunIdRef.current;
    setTimeout(() => {
      setActiveReadingPageIdx(pageIdx);
      playAudioClip(page.audioUrl, page.text, singleRunId, () => {
        if (singleRunId === playbackRunIdRef.current) {
          setActiveReadingPageIdx(null);
        }
      });
    }, 60);
  };

  // Kid-proof hold-to-exit handler (or quick click when paused)
  const startExitHold = () => {
    if (!isPlaying) {
      stopCurrentAudio();
      onExit();
      return;
    }
    setExitHoldProgress(100);
    exitHoldTimeoutRef.current = setTimeout(() => {
      stopCurrentAudio();
      onExit();
    }, 650);
  };

  const cancelExitHold = () => {
    setExitHoldProgress(0);
    if (exitHoldTimeoutRef.current) {
      clearTimeout(exitHoldTimeoutRef.current);
      exitHoldTimeoutRef.current = null;
    }
  };

  // Current human-readable page/spread label
  const getSpreadLabel = () => {
    if (currentSpreadIndex <= 1) return "Cover";
    if (currentSpreadIndex >= 12) return "Colour by Numbers & Goodnight";
    if (isPortraitPhone) {
      return `Page ${currentSpreadIndex - 1} of 10`;
    }
    const leftPageNum = currentSpreadIndex - 1;
    const rightPageNum = currentSpreadIndex;
    return `Pages ${leftPageNum} & ${rightPageNum} of 10`;
  };

  return (
    <div
      onMouseMove={resetHudTimer}
      onTouchStart={resetHudTimer}
      className="relative flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#070913] select-none"
    >
      {/* Starry Night Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(46,38,94,0.45)_0%,_rgba(8,10,22,0.98)_75%)]" />

      {/* Warm Amber Bedtime Eye-Comfort Filter Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-700"
        style={{
          backgroundColor: "rgba(255, 166, 64, 1)",
          mixBlendMode: "multiply",
          opacity: warmthLevel / 100,
        }}
      />

      {/* Sleep Dimmer Overlay (activates gently after Page 10 finishes) */}
      {sleepDimmed && (
        <div
          onClick={() => setSleepDimmed(false)}
          className="fixed inset-0 z-45 flex cursor-pointer flex-col items-center justify-center bg-black/80 px-6 text-center backdrop-blur-sm transition-opacity duration-1000"
        >
          <Moon className="mb-4 h-12 w-12 animate-pulse text-amber-300/70" />
          <p className="font-display text-xl sm:text-2xl tracking-wide text-amber-100/80">
            Goodnight, sweet Charlotte
          </p>
          <p className="mt-2 text-xs text-amber-200/50">
            Tap anywhere to wake the storybook
          </p>
        </div>
      )}

      {/* Extracted Top & Bottom HUD Controls */}
      <FlipbookHud
        storyTitle={story.title}
        spreadLabel={getSpreadLabel()}
        showHud={showHud}
        isPlaying={isPlaying}
        isAutoplay={isAutoplay}
        isAmbientOn={isAmbientOn}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isPortraitPhone={isPortraitPhone}
        warmthLevel={warmthLevel}
        exitHoldProgress={exitHoldProgress}
        currentSpreadIndex={currentSpreadIndex}
        onStartExitHold={startExitHold}
        onCancelExitHold={cancelExitHold}
        onTogglePlay={() => {
          setSleepDimmed(false);
          setIsPlaying((prev) => !prev);
        }}
        onToggleAutoplay={() => setIsAutoplay((prev) => !prev)}
        onToggleAmbient={() => setIsAmbientOn((prev) => !prev)}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onChangeWarmth={(val) => setWarmthLevel(val)}
        onToggleFullscreen={toggleFullscreen}
        onJumpToSpread={(targetIdx) => {
          setSleepDimmed(false);
          stopCurrentAudio();
          if (flipBookRef.current) {
            soundEngine.playPageFlip();
            flipBookRef.current.pageFlip().flip(targetIdx);
          }
        }}
      />

      {/* Main 3D Hardcover Book Frame */}
      <div className="relative flex items-center justify-center">
        {/* Leather/Gold Outer Book Binding Frame */}
        <div
          className="relative flex items-center justify-center rounded-[22px] sm:rounded-[26px] border-4 border-[#6d4c2d] bg-gradient-to-b from-[#3d2817] via-[#291a0e] to-[#1e1209] p-2 sm:p-3.5 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(245,196,105,0.12)]"
          style={{
            width: isPortraitPhone
              ? dimensions.width + 18
              : dimensions.width * 2 + 28,
            height: dimensions.height + 20,
          }}
        >
          {/* Decorative Gold Book Corners */}
          <div className="pointer-events-none absolute top-1.5 left-1.5 h-5 w-5 rounded-tl-xl border-t-2 border-l-2 border-amber-400/50" />
          <div className="pointer-events-none absolute top-1.5 right-1.5 h-5 w-5 rounded-tr-xl border-t-2 border-r-2 border-amber-400/50" />
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 h-5 w-5 rounded-bl-xl border-b-2 border-l-2 border-amber-400/50" />
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-5 w-5 rounded-br-xl border-b-2 border-r-2 border-amber-400/50" />

          {/* Subtle Center Book Spine Crease Line (only in 2-page landscape spread mode) */}
          {!isPortraitPhone && (
            <>
              <div className="pointer-events-none absolute inset-y-3 left-1/2 z-30 w-3 -translate-x-1/2 bg-gradient-to-r from-amber-950/15 via-amber-950/35 to-amber-950/15" />
              <div className="pointer-events-none absolute inset-y-3 left-1/2 z-30 w-px -translate-x-1/2 bg-amber-950/40" />
            </>
          )}

          {/* Interactive Flipbook */}
          <HTMLFlipBook
            key={isPortraitPhone ? "portrait-book" : "landscape-book"}
            ref={flipBookRef}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={260}
            maxWidth={900}
            minHeight={360}
            maxHeight={900}
            maxShadowOpacity={0.55}
            showCover={false}
            mobileScrollSupport={false}
            swipeDistance={25}
            clickEventForward={false}
            useMouseEvents={true}
            flippingTime={800}
            usePortrait={isPortraitPhone}
            startZIndex={10}
            autoSize={false}
            drawShadow={true}
            showPageCorners={true}
            disableFlipByClick={true}
            startPage={currentSpreadIndex}
            onInit={handleBookInit}
            onFlip={(e: { data: number }) => {
              soundEngine.playPageFlip();
              setCurrentSpreadIndex(e.data);
            }}
            className="gembook-flipbook"
            style={{}}
          >
            {/* =========================================================
                PAGE INDEX 0 (Spread 0 Left): Dedication Frontispiece
               ========================================================= */}
            <FlipPage
              className={`${
                isPortraitPhone ? "rounded-xl" : "rounded-l-xl"
              } bg-gradient-to-br from-[#fbf4e4] via-[#f5e8cc] to-[#ead5ad] text-parchment-900 shadow-inner`}
            >
              <div className="flex h-full flex-col items-center justify-between border-r border-amber-900/15 p-5 sm:py-10 sm:pl-8 sm:pr-10 text-center">
                <div className="mt-2 sm:mt-4 flex items-center gap-2 text-amber-800/70">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-display text-[10px] sm:text-xs tracking-[0.25em] uppercase">
                    Charlotte&apos;s Bedtime Library
                  </span>
                  <Sparkles className="h-4 w-4" />
                </div>

                <div className="my-auto max-w-md space-y-4 sm:space-y-5">
                  <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-amber-700/30 bg-amber-500/10 shadow-inner">
                    <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-amber-800" />
                  </div>
                  <h1 className="font-display text-xl sm:text-3xl font-bold leading-tight text-[#2c1d11]">
                    {story.title}
                  </h1>
                  <p className="font-serif italic text-sm sm:text-lg text-amber-950/80">
                    {story.subtitle}
                  </p>
                  <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-amber-800/40 to-transparent" />
                  <p className="rounded-2xl border border-amber-800/15 bg-amber-900/5 px-4 py-2.5 sm:px-5 sm:py-3 font-serif text-xs sm:text-base text-amber-950">
                    ✨ {story.dedicatedTo} ✨
                  </p>
                </div>

                <div className="mb-1 text-[11px] sm:text-xs text-amber-900/60">
                  Swipe page corner to begin the adventure →
                </div>
              </div>
            </FlipPage>

            {/* =========================================================
                PAGE INDEX 1 (Spread 0 Right): Story Cover Artwork
               ========================================================= */}
            <FlipPage
              className={`${
                isPortraitPhone ? "rounded-xl" : "rounded-r-xl"
              } bg-gradient-to-bl from-[#fbf4e4] via-[#f5e8cc] to-[#ead5ad] text-parchment-900`}
            >
              <div className="relative flex h-full flex-col items-center justify-between p-4 sm:py-8 sm:pl-10 sm:pr-8">
                <div className="relative h-[78%] w-full overflow-hidden rounded-2xl border-4 border-amber-700/40 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-center text-white drop-shadow">
                    <p className="font-display text-xs sm:text-base font-bold tracking-wider text-amber-200">
                      {story.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsPlaying(true);
                    flipToNextSpread();
                  }}
                  className="mt-2 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-amber-50 shadow-lg transition hover:brightness-110 active:scale-95"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Open Page 1 &amp; Start Story
                </button>
              </div>
            </FlipPage>

            {/* =========================================================
                PAGE INDICES 2..11 (Spreads 1..5): 10 Story Pages!
               ========================================================= */}
            {story.pages.map((page, idx) => {
              const flipPageIndex = idx + 2; // 2..11
              const isLeftPage = flipPageIndex % 2 === 0;
              const isBeingRead = activeReadingPageIdx === flipPageIndex;
              const sentences = pageSentences[idx] || [page.text];

              // Calculate which sentence is currently being spoken based on character-weighted audio progress
              const totalChars = page.text.length || 1;
              let cumulativeChars = 0;
              const activeSentenceIdx = isBeingRead
                ? sentences.findIndex((s) => {
                    cumulativeChars += s.length + 1;
                    return (
                      activeReadingProgress <= cumulativeChars / totalChars
                    );
                  })
                : -1;

              return (
                <FlipPage
                  key={page.pageNumber}
                  className={`${
                    isPortraitPhone
                      ? "rounded-xl"
                      : isLeftPage
                      ? "rounded-l-xl"
                      : "rounded-r-xl"
                  } bg-gradient-to-b from-[#fdf8ec] via-[#f8eed9] to-[#efe0c1] text-[#2b1e12]`}
                >
                  {/* Soft, narrow inner spine shading (only in 2-page landscape mode) */}
                  {!isPortraitPhone && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 z-10 w-4 ${
                        isLeftPage
                          ? "right-0 bg-gradient-to-l from-amber-950/15 to-transparent"
                          : "left-0 bg-gradient-to-r from-amber-950/15 to-transparent"
                      }`}
                    />
                  )}

                  {/* Active Reading Golden Highlight Border */}
                  <div
                    className={`relative z-20 flex h-full w-full flex-col justify-between py-3.5 sm:py-5 transition-all duration-500 ${
                      isPortraitPhone
                        ? "px-4"
                        : isLeftPage
                        ? "pl-4 pr-7 sm:pl-6 sm:pr-9"
                        : "pl-7 pr-4 sm:pl-9 sm:pr-6"
                    } ${
                      isBeingRead
                        ? "ring-4 ring-inset ring-amber-400/80 bg-amber-100/20"
                        : ""
                    }`}
                  >
                    {/* Page Header: Chapter Title & Read-This-Page Button */}
                    <div className="flex items-center justify-between gap-2 border-b border-amber-900/15 pb-1.5">
                      <span className="truncate font-display text-[11px] sm:text-xs font-bold tracking-wider uppercase text-amber-900/80">
                        {page.chapterTitle || `Page ${page.pageNumber}`}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadSinglePage(flipPageIndex, page);
                        }}
                        className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                          isBeingRead
                            ? "bg-amber-500 text-slate-950 shadow-sm animate-pulse"
                            : "bg-amber-900/10 text-amber-900 hover:bg-amber-900/20"
                        }`}
                        title="Listen to this page"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>{isBeingRead ? "Reading..." : "Listen"}</span>
                      </button>
                    </div>

                    {/* Generated Storybook Artwork */}
                    <div className="relative my-2 flex-1 min-h-0 w-full overflow-hidden rounded-xl border-2 border-amber-800/25 bg-amber-950/10 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.image}
                        alt={page.chapterTitle || `Page ${page.pageNumber}`}
                        className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${
                          isBeingRead ? "scale-105" : "scale-100"
                        }`}
                        loading="eager"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_24px_rgba(43,30,18,0.28)]" />
                    </div>

                    {/* Easy-to-read Bedtime Story Text with Sentence Karaoke Highlight & Scroll-Safety on Small Portrait Phones */}
                    <div
                      className={`max-h-[34%] overflow-y-auto rounded-xl px-3 py-2 sm:px-4 sm:py-3 transition-colors duration-500 ${
                        isBeingRead
                          ? "bg-amber-300/20 border border-amber-600/30 shadow-sm"
                          : "bg-amber-950/[0.04] border border-amber-900/10"
                      }`}
                    >
                      <p className="font-serif text-[12.5px] sm:text-[15px] md:text-[15.5px] leading-relaxed text-[#2a1d11]">
                        {sentences.map((sentence, sIdx) => {
                          const isCurrentSentence =
                            isBeingRead &&
                            (activeSentenceIdx === sIdx ||
                              (activeSentenceIdx === -1 &&
                                sIdx === sentences.length - 1));
                          return (
                            <span
                              key={sIdx}
                              className={`transition-colors duration-300 rounded px-0.5 ${
                                isCurrentSentence
                                  ? "bg-amber-400/45 text-[#1a1108] font-medium"
                                  : ""
                              }`}
                            >
                              {sIdx === 0 ? (
                                <>
                                  <span className="font-display text-base sm:text-xl font-bold text-amber-800">
                                    {sentence.charAt(0)}
                                  </span>
                                  {sentence.slice(1)}
                                </>
                              ) : (
                                sentence
                              )}{" "}
                            </span>
                          );
                        })}
                      </p>
                    </div>

                    {/* Page Footer Number */}
                    <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-amber-900/60">
                      <span>
                        {isPortraitPhone || isLeftPage
                          ? `Page ${page.pageNumber}`
                          : ""}
                      </span>
                      <span className="font-display tracking-widest text-amber-800/50">
                        ✦ {page.pageNumber} ✦
                      </span>
                      <span>
                        {!isPortraitPhone && !isLeftPage
                          ? `Page ${page.pageNumber}`
                          : isPortraitPhone
                          ? "Swipe →"
                          : ""}
                      </span>
                    </div>
                  </div>
                </FlipPage>
              );
            })}

            {/* =========================================================
                PAGE INDEX 12 (Spread 6 Left): The End / Goodnight & Colour Prompt
               ========================================================= */}
            <FlipPage
              className={`${
                isPortraitPhone ? "rounded-xl" : "rounded-l-xl"
              } bg-gradient-to-br from-[#1b1638] via-[#131029] to-[#0c0a1a] text-amber-100`}
            >
              <div className="flex h-full flex-col items-center justify-between py-6 pl-5 pr-7 sm:py-8 sm:pl-7 sm:pr-9 text-center">
                <div className="mt-2 flex items-center gap-2 text-amber-300/80">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-display text-[10px] sm:text-xs tracking-[0.25em] uppercase">
                    The End of Tonight&apos;s Story
                  </span>
                  <Sparkles className="h-4 w-4" />
                </div>

                <div className="my-auto flex flex-col items-center">
                  <div className="mb-3 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                    <Moon className="h-7 w-7 sm:h-8 sm:w-8 text-amber-300" />
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-200">
                    {story.closingTitle || "Goodnight, Sweet Charlotte"}
                  </h2>
                  <p className="mt-2.5 max-w-sm font-serif text-xs sm:text-sm leading-relaxed text-amber-100/85">
                    {story.closingMessage}
                  </p>

                  {/* Stylus Colour-by-Numbers Invitation Card */}
                  <div className="mt-5 max-w-sm rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-center shadow-inner">
                    <p className="font-display text-xs sm:text-sm font-bold text-amber-300">
                      🎨 Bonus Activity: Colour by Numbers!
                    </p>
                    <p className="mt-1 font-serif text-xs text-amber-100/90">
                      {story.coloringActivity.promptText}
                    </p>
                    {isPortraitPhone && (
                      <button
                        onClick={flipToNextSpread}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow"
                      >
                        Open Colouring Page →
                      </button>
                    )}
                  </div>
                </div>

                {/* Replay / Bookshelf / Nightlight Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={handleRestartStory}
                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Read Again
                  </button>

                  <button
                    onClick={() => {
                      stopCurrentAudio();
                      onExit();
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-white/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-white/20 active:scale-95"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Story Bookshelf
                  </button>

                  <button
                    onClick={() => setSleepDimmed(true)}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-300/30 bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/30 active:scale-95"
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Nightlight Mode
                  </button>
                </div>
              </div>
            </FlipPage>

            {/* =========================================================
                PAGE INDEX 13 (Spread 6 Right): Interactive Stylus Colour-by-Numbers!
               ========================================================= */}
            <FlipPage
              className={`${
                isPortraitPhone ? "rounded-xl" : "rounded-r-xl"
              } bg-gradient-to-b from-[#fdf8ec] via-[#f8eed9] to-[#efe0c1] text-[#2b1e12]`}
            >
              <div
                className={`relative z-20 flex h-full w-full flex-col justify-between py-3.5 sm:py-4 ${
                  isPortraitPhone ? "px-4" : "pl-7 pr-4 sm:pl-9 sm:pr-6"
                }`}
              >
                <ColorByNumbersCanvas
                  storyId={story.id}
                  storyTitle={story.title}
                  coloringImageUrl={story.coloringActivity.imageUrl}
                  palette={story.coloringActivity.palette}
                  hints={story.coloringActivity.hints}
                />
              </div>
            </FlipPage>
          </HTMLFlipBook>
        </div>

        {/* Left & Right Quick Page-Flip Side Arrows */}
        <button
          onClick={() => {
            setSleepDimmed(false);
            flipToPrevSpread();
          }}
          disabled={currentSpreadIndex === 0}
          className={`fixed left-1.5 sm:left-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-amber-300/25 bg-[#12162b]/80 p-2 sm:p-3 text-amber-200 shadow-xl backdrop-blur-md transition hover:bg-amber-400 hover:text-slate-950 disabled:opacity-20 ${
            showHud ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onClick={() => {
            setSleepDimmed(false);
            flipToNextSpread();
          }}
          disabled={currentSpreadIndex >= (isPortraitPhone ? 13 : 12)}
          className={`fixed right-1.5 sm:right-3 top-1/2 z-40 -translate-y-1/2 rounded-full border border-amber-300/25 bg-[#12162b]/80 p-2 sm:p-3 text-amber-200 shadow-xl backdrop-blur-md transition hover:bg-amber-400 hover:text-slate-950 disabled:opacity-20 ${
            showHud ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );
}
