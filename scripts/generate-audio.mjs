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
  {
    id: "casper-charlotte",
    items: [
      {
        filename: "cover.mp3",
        text: "Charlotte and the Friendly Ghost. A Cozy Whipstaff Manor Bedtime Adventure. Dedicated with love to Charlotte.",
      },
      {
        filename: "page-1.mp3",
        text: "In the sleepy seaside town of Friendship, Maine, autumn fireflies twinkled along the stone pathway to Whipstaff Manor. Seven-year-old Charlotte wrapped her soft lavender cardigan around her shoulders and smiled up at the whimsical stained-glass turrets. High in the round tower window, a warm, pearly-blue light flickered like a friendly wave hello.",
      },
      {
        filename: "page-2.mp3",
        text: "Inside the grand foyer, hundreds of golden candles floated like tiny stars beneath the vaulted ceiling. From behind a shiny knight's armor drifted a gentle, glowing little ghost with kind eyes and the sweetest smile. Hi there, I'm Casper! he whispered softly, floating on a cushion of moonbeams. I was hoping a friend like you might visit tonight.",
      },
      {
        filename: "page-3.mp3",
        text: "In the cozy velvet parlor, Casper's three goofy uncles, Stretch, Stinkie, and Fatso, tried to put on a spooky show, but Charlotte only giggled with delight. Seeing her bright smile, the three uncles immediately turned into a silly circus instead, juggling glowing teacups and sharing slices of warm blueberry pie until everyone laughed together.",
      },
      {
        filename: "page-4.mp3",
        text: "Down in the warm Victorian kitchen, Casper tied on a tiny white chef's apron and floated beside the stove. With a flick of his wrist, he flipped fluffy golden pancakes shaped like twinkling stars and drizzled them with sweet maple syrup. Charlotte took a warm, delicious bite and declared Casper the best midnight chef in Maine.",
      },
      {
        filename: "page-5.mp3",
        text: "Up in his secret attic playroom, where model trains chugged softly past paper-lantern moons, Casper showed Charlotte his favorite treasures. There was a glow-in-the-dark baseball, a brass telescope pointed at the Milky Way, and a scrapbook of dreams. Charlotte drew a picture of the two of them holding hands so Casper would never feel lonely again.",
      },
      {
        filename: "page-6.mp3",
        text: "Ready for a magical shortcut? Casper beamed, helping Charlotte hop into a brightly painted armchair perched on a gleaming brass track. With a gentle chime, the chair glided smoothly down through a secret library lined with floating storybooks and fairy lights, whizzing around cosy spiral curves like a bedtime rollercoaster.",
      },
      {
        filename: "page-7.mp3",
        text: "The track glided to a soft stop inside the wondrous vaulted laboratory, where rainbow-colored glass globes bubbled like a giant musical clockwork box. Resting on a velvet cushion was a crystal vial filled with shimmering Moonbeam Dream-Dust, made to bring peaceful wishes and happy dreams to every child in town.",
      },
      {
        filename: "page-8.mp3",
        text: "Together, Charlotte and Casper floated up to the warm stone lighthouse overlooking the calm ocean bay of Friendship. As the golden beacon swept gently across the silver waves, Casper told stories of the constellations while the rhythmic hush of the sea sang a quiet lullaby below.",
      },
      {
        filename: "page-9.mp3",
        text: "Back in the candlelit ballroom beneath a dome of painted stars, a soft music-box melody began to play. Casper took Charlotte's hands, and together they floated three inches above the polished marble floor... twirling slowly through a shower of golden starlight. Can I keep you, my dear friend? Casper whispered with a happy sigh.",
      },
      {
        filename: "page-10.mp3",
        text: "When it was time for sleep, Casper tucked a cozy starry quilt gently around Charlotte's shoulders in the guest bedroom canopy bed. As Charlotte closed her eyes with a peaceful smile, Casper floated outside the arched moonlit window, waving a fond goodnight and watching over her sweetest dreams.",
      },
      {
        filename: "closing.mp3",
        text: "Goodnight from Whipstaff Manor. True friendship shines brighter than any moonbeam. Sleep peacefully tonight, sweet Charlotte.",
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
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
        console.log(`  ⏭️ Skipping existing ${story.id}/${item.filename}`);
        continue;
      }

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
