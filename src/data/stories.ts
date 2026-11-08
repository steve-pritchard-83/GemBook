export interface StoryPage {
  pageNumber: number;
  chapterTitle?: string;
  image: string;
  audioUrl: string;
  text: string;
  caption?: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  dedicatedTo: string;
  author: string;
  readingTimeMinutes: number;
  ageRange: string;
  coverImage: string;
  coverAudioUrl?: string;
  closingAudioUrl?: string;
  closingTitle?: string;
  closingMessage?: string;
  themeColor: string;
  accentColor: string;
  summary: string;
  pages: StoryPage[];
}

export const STORIES: Story[] = [
  {
    id: "neverending-charlotte",
    title: "Charlotte and the Neverending Story",
    subtitle: "A Magical Journey Through Fantasia",
    dedicatedTo: "For Charlotte, age 7",
    author: "Told with love at bedtime",
    readingTimeMinutes: 5,
    ageRange: "7 Years Old",
    coverImage: "/stories/neverending-charlotte/cover.png",
    coverAudioUrl: "/audio/neverending-charlotte/cover.mp3",
    closingAudioUrl: "/audio/neverending-charlotte/closing.mp3",
    closingTitle: "Goodnight, Princess of Fantasia",
    closingMessage:
      "Every time you close your eyes and dream, a new chapter begins in Fantasia. Sleep tight, sweet Charlotte.",
    themeColor: "#1b1638",
    accentColor: "#f5c469",
    summary:
      "When seven-year-old Charlotte discovers a shimmering copper book in her cozy attic, her imagination whisks her away to the magical land of Fantasia—soaring on Falkor the Luckdragon and saving a world made of dreams.",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "The Shimmering Book",
        image: "/stories/neverending-charlotte/page-1.png",
        audioUrl: "/audio/neverending-charlotte/page-1.mp3",
        text: "Rain pattered softly against the attic window as seven-year-old Charlotte brushed a lock of golden-blonde hair behind her ear. Resting on her velvet quilt was an ancient copper-bound storybook that seemed to hum with a warm, sleepy light. On its cover gleamed the golden AURYN emblem—two gentle serpents twined in an endless circle of dreams.",
      },
      {
        pageNumber: 2,
        chapterTitle: "Whispers of Stardust",
        image: "/stories/neverending-charlotte/page-2.png",
        audioUrl: "/audio/neverending-charlotte/page-2.mp3",
        text: "As Charlotte opened the heavy parchment cover, ribbons of warm golden stardust and lavender light swirled gently into the room. The pages whispered her name—\"Charlotte, Fantasia needs your imagination!\" With a soft breath of wonder, her cozy attic melted into a twilight sky of floating crystal islands.",
      },
      {
        pageNumber: 3,
        chapterTitle: "The Gentle Giant",
        image: "/stories/neverending-charlotte/page-3.png",
        audioUrl: "/audio/neverending-charlotte/page-3.mp3",
        text: "Charlotte landed softly on a mossy path in the Whispering Forest, where lantern-mushrooms glowed in shades of rose and violet. There sat the friendly Rock Biter, a kind giant made of smooth river stones, happily munching on sparkling amethyst crystals. \"They look like big, good, strong hands—and a very kind heart,\" he rumbled warmly, sharing a tiny sugar-crystal gem with Charlotte.",
      },
      {
        pageNumber: 4,
        chapterTitle: "The Silver Mountains",
        image: "/stories/neverending-charlotte/page-4.png",
        audioUrl: "/audio/neverending-charlotte/page-4.mp3",
        text: "Beside the shimmering Silver Mountains, young Atreyu greeted Charlotte with a gentle bow, his loyal white horse Artax nuzzling her hand. \"The Nothing is only a shadow when children forget to dream,\" Atreyu said softly, pointing to the golden AURYN medallion now resting over Charlotte's lavender cardigan. \"Your imagination can light up all of Fantasia.\"",
      },
      {
        pageNumber: 5,
        chapterTitle: "Flight of the Luckdragon",
        image: "/stories/neverending-charlotte/page-5.png",
        audioUrl: "/audio/neverending-charlotte/page-5.mp3",
        text: "From the cotton-candy twilight clouds swooped Falkor the Luckdragon, his pearlescent white fur and golden scales shimmering like moonbeams. Charlotte climbed onto his warm, fluffy neck, giggling as her blonde hair danced in the gentle evening breeze. \"Never give up, and good luck will find you, little dreamer!\" Falkor sang in a soothing rumble.",
      },
      {
        pageNumber: 6,
        chapterTitle: "The Ivory Tower",
        image: "/stories/neverending-charlotte/page-6.png",
        audioUrl: "/audio/neverending-charlotte/page-6.mp3",
        text: "Together they glided high above sleepy valleys toward the heart of Fantasia, where the magnificent Ivory Tower rose like a giant glowing moonflower. Thousands of tiny star-lanterns twinkled along its pearly spires, welcoming Charlotte and Falkor home through the velvety night.",
      },
      {
        pageNumber: 7,
        chapterTitle: "The Mirror of the Heart",
        image: "/stories/neverending-charlotte/page-7.png",
        audioUrl: "/audio/neverending-charlotte/page-7.mp3",
        text: "Along the starry pathway stood the twin sapphire arches of the Southern Oracle, glowing like gentle blue northern lights. Usually only the bravest heroes dared step through, yet as Charlotte walked peacefully between them, the crystal mirrors simply smiled back—showing a brave, loving seven-year-old girl whose kindness knew no end.",
      },
      {
        pageNumber: 8,
        chapterTitle: "A Single Grain of Sand",
        image: "/stories/neverending-charlotte/page-8.png",
        audioUrl: "/audio/neverending-charlotte/page-8.mp3",
        text: "Inside the Pavilion of Stars, the Childlike Empress welcomed Charlotte with a serene smile and placed a single, radiant grain of golden sand into her cupped palms. \"All of Fantasia lives inside this tiny spark, Charlotte,\" the Empress whispered softly. \"Make a wish with your gentle heart, and dream our world anew.\"",
      },
      {
        pageNumber: 9,
        chapterTitle: "Wishes in the Night Sky",
        image: "/stories/neverending-charlotte/page-9.png",
        audioUrl: "/audio/neverending-charlotte/page-9.mp3",
        text: "Charlotte closed her eyes, thought of every wonderful story she loved, and blew softly upon the glowing grain of sand. All at once, golden constellations, sleepy crystal meadows, baby unicorns, and dancing fireflies blossomed across the night sky, filling Fantasia with warmth and peace.",
      },
      {
        pageNumber: 10,
        chapterTitle: "Sweet Dreams, Charlotte",
        image: "/stories/neverending-charlotte/page-10.png",
        audioUrl: "/audio/neverending-charlotte/page-10.mp3",
        text: "Falkor carried Charlotte softly through the starry mist and tucked her right back beneath her warm bedroom quilt. As her eyelids grew heavy and sweet dreams drifted in, the copper book rested beside her pillow—waiting quietly for tomorrow night's next magical adventure. Goodnight, Charlotte.",
      },
    ],
  },
];

export function getStoryById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
