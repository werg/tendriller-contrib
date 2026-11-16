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
sources: ["https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/ptt.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/components/vad.js", "https://github.com/werg/tendriller-contrib/blob/6554970c5b1dbf8a7cfb2ffcc22eeb437eede6ce/recipes/voice-coach/index.html", "https://github.com/werg/tendriller/blob/a0a84cc9e0db104313caf6ece2cbe0d009a9e19d/runtime/src/control/speech-input.ts"]
---

# Choose a voice interaction

Voice is useful when the person's hands or eyes are occupied. It is a poor default when privacy, noise, precision, or browser support makes it unreliable. Keep a typed alternative that can complete the task. Choose input and output independently: a person may dictate but prefer silent replies, or type and hear a short response.

## Compare the approaches

| Approach | Useful when | Cost or failure to design for |
| --- | --- | --- |
| Typed input | Exact wording, quiet spaces, or unsupported devices. | Hands/eyes are occupied; use a clear draft and send state. |
| Push-to-talk | The person can deliberately start an utterance. | Press/hold mechanics, cancellation, accidental release, and recognition errors. |
| Energy VAD | A clearly started listening session should split speech into clips. | Loud non-speech sounds trigger it; quiet speech may be missed. |
| Explicit wake engine | A tested engine should remain locally armed for a chosen phrase. | Engine/model assets, language coverage, memory, battery, foreground limits, and false wakes. |

The extracted energy detector used an RMS floor of 0.015, noise multiplier 3, quiet-only noise adaptation with weights 0.95/0.05, 150 ms onset, 600 ms hangover, and 30 ms polling. These are calibration examples. A larger threshold misses more quiet speech; a longer hangover reduces split pauses while increasing latency. Test real voices, background noise, microphone placement, and the quiet user's ability to stop it.

Browser SpeechRecognition is an engine choice, not proof of on-device processing. Do not call a recognition-based wake phrase a verified local wake detector. Require the selected engine to state its processing location and resource provenance; never silently switch to cloud processing when local recognition is unavailable. A language/model install is an explicit operation with its own progress and failure state.

## Adapt the plan

Choose the minimal interaction that serves the task. Start listening only after a visible gesture with a clear active state and Stop action. Keep local mute and stop independent of agent replies and network availability. On backgrounding, navigation, or reload, follow an explicit policy; do not silently restart continuous listening. Separate recognized text from a sent instruction when an accidental transcription could trigger consequential work. Use review/confirmation for actions that warrant it.

When output speech is desired, select the optional core adapter explicitly and supply the resources and consent it requires. Queue or interrupt speech according to the user's task; starting a microphone does not imply permission to speak. A local Stop must stop both current speech and pending playback as promised by the interface. Audio focus between devices is a coordination hint, not an authorization grant.

## Verify

Try denial, unavailable engine, missing language assets, offline mode, a loud non-speech sound, quiet speech, rapid start/stop, backgrounding, and reload. Confirm the microphone actually stops and queued callbacks cannot send later. Check whether a reply intended for another device is spoken here. Record the engine/version and actual tested device conditions; source review alone does not establish recognition accuracy.
