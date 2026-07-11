# Bloom - Features Specification

## 1. Voice-First Onboarding (MANDATORY PATH)
A guided, conversational onboarding experience to capture the essence of the MSME.

- **Bilingual Greeting:** Automatically detects user location and greets them using a Live Voice Agent in both English and the local regional language.
- **Dynamic Language Switching:** Seamlessly switches language based on what the user speaks.
- **Context Gathering:** The agent dynamically asks questions to understand the business (location, type, customers, goals) and builds unstructured/structured context.
- **Camera Integration (Tool Access):** The voice agent can prompt the user to open the camera to take a picture of their shop or products at any time.
- **Logo Acquisition:**
  - *Option A (Existing):* User uploads or clicks a photo of their logo. Nano Banana 2 Lite extracts it and creates a transparent PNG.
  - *Option B (Generate):* If no logo exists, the system uses the gathered context, uses Gemini 3.5 Flash to create prompts, and Nano Banana 2 Lite generates 5 logo options. User selects one.
- **Design MD (Theme Generation):** Based on the logo and business context, the system generates 4 distinct design themes/styles. It creates 4 dummy social media posts to preview these themes.
- **Interactive Refinement:** The Live Agent guides the user to pick a theme, accepting verbal feedback to iterate on the designs until final approval.

## 2. Conversational Content Creation
- **Zero-UI Prompting:** Users tap a microphone and speak their intent (e.g., "Make a poster for the new Diwali sweet boxes").
- **Instant Generation:** The system translates the voice intent into a polished marketing asset (image or video loop) based on their saved Design MD.

## 3. The "Familiar Face" Trust Anchor
- **Face Integration:** Seamlessly integrates the shopkeeper's actual face into the generated promotional materials.
- **Trust Building:** Ensures digital ads retain the personal, human connection that local retail thrives on.

## 4. Hyper-Local Smart Calendar
- **Event Tracking:** The app tracks local festivals, market days, and regional events based on the business's location.
- **Proactive Generation:** Automatically pre-generates relevant promotional campaigns well in advance, prompting the user when it's time to post.

## 5. Proactive Inspiration Board
- **Personalized Dashboard:** A feed showing a mix of the user's created assets and AI-suggested content.
- **Fresh Ideas:** Gives shopkeepers a constant stream of ready-to-publish content tailored to their inventory and category.

## 6. Voice-Driven Editing & Version Control
- **Verbal Edits:** Users can edit generated assets via voice commands (e.g., "Make it brighter," "Change the price to 100").
- **Edit History:** The system tracks all modifications, allowing users to revert to any previous version effortlessly.

## 7. Dynamic, Real-Time Pricing
- **Instant Updates:** Voice commands can instantly update pricing on generated videos and images to reflect changing wholesale margins.

## 8. Frictionless Social Distribution
- **One-Click Share:** Direct integration to share finalized assets to WhatsApp Status, WhatsApp Groups, and Instagram Stories.
