#!/usr/bin/env node
/**
 * Copies every asset the video reads from `public/` out of its source of truth,
 * so the repository only tracks source code. Run after cloning or after the
 * product's own assets change: `npm run assets`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(project, "../..");
const pub = path.join(project, "public");

const copies = [
  ["node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "fonts/Inter-Variable.woff2", project],
  ["node_modules/@fontsource-variable/inter/LICENSE", "fonts/Inter-LICENSE.txt", project],
  ["packages/web/public/logo-light-512x512.svg", "brand/logo-light.svg"],
  ["packages/web/public/logo-dark-512x512.svg", "brand/logo-dark.svg"],
  [".github/readme/assets/varin-cast-dark.webp", "cast/varin-cast-dark.webp"],
  [".github/readme/assets/varin-cast-light.webp", "cast/varin-cast-light.webp"],
  [".github/readme/assets/varin-zh-CN.png", "ui/readme-varin-zh.png"],
  [".github/readme/assets/workbench-zh-CN.png", "ui/readme-workbench-zh.png"],
  [".github/readme/assets/ide-zh-CN.png", "ui/readme-ide-zh.png"],
  [".github/readme/assets/conversation-choices-zh-CN.png", "ui/readme-choices-zh.png"],
  ...["codex.svg", "deepseek-harness.svg", "pi.svg", "opencode.svg", "gemini.png", "kimi.png", "cursor.svg", "qoder.svg", "grok.svg"].map(
    (name) => [`packages/ui/src/assets/harness-logos/${name}`, `logos/${name}`],
  ),
  ...["claude.svg", "deepseek.svg", "openai.svg", "qwen.svg", "ollama.svg", "zhipuai-coding-plan.svg", "google.svg", "kimi-for-coding.svg", "openrouter.svg", "anthropic.svg"].map(
    (name) => [`packages/ui/src/assets/provider-logos/${name}`, `logos/provider-${name}`],
  ),
  ...["claude", "deepseek", "gemini", "glm", "gpt", "grok", "jev", "kimi", "llama", "minimax", "mistral", "perplexity", "qwen", "seed", "wenxin"].map(
    (name) => [`packages/ui/src/workbenches/bot/figurePresets/${name}.webp`, `bots/${name}.webp`],
  ),
  ["packages/web/public/companion-previews/varin.png", "bots/varin.png"],
  ...[
    ["02_agent_question_and_collaboration/s3_question_option_selected.png", "ui/question-selected.png"],
    ["02_agent_question_and_collaboration/s1_question_card_idle.png", "ui/question-idle.png"],
    ["03_completed_work/s0_collapsed.png", "ui/completed-collapsed.png"],
    ["11d_settings_and_devices/settings_root.png", "ui/settings-devices.png"],
  ].map(([from, to]) => [`video-assets/retake-v0.9.53/${from}`, to, repo, true]),
];

const missing = [];
for (const [from, to, base = repo, optional = false] of copies) {
  const source = path.join(base, from);
  const target = path.join(pub, to);
  if (!fs.existsSync(source)) {
    if (!optional) missing.push(from);
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// The Claude mark ships as `currentColor`; the video needs fixed light/dark variants.
const claude = path.join(pub, "logos/provider-claude.svg");
if (fs.existsSync(claude)) {
  const svg = fs.readFileSync(claude, "utf8");
  fs.writeFileSync(path.join(pub, "logos/claude-orange.svg"), svg.replace('fill="currentColor"', 'fill="#D97757"'));
  fs.writeFileSync(path.join(pub, "logos/claude-white.svg"), svg.replace('fill="currentColor"', 'fill="#F1EFE8"'));
}

// Noto Sans SC (OFL) is large; take it from the system font folder instead of committing it.
const noto = path.join(pub, "fonts/NotoSansSC-VF.ttf");
const notoCandidates = [
  process.env.NOTO_SANS_SC_PATH,
  "C:/Windows/Fonts/NotoSansSC-VF.ttf",
  "/usr/share/fonts/opentype/noto/NotoSansSC-VF.ttf",
].filter(Boolean);
const notoSource = notoCandidates.find((candidate) => fs.existsSync(candidate));
if (notoSource) fs.copyFileSync(notoSource, noto);
else if (!fs.existsSync(noto)) missing.push("NotoSansSC-VF.ttf (set NOTO_SANS_SC_PATH)");

if (missing.length) {
  console.error(`Missing assets:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(`Assets ready in ${path.relative(repo, pub)}`);
