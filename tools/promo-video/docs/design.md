# 制作设计说明

对应 [script.md](script.md) 的 V2 全片制作方案。15 秒样片（脚本 0:00–0:15）验证了单一时间轴和节拍网格，全片开场直接复用它。

## 成片自检

| 项 | 结果 |
| --- | --- |
| 时长 / 规格 | 2685 帧 = 1:29.5，1920×1080 · 30fps · H.264 + AAC 48kHz 320k |
| 响度 | 带配乐 -15.3 LUFS、仅音效 -17.7 LUFS，真峰值约 -0.8 dBFS |
| 三处冲击 | 12s、54s、82s；12s 与 82s 前各有 0.5 秒纯数字静音（首尾呼应） |
| 转场 | 逐个边界抽帧检查：标志重合、甩镜、两次圆形转场、地板掉落、同镜头延续、钻屏、头像展开均无裸切 |

## 方法

| 方法 | 做法 |
| --- | --- |
| 单一时间轴 | `src/film/timeline.ts` 的 `S`（章节边界）、`PRE`（转场提前量）、`C`（章节内节拍）同时驱动画面和 `scripts/synth/film.mjs` |
| 承接而非切换 | 场景可在边界前 `PRE` 帧开始渲染；`useSceneFrame()` 返回相对边界的帧号（提前段为负）。`Film.tsx` 按承接方向决定上下层 |
| 相机 | `src/film/camera.ts`：关键帧相机（对数插值缩放，follow / whip / snap 三种曲线）；真实截图用 `Screen` 放进世界坐标，叠加层用截图像素坐标，任何缩放下都贴着界面 |
| 真实输入 | `Cursor` 在屏幕坐标绘制光标或手指，路径按世界坐标写，随相机换算；每次点击带按压和波纹 |
| 标题 | `Title`：深色标题卡逐行砸入，停两小节后折成小标签，不再占半屏 |
| 产品转场 | `Lattice` 按 `packages/ui/src/components/ui/workbench-lattice.ts` 的格子尺寸、错峰和时长重画晶格 |

## 工程结构

```
src/
  theme.ts            产品色、字体、缓动
  components/         Screen、Cursor、Lattice、TerminalWindow、Chibi …
  sample/             15 秒样片（冷开场 + 揭示），全片开场直接复用
  film/               timeline.ts、camera.ts、scene.tsx、motion.ts、Title.tsx、Film.tsx、scenes/
scripts/
  sync-assets.mjs     素材同步（不入库），含 retake-v0.9.53 与 varin-native-ui-pack 的实拍
  crop-chars.mjs      从 Q 版三视图裁出正面形象
  synth/              DSP 库 + sample15.mjs（样片）+ film.mjs（全片）
```

## 配乐系统

所有声音都由代码合成（`scripts/synth/film.mjs`），没有外部音频文件。

| 段落 | 时间 | 和声 | 乐器 |
| --- | --- | --- | --- |
| 前奏 | 0–12s | Am → F → E | 暗 pad、滴答、hi-hat、riser，末拍静音 |
| 主题 A | 12–43.4s | Am – F – C – G | 四拍底鼓、贝斯、拨弦琶音；16s 起 clap，28s 起主旋律 |
| 下坠 / 断电 / 回归 | 43.4–54s | Dm – Am – E | 下坠扫频 → 半拍心跳 → 全停 → 上电、底鼓与军鼓滚奏 |
| 主题 B | 54–70s | Am – F – C – G | clap + 主旋律 |
| Bot 段 | 70–78s | Am – F – C – G + F – G – Em – Am 铃音 | 律动不退，铃音琶音 |
| 终章 | 78–89.5s | F – E → Am(add9) | 军鼓滚奏 + riser → 静音半拍 → 最终和弦衰减 |

拟音规则：画面里发生什么动作就配什么声音（打字配键盘、点击配机械 click、落位配木质 tick、标题落下配低音落点、晶格配细碎颗粒），不用游戏提示音。

## 交付物

- `out/varin-promo.mp4`：带配乐版
- `out/varin-promo-sfx-only.mp4`：仅音效版（同一视频流换音轨）

## 复现

```sh
npm install && npm run assets
npm run film        # 合成配乐 + 渲染两版成片到 out/
npm run dev         # Studio 预览
```
