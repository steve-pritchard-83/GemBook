import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8")
  : "";
const keyMatch = envContent.match(/GEMINI_API_KEY="?([^"\r\n]+)"?/);
const API_KEY = process.env.GEMINI_API_KEY || (keyMatch ? keyMatch[1].trim() : "");

// Locate ffmpeg binary (Windows WinGet path or system PATH)
const WIN_FFMPEG =
  "C:\\Users\\steve_tzmi3fh\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";
const FFMPEG_BIN = fs.existsSync(WIN_FFMPEG) ? WIN_FFMPEG : "ffmpeg";

// Studio-quality expressive controllable Gemini TTS models (support Australian style prompt cleanly)
const GEMINI_TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
];

const GEMINI_VOICE_NAME = "Aoede";
const DIRECTOR_STYLE_PROMPT =
  "Speak in a warm, gentle, natural Australian female bedtime storyteller voice, unhurried, tender, and soothing for a 7-year-old girl named Charlotte:";

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
        text: "Rain pattered softly against the attic window as seven-year-old Charlotte brushed a lock of golden-blonde hair behind her ear. Resting on her velvet quilt was an ancient copper-bound storybook that seemed to hum with a warm, sleepy light. On its cover gleamed the golden Auryn emblem... two gentle serpents twined in an endless circle of dreams.",
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
        text: "Beside the shimmering Silver Mountains, young Atreyu greeted Charlotte with a gentle bow, his loyal white horse Artax nuzzling her hand. The Nothing is only a shadow when children forget to dream, Atreyu said softly, pointing to the golden Auryn medallion now resting over Charlotte's lavender cardigan. Your imagination can light up all of Fantasia.",
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
  {
    id: "labyrinth-charlotte",
    items: [
      {
        filename: "cover.mp3",
        text: "Charlotte and the Starlight Labyrinth. A Magical Journey to the Crystal Castle. Dedicated with love to Charlotte.",
      },
      {
        filename: "page-1.mp3",
        text: "Outside seven-year-old Charlotte's bedroom window, a snowy white barn owl with feathers like spun moonbeams perched upon the sill. As Charlotte brushed back her golden-blonde curls, the owl gently rolled a floating glass crystal orb across her quilt. Inside the crystal swirled a miniature castle of starlight and a shimmering golden maze.",
      },
      {
        filename: "page-2.mp3",
        text: "With a soft chime, the bedroom walls dissolved into tall, twinkling hedges dusted with silver moss. Perched on a mossy stone ledge was a tiny fuzzy blue caterpillar wearing a miniature red scarf. Ello! he squeaked cheerfully, tipping his tiny cap. Come inside and have a nice warm cup of bedtime tea before you explore the maze!",
      },
      {
        filename: "page-3.mp3",
        text: "At the end of the mossy lane stood two ornate brass doors with friendly, sleepy lion knockers. One knocker mumbled with a big brass ring in his mouth while the other chuckled, Only a clever seven-year-old with a kind smile knows which door leads to magic! Charlotte politely tapped the golden ring, and the doors swung open to a garden of glowing crystals.",
      },
      {
        filename: "page-4.mp3",
        text: "Instead of a dark shaft, Charlotte floated gently downward through a tunnel of soft, velvet-gloved Helping Hands that cradled her like a cloud of warm pillows. Which way, little princess? Up or down? they whispered kindly, before setting her feet softly upon a path of sparkling rose-quartz cobblestones.",
      },
      {
        filename: "page-5.mp3",
        text: "Sitting beside a willow tree was Ludo, a big, cuddly, cinnamon-furred gentle giant with curved horns and the warmest, kindest eyes. When Charlotte offered him a wildflower and a gentle hug, Ludo's face lit up with a huge smile. Charlotte... friend! he rumbled softly, lifting her onto his fluffy shoulder.",
      },
      {
        filename: "page-6.mp3",
        text: "When a bubbly lavender stream blocked their path, Ludo tilted back his head and let out a deep, musical hum that echoed like a cello. Slowly, smooth glowing river stones floated up from the water and arranged themselves into a shimmering bridge so Charlotte could skip safely across.",
      },
      {
        filename: "page-7.mp3",
        text: "At the edge of the Whispering Woods, a gallant little fox-terrier knight in a feathered hat, Sir Didymus, bowed from atop his big, fluffy sheepdog steed, Ambrosius. Fear not, fair Lady Charlotte! Sir Didymus declared proudly, while friendly Ambrosius wagged his tail and gave Charlotte's hand a big, ticklish puppy kiss.",
      },
      {
        filename: "page-8.mp3",
        text: "As they neared the castle, a floating bubble drifted past, carrying Charlotte into a dreamy masquerade ballroom lit by crystal chandeliers and silver masks. The Goblin King bowed gracefully, spinning a glowing glass orb that reflected Charlotte's own bright, brave heart... reminding her that her love for her friends was the strongest magic of all.",
      },
      {
        filename: "page-9.mp3",
        text: "Inside the shimmering Crystal Castle, staircases wound playfully in every direction like a giant puzzle box under the stars. With a calm breath, Charlotte spoke the gentle bedtime words of power: You have no power over my dreams, only kindness rules here! Instantly, the crystal stairs glowed with warm golden light, leading straight home.",
      },
      {
        filename: "page-10.mp3",
        text: "Back in her warm bedroom under her starry quilt, Charlotte smiled as Ludo, Sir Didymus, Ambrosius, and the little blue caterpillar waved fondly from the moonlit mirror. Should you ever need us, Charlotte, we are always in your dreams, they whispered softly, as the white owl soared into the peaceful night sky.",
      },
      {
        filename: "closing.mp3",
        text: "Should You Need Us, Sweet Charlotte. Remember that your friends in the Starlight Labyrinth are always inside your heart whenever you close your eyes and dream. Goodnight, Charlotte.",
      },
    ],
  },
];

