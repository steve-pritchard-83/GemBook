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

const STYLE_PROMPT = `Enchanting classic children's bedtime picture book watercolor and gouache illustration, warm golden candlelight and starry midnight blue glow, dreamy fairytale painting aesthetic matching a cohesive storybook, no text or words in the image.
Main Character: Charlotte, a sweet 7-year-old girl with shoulder-length wavy golden-blonde hair, expressive warm blue-green eyes, wearing a cozy soft lavender-blue bedtime cardigan over a star-patterned cream nightdress.`;

const STORY_BATCHES = [
  {
    storyId: "casper-charlotte",
    extraStyle: `Co-star: Casper the Friendly Ghost, a cute, gentle, glowing pearlescent-white and soft sky-blue translucent friendly little ghost boy with a warm smile and kind eyes (cuddly and heartwarming, never scary).`,
    items: [
      {
        file: "page-1.png",
        scene:
          "Outside the whimsical turret-topped Whipstaff Manor in Friendship, Maine on a starry autumn twilight evening. 7-year-old blonde-haired Charlotte in her lavender cardigan and starry cream nightdress walks up the glowing lantern-lit stone path while golden fireflies dance around autumn leaves, and cute glowing Casper waves a friendly hello from a high round stained-glass tower window under a crescent moon.",
      },
      {
        file: "page-2.png",
        scene:
          "Inside the grand marble foyer of Whipstaff Manor, lit by hundreds of warm floating golden candles beneath vaulted arches. Cute glowing translucent Casper the Friendly Ghost floats shyly out from behind a shiny knight suit of armor with a cheerful wave and sweet smile, while 7-year-old blonde-haired Charlotte smiles back in delight.",
      },
      {
        file: "page-3.png",
        scene:
          "In the cozy Victorian velvet parlor of Whipstaff Manor, 7-year-old blonde-haired Charlotte and cute glowing Casper sit together on a plush velvet sofa giggling happily while three goofy, playful, cartoon-friendly ghost uncles perform a funny circus act juggling glowing teacups and a warm blueberry pie.",
      },
      {
        file: "page-4.png",
        scene:
          "In the warm lantern-lit Victorian kitchen of Whipstaff Manor, cute glowing Casper wearing a tiny white chef's hat and apron happily flips fluffy golden star-shaped pancakes drizzled with maple syrup for 7-year-old blonde-haired Charlotte sitting at the cozy wooden breakfast table.",
      },
      {
        file: "page-5.png",
        scene:
          "Up in Casper's magical cozy attic playroom filled with vintage wooden toys, model trains chugging past paper-lantern moons, and a brass telescope pointed at a starry skylight, cute glowing Casper shows 7-year-old blonde-haired Charlotte his glow-in-the-dark baseball and a scrapbook of colorful drawings.",
      },
      {
        file: "page-6.png",
        scene:
          "7-year-old blonde-haired Charlotte and cute glowing Casper riding together inside a whimsical painted armchair rollercoaster cart gliding smoothly along a gleaming golden brass track through a magical secret library lined with floating storybooks and twinkling fairy lights.",
      },
      {
        file: "page-7.png",
        scene:
          "Inside the wondrous vaulted clockwork laboratory of Whipstaff Manor, filled with rainbow-colored bubbling glass globes and golden brass gears like a giant magical music box, 7-year-old blonde-haired Charlotte and cute glowing Casper admire a shimmering crystal vial of golden Moonbeam Dream-Dust resting on a velvet cushion.",
      },
      {
        file: "page-8.png",
        scene:
          "High atop a warm stone lighthouse balcony overlooking the calm moonlit ocean bay of Friendship, Maine, 7-year-old blonde-haired Charlotte and cute glowing Casper sit together beside the warm golden lighthouse beacon watching silver moonbeams ripple across the sleepy sea under a starry sky.",
      },
      {
        file: "page-9.png",
        scene:
          "Inside the grand candlelit ballroom of Whipstaff Manor beneath a dome of painted constellations, cute glowing Casper holds 7-year-old blonde-haired Charlotte's hands as they float gently three inches above the polished marble floor in a slow, magical bedtime waltz surrounded by drifting golden starlight sparkles.",
      },
      {
        file: "page-10.png",
        scene:
          "Cozy bedtime finale: 7-year-old blonde-haired Charlotte is tucked peacefully asleep with a happy smile under a starry patchwork quilt in a warm wooden canopy bed, while cute glowing Casper floats gently outside the arched moonlit window under the crescent moon, waving a fond goodnight with a trail of silver stardust.",
      },
    ],
  },
  {
    storyId: "labyrinth-charlotte",
    extraStyle: `Setting: Inspired by Jim Henson's Labyrinth, adapted into a warm, magical, cozy, gentle fairytale world of crystal orbs, friendly plush-like creatures (Ludo the big cuddly cinnamon-furred gentle giant, Sir Didymus the gallant fox-terrier knight riding fluffy sheepdog Ambrosius, and the cute tiny blue caterpillar in a red scarf), shimmering starlight hedges, and a glowing Crystal Castle.`,
    items: [
      {
        file: "cover.png",
        scene:
          "Book cover illustration for 'Charlotte and the Starlight Labyrinth'. 7-year-old blonde-haired Charlotte in her lavender cardigan and starry nightdress holding a glowing crystal orb in the foreground, alongside big cuddly cinnamon-furred Ludo, gallant little fox-terrier knight Sir Didymus on fluffy white sheepdog Ambrosius, and a snowy white barn owl soaring toward a shimmering golden Crystal Castle at the center of an enchanted twilight hedge maze.",
      },
      {
        file: "page-1.png",
        scene:
          "At 7-year-old blonde-haired Charlotte's cozy moonlit bedroom window, a majestic snowy white barn owl with shimmering moonbeam feathers perches on the sill, gently rolling a glowing glass crystal orb across Charlotte's starry quilt; inside the orb swirls a miniature starlight castle.",
      },
      {
        file: "page-2.png",
        scene:
          "At the entrance of a magical twilight hedge maze dusted with glowing silver moss and fairy lights, 7-year-old blonde-haired Charlotte smiles warmly at a cute tiny fuzzy blue caterpillar wearing a miniature red striped scarf sitting on a mossy stone ledge beside a tiny steaming teacup.",
      },
      {
        file: "page-3.png",
        scene:
          "In front of two ornate golden-brass fairytale doors set into a crystal-studded stone wall, 7-year-old blonde-haired Charlotte reaches out politely toward two friendly, comical brass lion door-knockers (one holding a brass ring in its mouth) that are smiling warmly at her.",
      },
      {
        file: "page-4.png",
        scene:
          "7-year-old blonde-haired Charlotte floating gently like a feather down a magical vertical archway lined with soft, pastel velvet-gloved Helping Hands that cradle her like a cloud of warm pillows, setting her down onto a path of sparkling rose-quartz cobblestones.",
      },
      {
        file: "page-5.png",
        scene:
          "Under a glowing willow tree with golden lantern leaves, 7-year-old blonde-haired Charlotte gives a gentle flower and a warm hug to Ludo, a big lovable cuddly cinnamon-furred gentle giant with small curved horns and kind, happy eyes.",
      },
      {
        file: "page-6.png",
        scene:
          "Beside a sparkling lavender fairytale stream at twilight, big cuddly Ludo tilts his head back singing a gentle musical note while smooth glowing golden river stones float magically up to the surface to form a stepping-stone bridge for 7-year-old blonde-haired Charlotte.",
      },
      {
        file: "page-7.png",
        scene:
          "On a starry forest bridge, gallant little fox-terrier knight Sir Didymus (wearing a miniature red velvet tunic and feathered hat, holding a walking-stick lance) bows cheerfully from the back of his big, fluffy white-and-tan sheepdog steed Ambrosius, who happily licks 7-year-old blonde-haired Charlotte's hand.",
      },
      {
        file: "page-8.png",
        scene:
          "Inside a dreamy starlight masquerade ballroom lit by crystal chandeliers and floating soap-bubble lanterns, 7-year-old blonde-haired Charlotte watches in wonder as a graceful fairytale king in silver-and-midnight velvet spins a floating glowing crystal orb that reflects constellations.",
      },
      {
        file: "page-9.png",
        scene:
          "Inside the shimmering Crystal Castle, whimsical MC Escher-inspired staircases made of warm glowing amber and pearl crystal wind playfully under a starry dome, as 7-year-old blonde-haired Charlotte stands bravely on a glowing golden landing leading straight toward a warm doorway of light.",
      },
      {
        file: "page-10.png",
        scene:
          "Cozy bedtime finale: 7-year-old blonde-haired Charlotte is tucked peacefully under her starry quilt in her warm bedroom, smiling as cuddly Ludo, Sir Didymus on fluffy Ambrosius, and the tiny blue caterpillar wave a fond goodnight from inside her glowing moonlit bedroom mirror while the white barn owl flies past the starry window.",
      },
    ],
  },
];

