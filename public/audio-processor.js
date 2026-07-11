class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      
      // Convert Float32Array to Int16Array
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        // Clamp the values to -1.0 to 1.0
        let s = Math.max(-1, Math.min(1, channelData[i]));
        // Scale to 16-bit integer
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Post the PCM16 buffer to the main thread
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
