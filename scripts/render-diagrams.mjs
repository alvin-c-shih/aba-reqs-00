// Render docs/architecture/diagrams/*.svg to PNG (for slides and visual checks).
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";
const dir = new URL("../docs/architecture/diagrams/", import.meta.url).pathname;
let browser; try { browser = await chromium.launch({ channel: "chrome" }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const f of readdirSync(dir).filter(f => f.endsWith(".svg"))) {
  await page.setContent(`<body style="margin:0">${readFileSync(dir + f, "utf8")}</body>`);
  await page.locator("svg").screenshot({ path: dir + f.replace(".svg", ".png") });
  console.log("rendered", f);
}
await browser.close();
