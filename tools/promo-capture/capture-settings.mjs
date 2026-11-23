#!/usr/bin/env node
/**
 * Captures the settings surfaces that changed after 0.9.48:
 * the full-page settings shell, the model service list and the
 * "add service" type picker.
 *
 * Requires a running Web Host (`bun run dev`).
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
const OUT = path.join(ROOT, '11d_settings_and_devices');
const CHROME = process.env.PROMO_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--lang=zh-CN', '--hide-scrollbars'],
});

const clickText = async (page, text, mode = 'exact') => {
  const ok = await page.evaluate((target, matchMode) => {
    const nodes = [...document.querySelectorAll('button, a, [role="button"]')];
    const norm = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim();
    const hit = nodes.find((el) => (matchMode === 'exact' ? norm(el) === target : norm(el).startsWith(target)));
    if (!hit) return false;
    hit.click();
    return true;
  }, text, mode);
  await sleep(1200);
  return ok;
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1110, height: 705, deviceScaleFactor: 2 });
  await page.goto(UI, { waitUntil: 'networkidle2', timeout: 120000 });
  await sleep(4500);

  const pwa = await page.$('button[data-button][data-cancel]');
  if (pwa) { await pwa.click(); await sleep(400); }

  const sessions = await page.$('button[aria-label="打开会话"]');
  if (sessions) { await sessions.click(); await sleep(600); }

  await page.evaluate(() => document.querySelector('button[data-varin-settings-origin]')?.click());
  await sleep(1800);
  await page.screenshot({ path: path.join(OUT, 'settings_root.png') });

  await clickText(page, '模型服务');
  await page.screenshot({ path: path.join(OUT, 'settings_model_service.png') });

  await clickText(page, '添加服务');
  await clickText(page, 'OpenAI compatible', 'prefix');
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, 'settings_model_add_service.png') });

  console.log(`captured settings surfaces -> ${OUT}`);
} finally {
  await browser.close();
}
