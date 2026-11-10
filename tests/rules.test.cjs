const { test } = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../src/extension/core/rules.js');
const base = { group: '44510', subject: 'Английский язык', type: 'ЛК', teacherIds: ['57063'], teacherLabel: 'Ануфриева Т. Н.', date: '2026-11-02', time: '08:30' };

test('permanent rules match subject, teacher, type and group on other weeks', () => {
  const state = rules.change(rules.emptyState(), 'hide', base);
  assert.ok(rules.reason(state, { ...base, date: '2027-01-11', room: 'different' }));
  for (const difference of [{ group: '44511' }, { subject: 'Физика' }, { type: 'ПР' },
    { type: 'ЛБ' }, { teacherIds: ['109784'] }, { teacherIds: [] }]) {
    assert.equal(rules.reason(state, { ...base, ...difference }), '');
  }
});
test('normalization ignores whitespace, case, teacher order and room', () => {
  assert.equal(rules.ruleKey(base), rules.ruleKey({ ...base, subject: '  АНГЛИЙСКИЙ\u00a0язык  ', room: '235' }));
  assert.equal(rules.ruleKey({ ...base, teacherIds: ['2', '1', '2'] }), rules.ruleKey({ ...base, teacherIds: ['1', '2'] }));
  assert.notEqual(rules.ruleKey({ ...base, teacherIds: ['1', '2'] }), rules.ruleKey({ ...base, teacherIds: ['1'] }));
});
test('skip affects only one calendar date and time', () => {
  const state = rules.change(rules.emptyState(), 'skip', base);
  assert.ok(rules.reason(state, base));
  assert.equal(rules.reason(state, { ...base, date: '2026-11-09' }), '');
  assert.equal(rules.reason(state, { ...base, time: '10:25' }), '');
  assert.equal(rules.reason(rules.change(state, 'restore', base), base), '');
});
test('restoring one occurrence preserves the permanent rule and can be skipped again', () => {
  let state = rules.change(rules.emptyState(), 'hide', base);
  state = rules.change(state, 'restore', base);
  assert.equal(rules.reason(state, base), '');
  assert.ok(rules.reason(state, { ...base, date: '2026-11-09' }));
  assert.equal(state.rules.length, 1);
  state = rules.change(state, 'skip', base);
  assert.ok(rules.reason(state, base));
  state = rules.change(state, 'restore', base);
  assert.equal(rules.reason(state, base), '');
});
test('disabling a rule preserves an independently skipped occurrence', () => {
  let state = rules.change(rules.emptyState(), 'hide', base);
  state = rules.change(state, 'skip', base);
  state = rules.change(state, 'unhide', base);
  assert.ok(rules.reason(state, base));
  assert.equal(rules.reason(state, { ...base, date: '2026-11-09' }), '');
});
test('new permanent hide clears prior per-occurrence restores; input is not mutated', () => {
  const initial = rules.emptyState();
  let state = rules.change(initial, 'hide', base);
  state = rules.change(state, 'restore', base);
  state = rules.change(state, 'hide', base);
  assert.equal(state.rules.length, 1);
  assert.ok(rules.reason(state, base));
  assert.deepEqual(initial, rules.emptyState());
});
test('invalid and future data are rejected', () => {
  assert.throws(() => rules.validateState({ version: 2 }));
  assert.throws(() => rules.validateState({ ...rules.emptyState(), allowed: ['not json'] }), /повреждены/);
  assert.throws(() => rules.ruleKey({ ...base, subject: '' }));
  assert.throws(() => rules.change(rules.emptyState(), 'skip', { ...base, date: undefined }));
  assert.throws(() => rules.change(rules.emptyState(), 'anything', base));
});
