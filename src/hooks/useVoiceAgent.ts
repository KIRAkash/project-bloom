import { useCallback } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useLiveAPI } from './useLiveAPI';

export function useVoiceAgent(mode: 'onboarding' | 'dashboard' = 'onboarding') {
  const {
    currentState,
    setCurrentState,
    updateContext,
    businessContext,
    generatedThemes,
    setGeneratedLogos,
    setGeneratedThemes,
    setIsGeneratingLogos,
    setIsGeneratingThemes,
    selectedLogo,
  } = useOnboardingStore();

  const {
    themeDesignPrompt,
    generateCampaignForEvent,
    generateVideoCampaignForEvent
  } = useDashboardStore();

  const systemInstruction = mode === 'onboarding' ? `
You are Bloom, a warm and friendly voice-first onboarding assistant for local Indian small business owners (MSMEs).
The current onboarding state is: ${currentState}.
Here is the context gathered so far: ${JSON.stringify(businessContext || {})}.
${generatedThemes.length > 0 ? `Here are the currently generated themes you can reference by name: ${generatedThemes.map((t: any) => t.name).join(', ')}` : ''}

Your goals for each state:
1. GREETING: Welcome them in a friendly, helpful tone. Ask what their business name is and what they sell.
2. CONTEXT_GATHERING: Extract details like businessName, businessCategory, businessLocation, and primaryProducts. Ask follow-up questions one at a time. Once you have businessName AND businessCategory AND businessLocation, call update_onboarding_state with nextState="LOGO_ACQUISITION". Also call generate_visuals (type="logo") to generate logo options.
3. LOGO_ACQUISITION: Tell the user that logos are being generated and they can pick one on screen. Wait for them to select a logo on screen — you don't need to ask again. When state advances to THEME_SELECTION, call generate_visuals (type="theme") immediately.
4. THEME_SELECTION: Tell the user that brand themes are being designed and they can pick one on screen. When user selects a theme, onboarding is complete.
5. COMPLETE: Warmly congratulate them and tell them Bloom is ready to launch their first campaign!

CRITICAL INSTRUCTIONS:
- You MUST call "update_onboarding_state" every time you learn a new detail (businessName, businessLocation, etc.) AND when transitioning states.
- You MUST call "generate_visuals" when entering LOGO_ACQUISITION (type="logo") and THEME_SELECTION (type="theme").
- If the user asks for different options, or says they don't like the current designs, you MUST call "generate_visuals" again for the current state to regenerate and replace the options.
- Keep responses short, friendly, and conversational — local Indian shopkeeper friendly language.
` : `
You are Bloom, a creative marketing partner for ${businessContext.businessName || 'a local business'}. 
You are currently chatting with them on their dashboard.
Their products/services: ${businessContext.businessProducts || 'various items'}.
Their brand aesthetic pattern is: ${themeDesignPrompt || 'generic aesthetic'}.

Your goal:
1. Ask the user what kind of social media campaign they want to run today (e.g., a flash sale, a holiday greeting, a new product launch).
2. Gather specific details (dates, prices, or product names to feature).
3. Ask if they prefer a static POSTER or an animated VIDEO.
4. Once you have all details, politely confirm with the user.
5. Call the "trigger_custom_campaign" tool with the exact details.
6. End the conversation playfully.

CRITICAL INSTRUCTIONS:
- Keep it brief, upbeat, and action-oriented. Do not ask too many questions. 
- You MUST call "trigger_custom_campaign" once the user confirms what they want.
`;

  const tools = mode === 'onboarding' ? [
    {
      name: 'update_onboarding_state',
      description: 'Save newly discovered business details or advance the onboarding state.',
      parameters: {
        type: 'object',
        properties: {
          nextState: {
            type: 'string',
            description: "Next onboarding state. One of: 'GREETING','CONTEXT_GATHERING','LOGO_ACQUISITION','THEME_SELECTION','COMPLETE'"
          },
          extractedContext: {
            type: 'object',
            description: 'Any new details extracted from the user speech.',
            properties: {
              businessName: { type: 'string' },
              businessCategory: { type: 'string' },
              businessLocation: { type: 'string' },
              primaryProducts: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    },
    {
      name: 'generate_visuals',
      description: 'Trigger image generation for logos or theme mockups based on business context.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Either "logo" or "theme"'
          },
          feedback: {
            type: 'string',
            description: 'Any specific feedback or prompt from the user for the regeneration (e.g., "make it more colorful", "use a minimal style").'
          }
        },
        required: ['type']
      }
    }
  ] : [
    {
      name: 'trigger_custom_campaign',
      description: 'Trigger the generation of a custom campaign once all details are gathered.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['image', 'video'], description: "The type of campaign to generate" },
          title: { type: 'string', description: "Catchy title for the event/promo" },
          details: { type: 'string', description: "Details like price, dates, and products" }
        },
        required: ['type', 'title', 'details']
      }
    }
  ];

  const handleToolCall = useCallback(async (call: any) => {
    console.log(`[VoiceAgent] Tool call: "${call.name}"`, call.args);

    if (call.name === 'update_onboarding_state') {
      const args = call.args;

      if (args.extractedContext) {
        for (const [k, v] of Object.entries(args.extractedContext)) {
          if (v !== null && v !== undefined && v !== '') {
            console.log(`[VoiceAgent] 📝 Saving context: ${k} =`, v);
            await updateContext(k, v);
          }
        }
      }

      if (args.nextState && args.nextState !== currentState) {
        console.log(`[VoiceAgent] ➡️ State transition: ${currentState} → ${args.nextState}`);
        setCurrentState(args.nextState);
      }

      return { success: true };
    }

    if (call.name === 'generate_visuals') {
      const type = call.args?.type;
      const feedback = call.args?.feedback;
      const name = businessContext.businessName || 'a local business';
      const category = businessContext.businessCategory || 'retail shop';
      const location = businessContext.businessLocation || 'India';

      if (type === 'logo') {
        console.log('[VoiceAgent] 🎨 Generating logos via 2-step prompt...');
        setIsGeneratingLogos(true);
        setGeneratedLogos([]);

        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'logo',
            context: businessContext,
            count: 3,
            feedback
          })
        })
          .then(async (res) => {
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            console.log(`[VoiceAgent] ✅ Got ${data.images?.length || 0} logos`);
            setGeneratedLogos(data.images || []);
          })
          .catch((err) => {
            console.error('[VoiceAgent] ❌ Logo generation failed:', err);
          })
          .finally(() => {
            setIsGeneratingLogos(false);
          });
      }

      if (type === 'theme') {
        console.log('[VoiceAgent] 🎨 Generating themes/banners via 2-step prompt...');
        setIsGeneratingThemes(true);
        setGeneratedThemes([]);

        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'theme',
            context: businessContext,
            count: 4,
            referenceImage: selectedLogo,
            feedback
          })
        })
          .then(async (res) => {
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            console.log(`[VoiceAgent] ✅ Got ${data.images?.length || 0} themes`);
            setGeneratedThemes(data.images || []);
          })
          .catch((err) => {
            console.error('[VoiceAgent] ❌ Theme generation failed:', err);
          })
          .finally(() => {
            setIsGeneratingThemes(false);
          });
      }

      return { success: true, message: `${type} generation started` };
    }

    if (call.name === 'trigger_custom_campaign') {
      const { type, title, details } = call.args;
      console.log(`[VoiceAgent] 🚀 Triggering custom ${type} campaign: ${title}`);
      
      const customEvent = {
        title: title || 'Custom Promo',
        description: details || '',
        date: { month: 'Custom', day: '' }
      };

      if (type === 'video') {
        generateVideoCampaignForEvent(customEvent);
      } else {
        generateCampaignForEvent(customEvent);
      }
      
      // Disconnect immediately after starting generation
      setTimeout(() => {
        disconnect();
      }, 1000); // Small delay to let the AI say its final word
      
      return { result: "Campaign generation started. Disconnecting now." };
    }

    return { result: "success" };
  }, [
    mode,
    currentState,
    updateContext,
    setCurrentState,
    businessContext,
    setIsGeneratingLogos,
    setGeneratedLogos,
    setIsGeneratingThemes,
    setGeneratedThemes,
    selectedLogo,
    generateCampaignForEvent,
    generateVideoCampaignForEvent
  ]);

  const { isConnected, connect, disconnect, sendText } = useLiveAPI({
    systemInstruction,
    tools,
    onToolCall: handleToolCall
  });

  const toggleRecording = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect().then(() => {
        if (currentState === 'GREETING') {
          setTimeout(() => {
            sendText('Start the onboarding session with a warm greeting.');
          }, 1200);
        }
      });
    }
  }, [isConnected, connect, disconnect, currentState, sendText]);

  return {
    isRecording: isConnected,
    isProcessing: false,
    toggleRecording,
    sendText,
    disconnect,
    transcript: isConnected ? 'Voice active (Live API)' : ''
  };
}