let modelCursor = 0;

async function generateGeminiAudioMp3(text, outMp3Path) {
  for (let attempt = 0; attempt < GEMINI_TTS_MODELS.length * 2; attempt++) {
    const model = GEMINI_TTS_MODELS[modelCursor % GEMINI_TTS_MODELS.length];
    modelCursor++;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${DIRECTOR_STYLE_PROMPT}\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: GEMINI_VOICE_NAME,
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `    ⚠️ ${model} returned ${res.status}: ${errText.slice(0, 120)}`
      );
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2500));
      }
      continue;
    }

    const data = await res.json();
    const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) {
      continue;
    }

    const pcmBuffer = Buffer.from(inline.data, "base64");
    const ff = spawnSync(
      FFMPEG_BIN,
      [
        "-y",
        "-f",
        "s16le",
        "-ar",
        "24000",
        "-ac",
        "1",
        "-i",
        "pipe:0",
        "-af",
        "highpass=f=70,lowpass=f=11000,acompressor=threshold=-18dB:ratio=2:attack=15:release=200",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "128k",
        outMp3Path,
      ],
      { input: pcmBuffer }
    );

    if (ff.status === 0 && fs.existsSync(outMp3Path)) {
      return { engine: `${model} (${GEMINI_VOICE_NAME})` };
    }
  }

  throw new Error("All Gemini TTS models failed for segment.");
}

async function generateFallbackEdgeMp3(text, outMp3Path) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    "en-AU-NatashaNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
  );
  // Natural pitch (0Hz) and gentle -4% cadence without artificial phase-vocoder distortion
  const { audioStream } = tts.toStream(text, {
    rate: "-4%",
    pitch: "+0Hz",
  });

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outMp3Path);
    audioStream.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    audioStream.on("error", reject);
  });

  return { engine: "msedge-tts (en-AU-NatashaNeural natural)" };
}

/**
 * Inspect an MP3 with ffmpeg silencedetect to extract real sentence pause boundaries
 * and total audio duration so karaoke sentence highlighting matches spoken pauses!
 */
