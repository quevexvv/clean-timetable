const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
function background() {
  let handler;
  const data = {};
  const browser = {
    runtime: { id: 'test@local.invalid', onMessage: { addListener(fn) { handler = fn; } } },
    storage: { local: {
      async get(key) { return structuredClone({ [key]: data[key] }); },
      async set(value) { Object.assign(data, structuredClone(value)); },
    } },
  };
  const context = vm.createContext({ browser, URL, structuredClone });
  for (const name of ['core/site.js', 'core/rules.js', 'core/store.js', 'background.js']) {
    vm.runInContext(readFileSync(join(__dirname, '../src/extension', name), 'utf8'), context);
  }
  return handler;
}
const sender = { id: 'test@local.invalid', url: 'https://my-rasp.tpu.ru/gruppa_44510/2026/10/view.html' };
const publicSender = { ...sender, url: 'https://ro-rasp.tpu.ru/gruppa_44510/view.html' };
test('background rejects other origins, pages, senders and cross-group writes', async () => {
  const send = background();
  for (const change of [{ url: 'https://example.com/gruppa_44510/2026/10/view.html' },
    { url: 'http://ro-rasp.tpu.ru/gruppa_44510/view.html' },
    { url: 'https://ro-rasp.tpu.ru.example.com/gruppa_44510/view.html' },
    { url: 'https://my-rasp.tpu.ru/user_1/2026/10/view.html' },
    { url: 'https://ro-rasp.tpu.ru/user_1/2026/10/view.html' },
    { url: 'https://ro-rasp.tpu.ru/gruppa_44510/2026/11/extra/view.html' }, { id: 'other@extension' }]) {
    assert.ok((await send({ kind: 'tpu:get' }, { ...sender, ...change })).error);
  }
  const foreignLesson = { group: '999', subject: 'Английский язык', type: 'ПР', teacherIds: ['1'] };
  assert.match((await send({ kind: 'tpu:update', action: 'hide', lesson: foreignLesson }, publicSender)).error,
    /Группа занятия не совпадает со страницей/);
  assert.equal((await send({ kind: 'tpu:get' }, sender)).state.rules.length, 0);
  assert.equal(send({ kind: 'unrelated' }, sender), undefined);
});
test('background serializes updates across both sites and returns the same group state', async () => {
  const send = background();
  const item = { group: '44510', subject: 'Английский язык', type: 'ПР', teacherIds: ['1'] };
  const results = await Promise.all([sender, publicSender].map((tab, i) => send({
    kind: 'tpu:update', action: 'hide', lesson: { ...item, teacherIds: [`${i + 1}`] },
  }, tab)));
  assert.ok(results.every(result => !result.error));
  for (const tab of [sender, publicSender]) {
    const { state } = await send({ kind: 'tpu:get' }, tab);
    assert.deepEqual(Array.from(state.rules, rule => rule.teacherIds[0]), ['1', '2']);
  }
});
