// Adaptable full-duplex voice + text chat controller with session/auto consent,
// barge-in over spoken TTS replies, and typed fallback.
export function createVoiceChatController({
  voice,
  consentMode = 'auto',
  autoSend = true,
  autoSpeak = false,
  handsFreeLoop = false,
  onSend,
  onDraft,
  onStatus = () => {},
} = {}) {
  if (!voice || typeof onSend !== 'function') {
    throw new TypeError('createVoiceChatController requires a voice adapter and onSend callback');
  }

  let speaking = false;
  let recording = false;
  let loopArmed = Boolean(handsFreeLoop);
  let speakEnabled = Boolean(autoSpeak);
  let disposed = false;

  const snapshot = () => ({
    consentMode,
    autoSend,
    speakEnabled,
    loopArmed,
    speaking,
    recording,
    muted: voice.muted,
  });
  const notify = () => { if (!disposed) onStatus(snapshot()); };

  return Object.freeze({
    snapshot,
    /** Start or finish a voice turn; interrupts active TTS playback immediately (barge-in). */
    async toggleMic() {
      if (disposed) return;
      if (voice.speaking) {
        voice.stop();
        speaking = false;
      }
      if (recording) {
        voice.finishCapture();
        recording = false;
        notify();
        return;
      }
      recording = true;
      notify();
      try {
        await voice.startCapture();
      } catch (error) {
        recording = false;
        notify();
        throw error;
      }
    },
    /** Handle a finalized transcript according to autoSend vs draft-review mode. */
    async handleTranscript(text) {
      recording = false;
      const trimmed = String(text ?? '').trim();
      notify();
      if (!trimmed) return;
      if (autoSend) await onSend({ text: trimmed, via: 'voice' });
      else onDraft?.(trimmed);
    },
    /** Speak an incoming agent reply when voice output is enabled. */
    async handleAgentReply(text, { engine = 'browser' } = {}) {
      if (disposed || !speakEnabled || !String(text ?? '').trim()) return;
      if (voice.muted) {
        const ok = await voice.enableOutput(engine);
        if (!ok || disposed) return;
      }
      speaking = true;
      notify();
      voice.speak(String(text).trim());
    },
    /** Called when TTS playback finishes; optionally re-opens listening in hands-free mode. */
    async onOutputEnded() {
      speaking = false;
      notify();
      if (!disposed && loopArmed && !recording) {
        await this.toggleMic();
      }
    },
    stopSpeaking() {
      voice.stop();
      speaking = false;
      notify();
    },
    setSpeakEnabled(value) {
      speakEnabled = Boolean(value);
      if (!speakEnabled) {
        loopArmed = false;
        voice.mute();
        speaking = false;
      }
      notify();
    },
    setHandsFreeLoop(value) {
      loopArmed = Boolean(value);
      if (loopArmed) speakEnabled = true;
      notify();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      voice.stop();
    },
  });
}
