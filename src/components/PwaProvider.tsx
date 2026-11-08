"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaProvider() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration skipped:", err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  if (!installPrompt || dismissed) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-[#14172b]/95 px-4 py-3 text-amber-100 shadow-2xl backdrop-blur-md">
      <Sparkles className="h-5 w-5 text-amber-300 shrink-0" />
      <div className="text-xs sm:text-sm">
        <p className="font-semibold text-amber-200">
          Install Charlotte&apos;s Storybook App
        </p>
        <p className="text-amber-100/70">
          Add to Galaxy Tab home screen for instant fullscreen &amp; offline bedtime reading
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110 active:scale-95"
      >
        <Download className="h-3.5 w-3.5" />
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-amber-200/50 hover:bg-white/10 hover:text-amber-100"
        aria-label="Dismiss install banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
