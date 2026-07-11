import { useState, useRef, useCallback } from 'react';

// Utility for converting base64 to Uint8Array
const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Utility for converting ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export function useLiveAPI({
  systemInstruction,
  tools,
  onToolCall,
}: {
  systemInstruction: string;
  tools: any[];
  onToolCall: (call: any) => Promise<any>;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  // Track whether the AudioWorklet module has been loaded
  const workletLoadedRef = useRef<boolean>(false);

  const disconnect = useCallback(() => {
    console.log('[LiveAPI] Disconnecting...');
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent recursive disconnect
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    workletLoadedRef.current = false;
    setIsConnected(false);
    nextPlayTimeRef.current = 0;
  }, []);

  // Stable ref to handle tool calls – avoids stale closure issues on ws.onmessage
  const onToolCallRef = useRef(onToolCall);
  onToolCallRef.current = onToolCall;

  const sendToolResponse = useCallback((functionCall: any, result: any) => {
    const toolResPayload = {
      toolResponse: {
        functionResponses: [{
          id: functionCall.id,
          name: functionCall.name,
          response: { result: result }
        }]
      }
    };
    console.log('[LiveAPI] ➡️ Sending tool response:', JSON.stringify(toolResPayload));
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(toolResPayload));
    } else {
      console.error('[LiveAPI] ❌ Cannot send tool response – WebSocket not open');
    }
  }, []);

  const playAudio = useCallback((base64: string) => {
    if (!audioContextRef.current) return;
    try {
      const uint8Array = base64ToUint8Array(base64);
      const int16Array = new Int16Array(uint8Array.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      const audioCtx = audioContextRef.current;
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      const startTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
    } catch (e) {
      console.error('[LiveAPI] Error playing audio chunk:', e);
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || wsRef.current) return;

    try {
      // 1. Fetch API Key securely from backend
      console.log('[LiveAPI] Fetching API key...');
      const keyRes = await fetch('/api/agent/key');
      const { key } = await keyRes.json();
      if (!key) throw new Error("Could not retrieve API key from server");
      console.log('[LiveAPI] API key retrieved ✅');

      // 2. Setup AudioContext and worklet FIRST (before WS, so they're ready)
      console.log('[LiveAPI] Initializing AudioContext (16kHz for microphone capture)...');
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      if (!workletLoadedRef.current) {
        console.log('[LiveAPI] Loading AudioWorklet module...');
        await audioCtx.audioWorklet.addModule('/audio-processor.js');
        workletLoadedRef.current = true;
        console.log('[LiveAPI] AudioWorklet loaded ✅');
      }

      console.log('[LiveAPI] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      console.log('[LiveAPI] Microphone access granted ✅');

      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'audio-processor');
      audioWorkletNodeRef.current = workletNode;
      source.connect(workletNode);
      // Do NOT connect workletNode to destination (avoids mic echo)
      console.log('[LiveAPI] Audio pipeline ready ✅');

      // 3. Open WebSocket
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
      console.log('[LiveAPI] Connecting to Gemini Live API WebSocket...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[LiveAPI] WebSocket connected ✅');
        setIsConnected(true);

        const setupMsg = {
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO']
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            tools: [{ functionDeclarations: tools }]
          }
        };
        console.log('[LiveAPI] ➡️ Sending setup:', JSON.stringify(setupMsg));
        ws.send(JSON.stringify(setupMsg));

        // Start streaming microphone audio once connected
        workletNode.port.onmessage = (e) => {
          const base64Data = arrayBufferToBase64(e.data);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              realtimeInput: {
                audio: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Data
                }
              }
            }));
          }
        };
      };

      ws.onmessage = async (event) => {
        let data: any;
        if (event.data instanceof Blob) {
          data = JSON.parse(await event.data.text());
        } else {
          data = JSON.parse(event.data);
        }

        // ── Handle server content (audio output from model) ──
        if (data.serverContent) {
          const modelTurn = data.serverContent.modelTurn;
          if (data.serverContent.turnComplete) {
            console.log('[LiveAPI] ℹ️ Server turn complete');
          }
          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                playAudio(part.inlineData.data);
              }
            }
          }
        }

        // ── Handle tool calls (arrive as top-level "toolCall" message, NOT inside serverContent) ──
        else if (data.toolCall) {
          const functionCalls: any[] = data.toolCall.functionCalls || [];
          console.log(`[LiveAPI] 🔧 Received toolCall with ${functionCalls.length} function call(s):`, data.toolCall);
          for (const functionCall of functionCalls) {
            console.log(`[LiveAPI] 🔧 Executing function: "${functionCall.name}" with args:`, functionCall.args);
            try {
              const result = await onToolCallRef.current(functionCall);
              console.log(`[LiveAPI] ✅ Function "${functionCall.name}" returned:`, result);
              sendToolResponse(functionCall, result);
            } catch (err) {
              console.error(`[LiveAPI] ❌ Error executing function "${functionCall.name}":`, err);
              sendToolResponse(functionCall, { error: String(err) });
            }
          }
        }

        else if (data.setupComplete) {
          console.log('[LiveAPI] ✅ Setup complete – session is ready');
        } else {
          // sessionResumptionUpdate and other non-critical messages
          const knownKeys = ['sessionResumptionUpdate', 'goAway', 'usageMetadata'];
          const keys = Object.keys(data);
          if (!keys.some(k => knownKeys.includes(k))) {
            console.log('[LiveAPI] ℹ️ Unknown message:', data);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[LiveAPI] ❌ WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log(`[LiveAPI] WebSocket closed – Code: ${event.code}, Reason: "${event.reason}"`);
        disconnect();
      };

    } catch (error) {
      console.error('[LiveAPI] ❌ Connection failed:', error);
      disconnect();
    }
  }, [isConnected, systemInstruction, tools, disconnect, playAudio, sendToolResponse]);

  const sendText = useCallback((text: string) => {
    const payload = {
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true
      }
    };
    console.log('[LiveAPI] ➡️ Sending text prompt:', payload);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn('[LiveAPI] ⚠️ Cannot sendText – WebSocket not open');
    }
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendText
  };
}
