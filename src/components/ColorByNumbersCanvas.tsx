"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  PaintBucket,
  RotateCcw,
  Sparkles,
  Undo2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundEngine } from "@/utils/soundEffects";

export interface PaintSwatch {
  number: number;
  name: string;
  hex: string;
}

export interface NumberHintMarker {
  /** Percentage X (0..100) across the coloring canvas */
  x: number;
  /** Percentage Y (0..100) down the coloring canvas */
  y: number;
  /** Palette number (1..8) */
  number: number;
}

interface ColorByNumbersCanvasProps {
  storyId: string;
  storyTitle: string;
  coloringImageUrl: string;
  palette: PaintSwatch[];
  hints: NumberHintMarker[];
}

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b, 255];
}

export function ColorByNumbersCanvas({
  storyId,
  storyTitle,
  coloringImageUrl,
  palette,
  hints,
}: ColorByNumbersCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);

  const [selectedSwatch, setSelectedSwatch] = useState<PaintSwatch>(palette[0]);
  const [showNumbers, setShowNumbers] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [paintCount, setPaintCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `charlotte-gembook-coloring-${storyId}-v1`;

  // Load coloring line-art image onto the HTML5 Canvas
  const initCanvas = useCallback(
    (restoreSaved = true) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = 900;
        canvas.height = 675;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Save clean uncolored baseline for Reset & outline boundary checks
        originalImageDataRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Restore Charlotte's saved artwork if present
        if (restoreSaved) {
          try {
            const savedDataUrl = localStorage.getItem(storageKey);
            if (savedDataUrl) {
              const savedImg = new Image();
              savedImg.onload = () => {
                ctx.drawImage(savedImg, 0, 0, canvas.width, canvas.height);
              };
              savedImg.src = savedDataUrl;
            }
          } catch {
            // Ignore storage errors
          }
        }

        setIsLoaded(true);
      };
      img.src = coloringImageUrl;
    },
    [coloringImageUrl, storageKey]
  );

  useEffect(() => {
    initCanvas(true);
  }, [initCanvas]);

  const saveCanvasToStorage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      localStorage.setItem(storageKey, canvas.toDataURL("image/png"));
    } catch {
      // Ignore quota errors
    }
  }, [storageKey]);

  /**
   * Fast scanline flood-fill algorithm that respects dark line-art boundaries
   * so Charlotte can tap with her Galaxy Tab stylus to paint any region!
   */
  const handleCanvasPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.stopPropagation(); // Prevent triggering a flipbook page drag!

    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const startX = Math.floor((e.clientX - rect.left) * scaleX);
    const startY = Math.floor((e.clientY - rect.top) * scaleY);

    if (
      startX < 0 ||
      startX >= canvas.width ||
      startY < 0 ||
      startY >= canvas.height
    ) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const baseData = originalImageDataRef.current?.data;

    const startIdx = (startY * width + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];

    // Do not flood-fill if tapping directly on a dark black outline
    const baseBrightness = baseData
      ? (baseData[startIdx] + baseData[startIdx + 1] + baseData[startIdx + 2]) /
        3
      : (targetR + targetG + targetB) / 3;
    if (baseBrightness < 95) {
      return;
    }

    const [fillR, fillG, fillB, fillA] = hexToRgba(selectedSwatch.hex);

    // If region is already painted this exact color, do nothing
    if (
      Math.abs(targetR - fillR) < 6 &&
      Math.abs(targetG - fillG) < 6 &&
      Math.abs(targetB - fillB) < 6
    ) {
      return;
    }

    // Save snapshot to undo stack (max 12 steps)
    undoStackRef.current.push(ctx.getImageData(0, 0, width, height));
    if (undoStackRef.current.length > 12) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);

    const visited = new Uint8Array(width * height);
    const stack: number[] = [startX, startY];
    const tolerance = 52;

    const matchesTarget = (pixelIdx: number) => {
      const byteIdx = pixelIdx * 4;
      // Never cross original dark line-art boundaries
      if (baseData) {
        const origLum =
          (baseData[byteIdx] +
            baseData[byteIdx + 1] +
            baseData[byteIdx + 2]) /
          3;
        if (origLum < 115) return false;
      }
      const r = data[byteIdx];
      const g = data[byteIdx + 1];
      const b = data[byteIdx + 2];
      return (
        Math.abs(r - targetR) <= tolerance &&
        Math.abs(g - targetG) <= tolerance &&
        Math.abs(b - targetB) <= tolerance
      );
    };

    let filledPixels = 0;

    while (stack.length > 0) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const pixelIdx = y * width + x;

      if (visited[pixelIdx]) continue;
      if (!matchesTarget(pixelIdx)) continue;

      // Scan left
      let leftX = x;
      while (leftX > 0 && !visited[y * width + (leftX - 1)] && matchesTarget(y * width + (leftX - 1))) {
        leftX--;
      }

      // Scan right
      let rightX = x;
      while (
        rightX < width - 1 &&
        !visited[y * width + (rightX + 1)] &&
        matchesTarget(y * width + (rightX + 1))
      ) {
        rightX++;
      }

      let spanAbove = false;
      let spanBelow = false;

      for (let currX = leftX; currX <= rightX; currX++) {
        const currIdx = y * width + currX;
        visited[currIdx] = 1;
        const byteIdx = currIdx * 4;
        data[byteIdx] = fillR;
        data[byteIdx + 1] = fillG;
        data[byteIdx + 2] = fillB;
        data[byteIdx + 3] = fillA;
        filledPixels++;

        if (y > 0) {
          const aboveIdx = (y - 1) * width + currX;
          if (!spanAbove && !visited[aboveIdx] && matchesTarget(aboveIdx)) {
            stack.push(currX, y - 1);
            spanAbove = true;
          } else if (spanAbove && (visited[aboveIdx] || !matchesTarget(aboveIdx))) {
            spanAbove = false;
          }
        }

        if (y < height - 1) {
          const belowIdx = (y + 1) * width + currX;
          if (!spanBelow && !visited[belowIdx] && matchesTarget(belowIdx)) {
            stack.push(currX, y + 1);
            spanBelow = true;
          } else if (spanBelow && (visited[belowIdx] || !matchesTarget(belowIdx))) {
            spanBelow = false;
          }
        }
      }
    }

    if (filledPixels > 0) {
      // Re-composite crisp black outlines from original image on top so anti-aliased edges look clean
      if (baseData) {
        for (let i = 0; i < data.length; i += 4) {
          const origLum =
            (baseData[i] + baseData[i + 1] + baseData[i + 2]) / 3;
          if (origLum < 115) {
            data[i] = baseData[i];
            data[i + 1] = baseData[i + 1];
            data[i + 2] = baseData[i + 2];
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      saveCanvasToStorage();

      const nextCount = paintCount + 1;
      setPaintCount(nextCount);
      if (nextCount === 5 || nextCount === 12) {
        soundEngine.playMagicalSparkle();
        try {
          confetti({
            particleCount: 25,
            spread: 55,
            origin: { y: 0.7 },
          });
        } catch {
          // Ignore
        }
      }
    }
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevData = undoStackRef.current.pop()!;
    ctx.putImageData(prevData, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
    saveCanvasToStorage();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    undoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(originalImageDataRef.current, 0, 0);
    setCanUndo(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  const handleDownloadArtwork = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${storyId}-charlotte-masterpiece.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-full w-full flex-col justify-between select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-1 border-b border-amber-900/15 pb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <PaintBucket className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          <span className="truncate font-display text-[11px] sm:text-xs font-bold tracking-wider uppercase text-amber-950">
            Stylus Colour-by-Numbers
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNumbers((prev) => !prev);
            }}
            className="flex items-center gap-1 rounded-full bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-900/20"
            title="Show or hide number hints"
          >
            {showNumbers ? (
              <>
                <EyeOff className="h-3 w-3" />
                <span>Hide #s</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>Show #s</span>
              </>
            )}
          </button>

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 rounded-full bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-900/20 disabled:opacity-35"
            title="Undo last paint fill"
          >
            <Undo2 className="h-3 w-3" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-full bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-900/20"
            title="Clear and start coloring again"
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          <button
            onClick={handleDownloadArtwork}
            className="flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm hover:bg-amber-700"
            title="Save Charlotte's painted picture"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Interactive Coloring Canvas + Number Hint Badges */}
      <div className="relative my-1.5 flex-1 min-h-0 w-full overflow-hidden rounded-xl border-2 border-amber-800/35 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          className="h-full w-full cursor-crosshair touch-none object-contain"
        />

        {/* Number-by-Color Guide Overlay Markers (pointer-events-none so stylus taps go straight to canvas) */}
        {showNumbers &&
          hints.map((hint, idx) => {
            const matchingSwatch = palette.find(
              (p) => p.number === hint.number
            );
            const isSelected = selectedSwatch.number === hint.number;
            return (
              <div
                key={idx}
                style={{ left: `${hint.x}%`, top: `${hint.y}%` }}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-[10px] sm:text-xs font-extrabold shadow transition-transform ${
                  isSelected
                    ? "scale-125 border-amber-950 bg-amber-300 text-slate-950 ring-2 ring-white"
                    : "border-slate-700/60 bg-white/90 text-slate-900"
                }`}
              >
                <span>{hint.number}</span>
                {matchingSwatch && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white"
                    style={{ backgroundColor: matchingSwatch.hex }}
                  />
                )}
              </div>
            );
          })}
      </div>

      {/* Numbered Paint Bucket Palette for Galaxy Tab Stylus */}
      <div className="rounded-xl border border-amber-900/15 bg-amber-950/[0.06] p-1.5 sm:p-2">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-950/80">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-600" />
            Tap a numbered paint pot with your stylus, then tap the picture!
          </span>
          <span className="font-bold text-amber-900">
            Active: #{selectedSwatch.number} {selectedSwatch.name}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {palette.map((swatch) => {
            const isSelected = selectedSwatch.number === swatch.number;
            return (
              <button
                key={swatch.number}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSwatch(swatch);
                }}
                className={`group relative flex flex-col items-center justify-center rounded-xl py-1 px-1 transition-all ${
                  isSelected
                    ? "scale-105 bg-amber-950 text-amber-50 shadow-md ring-2 ring-amber-500"
                    : "bg-white/80 text-amber-950 hover:bg-white"
                }`}
              >
                <div
                  className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span className="rounded-full bg-black/45 px-1.5 text-[10px] font-extrabold text-white drop-shadow">
                    {swatch.number}
                  </span>
                </div>
                <span className="mt-0.5 max-w-full truncate text-[9px] font-semibold leading-tight">
                  {swatch.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
