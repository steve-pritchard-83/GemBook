import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Calm, warm Australian female neural voice
const VOICE = "en-AU-NatashaNeural";

const STORY_AUDIO_SEGMENTS = [
  {
    id: "neverending-charlotte",
    items: [
      {
        filename: "cover.mp3",
        text: "Charlotte and the Neverending Story. A Magical Journey Through Fantasia. Dedicated with love to Charlotte.",
      },
      {
        filename: "page-1.mp3",
        text: "Rain pattered softly against the attic window as seven-year-old Charlotte brushed a lock of golden-blonde hair behind her ear. Resting on her velvet quilt was an ancient copper-bound storybook that seemed to hum with a warm, sleepy light. On its cover gleamed the golden AURYN emblem... two gentle serpents twined in an endless circle of dreams.",
      },
      {
        filename: "page-2.mp3",
        text: "As Charlotte opened the heavy parchment cover, ribbons of warm golden stardust and lavender light swirled gently into the room. The pages whispered her name... Charlotte, Fantasia needs your imagination! With a soft breath of wonder, her cozy attic melted into a twilight sky of floating crystal islands.",
      },
      {
        filename: "page-3.mp3",
        text: "Charlotte landed softly on a mossy path in the Whispering Forest, where lantern-mushrooms glowed in shades of rose and violet. There sat the friendly Rock Biter, a kind giant made of smooth river stones, happily munching on sparkling amethyst crystals. They look like big, good, strong hands, and a very kind heart, he rumbled warmly, sharing a tiny sugar-crystal gem with Charlotte.",
      },
      {
        filename: "page-4.mp3",
        text: "Beside the shimmering Silver Mountains, young Atreyu greeted Charlotte with a gentle bow, his loyal white horse Artax nuzzling her hand. The Nothing is only a shadow when children forget to dream, Atreyu said softly, pointing to the golden AURYN medallion now resting over Charlotte's lavender cardigan. Your imagination can light up all of Fantasia.",
      },
      {
        filename: "page-5.mp3",
        text: "From the cotton-candy twilight clouds swooped Falkor the Luckdragon, his pearlescent white fur and golden scales shimmering like moonbeams. Charlotte climbed onto his warm, fluffy neck, giggling as her blonde hair danced in the gentle evening breeze. Never give up, and good luck will find you, little dreamer! Falkor sang in a soothing rumble.",
      },
      {
        filename: "page-6.mp3",
        text: "Together they glided high above sleepy valleys toward the heart of Fantasia, where the magnificent Ivory Tower rose like a giant glowing moonflower. Thousands of tiny star-lanterns twinkled along its pearly spires, welcoming Charlotte and Falkor home through the velvety night.",
      },
      {
        filename: "page-7.mp3",
        text: "Along the starry pathway stood the twin sapphire arches of the Southern Oracle, glowing like gentle blue northern lights. Usually only the bravest heroes dared step through, yet as Charlotte walked peacefully between them, the crystal mirrors simply smiled back... showing a brave, loving seven-year-old girl whose kindness knew no end.",
      },
      {
        filename: "page-8.mp3",
        text: "Inside the Pavilion of Stars, the Childlike Empress welcomed Charlotte with a serene smile and placed a single, radiant grain of golden sand into her cupped palms. All of Fantasia lives inside this tiny spark, Charlotte, the Empress whispered softly. Make a wish with your gentle heart, and dream our world anew.",
      },
      {
        filename: "page-9.mp3",
        text: "Charlotte closed her eyes, thought of every wonderful story she loved, and blew softly upon the glowing grain of sand. All at once, golden constellations, sleepy crystal meadows, baby unicorns, and dancing fireflies blossomed across the night sky, filling Fantasia with warmth and peace.",
      },
      {
        filename: "page-10.mp3",
        text: "Falkor carried Charlotte softly through the starry mist and tucked her right back beneath her warm bedroom quilt. As her eyelids grew heavy and sweet dreams drifted in, the copper book rested beside her pillow... waiting quietly for tomorrow night's next magical adventure. Goodnight, Charlotte.",
      },
      {
        filename: "closing.mp3",
        text: "Goodnight, Princess of Fantasia. Every time you close your eyes and dream, a new chapter begins in Fantasia. Sleep tight, sweet Charlotte.",
      },
    ],
  },
];

async function generateAllAudio() {
  console.log(`🎙️ Generating calm Australian female voiceover (${VOICE})...`);

  for (const story of STORY_AUDIO_SEGMENTS) {
    const outDir = path.join(process.cwd(), "public", "audio", story.id);
    fs.mkdirSync(outDir, { recursive: true });

    for (const item of story.items) {
      const filePath = path.join(outDir, item.filename);
      const tts = new MsEdgeTTS();
      await tts.setMetadata(
        VOICE,
        OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
      );

      // Slow, soothing bedtime pacing (-14% rate, slightly softer/lower pitch -2Hz)
      const { audioStream } = tts.toStream(item.text, {
        rate: "-14%",
        pitch: "-2Hz",
      });

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        audioStream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        audioStream.on("error", reject);
      });

      const stats = fs.statSync(filePath);
      console.log(
        `  ✓ Generated ${story.id}/${item.filename} (${(stats.size / 1024).toFixed(1)} KB)`
      );
    }
  }

  console.log("✨ All bedtime story voiceover files generated successfully!");
}

generateAllAudio().catch((err) => {
  console.error("Error generating TTS audio:", err);
  process.exit(1);
});