const MODELS_TO_TRY = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
];

async function generateWithGemini(promptText) {
  for (const model of MODELS_TO_TRY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `  ⚠️ Model ${model} returned ${res.status}: ${errText.slice(0, 180)}`
      );
      continue;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);
    if (imgPart) {
      return {
        model,
        buffer: Buffer.from(imgPart.inlineData.data, "base64"),
      };
    }
  }
  throw new Error("All Gemini image models failed to return an image.");
}

async function run() {
  for (const batch of STORY_BATCHES) {
    const outDir = path.join(process.cwd(), "public", "stories", batch.storyId);
    fs.mkdirSync(outDir, { recursive: true });

    for (const item of batch.items) {
      console.log(`🎨 Generating ${batch.storyId}/${item.file}...`);
      const fullPrompt = `${STYLE_PROMPT}\n${batch.extraStyle}\n\nScene: ${item.scene}`;
      const { model, buffer } = await generateWithGemini(fullPrompt);
      const outPath = path.join(outDir, item.file);
      await sharp(buffer).png({ quality: 90 }).toFile(outPath);
      const stats = fs.statSync(outPath);
      console.log(
        `  ✓ Saved ${batch.storyId}/${item.file} via ${model} (${(
          stats.size / 1024
        ).toFixed(1)} KB)`
      );
    }
  }
  console.log("✨ All Casper & Labyrinth AI illustrations generated successfully!");
}

run().catch((err) => {
  console.error("Error generating Gemini images:", err);
  process.exit(1);
});
