"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Brush,
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

type GuideMode = "smart" | "all" | "off";
type StylusTool = "bucket" | "brush";

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b, 255];
}

export function ColorByNumbersCanvas({
  storyId,
  coloringImageUrl,
  palette,
  hints,
}: ColorByNumbersCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const isDrawingBrushRef = useRef(false);
  const lastBrushPointRef = useRef<{ x: number; y: number } | null>(null);

  const [selectedSwatch, setSelectedSwatch] = useState<PaintSwatch>(palette[0]);
  const [guideMode, setGuideMode] = useState<GuideMode>("smart");
  const [activeTool, setActiveTool] = useState<StylusTool>("bucket");
  const [completedHints, setCompletedHints] = useState<Record<number, boolean>>(
    {}
  );
  const [canUndo, setCanUndo] = useState(false);
  const [paintCount, setPaintCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `charlotte-gembook-coloring-${storyId}-v1`;

  /**
   * Inspect canvas pixels at each hint's (x%, y%) coordinate.
   * Once a region is painted (no longer white), its number hint automatically vanishes
   * so numbers never obstruct Charlotte's artwork!
   */
  const syncCompletedHints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const baseData = originalImageDataRef.current?.data;

    const nextCompleted: Record<number, boolean> = {};

    hints.forEach((hint, idx) => {
      const cx = Math.floor((hint.x / 100) * width);
      const cy = Math.floor((hint.y / 100) * height);

      // Sample a small neighborhood around (cx, cy) ignoring original black outlines
      let coloredSamples = 0;
      let validSamples = 0;

      for (let dy = -4; dy <= 4; dy += 2) {
        for (let dx = -4; dx <= 4; dx += 2) {
          const sx = Math.min(width - 1, Math.max(0, cx + dx));
          const sy = Math.min(height - 1, Math.max(0, cy + dy));
          const pIdx = (sy * width + sx) * 4;

          if (baseData) {
            const origLum =
              (baseData[pIdx] + baseData[pIdx + 1] + baseData[pIdx + 2]) / 3;
            if (origLum < 140) continue; // Skip dark line-art pixels
          }

          validSamples++;
          const r = imgData[pIdx];
          const g = imgData[pIdx + 1];
          const b = imgData[pIdx + 2];

          // Check if pixel differs meaningfully from unpainted white
          if (r < 244 || g < 244 || b < 244) {
            coloredSamples++;
          }
        }
      }

      if (validSamples > 0 && coloredSamples / validSamples >= 0.5) {
        nextCompleted[idx] = true;
      }
    });

    setCompletedHints(nextCompleted);
  }, [hints]);

  /**
   * Re-composite original dark line-art pixels on top of the canvas
   * so both Paint Bucket and Magic Brush keep crisp black outlines.
   */
  const recompositeLineArt = useCallback(() => {
    const canvas = canvasRef.current;
    const baseData = originalImageDataRef.current?.data;
    if (!canvas || !baseData) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const origLum =
        (baseData[i] + baseData[i + 1] + baseData[i + 2]) / 3;
      if (origLum < 115) {
        data[i] = baseData[i];
        data[i + 1] = baseData[i + 1];
        data[i + 2] = baseData[i + 2];
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

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
                syncCompletedHints();
              };
              savedImg.src = savedDataUrl;
            } else {
              syncCompletedHints();
            }
          } catch {
            syncCompletedHints();
          }
        } else {
          syncCompletedHints();
        }

        setIsLoaded(true);
      };
      img.src = coloringImageUrl;
    },
    [coloringImageUrl, storageKey, syncCompletedHints]
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
    syncCompletedHints();
  }, [storageKey, syncCompletedHints]);

  const pushUndoSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    undoStackRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    if (undoStackRef.current.length > 12) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  };

  /**
   * Fast scanline flood-fill algorithm that respects dark line-art boundaries
   * and snaps across nearby outlines if Charlotte taps right on a line or number hint.
   */
  const performBucketFill = (rawX: number, rawY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const baseData = originalImageDataRef.current?.data;

    // If stylus tip lands directly on a thin black outline, search a 6px radius for the nearest paintable pixel
    let startX = rawX;
    let startY = rawY;
    const isPaintablePixel = (px: number, py: number) => {
      if (px < 0 || px >= width || py < 0 || py >= height) return false;
      const idx = (py * width + px) * 4;
      const lum = baseData
        ? (baseData[idx] + baseData[idx + 1] + baseData[idx + 2]) / 3
        : (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      return lum >= 115;
    };

    if (!isPaintablePixel(startX, startY)) {
      let found = false;
      const offsets = [2, -2, 4, -4, 6, -6];
      for (const dy of offsets) {
        for (const dx of offsets) {
          if (isPaintablePixel(rawX + dx, rawY + dy)) {
            startX = rawX + dx;
            startY = rawY + dy;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) return;
    }

    const startIdx = (startY * width + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];

    const [fillR, fillG, fillB, fillA] = hexToRgba(selectedSwatch.hex);

    // If region is already painted this exact color, do nothing
    if (
      Math.abs(targetR - fillR) < 6 &&
      Math.abs(targetG - fillG) < 6 &&
      Math.abs(targetB - fillB) < 6
    ) {
      return;
    }

    pushUndoSnapshot();

    const visited = new Uint8Array(width * height);
    const stack: number[] = [startX, startY];
    const tolerance = 52;

    const matchesTarget = (pixelIdx: number) => {
      const byteIdx = pixelIdx * 4;
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

      let leftX = x;
      while (
        leftX > 0 &&
        !visited[y * width + (leftX - 1)] &&
        matchesTarget(y * width + (leftX - 1))
      ) {
        leftX--;
      }

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
          } else if (
            spanAbove &&
            (visited[aboveIdx] || !matchesTarget(aboveIdx))
          ) {
            spanAbove = false;
          }
        }

        if (y < height - 1) {
          const belowIdx = (y + 1) * width + currX;
          if (!spanBelow && !visited[belowIdx] && matchesTarget(belowIdx)) {
            stack.push(currX, y + 1);
            spanBelow = true;
          } else if (
            spanBelow &&
            (visited[belowIdx] || !matchesTarget(belowIdx))
          ) {
            spanBelow = false;
          }
        }
      }
    }

    if (filledPixels > 0) {
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
      if (nextCount === 5 || nextCount === 10) {
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

  const handleCanvasPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.stopPropagation();
    if (!isLoaded) return;

    const { x, y } = getCanvasCoords(e);

    if (activeTool === "bucket") {
      performBucketFill(x, y);
      return;
    }

    // Freehand Magic Brush Mode
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    pushUndoSnapshot();
    isDrawingBrushRef.current = true;
    lastBrushPointRef.current = { x, y };
    canvas.setPointerCapture(e.pointerId);

    ctx.strokeStyle = selectedSwatch.hex;
    ctx.fillStyle = selectedSwatch.hex;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 22;

    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    recompositeLineArt();
  };

  const handleCanvasPointerMove = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.stopPropagation();
    if (activeTool !== "brush" || !isDrawingBrushRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    const prev = lastBrushPointRef.current || { x, y };

    ctx.strokeStyle = selectedSwatch.hex;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 22;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastBrushPointRef.current = { x, y };
    recompositeLineArt();
  };

  const handleCanvasPointerUp = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    e.stopPropagation();
    if (activeTool === "brush" && isDrawingBrushRef.current) {
      isDrawingBrushRef.current = false;
      lastBrushPointRef.current = null;
      recompositeLineArt();
      saveCanvasToStorage();
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

    pushUndoSnapshot();
    ctx.putImageData(originalImageDataRef.current, 0, 0);
    setCompletedHints({});
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

  const cycleGuideMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGuideMode((prev) =>
      prev === "smart" ? "all" : prev === "all" ? "off" : "smart"
    );
  };

  const remainingHintsCount = hints.filter(
    (_, idx) => !completedHints[idx]
  ).length;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-full w-full flex-col justify-between select-none"
    >
      {/* Top Header Bar with Bucket/Brush Switcher & Non-Obstructive Guide Mode */}
      <div className="flex items-center justify-between gap-1 border-b border-amber-900/15 pb-1.5">
        {/* Stylus Tool Toggle: Bucket vs Magic Brush */}
        <div className="flex items-center gap-1 rounded-full bg-amber-900/10 p-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTool("bucket");
            }}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
              activeTool === "bucket"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-amber-950 hover:bg-amber-900/10"
            }`}
            title="Paint Bucket: Tap inside any outline to flood-fill"
          >
            <PaintBucket className="h-3 w-3" />
            <span>Bucket</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTool("brush");
            }}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
              activeTool === "brush"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-amber-950 hover:bg-amber-900/10"
            }`}
            title="Magic Brush: Colour freely with your stylus underneath the black lines"
          >
            <Brush className="h-3 w-3" />
            <span>Brush</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={cycleGuideMode}
            className="flex items-center gap-1 rounded-full bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-900/20"
            title="Cycle number guide: Smart (Active # highlighted, painted hidden) -> All #s -> Off"
          >
            {guideMode === "off" ? (
              <>
                <Eye className="h-3 w-3" />
                <span>#s: Off</span>
              </>
            ) : guideMode === "smart" ? (
              <>
                <Sparkles className="h-3 w-3 text-amber-700" />
                <span>#s: Smart</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                <span>#s: All</span>
              </>
            )}
          </button>

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 rounded-full bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-950 hover:bg-amber-900/20 disabled:opacity-35"
            title="Undo last paint step"
          >
            <Undo2 className="h-3 w-3" />
            <span className="hidden sm:inline">Undo</span>
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

      {/* Interactive Coloring Canvas + Non-Obstructive Auto-Vanishing Number Hints */}
      <div className="relative my-1.5 flex-1 min-h-0 w-full overflow-hidden rounded-xl border-2 border-amber-800/35 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="h-full w-full cursor-crosshair touch-none object-contain"
        />

        {/* Non-Obstructive Number Guide Overlay:
            - Automatically vanishes as soon as that region is painted!
            - In 'smart' mode, only the active paint pot's unpainted regions show a delicate micro-pill;
              other unpainted numbers render as tiny borderless watermarks so they never block the drawing. */}
        {guideMode !== "off" &&
          hints.map((hint, idx) => {
            // Once painted, hide the number completely so Charlotte sees her clean artwork!
            if (completedHints[idx]) {
              return null;
            }

            const matchingSwatch = palette.find(
              (p) => p.number === hint.number
            );
            const isSelected = selectedSwatch.number === hint.number;

            if (guideMode === "smart" && !isSelected) {
              // Subtle borderless watermark for inactive numbers: zero box/circle obstruction
              return (
                <div
                  key={idx}
                  style={{ left: `${hint.x}%`, top: `${hint.y}%` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-600/55 drop-shadow-[0_0_2px_rgba(255,255,255,0.95)] transition-opacity"
                >
                  {hint.number}
                </div>
              );
            }

            return (
              <div
                key={idx}
                style={{ left: `${hint.x}%`, top: `${hint.y}%` }}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all ${
                  isSelected
                    ? "h-4 w-4 sm:h-4.5 sm:w-4.5 border border-amber-900/80 bg-white/80 text-[9px] sm:text-[10px] font-extrabold text-slate-950 shadow-sm ring-2 ring-amber-400/80 animate-pulse"
                    : "h-3.5 w-3.5 border border-slate-500/40 bg-white/65 text-[8px] font-bold text-slate-800/80"
                }`}
              >
                <span>{hint.number}</span>
                {isSelected && matchingSwatch && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white"
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
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
            {remainingHintsCount === 0
              ? "All numbered spots painted! Keep decorating or save!"
              : activeTool === "bucket"
                ? `Tap any #${selectedSwatch.number} spot to fill (${remainingHintsCount} left)`
                : `Draw freely with #${selectedSwatch.number} ${selectedSwatch.name}`}
          </span>
          <span className="font-bold text-amber-900 shrink-0 ml-1">
            #{selectedSwatch.number} {selectedSwatch.name}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {palette.map((swatch) => {
            const isSelected = selectedSwatch.number === swatch.number;
            // Check if all hints for this swatch number are already painted
            const swatchHints = hints
              .map((h, i) => ({ h, i }))
              .filter(({ h }) => h.number === swatch.number);
            const isSwatchComplete =
              swatchHints.length > 0 &&
              swatchHints.every(({ i }) => completedHints[i]);

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
                    {isSwatchComplete ? "✓" : swatch.number}
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
