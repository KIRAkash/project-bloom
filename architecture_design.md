# Bloom - Architecture Design

## 1. System Overview
Bloom is an autonomous, voice-first marketing agency built for local Indian businesses (MSMEs). The platform uses a mobile-first approach, leveraging real-time voice and multimodal AI to assist users in creating, editing, and distributing high-quality marketing assets.

## 2. Tech Stack

### 2.1 Frontend (Client Application)
- **Framework:** Next.js (React) configured as a Progressive Web App (PWA), ensuring it works seamlessly on mobile devices with native-like capabilities.
- **Styling:** Tailwind CSS / Custom CSS for responsive, mobile-first design.
- **State Management:** React Context / Zustand to manage user sessions and live agent context locally before syncing.

### 2.2 Backend & Data Storage (Local First POC)
For the Proof of Concept (POC), all data will be stored in a local database file, eliminating the need for a cloud backend.
- **Database:** SQLite (using Prisma ORM or `better-sqlite3` via Next.js API Routes).
  - *Why SQLite?* It provides a physical `.db` file that persists across app/server restarts, mimicking a local on-device database. This makes it extremely easy to inspect, manage, and move the local data for the POC.
- **Storage:** Images (logos, generated assets) will be stored as files in the local filesystem (e.g., `public/uploads`) and referenced by file path in the SQLite database.
- **Authentication:** Local session only (no active auth required for the POC).

### 2.3 AI Integration Layer
The core intelligence of Bloom is powered by Google's Gemini models:

- **Gemini Flash Live (`gemini-3.1-flash-live-preview`)**
  - **Role:** Handles the real-time, low-latency conversational voice agent.
  - **Function:** Understands regional languages, switches between English and local dialects, and manages the multi-turn onboarding flow.
- **Gemini Omni (`gemini-omni-flash-preview`)**
  - **Role:** Multimodal processing.
  - **Function:** Analyzes user-uploaded photos or camera captures to extract context, refine prompts, and assist in content understanding.
- **Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`)**
  - **Role:** High-speed, efficient image generation.
  - **Function:** Generates the 5 logo variations during onboarding, removes backgrounds (creating PNGs) from user-clicked logos, and generates the final studio-quality promotional posters and design themes (Design MD).
- **Gemini 3.5 Flash (via API)**
  - **Role:** Text and prompt manipulation.
  - **Function:** Translates unstructured business context into detailed prompt engineering for Nano Banana 2 Lite.

## 3. Core Architecture Flows

### 3.1 Live Agent Onboarding & State Machine
The onboarding is handled by a stateful Live Agent workflow:

1. **Initialization:** User opens app -> Gemini Flash Live initiates greeting based on location (English + Local language).
2. **State Tracking:** A local state machine tracks the user's progress through the onboarding funnel.
   - *State 1:* Gathering Business Details.
   - *State 2:* Logo Acquisition (Upload / Camera Capture / Generate).
   - *State 3:* Theme (Design MD) Selection.
3. **Tool Invocation:** The Live Agent has access to "Tools" (functions it can call), such as `openCamera()`, `generateLogoPrompts()`, and `finalizeTheme()`.
4. **Context Window Management:** As the user speaks, structured and unstructured data is extracted and saved to the local SQLite database. This context is injected into subsequent prompts to maintain a coherent conversation.

### 3.2 Asset Generation Pipeline
1. User provides a voice prompt ("I have fresh mangoes, 10% off").
2. Flash Live parses the intent and variables (Product: Mango, Offer: 10% off).
3. The context + Design MD is passed to Gemini 3.5 Flash to generate an optimized image generation prompt.
4. Nano Banana 2 Lite generates the image asset.
5. The UI displays the asset; user can iterate using voice (Voice-Driven Editing).

## 4. Security & Privacy
- All API keys for Gemini models are secured via serverless functions (e.g., Next.js API routes) to prevent exposing them in the client, even though data storage is local.
- All user data and generated assets are kept entirely in the local environment (SQLite DB and local filesystem), ensuring complete privacy for the POC.
