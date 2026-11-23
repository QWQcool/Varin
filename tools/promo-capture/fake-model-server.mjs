import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.FAKE_MODEL_PORT || 4199);
const SCENARIO = process.env.FAKE_MODEL_SCENARIO || 'ask';
const LOG = process.env.FAKE_MODEL_LOG || '';

let call = 0;
const requests = [];

const log = (...args) => { if (LOG) console.log(new Date().toISOString(), ...args); };

const toolCall = (name, args) => ({
  id: `item-${crypto.randomUUID()}`,
  type: 'function_call',
  call_id: `call-${crypto.randomUUID()}`,
  name,
  arguments: JSON.stringify(args),
});

const message = (text) => ({
  id: `item-${crypto.randomUUID()}`,
  type: 'message',
  content: [{ type: 'output_text', text }],
});

const ASK_PAYLOAD = {
  questions: [{
    id: 'release-channel',
    question: '这次发布说明要按哪个渠道的口吻来写？',
    options: [
      { id: 'beta', label: '内测用户，强调新能力' },
      { id: 'stable', label: '稳定版用户，强调兼容与修复' },
      { id: 'both', label: '两版都覆盖，分区说明' },
    ],
  }],
};

const FINAL_TEXT = [
  '## Varin 0.9.53 发布说明',
  '',
  '面向 0.9.52 用户，这次更新集中在阅读体验和执行可靠性。',
  '',
  '**对话更清爽**：一轮结束后自动收起工作过程，最终回复留在原位，需要细节时再展开。',
  '',
  '**草稿不再丢失**：刷新后未发送的文字和引用会恢复，发送成功后自动清除。',
  '',
  '**方案可以预览**：选方案前先看正文，选中后完整填入输入框继续编辑。',
  '',
  '**文件与项目更稳**：恢复后的文件读取当前内容，中断的恢复可以接续，项目备注可直接从会话打开。',
].join('\n');

const scenarioOutput = (hasToolResult) => {
  if (SCENARIO === 'ask') {
    return hasToolResult ? [message(FINAL_TEXT)] : [toolCall('ask_user', ASK_PAYLOAD)];
  }
  if (SCENARIO === 'work') {
    if (!hasToolResult) {
      return [
        toolCall('file_list', { path: '.' }),
        message('先看一下目录结构。'),
      ];
    }
    return [message(FINAL_TEXT)];
  }
  return [message(FINAL_TEXT)];
};

const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (b) => chunks.push(b));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString() || '{}';
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
    resolve(parsed);
  });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && (path === '/v1/models' || path === '/models')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [{ id: 'fixture-model', object: 'model', owned_by: 'fixture', created: 1700000000 }],
    }));
    return;
  }

  if (req.method === 'POST' && (path === '/responses' || path === '/v1/responses')) {
    const body = await readBody(req);
    call += 1;
    requests.push({ protocol: 'responses', call });
    log('responses call', call, 'tools', Array.isArray(body.tools) ? body.tools.length : 0);
    const output = scenarioOutput(JSON.stringify(body.input ?? body.messages ?? []).includes('function_call_output'));
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    res.end(`data: ${JSON.stringify({ type: 'response.completed', response: { id: `resp-${call}`, output } })}\n\n`);
    return;
  }

  if (req.method === 'POST' && (path === '/chat/completions' || path === '/v1/chat/completions')) {
    const body = await readBody(req);
    call += 1;
    requests.push({ protocol: 'chat', call });
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const hasToolOutput = messages.some((m) => m && (m.role === 'tool' || m.role === 'function'))
      || JSON.stringify(messages).includes('tool_call_id');
    const outputs = scenarioOutput(hasToolOutput);
    const tool = outputs.find((item) => item.type === 'function_call');
    log('chat call', call, 'tool', tool?.name ?? 'none');
    const chunk = (delta, finish = null) => ({
      id: `chatcmpl-${call}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: body.model ?? 'fixture-model',
      choices: [{ index: 0, delta, finish_reason: finish }],
    });
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    res.write(`data: ${JSON.stringify(chunk({ role: 'assistant', content: '' }))}\n\n`);
    if (tool) {
      res.write(`data: ${JSON.stringify(chunk({ tool_calls: [{ index: 0, id: tool.call_id, type: 'function', function: { name: tool.name, arguments: tool.arguments } }] }))}\n\n`);
      res.write(`data: ${JSON.stringify(chunk({}, 'tool_calls'))}\n\n`);
    } else {
      const text = outputs.map((item) => item.content?.map((c) => c.text).join('') ?? '').join('');
      for (const piece of text.match(/[\s\S]{1,80}/g) ?? [text]) {
        res.write(`data: ${JSON.stringify(chunk({ content: piece }))}\n\n`);
      }
      res.write(`data: ${JSON.stringify(chunk({}, 'stop'))}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (path === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, scenario: SCENARIO, calls: call }));
    return;
  }

  if (path === '/requests') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(requests));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', path }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`fake model server on http://127.0.0.1:${PORT} scenario=${SCENARIO}`);
});
