# Varin 宣传片

Remotion 工程，产出面向 B 站 Agent 用户的 Varin 宣传片（1920×1080 · 30 fps · 中文 · 无口播）。

```sh
npm install
npm run assets      # 从仓库、node_modules 和系统字体同步 public/ 素材
npm run dev         # Remotion Studio
npm run keyframes   # 渲染三张静态关键帧到 out/keyframes/
```

- 脚本与关键帧：[docs/script.md](docs/script.md)
- 视觉 tokens：`src/theme.ts`（全部取自产品主题与品牌 SVG）
- `public/` 下的素材不入库，由 `scripts/sync-assets.mjs` 复制；Noto Sans SC 取自系统字体目录，
  其他系统可用 `NOTO_SANS_SC_PATH` 指定。
- 真实界面截图由 `tools/promo-capture` 采集，输出在被忽略的 `video-assets/`。

第三方 Agent 与模型厂商标志沿用产品内置资源及其许可说明
（`packages/ui/src/assets/harness-logos/README.md`），仅用于说明“可与之协作”，不代表背书。
