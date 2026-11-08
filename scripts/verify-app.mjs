import fs from "node:fs";
import path from "node:path";

const STORY_IDS = [
  "neverending-charlotte",
  "casper-charlotte",
  "labyrinth-charlotte",
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log("🔍 Running GemBook Automated Verification Suite...\n");

// 1. Verify all 36 story & coloring illustrations (3 stories x 12 PNGs)
for (const storyId of STORY_IDS) {
  const storyDir = path.join(process.cwd(), "public", "stories", storyId);
  const expectedImages = [
    "cover.png",
    "coloring.png",
    ...Array.from({ length: 10 }, (_, i) => `page-${i + 1}.png`),
  ];

  for (const imgFile of expectedImages) {
    const fullPath = path.join(storyDir, imgFile);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Missing image: public/stories/${storyId}/${imgFile}`);
    if (exists) {
      const stat = fs.statSync(fullPath);
      assert(
        stat.size > 30000,
        `Image too small (<30KB): public/stories/${storyId}/${imgFile} (${stat.size}B)`
      );
      const header = fs.readFileSync(fullPath).subarray(0, 4);
      const isPng =
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47;
      assert(isPng, `Invalid PNG header: public/stories/${storyId}/${imgFile}`);
    }
  }
}
console.log("  ✓ Verified 36 story & Colour-by-Numbers PNG illustrations");

// 2. Verify all 36 voiceover audio MP3s (3 stories x 12 MP3s)
for (const storyId of STORY_IDS) {
  const audioDir = path.join(process.cwd(), "public", "audio", storyId);
  const expectedAudio = [
    "cover.mp3",
    "closing.mp3",
    ...Array.from({ length: 10 }, (_, i) => `page-${i + 1}.mp3`),
  ];

  for (const mp3File of expectedAudio) {
    const fullPath = path.join(audioDir, mp3File);
    const exists = fs.existsSync(fullPath);
    assert(exists, `Missing audio: public/audio/${storyId}/${mp3File}`);
    if (exists) {
      const stat = fs.statSync(fullPath);
      assert(
        stat.size > 15000,
        `Audio file too small (<15KB): public/audio/${storyId}/${mp3File} (${stat.size}B)`
      );
    }
  }
}
console.log("  ✓ Verified 36 bedtime voiceover MP3 files");

// 3. Verify acoustic sentence timing manifest
const timingsPath = path.join(process.cwd(), "src", "data", "audioTimings.ts");
assert(fs.existsSync(timingsPath), "Missing src/data/audioTimings.ts");
if (fs.existsSync(timingsPath)) {
  const content = fs.readFileSync(timingsPath, "utf8");
  assert(
    content.includes("AUDIO_SENTENCE_TIMINGS") &&
      content.includes("/audio/neverending-charlotte/page-1.mp3") &&
      content.includes("/audio/casper-charlotte/page-1.mp3") &&
      content.includes("/audio/labyrinth-charlotte/page-1.mp3"),
    "audioTimings.ts missing expected story timing keys"
  );
}
console.log("  ✓ Verified acoustic sentence boundary timing manifest");

// 4. Verify component invariants (Audio-Completion Guard, Auto-Vanishing Hints, Bucket+Brush tools)
const flipbookCode = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "StoryFlipbook.tsx"),
  "utf8"
);
assert(
  flipbookCode.includes("playbackRunIdRef") &&
    flipbookCode.includes("audio.onended"),
  "StoryFlipbook missing strict audio-completion page-turn guard"
);

const canvasCode = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "ColorByNumbersCanvas.tsx"),
  "utf8"
);
assert(
  canvasCode.includes("completedHints") &&
    canvasCode.includes("syncCompletedHints") &&
    canvasCode.includes('activeTool === "brush"'),
  "ColorByNumbersCanvas missing auto-vanishing hints or Brush/Bucket switcher"
);
console.log("  ✓ Verified Flipbook & Stylus Canvas architectural invariants");

console.log(`\n✅ Passed: ${passed} assertions | ❌ Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
