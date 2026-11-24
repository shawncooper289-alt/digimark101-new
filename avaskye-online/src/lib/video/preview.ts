import { escapeHtml } from "./text"
import type { VideoProject } from "./types"

export function previewDraftHtml(project: VideoProject) {
  const ratio = project.brief.aspect === "9:16" ? "9 / 16" : project.brief.aspect === "1:1" ? "1 / 1" : "16 / 9"
  const width = project.brief.aspect === "9:16" ? 360 : project.brief.aspect === "1:1" ? 480 : 640
  const scenes = project.scenes.map((scene) => ({
    caption: scene.caption,
    visual: scene.visual,
    camera: scene.camera,
    start: scene.startMs,
    end: scene.endMs,
  }))
  const logo = project.brief.brand.logoUrl
    ? `<img alt="" src="${escapeHtml(project.brief.brand.logoUrl)}" />`
    : ""
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(project.title)} — preview draft</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b0d0e; color: #eae4d7; font-family: Georgia, serif; }
  .banner { position: sticky; top: 0; z-index: 2; background: #cbb082; color: #14110c; text-align: center; font-family: "Segoe UI", sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; padding: 10px 16px; }
  main { display: grid; place-items: center; min-height: calc(100vh - 42px); padding: 24px; }
  .stage { width: min(${width}px, 100%); aspect-ratio: ${ratio}; background: ${escapeHtml(project.brief.brand.primary)}; border: 1px solid rgba(234,228,215,0.2); position: relative; overflow: hidden; }
  .stage img { position: absolute; top: 16px; left: 16px; height: 36px; width: auto; }
  .scene { position: absolute; inset: 0; display: grid; align-content: end; padding: 28px; opacity: 0; }
  .scene.on { opacity: 1; animation: drift 8s ease-in-out infinite alternate; }
  .kicker { font-family: "Segoe UI", sans-serif; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: ${escapeHtml(project.brief.brand.accent)}; }
  h1 { font-size: 28px; line-height: 1.15; margin: 8px 0; }
  p { font-family: "Segoe UI", sans-serif; font-size: 16px; line-height: 1.4; margin: 0; }
  @keyframes drift { from { transform: scale(1); } to { transform: scale(1.04) translate3d(-1%, -1%, 0); } }
</style>
</head>
<body>
  <div class="banner">PREVIEW DRAFT. This is not a finished video. It is not lip-synced.</div>
  <main>
    <div class="stage" id="stage">
      ${logo}
      <div class="scene on" id="card">
        <div class="kicker">Preview draft</div>
        <h1 id="caption"></h1>
        <p id="visual"></p>
      </div>
    </div>
  </main>
  <script>
    const scenes = ${JSON.stringify(scenes).replace(/</g, "\\u003c")};
    const caption = document.getElementById("caption");
    const visual = document.getElementById("visual");
    let index = 0;
    function show(next) {
      const scene = scenes[next];
      if (!scene) return;
      caption.textContent = scene.caption;
      visual.textContent = scene.visual + " " + scene.camera;
    }
    function tick() {
      show(index);
      const scene = scenes[index];
      const wait = Math.max(800, (scene?.end || 0) - (scene?.start || 0));
      index = (index + 1) % scenes.length;
      setTimeout(tick, wait);
    }
    if (scenes.length) tick();
  </script>
</body>
</html>`
}

export function previewFileName(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "video"
  return `${slug}-preview-draft.html`
}