function inspectMp3SentenceTimings(mp3Path, text) {
  const sentences =
    text
      .match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [text];

  const ff = spawnSync(
    FFMPEG_BIN,
    [
      "-i",
      mp3Path,
      "-af",
      "silencedetect=noise=-36dB:d=0.22",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" }
  );

  const stderr = ff.stderr || "";
  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const totalDuration = durMatch
    ? parseInt(durMatch[1], 10) * 3600 +
      parseInt(durMatch[2], 10) * 60 +
      parseFloat(durMatch[3])
    : 12.0;

  // Collect midpoint timestamps of detected pauses
  const silenceMidpoints = [];
  const silenceRegex =
    /silence_start:\s*([\d.]+)[\s\S]*?silence_end:\s*([\d.]+)/g;
  let m;
  while ((m = silenceRegex.exec(stderr)) !== null) {
    const s = parseFloat(m[1]);
    const e = parseFloat(m[2]);
    const mid = (s + e) / 2;
    if (mid > 0.6 && mid < totalDuration - 0.6) {
      silenceMidpoints.push(mid);
    }
  }

  // Compute ideal character-weighted split points, then snap each split point to the nearest real silence pause!
  const totalChars =
    sentences.reduce((sum, s) => sum + s.length, 0) || 1;
  const boundaries = [0];
  let cumChars = 0;

  for (let i = 0; i < sentences.length - 1; i++) {
    cumChars += sentences[i].length;
    const expectedTime = (cumChars / totalChars) * totalDuration;
    // Find closest detected silence midpoint within ±1.8s of expectedTime
    let bestSplit = expectedTime;
    let bestDist = 1.8;
    for (const mid of silenceMidpoints) {
      const dist = Math.abs(mid - expectedTime);
      if (dist < bestDist && mid > boundaries[boundaries.length - 1] + 0.8) {
        bestDist = dist;
        bestSplit = mid;
      }
    }
    boundaries.push(Number(bestSplit.toFixed(2)));
  }
  boundaries.push(Number(totalDuration.toFixed(2)));

  return {
    duration: Number(totalDuration.toFixed(2)),
    sentenceEndTimes: boundaries.slice(1),
  };
}

async function generateAllAudio() {
  const forceRegen = process.argv.includes("--force");
  console.log(
    `🎙️ Generating expressive Australian bedtime voiceover (force=${forceRegen})...`
  );

  const timingManifest = {};

  for (const story of STORY_AUDIO_SEGMENTS) {
    const outDir = path.join(process.cwd(), "public", "audio", story.id);
    fs.mkdirSync(outDir, { recursive: true });

    for (const item of story.items) {
      const filePath = path.join(outDir, item.filename);

      if (!forceRegen && fs.existsSync(filePath) && fs.statSync(filePath).size > 5000) {
        console.log(`  ⏭️ Using existing ${story.id}/${item.filename}`);
      } else {
        let result;
        if (API_KEY) {
          try {
            result = await generateGeminiAudioMp3(item.text, filePath);
          } catch (err) {
            console.warn(
              `  ⚠️ Gemini TTS fallback triggered for ${story.id}/${item.filename}: ${err.message}`
            );
            result = await generateFallbackEdgeMp3(item.text, filePath);
          }
        } else {
          result = await generateFallbackEdgeMp3(item.text, filePath);
        }

        const stats = fs.statSync(filePath);
        console.log(
          `  ✓ Generated ${story.id}/${item.filename} via ${result.engine} (${(
            stats.size / 1024
          ).toFixed(1)} KB)`
        );
      }

      // Compute acoustic sentence boundary timings for real-time karaoke highlighting
      const audioUrl = `/audio/${story.id}/${item.filename}`;
      timingManifest[audioUrl] = inspectMp3SentenceTimings(filePath, item.text);
    }
  }

  // Write acoustic sentence timing manifest so StoryFlipbook can highlight with exact pause sync
  const timingsTsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "audioTimings.ts"
  );
  const tsContent = `// Auto-generated acoustic sentence boundary timings (via ffmpeg silencedetect)
export interface AudioSentenceTiming {
  duration: number;
  sentenceEndTimes: number[];
}

export const AUDIO_SENTENCE_TIMINGS: Record<string, AudioSentenceTiming> = ${JSON.stringify(
    timingManifest,
    null,
    2
  )};
`;
  fs.writeFileSync(timingsTsPath, tsContent, "utf8");
  console.log(`✨ Wrote acoustic sentence timings to src/data/audioTimings.ts`);
  console.log("✨ All bedtime story voiceover files generated successfully!");
}

generateAllAudio().catch((err) => {
  console.error("Error generating TTS audio:", err);
  process.exit(1);
});
