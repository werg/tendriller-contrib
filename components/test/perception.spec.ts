import { test, expect } from "@playwright/test";
import { load } from "./helpers";

// Experimental adapters receive explicit engines; tests never download executable code.
test.describe.configure({ timeout: 180_000 });

test("pose: angle() and repCounter() count squats from landmark sequences", async ({ page }) => {
  await load(page, "pose");
  const r = await page.evaluate(() => {
    const pose = (window as any).tendrilSnippets.pose;
    const right = pose.angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 });
    const straight = pose.angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 });
    // knee angle sweeps 170 → 80 → 170 twice
    const person = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return { landmarks: { left_hip: { x: 0.5, y: 0.4, visibility: 1 }, left_knee: { x: 0.5, y: 0.6, visibility: 1 }, left_ankle: { x: 0.5 + 0.2 * Math.sin(a), y: 0.6 - 0.2 * Math.cos(a), visibility: 1 } } };
    };
    const reps: number[] = [];
    const rc = pose.repCounter({ joint: "left_knee", low: 100, high: 160, onRep: (n: number) => reps.push(n) });
    for (const d of [170, 150, 120, 90, 80, 95, 130, 165, 170, 120, 85, 140, 168]) rc.update(person(d));
    rc.update({ landmarks: { ...person(80).landmarks, left_knee: { x: 0.5, y: 0.6, visibility: 0.1 } } }); // ignored
    return { right, straight, reps, count: rc.count, names: pose.NAMES.length, supported: pose.supported() };
  });
  expect(r.right).toBeCloseTo(90, 5);
  expect(r.straight).toBeCloseTo(180, 5);
  expect(r.reps).toEqual([1, 2]);
  expect(r.count).toBe(2);
  expect(r.names).toBe(33);
  expect(r.supported).toBe(true);
});

test("pose: accepts an explicit engine and local files", async ({ page }) => {
  await load(page, "pose");
  const r = await page.evaluate(async () => {
    const c = Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
    const g = c.getContext("2d")!;
    g.fillStyle = "#88a"; g.fillRect(0, 0, 256, 256);
    const img = new Image();
    img.src = c.toDataURL();
    await img.decode();
    const pose=(window as any).tendrilSnippets.pose;
    await pose.load({engine:{PoseLandmarker:{createFromOptions:async()=>({detect:()=>({landmarks:[]})})}},files:{},model:"assets/model.task"},"IMAGE");
    const people = await pose.detect(img);
    return Array.isArray(people);
  });
  expect(r).toBe(true);
});

test("objects: accepts an explicit detector and returns normalized results", async ({ page }) => {
  await load(page, "objects");
  const r = await page.evaluate(async () => {
    const o = (window as any).tendrilSnippets.objects;
    const c = Object.assign(document.createElement("canvas"), { width: 320, height: 240 });
    c.getContext("2d")!.fillRect(0, 0, 320, 240);
    await o.load({engine:{ObjectDetector:{createFromOptions:async()=>({detect:()=>({detections:[{categories:[{categoryName:"cup",score:.8}],boundingBox:{originX:32,originY:48,width:96,height:96}}]})})}},files:{},model:"assets/model.tflite"},"IMAGE");
    const found = await o.detect(c, { minScore: 0 });
    const shapes = o.toOverlay([{ label: "cup", score: 0.8, box: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 } }]);
    return { ok: Array.isArray(found), inRange: found.every((f: any) => f.box.x >= -0.01 && f.box.x <= 1.01 && typeof f.label === "string"), shapes };
  });
  expect(r.ok).toBe(true);
  expect(r.inRange).toBe(true);
  expect(r.shapes).toEqual([{ shape: "box", x: 0.1, y: 0.2, w: 0.3, h: 0.4, text: "cup 80%", color: undefined }]);
});

test("text: accepts an explicit local worker factory", async ({ page }) => {
  await load(page, "text");
  const r = await page.evaluate(async () => {
    const c = Object.assign(document.createElement("canvas"), { width: 640, height: 160 });
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff"; g.fillRect(0, 0, 640, 160);
    g.fillStyle = "#000"; g.font = "bold 64px sans-serif"; g.fillText("HELLO 42", 40, 105);
    const text=(window as any).tendrilSnippets.text;
    text.configure({createWorker:async()=>({recognize:async()=>({data:{text:"HELLO 42",confidence:95,blocks:[{paragraphs:[{lines:[{text:"HELLO 42",bbox:{x0:40,y0:42,x1:350,y1:106}}]}]}]}}),terminate:async()=>{}})});
    return await text.recognize(c,{engine:"tesseract"});
  });
  expect(r.text.replace(/\s+/g, " ")).toContain("HELLO 42");
  expect(["native", "tesseract"]).toContain(r.engine);
  expect(r.lines.length).toBeGreaterThan(0);
  expect(r.lines[0].box.x).toBeGreaterThan(0);
  expect(r.lines[0].box.x).toBeLessThan(0.2);
});
