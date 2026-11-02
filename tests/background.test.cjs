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
  for (const name of ['core/rules.js', 'core/store.js', 'background.js']) {
    vm.runInContext(readFileSync(join(__dirname, '../extension', name), 'utf8'), context);
  }
  return handler;
}
const sender = { id: 'test@local.invalid', url: 'https://my-rasp.tpu.ru/gruppa_44510/2026/10/view.html' };
test('background rejects other origins, pages, senders and cross-group writes', async () => {
  const send = background();
  for (const change of [{ url: 'https://example.com/gruppa_44510/2026/10/view.html' },
    { url: 'https://my-rasp.tpu.ru/user_1/2026/10/view.html' }, { id: 'other@extension' }]) {
    assert.ok((await send({ kind: 'tpu:get' }, { ...sender, ...change })).error);
  }
  assert.ok((await send({ kind: 'tpu:update', action: 'hide', lesson: { group: '999' } }, sender)).error);
  assert.equal((await send({ kind: 'tpu:get' }, sender)).state.rules.length, 0);
  assert.equal(send({ kind: 'unrelated' }, sender), undefined);
});
test('background serializes updates shared by tabs and returns saved state', async () => {
  const send = background();
  const item = { group: '44510', subject: 'Английский язык', type: 'ПР', teacherIds: ['1'] };
  const results = await Promise.all([1, 2].map(id => send({ kind: 'tpu:update', action: 'hide', lesson: { ...item, teacherIds: [`${id}`] } }, sender)));
  assert.ok(results.every(result => !result.error));
  assert.equal((await send({ kind: 'tpu:get' }, sender)).state.rules.length, 2);
});
