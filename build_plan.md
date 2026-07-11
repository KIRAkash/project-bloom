# Bloom - Step-by-Step Build Plan

This plan breaks down the hackathon development into manageable phases.

## Phase 1: Setup & Foundation (Hours 1-4)
1. **Initialize Repository:** Set up a Next.js project with Tailwind CSS.
2. **Database Configuration:** Set up Prisma ORM with SQLite (`dev.db` file) to handle structured data and text context, and configure a local folder (`public/uploads`) for image storage.
3. **API Keys:** Securely store API keys for Gemini Flash Live, Gemini Omni, Nano Banana 2 Lite, and Gemini 3.5 Flash in `.env.local` to be used by Next.js API routes.
4. **Basic UI Shell:** Create the mobile layout (App shell, bottom navigation, microphone button component).

## Phase 2: Live Voice Onboarding Funnel (Hours 4-10)
1. **Gemini Flash Live Integration:** Connect to the `gemini-3.1-flash-live-preview` WebSocket/API for real-time audio streaming.
2. **State Machine Creation:** Implement the logic to track the onboarding steps:
   - `GREETING` -> `CONTEXT_GATHERING` -> `LOGO_ACQUISITION` -> `THEME_SELECTION` -> `COMPLETE`
3. **Tool Invocations:** Implement function calling for the Live Agent to trigger UI changes (e.g., `triggerCamera()`, `showLogoOptions()`).
4. **Context Storage:** Write functions to save the extracted unstructured/structured business data to the SQLite database via Next.js API routes in real-time.

## Phase 3: Logo & Asset Generation (Hours 10-16)
1. **Camera/Upload Component:** Build the UI for taking/uploading pictures.
2. **Background Removal:** Implement the Nano Banana 2 Lite call to process uploaded logos into transparent PNGs.
3. **Logo Generation:** Use Gemini 3.5 Flash to generate 5 logo prompts based on SQLite context, and use Nano Banana 2 Lite to render them. Build the selection UI.
4. **Design MD Generation:** Generate the 4 design themes and dummy social media posts using the chosen logo and context. Connect the Live Agent to handle verbal feedback on these themes.

## Phase 4: Dashboard & Core Features (Hours 16-22)
1. **Inspiration Board UI:** Create the masonry/feed layout for displaying generated assets.
2. **Conversational Creation:** Implement the main microphone interface for generating new posts based on the saved Design MD.
3. **Voice-Driven Editing:** Implement the logic to take a generated image, take a voice instruction, and pass it back to the AI for refinement. Add basic version history in state.
4. **Hyper-Local Calendar (Mock/Integration):** Build a simple proactive suggestion engine (can use static upcoming dates for the hackathon demo).

## Phase 5: Social Sharing & Polish (Hours 22-24)
1. **Web Share API / Deep Links:** Implement one-click sharing to WhatsApp (`wa.me` links or Web Share API for images) and Instagram.
2. **The "Familiar Face" Feature:** Ensure the image generation prompts include instructions for integrating user reference photos (if time permits, use a face-swap API or specific prompting techniques).
3. **End-to-End Testing:** Walk through the entire user journey on a mobile device to ensure the Live Agent handles interruptions and context correctly.
4. **Demo Prep:** Finalize the pitch and record a seamless run-through.
