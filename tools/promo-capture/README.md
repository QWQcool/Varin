# Promo capture

Deterministic screenshots of the running product for product videos and the
marketing surface. Captures use the promo viewport: **1110×705 CSS at DPR 2**,
so every PNG is 2220×1410 and can be compared against the existing
`varin-native-ui-pack` frames.

These tools are local capture aids, not product code. They talk to a running
Host over HTTP and over the UI only; no Host or kernel code is bypassed.

## Setup

```sh
bun install --frozen-lockfile
bun run kernel:build      # the Host refuses a kernel with a stale build identity
bun run dev               # starts the Web Host (UI on :5180, API on :3900+)
```

`capture-*.mjs` drive Chrome through `puppeteer-core` from `packages/electron`.
Set `PROMO_CHROME` if Chrome is not at the default Windows path, and
`PROMO_UI` / `PROMO_OUT` to point at a different Host or output root.

## Deterministic model responses

`fake-model-server.mjs` serves an OpenAI-compatible surface
(`GET /v1/models`, `POST /v1/chat/completions` as SSE, `POST /responses`) so a
real Host run can be driven without a paid provider and without flushing
credentials.

```sh
FAKE_MODEL_SCENARIO=ask  node tools/promo-capture/fake-model-server.mjs   # ask_user question card
FAKE_MODEL_SCENARIO=work node tools/promo-capture/fake-model-server.mjs   # one tool call, then final text
```

Register it once in **Settings → 模型 / Model services → 添加服务 → OpenAI compatible**:

| Field | Value |
| --- | --- |
| 名称 | Fixture Model |
| 接口地址 | `http://127.0.0.1:4199/v1` |
| API 密钥 | any non-empty string (the fixture does not validate it) |

Then use 连接并获取模型, tick `fixture-model`, and save. The Host keeps this
connection, so captures can be repeated without re-registering.

## Scenes

| Script | Scene | Notes |
| --- | --- | --- |
| `capture-home.mjs` | 01 home composer | Empty composer and a filled prompt. `@` / `/` suggestion panels need real workspace files or registered commands; a bare Host has no candidates, so those frames are not produced. |
| `capture-settings.mjs` | 11d settings | Full-page settings shell, model service list, add-service picker. |
| `capture-question.mjs` | 02 question card | Idle, option hover, option selected. Answering the card from the UI was not reliable under CDP; answer through the app or the thread HTTP API when a post-answer state is needed. |

Output defaults to `video-assets/promo-shots/<scene>/`, which is ignored by Git.
Curated frames are meant to be copied out; the raw capture root is not committed.

## Known gaps

- Completed-work collapse (`工作过程`) needs a finished run with at least one tool
  call. `FAKE_MODEL_SCENARIO=work` provides it, but the second turn can stall in
  `准备请求` when the thread has an unresolved question from an earlier run —
  answer or cancel pending questions first.
- Tool loops are avoided by checking for tool results (`role: "tool"`,
  `function_call_output`) rather than string matching request bodies.
