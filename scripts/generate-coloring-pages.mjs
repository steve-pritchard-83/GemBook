import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : "";
const keyMatch = envContent.match(/GEMINI_API_KEY="([^"]+)"/);
const API_KEY = process.env.GEMINI_API_KEY || (keyMatch ? keyMatch[1] : "");

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const COLORING_LINE_ART_STYLE = `Clean, bold, high-contrast black-and-white children's coloring book line art illustration on a pure solid white (#FFFFFF) background.
CRITICAL REQUIREMENTS FOR DIGITAL PAINT-BUCKET FLOOD FILL:
- Thick, crisp, continuous, completely closed solid black outlines (#000000) separating every region so paint-bucket flood fill stays cleanly inside each shape.
- Pure solid white (#FFFFFF) interior inside every region.
- NO grayscale shading, NO hatching, NO stippling, NO gradients, NO colors, NO text or numbers inside the drawing—only clean, large, simple, kid-friendly closed shapes for a 7-year-old girl using a tablet stylus.`;

const COLORING_PAGES = [
  {
    storyId: "neverending-charlotte",
    prompt: `${COLORING_LINE_ART_STYLE}
Scene: 7-year-old girl Charlotte with wavy hair riding joyfully on the back of friendly furry Luckdragon Falkor through big puffy clouds, with a crescent moon, large 5-pointed stars, and the fairytale Ivory Tower in the background. Simple, large, closed shapes with bold black outlines on pure white background.`,
  },
  {
    storyId: "casper-charlotte",
    prompt: `${COLORING_LINE_ART_STYLE}
Scene: 7-year-old girl Charlotte in a cardigan and starry dress smiling beside cute friendly ghost Casper wearing a chef hat, holding a plate of big star-shaped pancakes, with floating candles and an arched castle window with a crescent moon in the background. Simple, large, closed shapes with bold black outlines on pure white background.`,
  },
  {
    storyId: "labyrinth-charlotte",
    prompt: `${COLORING_LINE_ART_STYLE}
Scene: 7-year-old girl Charlotte holding a big round crystal orb alongside cuddly friendly horned monster Ludo, a cute little fuzzy caterpillar in a scarf, and a snowy barn owl perched above a fairytale castle. Simple, large, closed shapes with bold black outlines on pure white background.`,
  },
];

const MODELS_TO_TRY = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
];

async function generateLineArt(promptText) {
  for (const model of MODELS_TO_TRY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });

    if (!res.ok) continue;
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);
    if (imgPart) {
      return Buffer.from(imgPart.inlineData.data, "base64");
    }
  }
  throw new Error("Failed to generate coloring line art");
}

async function run() {
  for (const item of COLORING_PAGES) {
    console.log(`🖍️ Generating coloring line art for ${item.storyId}...`);
    const rawBuffer = await generateLineArt(item.prompt);
    const outDir = path.join(process.cwd(), "public", "stories", item.storyId);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "coloring.png");

    // Threshold / normalize to crisp black outlines on pure white background for clean flood-fill!
    await sharp(rawBuffer)
      .resize(900, 675, { fit: "cover" })
      .grayscale()
      .normalize()
      .linear(1.6, -60) // Boost contrast so lines are dark black and interiors are pure white
      .png({ palette: true, quality: 90, compressionLevel: 9 })
      .toFile(outPath);

    const stats = fs.statSync(outPath);
    console.log(
      `  ✓ Saved ${item.storyId}/coloring.png (${(stats.size / 1024).toFixed(1)} KB)`
    );
  }
  console.log("✨ All 3 story coloring line-art pages generated!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
