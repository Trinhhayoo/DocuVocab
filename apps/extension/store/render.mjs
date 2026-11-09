// Renders the extension icons and the Chrome Web Store graphics with a local Chrome.
// Set CHROME_PATH when Chrome is not in the default macOS location.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const BLUE = "#2563eb";
const BLUE_DARK = "#1e40af";
const HIGHLIGHT = "#fef08a";

const storeDir = fileURLToPath(new URL(".", import.meta.url));
const iconDir = fileURLToPath(new URL("../public/icon/", import.meta.url));
const outputDir = join(storeDir, "output");
const rawScreenshotDir = join(storeDir, "screenshots");
const workDir = mkdtempSync(join(tmpdir(), "docuvocab-store-"));

// Shown above each screenshot, in file name order (1.png, 2.png, ...).
const SCREENSHOT_CAPTIONS = [
  "Words you've saved are highlighted on every page",
  "Hover a word to see its meaning in Vietnamese and English",
  "Select any word or phrase to save it with its sentence",
  "Check your word count and settings from the toolbar",
  "Learn vocabulary while you read",
];

/** The web app's open-book logo, with one line marked in the highlight color. */
function iconSvg(size) {
  // The store icon keeps transparent padding around the artwork; toolbar icons fill their square.
  const inset = size === 128 ? 8 : 0;
  const box = 128 - inset * 2;
  // Thicker lines keep the book readable at toolbar sizes.
  const stroke = size <= 32 ? 2.6 : 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <rect x="${inset}" y="${inset}" width="${box}" height="${box}" rx="${box * 0.22}" fill="${BLUE}"/>
  <g transform="translate(${64 - 12 * 3.6} ${66 - 12 * 3.6}) scale(3.6)" fill="none" stroke="#fff"
     stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 7v14"/>
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
    ${size > 32 ? `<path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 12h2"/>` : ""}
    <path d="M15.5 8h3" stroke="${HIGHLIGHT}" stroke-width="${stroke * 1.4}"/>
  </g>
</svg>`;
}

const page = (width, height, body, css = "") => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #fff;
    background: linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%); }
  mark { background: ${HIGHLIGHT}; color: #1e293b; border-radius: 0.2em; padding: 0 0.15em; }
  ${css}
</style></head><body>${body}</body></html>`;

function promoTile(width, height) {
  const scale = height / 280;
  const tooltip =
    width > 440
      ? `<div class="tooltip">
      <div class="word">ubiquitous</div>
      <div class="line"><b>VI</b> có mặt ở khắp nơi, phổ biến</div>
      <div class="line"><b>EN</b> present or found everywhere</div>
    </div>`
      : "";
  return page(
    width,
    height,
    `<div class="wrap">
    ${iconSvg(128)}
    <div>
      <h1>Doc Dictionary</h1>
      <p class="tagline">Learn vocabulary while you read</p>
      <p class="sample">Smartphones are now <mark>ubiquitous</mark>.</p>
    </div>
    ${tooltip}
  </div>`,
    `.wrap { height: 100%; display: flex; align-items: center; gap: ${28 * scale}px; padding: 0 ${36 * scale}px; }
    svg { width: ${120 * scale}px; height: ${120 * scale}px; flex: none;
      filter: drop-shadow(0 ${6 * scale}px ${14 * scale}px rgb(0 0 0 / 0.35)); }
    h1 { font-size: ${32 * scale}px; font-weight: 800; letter-spacing: -0.02em; white-space: nowrap; }
    .tagline { font-size: ${16 * scale}px; opacity: 0.9; margin-top: ${4 * scale}px; white-space: nowrap; }
    .sample { display: inline-block; margin-top: ${16 * scale}px; font-size: ${15 * scale}px; color: #1e293b;
      background: #fff; border-radius: ${10 * scale}px; padding: ${8 * scale}px ${14 * scale}px; }
    .tooltip { margin-left: auto; width: 460px; flex: none; background: #fff; color: #1e293b; border-radius: 16px;
      padding: 24px 28px; box-shadow: 0 20px 50px rgb(0 0 0 / 0.3); font-size: 22px; line-height: 1.5; }
    .tooltip .word { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .tooltip b { display: inline-block; width: 40px; color: ${BLUE}; }`,
  );
}

function framedScreenshot(file, caption) {
  return page(
    1280,
    800,
    `<h1>${caption}</h1><div class="shot"><img src="${pathToFileURL(file)}"></div>`,
    `body { display: flex; flex-direction: column; align-items: center; padding: 44px 64px 0; }
    h1 { font-size: 40px; font-weight: 700; letter-spacing: -0.01em; text-align: center; }
    .shot { flex: 1; min-height: 0; width: 100%; display: flex; justify-content: center; align-items: center; padding: 36px 0 48px; }
    img { max-width: 100%; max-height: 100%; border-radius: 12px; box-shadow: 0 24px 60px rgb(0 0 0 / 0.35); }`,
  );
}

function render(name, html, width, height, output) {
  const source = join(workDir, `${name}.html`);
  writeFileSync(source, html);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    "--default-background-color=00000000",
    `--window-size=${width},${height}`,
    `--screenshot=${output}`,
    pathToFileURL(source).href,
  ], { stdio: "ignore" });
  console.log(`  ${output}`);
}

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH to its executable.`);
  process.exit(1);
}
mkdirSync(outputDir, { recursive: true });

console.log("Icons:");
for (const size of [16, 32, 48, 128]) {
  const svg = `<!doctype html><style>html,body{margin:0;background:transparent}</style>${iconSvg(size)}`;
  render(`icon-${size}`, svg, size, size, join(iconDir, `${size}.png`));
}

console.log("Promo tiles:");
render("promo-small", promoTile(440, 280), 440, 280, join(outputDir, "promo-small-440x280.png"));
render("promo-marquee", promoTile(1400, 560), 1400, 560, join(outputDir, "promo-marquee-1400x560.png"));

const rawScreenshots = existsSync(rawScreenshotDir)
  ? readdirSync(rawScreenshotDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
console.log(rawScreenshots.length ? "Screenshots:" : `No screenshots found in ${rawScreenshotDir}`);
rawScreenshots.slice(0, 5).forEach((name, index) => {
  render(
    `screenshot-${index + 1}`,
    framedScreenshot(join(rawScreenshotDir, name), SCREENSHOT_CAPTIONS[index]),
    1280,
    800,
    join(outputDir, `screenshot-${index + 1}-1280x800.png`),
  );
});
