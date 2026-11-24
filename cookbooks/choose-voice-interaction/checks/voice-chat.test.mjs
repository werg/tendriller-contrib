import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceChatController } from '../snippets/voice-chat.mjs';

function mockVoice() {
  const calls = [];
  return {
    calls,
    muted: true,
    speaking: false,
    async enableOutput(engine) { calls.push(['enableOutput', engine]); this.muted = false; return true; },
    mute() { calls.push(['mute']); this.muted = true; this.speaking = false; },
    speak(text) { calls.push(['speak', text]); this.speaking = true; },
    stop() { calls.push(['stop']); this.speaking = false; },
    async startCapture() { calls.push(['startCapture']); },
    finishCapture() { calls.push(['finishCapture']); },
  };
}

test('voice chat supports barge-in over active TTS, auto-send, and hands-free loop', async () => {
  const voice = mockVoice();
  const sent = [];
  const chat = createVoiceChatController({
    voice,
    consentMode: 'auto',
    autoSend: true,
    autoSpeak: true,
    handsFreeLoop: true,
    onSend: input => sent.push(input),
  });

  await chat.handleAgentReply('Cluster CPU is at 34 percent.');
  assert.equal(voice.speaking, true);

  // Tapping mic while agent speaks triggers immediate barge-in (stop -> startCapture).
  await chat.toggleMic();
  assert.deepEqual(voice.calls.slice(-2), [['stop'], ['startCapture']]);

  // Finishing and receiving transcript sends immediately in autoSend mode.
  await chat.toggleMic();
  await chat.handleTranscript('Show memory usage too');
  assert.deepEqual(sent, [{ text: 'Show memory usage too', via: 'voice' }]);

  // Hands-free loop re-opens capture when the next spoken reply finishes.
  await chat.handleAgentReply('Memory is 62 percent.');
  await chat.onOutputEnded();
  assert.equal(voice.calls.at(-1)[0], 'startCapture');
  chat.dispose();
});

test('voice chat falls back to editable draft when autoSend is false', async () => {
  const voice = mockVoice();
  const drafts = [];
  const sent = [];
  const chat = createVoiceChatController({
    voice,
    autoSend: false,
    onSend: input => sent.push(input),
    onDraft: text => drafts.push(text),
  });
  await chat.handleTranscript('Restart staging worker');
  assert.deepEqual(drafts, ['Restart staging worker']);
  assert.deepEqual(sent, []);
  chat.dispose();
});
