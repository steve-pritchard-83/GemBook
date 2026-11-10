import { NEVERENDING_CHARLOTTE_STORY } from "./stories/neverending-charlotte";
import { CASPER_CHARLOTTE_STORY } from "./stories/casper-charlotte";
import { LABYRINTH_CHARLOTTE_STORY } from "./stories/labyrinth-charlotte";
import { GOOSEBUMPS_CHARLOTTE_STORY } from "./stories/goosebumps-charlotte";
import {
  NumberHintMarker,
  PaintSwatch,
} from "@/components/ColorByNumbersCanvas";

export interface StoryPage {
  pageNumber: number;
  chapterTitle?: string;
  image: string;
  audioUrl: string;
  text: string;
  caption?: string;
}

export interface StoryColoringActivity {
  imageUrl: string;
  promptText: string;
  palette: PaintSwatch[];
  hints: NumberHintMarker[];
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
  coloringActivity: StoryColoringActivity;
}

export const STORIES: Story[] = [
  NEVERENDING_CHARLOTTE_STORY,
  CASPER_CHARLOTTE_STORY,
  LABYRINTH_CHARLOTTE_STORY,
  GOOSEBUMPS_CHARLOTTE_STORY,
];

export function getStoryById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
