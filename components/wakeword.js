/* Tendriller snippet: wakeword.js — listen continuously for a phrase such as "hey kitchen".
 *
 *   <div id="handsfree"></div>
 *   <script src="assets/components/wakeword.js"></script>
 *   <script>
 *     tendrilSnippets.wakeword.mount("#handsfree", {phrases:["hey kitchen"]});
 *   </script>
 *
 * Low tone = ready to hear the phrase; high tone = ready for the next command.
 * Say phrase and command together or pause, then speak within eight seconds.
 * Commands go to an explicit callback or an `utterance` page event.
 * For custom UI use start({phrases,onWake,onCommand,onState,onError}).
 *
 * This is an optional custom-page snippet, not the standard Tendriller control.
 * On core releases with integrated hands-free controls, prefer the built-in menu.
 * This snippet is NOT a true offline wake word engine: it matches browser
 * SpeechRecognition transcripts, which may be processed by a vendor/cloud.
 * The microphone stops when a page is backgrounded and never auto-restarts.
 * Background/locked-screen use is unreliable.
 */
(() => {
  const ns = (window.tendrilSnippets = window.tendrilSnippets || {});
  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = () => !!SR();
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

  function start({ phrases = ["hey tendril"], lang, onWake, onCommand, onHeard, onError,
                   onState, cooldownMs = 2000, commandTimeoutMs = 8000 } = {}) {
    if (!supported()) {
      const msg = "Speech recognition is not available in this browser, so wake words cannot work here.";
      if (onError) onError(msg);
      return { stop() {}, running: false, error: msg };
    }
    const wanted = phrases.map(norm).filter(Boolean);
    if (!wanted.length) throw new Error("At least one wake phrase is required.");
    let stopped = false, rec = null, failures = 0, lastWake = 0, restartTimer = null;
    let commandTimer = null, awaitingCommand = false;
    const handled = new Set(); // final result indexes already handled in this session
    const state = (name, detail) => onState?.(name, detail);
    function stop(reason = "stopped", detail) {
      if (stopped) return;
      stopped = true;
      clearTimeout(restartTimer);
      clearCommand();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onLeave);
      try { rec?.abort(); } catch {}
      state(reason, detail);
    }
    const clearCommand = () => { clearTimeout(commandTimer); commandTimer = null; awaitingCommand = false; };

    function match(text) {
      const t = " " + norm(text) + " ";
      for (const p of wanted) {
        const i = t.indexOf(" " + p + " ");
        if (i >= 0) return { phrase: p, command: t.slice(i + p.length + 2).trim() };
      }
      return null;
    }

    function begin() {
      if (stopped) return;
      state("starting");
      rec = new (SR())();
      rec.lang = lang || navigator.language || "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      handled.clear();
      rec.onstart = () => { failures = 0; state(awaitingCommand ? "command" : "listening"); };
      rec.onresult = (e) => {
        if (stopped) return;
        failures = 0;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i], text = r[0].transcript;
          if (onHeard) onHeard(text, r.isFinal);
          if (handled.has(i) || !r.isFinal) continue;
          const m = match(text);
          if (m && Date.now() - lastWake >= cooldownMs) {
            handled.add(i);
            lastWake = Date.now();
            clearCommand();
            if (onWake) onWake({ ...m, transcript: text });
            if (m.command) onCommand?.(m.command, { phrase: m.phrase, transcript: text });
            else if (onCommand) {
              awaitingCommand = true;
              state("command");
              commandTimer = setTimeout(() => { clearCommand(); state("listening"); }, commandTimeoutMs);
            }
          } else if (awaitingCommand && norm(text)) {
            handled.add(i);
            clearCommand();
            state("listening");
            onCommand?.(text.trim(), { phrase: null, transcript: text });
          }
        }
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          stop("error", "Microphone or speech permission was denied.");
          if (onError) onError("Microphone or speech permission was denied; wake word stopped.");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          failures++;
          state("error", "Speech recognition error: " + e.error);
          if (onError) onError("Speech recognition error: " + e.error);
        }
      };
      rec.onend = () => {
        if (stopped) return;
        state(document.visibilityState === "hidden" ? "background" : "restarting");
        // Restart quickly after normal ends; back off when it keeps failing (e.g. offline).
        const delay = Math.min(30000, failures ? 1000 * 2 ** Math.min(failures, 5) : 250);
        restartTimer = setTimeout(begin, delay);
      };
      try {
        rec.start();
      } catch (e) {
        failures++;
        state("error", "Could not start speech recognition.");
        onError?.("Could not start speech recognition: " + e.message);
        restartTimer = setTimeout(begin, 1000);
      }
    }

    // No background microphone capture or implicit re-activation on return.
    const onVis = () => {
      if (document.visibilityState !== "visible") stop("paused", "Page hidden. Tap Start hands-free again to resume.");
    };
    const onLeave = () => stop("paused", "Page closed. Tap Start hands-free on the next visit.");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onLeave);
    begin();
    return { get running() { return !stopped; }, stop };
  }

  // Optional ready-made control. The explicit tap unlocks the audio cue and requests
  // microphone access. The agent still needs to listen for the resulting page event.
  function mount(target, { phrases = ["hey tendril"], lang, onCommand, readyCue = true,
                            wakeCue = true, commandTimeoutMs = 8000, cooldownMs = 2000 } = {}) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("Wake-word target not found.");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Start hands-free";
    button.setAttribute("aria-pressed", "false");
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = supported() ? `Tap to enable the microphone. Say “${phrases[0]}”.` : "Wake words are unavailable here. Use the microphone button or type instead.";
    host.append(button, status);
    if (!supported()) button.disabled = true;
    let session = null, audio = null, audioReady = Promise.resolve(), cued = false, active = false;
    const cue = (frequency) => {
      if (!audio) return;
      if (audio.state !== "running") {
        void audioReady.then(() => { if (active && audio?.state === "running") cue(frequency); });
        return;
      }
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = "sine"; osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.17);
      osc.connect(gain).connect(audio.destination);
      osc.start(); osc.stop(audio.currentTime + 0.18);
    };
    const route = async (text) => {
      status.textContent = `“${text}” — sending…`;
      try {
        if (onCommand) await onCommand(text);
        else {
          if (!window.tendril?.send) throw new Error("Tendriller is not available on this page.");
          const result = await window.tendril.send({ type: "utterance", text, via: "wakeword" }, { wake: true });
          if (result?.error) throw new Error(result.message || result.error.message || String(result.error));
        }
        status.textContent = `“${text}” — sent. Say “${phrases[0]}” for another command.`;
      } catch (e) { status.textContent = "Could not send: " + e.message; }
    };
    const onState = (name, detail) => {
      if (!active) return;
      if (name === "listening") {
        status.textContent = `Listening for “${phrases[0]}”.`;
        if (!cued && readyCue) { cue(660); cued = true; }
      } else if (name === "command") {
        status.textContent = "Ready for your command. Speak now.";
        if (wakeCue) cue(880);
      } else if (name === "paused" || name === "stopped") {
        active = false; cued = false;
        button.textContent = "Start hands-free";
        button.setAttribute("aria-pressed", "false");
        status.textContent = detail || "Hands-free off. Tap Start to resume.";
      }
      else if (name === "restarting" || name === "starting") status.textContent = "Reconnecting microphone…";
      else if (name === "error") status.textContent = detail;
    };
    button.addEventListener("click", () => {
      if (active) {
        active = false; session?.stop(); session = null;
        button.textContent = "Start hands-free";
        button.setAttribute("aria-pressed", "false");
        status.textContent = "Hands-free off.";
        return;
      }
      // Create/resume audio in the user's click before the async recognizer starts.
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio) { audio ||= new Audio(); audioReady = audio.resume().catch(() => {}); }
      } catch (e) { console.info("Wake-word audio cue unavailable", e); }
      active = true; cued = false;
      button.textContent = "Stop hands-free";
      button.setAttribute("aria-pressed", "true");
      session = start({ phrases, lang, commandTimeoutMs, cooldownMs, onCommand: route, onState,
        onError: (message) => {
          status.textContent = message;
          if (!session?.running) { active = false; button.textContent = "Start hands-free"; button.setAttribute("aria-pressed", "false"); }
        } });
    });
    return { button, status, stop() { if (active) button.click(); },
      destroy() { session?.stop(); active = false; button.remove(); status.remove(); void audio?.close(); } };
  }

  ns.wakeword = { supported, start, mount };
})();
