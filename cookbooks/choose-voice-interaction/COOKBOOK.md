---
id: "choose-voice-interaction"
title: "Choose a voice interaction"
summary: "Compare typed input, push-to-talk, energy detection, and explicit wake engines with consent and reliable stop behavior."
group: "Choose inputs and algorithms"
tags: ["voice", "consent", "engines"]
choices: ["Typed input, push-to-talk, VAD, or wake engine", "Local processing and explicit resource installation", "Review recognized text and control output independently"]
capabilities: ["optional voice adapter"]
evidence: "explained"
related: ["capture-reviewed-evidence", "discover-capabilities", "coordinate-devices"]
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ptt.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/vad.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/voice-coach/index.html", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/control/speech.ts"]
---

# Choose a voice interaction

Voice is useful when a person's hands or eyes are occupied, such as describing a repair while looking at a part. Begin with a task that also works through typing: a question, a reviewed note, or a short instruction. Dictation and spoken replies are independent choices. A person may dictate in a workshop and read a silent reply; another may type and listen.

A complete experience lets the person choose a mode, understand where processing happens, try a harmless utterance, correct its transcript, send intentionally, and stop all activity immediately. Continuous listening adds value only when those extra lifecycle and error decisions are justified. A typed field with an optional record button is often the better first version.

## Choose the input and output separately

| Approach | Useful when | Design cost |
| --- | --- | --- |
| Typed input | Exact wording, shared spaces, or unsupported devices. | A persistent draft and clear delivery state. |
| Push-to-talk | The person can deliberately start a bounded utterance. | Accessible start/finish/cancel controls and recognition correction. |
| Energy VAD | An explicitly started session should split speech into clips. | Noise triggers, quiet speech, clip limits, and understandable active state. |
| Explicit wake engine | A chosen phrase materially reduces interaction effort. | Model/language preparation, false wakes, battery, and foreground limits. |

Prefer a click-to-start/click-to-finish control when holding a button excludes a person. If press-and-hold is useful, provide the same operation through keyboard and visible buttons. Treat release, pointer cancellation, lost focus, and navigation deliberately; they should not accidentally turn a partial utterance into a command.

Select short spoken confirmations only where they help. The person should be able to disable output without losing typed replies or changing input mode. Decide whether new replies queue, replace an obsolete utterance, or wait for the person to request playback. Announce the current task, rather than reading an unbounded conversation aloud.

## Walk through a repair-note session

1. Show the editable note, **Record a note**, and a short disclosure of processing location and resource preparation. Do not open the microphone during initial rendering.
2. Prepare the selected engine only after the relevant choice. Show progress, cancellation, and a typed route while resources load. Distinguish a missing language pack from microphone denial.
3. Start with a brief rehearsal: “Describe the part you are looking at.” Display a recording timer and **Finish**, **Cancel**, and **Stop all audio**. Keep the active state perceptible without relying on animation or color.
4. After capture, show “Transcribing this recording” while keeping typing available. The transcript becomes an editable candidate, never a retrospective overwrite of text entered while processing.
5. Review the candidate alongside its task/question. Let the person replace, append, or discard it. Sending snapshots the reviewed text; subsequent typing belongs to another draft.
6. Show queued, accepted, or rejected delivery distinctly. An accepted event is not proof that the agent has answered. Keep the submitted transcript available while waiting.
7. Offer another recording as a fresh action. Ending the session clears active resources; reopening a saved note does not rearm the microphone.

For low-consequence dictation, automatic insertion may be sufficient. For a command that changes external work, separate transcription from the person's intentional submission and apply the relevant action review policy. Background speech, recognition confidence, and a wake phrase are not authorization.

## Keep the processing and lifecycle honest

The [public voice contract](https://github.com/werg/tendriller/blob/44ba1371328281ad9a271b9a1709d6a5bfb2732e/docs/HANDS_FREE.md) makes voice an optional adapter. Construction starts no microphone, speech, or download. A stored engine preference is not consent to listen or play audio on a new visit. Use its explicit preparation, capture, cancellation, stop, and disposal lifecycle through page-owned controls; do not build a second invisible auto-restart loop around it.

Browser SpeechRecognition is an engine choice, not evidence of local processing. The reviewed adapter's local mode requires supported local recognition and language assets; browser mode may use a network provider. Neither is a dedicated low-power acoustic wake-word model. Explain the chosen mode and fail visibly when it is unavailable rather than silently changing processing location. A model installation has its own size, progress, cancellation, and failure state.

Keep a page-owned attempt ID for each recording and bind the transcript callback to its original draft and task revision. Invalidate pending callbacks on Cancel, Stop, mode change, or task change. A slow result from a cancelled attempt must not insert text or submit later. Distinguish raw recording retention from transcript retention; if audio need not survive transcription, avoid retaining it merely for convenience.

When the page becomes hidden, a role changes, or navigation occurs, follow the selected adapter's stop behavior. Reopening the page must visibly require the next deliberate start. The local Stop path must work without an agent reply or network connection and stop pending starts as well as current microphone/output activity. Audio focus hints between devices do not grant permission to speak on another device.

## If using an energy detector

The extracted detector used an RMS floor of 0.015, noise multiplier 3, quiet-only adaptation weights 0.95/0.05, 150 ms onset, 600 ms hangover, and 30 ms polling. These are historical calibration examples, not recommended defaults for every microphone. A higher threshold misses quiet speech; a longer hangover reduces splits but increases latency. Bound clip length and total session duration independently of silence detection.

Rehearse with real quiet and loud voices, ordinary pauses, fan noise, and microphone positions. Show a simple local input-level indication and allow recalibration without starting a new task. Measure false starts and missed utterances separately. Do not make a person shout to compensate for a threshold chosen on someone else's device.

## Verify the user experience

| Scenario | Expected observation |
| --- | --- |
| Denied permission or missing engine/language | The reason is visible; the typed draft and Send remain usable. |
| Cancel during preparation or transcription | Resources settle without a late transcript or command. |
| Type while transcription runs | New typing survives; the candidate is offered separately. |
| Loud non-speech sound or quiet speech | Failures are visible in rehearsal and do not trigger consequential work. |
| Stop while output is queued | Current and promised pending audio stop, including while offline. |
| Background, reload, or change role | Listening stops and never silently resumes. |
| Retried send or reply for another device | Original send identity is retained; unrelated replies are not spoken here. |

Record the exact engine/version and tested conditions. These scenarios are adaptation acceptance criteria; this explained guide does not establish recognition accuracy on a particular device.
