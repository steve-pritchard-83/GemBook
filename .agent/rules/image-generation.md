# GemBook Image Generation Policy

Whenever generating cover or page illustrations for stories in this repository:

1. **Primary (Free Built-in Quota First):**
   Always invoke Antigravity's built-in `image-generator` subagent first (`invoke_subagent` with `TypeName: "image-generator"`). Each 10-page story + cover requires 11 images, which fits within the 13-image rolling window.

2. **Automatic Fallback (`GEMINI_API_KEY` in `.env.local`):**
   If and only if the built-in `image-generator` subagent returns `HTTP 429` / `RESOURCE_EXHAUSTED` / `QUOTA_EXHAUSTED` for any remaining images, automatically fall back to running the Gemini Image API script (`scripts/generate-casper-gemini.mjs` or `scripts/generate-story-images.mjs`) using `GEMINI_API_KEY` from `.env.local` to complete the remaining illustrations without leaving placeholder graphics.
