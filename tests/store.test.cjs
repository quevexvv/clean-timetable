const { test } = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../src/extension/core/rules.js');
const createStore = require('../src/extension/core/store.js');
const base = { group: '900001', subject: 'Физика', type: 'ЛК', teacherIds: ['1'], date: '2026-11-02', time: '08:30' };
function storage() {
  const data = {};
  return { data, async get(key) { return structuredClone({ [key]: data[key] }); },
    async set(patch) { Object.assign(data, structuredClone(patch)); } };
}
test('saved rules survive a new store and remain isolated by group', async () => {
  const adapter = storage();
  await createStore(adapter).update('900001', 'hide', base);
  const restarted = createStore(adapter);
  assert.ok(rules.reason(await restarted.get('900001'), base));
  assert.deepEqual(await restarted.get('900002'), rules.emptyState());
});
test('rapid updates from different callers do not lose changes', async () => {
  const store = createStore(storage());
  await Promise.all(Array.from({ length: 20 }, (_, i) => store.update('900001', 'hide', { ...base, teacherIds: [`${i}`] })));
  assert.equal((await store.get('900001')).rules.length, 20);
});
test('write failure is reported, preserves old data, and does not poison the queue', async () => {
  const adapter = storage();
  const store = createStore(adapter);
  await store.update('900001', 'hide', base);
  const write = adapter.set;
  adapter.set = async () => { throw new Error('quota exceeded'); };
  await assert.rejects(store.update('900001', 'unhide', base), /quota exceeded/);
  assert.equal((await store.get('900001')).rules.length, 1);
  adapter.set = write;
  await store.update('900001', 'unhide', base);
  assert.equal((await store.get('900001')).rules.length, 0);
});
test('future schema, corrupted rules and mismatched groups are not overwritten', async () => {
  const adapter = storage();
  adapter.data['tpuScheduleFilter:900001'] = { version: 2 };
  const store = createStore(adapter);
  await assert.rejects(store.update('900001', 'hide', base), /unsupportedRules/);
  assert.deepEqual(adapter.data['tpuScheduleFilter:900001'], { version: 2 });
  await assert.rejects(store.update('900002', 'hide', base), /groupMismatch/);
});
