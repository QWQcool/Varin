#!/usr/bin/env node
/**
 * Captures the main Varin conversation home at the promo viewport
 * (1110x705 CSS, DPR 2 -> 2220x1410 PNG).
 *
 * Requires a running Web Host (`bun run dev`) and Chrome installed.
 * PROMO_UI  overrides the UI URL (default http://127.0.0.1:5180).
 * PROMO_OUT overrides the output root (default video-assets/promo-shots).
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
const OUT = path.join(ROOT, '01_home_composer_and_mentions');
const CHROME = process.env.PROMO_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1110, height: 705, deviceScaleFactor: 2 });
  await page.goto(UI, { waitUntil: 'networkidle2', timeout: 120000 });
  await sleep(4500);

  const pwa = await page.$('button[data-button][data-cancel]');
  if (pwa) { await pwa.click(); await sleep(500); }

  await page.screenshot({ path: path.join(OUT, 's0_empty.png') });

  await page.waitForSelector('[contenteditable="true"]', { timeout: 20000 });
  await page.click('[contenteditable="true"]');
  await page.keyboard.type('为 0.9.53 准备一段发布说明，面向已经在用 0.9.52 的用户。', { delay: 12 });
  await sleep(800);
  await page.screenshot({ path: path.join(OUT, 's3_prompt_filled.png') });

  console.log(`captured home composer -> ${OUT}`);
} finally {
  await browser.close();
}
