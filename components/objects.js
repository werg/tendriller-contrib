/* Tendriller snippet: objects.js — on-device object detection (MediaPipe Object Detector, COCO labels).
 *
 *   <script src="assets/components/objects.js"></script>
 *   <script>
 *     const objects = tendrilSnippets.objects;
 *     const found = await objects.detect(document.querySelector("img"));
 *     // → [{label:"cup", score:0.82, box:{x:0.41, y:0.30, w:0.12, h:0.18}}]   (0..1 of the frame)
 *
 *     // Watch a camera and tell the agent only when the set of things in view changes:
 *     const run = await objects.start(cam.video, { fps: 2, minScore: 0.5,
 *       onChange: (labels, found) => tendril.send({ type: "seen", labels }, { wake: false }) });
 *     // Draw them with overlay.js:  ov.draw(objects.toOverlay(found))
 *   </script>
 *
 * detect(source, {minScore=0.4, maxResults=10}) on an <img>, <video> or <canvas>.
 * start(video, {fps=2, minScore, onResult(found), onChange(labels, found)}) → {stop()}
 * The model and engine must be supplied with load({engine, files, model}); all
 * engine, worker, WASM and model files must be declared in the page publication.
 */
(() => {
  const ns = (window.tendrilSnippets = window.tendrilSnippets || {});

  const supported = () => typeof WebAssembly === "object" && !!document.createElement("canvas").getContext;

  let lib = null, opts = { model: "efficientdet_lite0", delegate: "GPU" };
  const tasks = {};

  async function create(runningMode) {
    if (!opts.engine || !opts.files || !opts.model) throw Error("Configure objects.load({engine, files, model}) with a declared local asset set before using this component.");
    lib ||= Promise.resolve(opts.engine);
    const { FilesetResolver, ObjectDetector } = await lib;
    const files = opts.files;
    const make = (delegate) => ObjectDetector.createFromOptions(files, {
      baseOptions: { modelAssetPath: opts.model, delegate }, runningMode, scoreThreshold: 0.2, maxResults: 25,
    });
    try {
      return await make(opts.delegate);
    } catch (e) {
      if (opts.delegate === "CPU") throw e;
      return make("CPU");
    }
  }
  function load(o = {}, mode = "VIDEO") {
    opts = { ...opts, ...o };
    return (tasks[mode] ||= create(mode).catch((e) => { delete tasks[mode]; throw e; }));
  }

  const size = (s) => s instanceof HTMLVideoElement ? [s.videoWidth, s.videoHeight]
    : s instanceof HTMLImageElement ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height];

  let lastTs = 0;
  async function detect(source, { minScore = 0.4, maxResults = 10 } = {}) {
    const video = source instanceof HTMLVideoElement;
    const det = await load({}, video ? "VIDEO" : "IMAGE");
    const ts = Math.max(performance.now(), lastTs + 1);
    lastTs = ts;
    const r = video ? det.detectForVideo(source, ts) : det.detect(source);
    const [W, H] = size(source);
    return (r.detections || [])
      .map((d) => {
        const c = d.categories[0] || {}, b = d.boundingBox || { originX: 0, originY: 0, width: 0, height: 0 };
        return { label: c.categoryName || c.displayName || "object", score: Math.round((c.score || 0) * 100) / 100,
          box: { x: b.originX / W, y: b.originY / H, w: b.width / W, h: b.height / H } };
      })
      .filter((d) => d.score >= minScore)
      .slice(0, maxResults);
  }

  async function start(video, { fps = 2, minScore = 0.5, onResult, onChange, onError } = {}) {
    await load();
    let stopped = false, timer = null, lastKey = null;
    const loop = async () => {
      if (stopped) return;
      try {
        if (video.readyState >= 2) {
          const found = await detect(video, { minScore });
          if (onResult) onResult(found);
          const labels = [...new Set(found.map((f) => f.label))].sort();
          if (labels.join() !== lastKey) { lastKey = labels.join(); if (onChange) onChange(labels, found); }
        }
      } catch (e) {
        onError ? onError(e) : console.warn("objects:", e);
      }
      timer = setTimeout(loop, 1000 / fps);
    };
    loop();
    return { stop() { stopped = true; clearTimeout(timer); } };
  }

  /** Convert detections to overlay.js shapes (boxes with labels). */
  const toOverlay = (found, color) => found.map((f) => ({ shape: "box", x: f.box.x, y: f.box.y, w: f.box.w, h: f.box.h, text: `${f.label} ${Math.round(f.score * 100)}%`, color }));

  ns.objects = { supported, load, detect, start, toOverlay };
})();
