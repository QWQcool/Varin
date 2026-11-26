# Varin 宣传片

Remotion 工程，产出面向 B 站 Agent 用户的 Varin 宣传片（1920×1080 · 30 fps · 中文 · 无口播 · 1:29.5）。

```sh
npm install
npm run assets      # 从仓库、node_modules 和系统字体同步 public/ 素材
npm run chars       # 从 Q 版人设三视图裁出正面形象到 public/chars/
npm run dev         # Remotion Studio（VarinPromo 为全片）
npm run film        # 合成全片配乐并渲染 out/varin-promo.mp4 与 out/varin-promo-sfx-only.mp4
npm run sample      # 15 秒样片（带配乐 + 仅音效两版）
npm run keyframes   # 三张静态关键帧到 out/keyframes/
```

- 脚本：[docs/script.md](docs/script.md)；制作设计：[docs/design.md](docs/design.md)
- 时间轴：`src/film/timeline.ts`（全片）与 `src/sample/timeline.ts`（开场 15 秒），画面与配乐共用
- 场景：`src/film/scenes/`，一章一个组件；`src/film/Film.tsx` 按 `PRE` 让相邻章节重叠，每个边界都是承接而非硬切
- 相机与真实界面：`src/film/camera.ts`、`src/components/Screen.tsx`、`Cursor.tsx`、`Lattice.tsx`
- 视觉 tokens：`src/theme.ts`（全部取自产品主题与品牌 SVG）
- 配乐与音效：`scripts/synth/`，零依赖代码合成（`film.mjs` 全片、`sample15.mjs` 样片）
- `public/` 下的素材不入库，由 `scripts/sync-assets.mjs` 复制；Noto Sans SC 取自系统字体目录，
  其他系统可用 `NOTO_SANS_SC_PATH` 指定。
- Q 版人设源图在仓库外（默认 `D:/AIVideo/AI娘`，可用 `AI_CHARS_DIR` 指定）。
- 真实界面截图由 `tools/promo-capture` 采集，输出在被忽略的 `video-assets/`（`retake-v0.9.53` 与 `varin-native-ui-pack`）。

第三方 Agent 与模型厂商标志沿用产品内置资源及其许可说明
（`packages/ui/src/assets/harness-logos/README.md`），Q 版形象为粉丝向拟人设定，
均仅用于说明“可与之协作”，不代表背书。
