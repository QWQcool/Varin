#!/usr/bin/env node
/**
 * Captures the agent question card states (idle / option hover / option selected).
 *
 * Requires:
 *   1. `bun run dev` Web Host running
 *   2. `FAKE_MODEL_SCENARIO=ask node tools/promo-capture/fake-model-server.mjs`
 *   3. A model service pointing at http://127.0.0.1:4199/v1 (see README)
 *
 * PROMO_UI / PROMO_OUT / PROMO_CHROME override defaults.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(repoRoot, 'packages/electron/package.json'));
const puppeteer = require('puppeteer-core');

const UI = process.env.PROMO_UI || 'http://127.0.0.1:5180';
const ROOT = process.env.PROMO_OUT || path.join(repoRoot, 'video-assets/promo-shots');
const OUT = path.join(ROOT, '02_agent_question_and_collaboration');
const CHROME = process.env.PROMO_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROMPT = process.env.PROMO_PROMPT || '帮我为 0.9.53 写一段发布说明，先确认口吻再动笔。';

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN', '--hide-scrollbars'],
});

const rowCenter = (page, text) => page.evaluate((target) => {
  const leaf = [...document.querySelectorAll('*')]
    .find((node) => node.children.length === 0 && (node.textContent || '').trim() === target);
  const row = leaf?.closest('label, [role="radio"], div');
  if (!row) return null;
  const rect = row.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}, text);

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1110, height: 705, deviceScaleFactor: 2 });
  await page.goto(UI, { waitUntil: 'networkidle2', timeout: 120000 });
  await sleep(4500);

  const pwa = await page.$('button[data-button][data-cancel]');
  if (pwa) { await pwa.click(); await sleep(400); }

  await page.waitForSelector('[contenteditable="true"]', { timeout: 20000 });
  await page.click('[contenteditable="true"]');
  await page.keyboard.type(PROMPT, { delay: 10 });
  await sleep(500);
  await page.click('button[aria-label="发送消息"]');

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(1200);
    const text = await page.evaluate(() => document.body.innerText || '');
    if (text.includes('这次发布说明要按')) break;
  }
  await page.screenshot({ path: path.join(OUT, 's1_question_card_idle.png') });

  const hoverBox = await rowCenter(page, '内测用户，强调新能力');
  if (hoverBox) {
    await page.mouse.move(hoverBox.x, hoverBox.y);
    await sleep(700);
    await page.screenshot({ path: path.join(OUT, 's2_question_option_hover.png') });
  }

  const pickBox = await rowCenter(page, '两版都覆盖，分区说明');
  if (pickBox) { await page.mouse.click(pickBox.x, pickBox.y); await sleep(700); }
  await page.screenshot({ path: path.join(OUT, 's3_question_option_selected.png') });

  console.log(`captured question card states -> ${OUT}`);
} finally {
  await browser.close();
}
