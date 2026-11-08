"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Clock,
  Maximize2,
  Moon,
  Play,
  Sparkles,
  Volume2,
} from "lucide-react";
import { STORIES, Story } from "@/data/stories";
import { StoryFlipbook } from "@/components/StoryFlipbook";
import { soundEngine } from "@/utils/soundEffects";

export function StoryLibrary() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [autoplayMode, setAutoplayMode] = useState(true);

  // Trigger fullscreen + landscape orientation lock + magical chime + launch flipbook
  const handleOpenStory = async (story: Story, withAutoplay = true) => {
    soundEngine.playMagicalSparkle();
    setAutoplayMode(withAutoplay);

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Attempt landscape orientation lock on Galaxy Tab Chrome
      if (
        typeof screen !== "undefined" &&
        "orientation" in screen &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (screen.orientation as any)?.lock === "function"
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock("landscape").catch(() => {});
      }
    } catch {
      // Ignore if fullscreen is blocked
    }

    setSelectedStory(story);
  };

  if (selectedStory) {
    return (
      <StoryFlipbook
        story={selectedStory}
        initialAutoplay={autoplayMode}
        onExit={() => setSelectedStory(null)}
      />
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#070914] text-amber-50 select-none">
      {/* Enchanted Starry Night Sky Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,43,115,0.45)_0%,_rgba(10,13,28,0.95)_65%,_rgba(5,7,15,1)_100%)]" />

      {/* Twinkling Starfield Dots */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute top-[12%] left-[18%] h-1.5 w-1.5 rounded-full bg-amber-200 animate-ping" />
        <div className="absolute top-[22%] right-[24%] h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
        <div className="absolute top-[45%] left-[8%] h-1 w-1 rounded-full bg-indigo-200 animate-pulse" />
        <div className="absolute bottom-[28%] right-[14%] h-1.5 w-1.5 rounded-full bg-amber-100 animate-ping" />
        <div className="absolute top-[16%] left-[52%] h-1 w-1 rounded-full bg-amber-200" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-6 sm:px-10 sm:py-8">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 to-indigo-500/20 shadow-lg shadow-amber-500/10">
              <Moon className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs uppercase tracking-[0.25em] text-amber-300/80">
                  Good Evening, Charlotte
                </span>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-amber-100">
                Charlotte&apos;s Magical Bedtime Library
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-amber-300/20 bg-white/5 px-4 py-2 text-xs text-amber-200/90 backdrop-blur-md">
              <Volume2 className="h-4 w-4 text-amber-300" />
              <span>Australian Bedtime Narrator • Auto-Fullscreen Ready</span>
            </div>

            <button
              onClick={async () => {
                try {
                  if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                  } else {
                    await document.exitFullscreen();
                  }
                } catch {
                  // Ignore
                }
              }}
              className="flex items-center gap-2 rounded-full border border-amber-300/25 bg-white/5 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-white/10"
            >
              <Maximize2 className="h-3.5 w-3.5 text-amber-300" />
              <span>Fullscreen</span>
            </button>
          </div>
        </header>

        {/* Featured Story Hero Banner (1-Tap Instant Fullscreen + Autoplay Launch for Galaxy Tab) */}
        <section className="my-auto py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm sm:text-base uppercase tracking-[0.2em] text-amber-300/90">
              ✨ Choose Tonight&apos;s Bedtime Story
            </h2>
            <span className="text-xs text-amber-200/60">
              Tap a book cover to open in Fullscreen with Voiceover Autoplay
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {STORIES.map((story) => (
              <div
                key={story.id}
                onClick={() => handleOpenStory(story, true)}
                className="group relative col-span-1 lg:col-span-12 flex flex-col md:flex-row cursor-pointer overflow-hidden rounded-3xl border-2 border-amber-300/25 bg-gradient-to-br from-[#171a36]/90 via-[#12152b]/95 to-[#0d0f20]/95 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_20px_70px_rgba(245,196,105,0.18)]"
              >
                {/* 3D Hardcover Book Cover Preview */}
                <div className="relative mx-auto md:mx-0 h-72 w-56 sm:h-80 sm:w-64 shrink-0 overflow-hidden rounded-2xl border-4 border-amber-500/40 shadow-2xl transition-transform duration-500 group-hover:scale-[1.03] group-hover:-rotate-1">
                  {/* Book Spine Highlight */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-5 bg-gradient-to-r from-black/50 via-white/15 to-transparent" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute bottom-3 inset-x-3 text-center">
                    <span className="inline-block rounded-full bg-amber-400/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow">
                      10 Illustrated Pages
                    </span>
                  </div>
                </div>

                {/* Story Details & Instant Launch Controls */}
                <div className="mt-6 md:mt-0 md:ml-8 flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300">
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1">
                        {story.dedicatedTo}
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-indigo-200">
                        <Clock className="h-3.5 w-3.5" />
                        {story.readingTimeMinutes} Min Bedtime Listen
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                        <Volume2 className="h-3.5 w-3.5" />
                        Calm Australian Voiceover
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-2xl sm:text-4xl font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                      {story.title}
                    </h3>
                    <p className="mt-1 font-serif italic text-base sm:text-lg text-amber-200/80">
                      {story.subtitle}
                    </p>

                    <p className="mt-4 max-w-2xl font-serif text-sm sm:text-base leading-relaxed text-amber-100/80">
                      {story.summary}
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStory(story, true);
                      }}
                      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-7 py-4 text-sm sm:text-base font-bold text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition hover:brightness-110 active:scale-95"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      <span>Open Book &amp; Autoplay with Voiceover</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStory(story, false);
                      }}
                      className="flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-white/5 px-5 py-4 text-sm font-semibold text-amber-100 transition hover:bg-white/15 active:scale-95"
                    >
                      <BookOpen className="h-4 w-4 text-amber-300" />
                      <span>Read at My Own Pace</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Footer Note */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/10 pt-4 text-xs text-amber-200/50">
          <span>
            Made with love for Charlotte • Optimized for Samsung Galaxy Tab Landscape
          </span>
          <span>
            Swipe page corners or relax with hands-free Bedtime Autoplay
          </span>
        </footer>
      </div>
    </main>
  );
}
