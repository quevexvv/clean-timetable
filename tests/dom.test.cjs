const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
const rules = require('../extension/core/rules.js');
const createStore = require('../extension/core/store.js');
const fixture = readFileSync(join(__dirname, 'fixtures/week.html'), 'utf8');
const scripts = ['core/rules.js', 'content/parser.js', 'content/ui.js', 'content/app.js'];
const tick = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
function setup({ url = 'https://my-rasp.tpu.ru/gruppa_44510/2026/10/view.html', failRead = false, failWrite = false, html = fixture } = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  const { window } = dom;
  const data = {};
  const listeners = [];
  const adapter = {
    async get(key) { if (failRead) throw new Error('read denied'); return structuredClone({ [key]: data[key] }); },
    async set(patch) {
      if (failWrite) throw new Error('quota exceeded');
      Object.assign(data, structuredClone(patch));
      listeners.forEach(listener => listener(Object.fromEntries(Object.keys(patch).map(key => [key, {}])), 'local'));
    },
  };
  const store = createStore(adapter);
  const messages = [];
  window.structuredClone = structuredClone;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.browser = {
    runtime: { async sendMessage(message) {
      messages.push(message);
      try { return { state: message.kind === 'tpu:get' ? await store.get('44510') : await store.update('44510', message.action, message.lesson) }; }
      catch (error) { return { error: error.message }; }
    } },
    storage: { onChanged: { addListener(listener) { listeners.push(listener); } } },
  };
  const load = name => window.eval(readFileSync(join(__dirname, '../extension', name), 'utf8'));
  scripts.forEach(load);
  const document = window.document;
  const visible = id => [...document.querySelectorAll(`#${id} .tpu-lesson`)].filter(node => !node.hidden);
  const click = (parent, text) => {
    const button = [...parent.querySelectorAll('button')].find(node => node.textContent === text && !node.hidden);
    assert.ok(button, `Button exists: ${text}`);
    assert.equal(button.disabled, false);
    const details = button.closest('details');
    if (details && !details.open) details.querySelector('summary').click();
    button.click();
  };
  return { dom, window, document, data, messages, store, visible, click, load };
}
test('parser maps rowspan correctly and preserves missing-teacher and unknown blocks', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  const parsed = app.window.TpuFilter.parser.parse;
  const raw = new JSDOM(fixture);
  t.after(() => raw.window.close());
  const broken = raw.window.document.createElement('a');
  broken.href = 'http://[';
  broken.textContent = 'Invalid unrelated link';
  raw.window.document.querySelector('#lecture').append(broken);
  const records = parsed(raw.window.document.querySelector('table'), '44510');
  const lecture = records.find(record => record.cell.id === 'lecture').blocks[0].lesson;
  assert.equal(lecture.date, '2026-11-04');
  const lab = records.find(record => record.cell.id === 'lab').blocks[0].lesson;
  assert.equal(lab.date, '2026-11-04');
  assert.equal(lab.time, '10:25');
  assert.deepEqual(Array.from(records.find(record => record.cell.id === 'missing-teacher').blocks[0].lesson.teacherIds), []);
  assert.equal(app.document.querySelector('#unknown').textContent, 'Неизвестный формат занятия');
  assert.equal(app.document.querySelector('#encrypted').dataset.tpuPrepared, undefined);
  assert.equal(app.document.querySelectorAll('#double a[href*="user_"]').length, 2);
  assert.equal(app.document.querySelector('.tpu-count').textContent, 'Скрыто 0 пар');
});
test('hide, full view, restore, skip and disable keep exact rule scope', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  app.click(app.visible('double')[0], 'Скрывать всегда');
  assert.match(app.document.querySelector('.tpu-confirm-description').textContent, /Английский язык · ПР · Ануфриева/);
  app.click(app.document.querySelector('dialog'), 'Скрывать всегда'); await tick();
  assert.equal(app.visible('double').length, 1);
  assert.equal(app.visible('repeat').length, 0);
  assert.equal(app.visible('lecture').length, 1);
  assert.equal(app.visible('lab').length, 1);
  assert.equal(app.visible('double')[0].classList.contains('tpu-divider'), false);
  assert.equal(app.document.querySelector('#double hr'), null);
  const saved = JSON.stringify(app.data);
  const toggle = app.document.querySelector('.tpu-toggle input');
  toggle.click(); await tick();
  assert.equal(app.visible('double').length, 2);
  assert.equal(JSON.stringify(app.data), saved);
  app.click(app.visible('double')[0], 'Вернуть эту пару'); await tick();
  toggle.click(); await tick();
  assert.equal(app.visible('double').length, 2);
  assert.equal(app.visible('repeat').length, 0);
  app.click(app.visible('double')[0], 'Пропустить пару'); await tick();
  assert.equal(app.visible('double').length, 1);
  app.click(app.document.querySelector('.tpu-rules'), 'Отключить правило'); await tick();
  assert.equal(app.visible('double').length, 1);
  assert.equal(app.visible('repeat').length, 1);
});
test('skip, empty cell, restore and a fresh page retain the saved choice', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
  assert.equal(app.visible('lecture').length, 0);
  assert.ok(app.document.querySelector('#lecture').classList.contains('tpu-empty'));
  app.load('content/app.js'); await tick();
  assert.equal(app.document.querySelectorAll('.tpu-panel').length, 1);
  assert.equal(app.document.querySelectorAll('#double .tpu-actions').length, 2);
  const replacement = new app.window.DOMParser().parseFromString(fixture, 'text/html').querySelector('#raspisanie-table');
  app.document.querySelector('#raspisanie-table').replaceWith(replacement); await tick();
  assert.equal(app.visible('lecture').length, 0);
  app.document.querySelector('.tpu-toggle input').click(); await tick();
  const another = new app.window.DOMParser().parseFromString(fixture, 'text/html').querySelector('#raspisanie-table');
  app.document.querySelector('#raspisanie-table').replaceWith(another); await tick();
  assert.equal(app.document.querySelector('.tpu-toggle input').checked, true);
  assert.equal(app.visible('lecture').length, 1);
  app.click(app.visible('lecture')[0], 'Вернуть эту пару'); await tick();
  assert.ok(!app.document.querySelector('#lecture').classList.contains('tpu-empty'));
  assert.equal((await app.store.get('44510')).skipped.length, 0);
});
test('delayed site decryption is detected without storing encrypted names', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  const subject = app.document.querySelector('#encrypted span');
  subject.textContent = 'Немецкий';
  subject.title = 'Немецкий язык';
  subject.classList.remove('encrypt'); await tick();
  assert.equal(app.document.querySelectorAll('#encrypted .tpu-actions').length, 1);
  assert.equal(app.document.querySelector('.tpu-count').textContent, 'Скрыто 0 пар');
});
test('replacement of tbody in the same table does not retain stale lessons', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  const original = new app.window.DOMParser().parseFromString(fixture, 'text/html');
  app.document.querySelector('tbody').replaceWith(original.querySelector('tbody')); await tick();
  assert.equal(app.document.querySelector('.tpu-count').textContent, 'Скрыто 0 пар');
  assert.equal(app.document.querySelectorAll('.tpu-panel').length, 1);
});
test('write failure keeps the lesson visible and reports an error', async t => {
  const app = setup({ failWrite: true }); t.after(() => app.dom.window.close()); await tick();
  app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
  assert.equal(app.visible('lecture').length, 1);
  assert.match(app.document.querySelector('.tpu-error').textContent, /quota exceeded/);
  assert.equal(app.document.querySelector('.tpu-error').hidden, false);
});
test('read failure leaves lessons visible and disables unsafe edits', async t => {
  const app = setup({ failRead: true }); t.after(() => app.dom.window.close()); await tick();
  assert.equal(app.visible('double').length, 2);
  assert.ok(app.document.querySelector('#double button').disabled);
  assert.match(app.document.querySelector('.tpu-error').textContent, /read denied/);
});
test('content script leaves other pages untouched', async t => {
  const app = setup({ url: 'https://my-rasp.tpu.ru/user_57063/2026/10/view.html' });
  t.after(() => app.dom.window.close()); await tick();
  assert.equal(app.document.querySelector('.tpu-panel'), null);
  assert.equal(app.messages.length, 0);
});
test('date parsing validates actual dates and supports a year boundary', () => {
  const { dateFrom } = require('../extension/content/parser.js');
  assert.equal(dateFrom('31.12.26'), '2026-12-31');
  assert.equal(dateFrom('01.01.27'), '2027-01-01');
  assert.equal(dateFrom('31.02.26'), null);
});
test('real week snapshots parse every lesson and carry a rule across weeks', t => {
  const { parse } = require('../extension/content/parser.js');
  const all = [];
  for (const week of [10, 11]) {
    const dom = new JSDOM(readFileSync(join(__dirname, `fixtures/tpu-week${week}.html`), 'utf8'));
    t.after(() => dom.window.close());
    const records = parse(dom.window.document.querySelector('table'), '44510');
    const lessons = records.flatMap(record => record.blocks.map(block => block.lesson));
    assert.equal(lessons.length, week === 10 ? 30 : 31);
    assert.ok(lessons.every(Boolean));
    assert.equal(lessons.filter(item => item.subject === 'Операционные системы').every(item => item.teacherIds.includes('61829')), true);
    all.push(lessons);
  }
  const physics = all[1].filter(item => item.subject === 'Физика 2.8 для ИТ' && item.type === 'ЛБ');
  assert.equal(physics.length, 2);
  assert.deepEqual(physics.map(item => item.teacherIds), [['60941'], ['58910']]);
  const oneTeacher = rules.change(rules.emptyState(), 'hide', physics[0]);
  assert.ok(rules.reason(oneTeacher, physics[0]));
  assert.equal(rules.reason(oneTeacher, physics[1]), '');
  const english = all[0].find(item => item.teacherIds.includes('109784'));
  const hidden = rules.change(rules.emptyState(), 'hide', english);
  assert.equal(all[0].filter(item => rules.reason(hidden, item)).length, 2);
  assert.equal(all[1].filter(item => rules.reason(hidden, item)).length, 3);
  assert.equal(all[1].filter(item => rules.reason(rules.change(rules.emptyState(), 'skip', english), item)).length, 0);
});
test('hiding a teacher under a shared heading leaves the other teacher and subject visible', async t => {
  const html = readFileSync(join(__dirname, 'fixtures/tpu-week11.html'), 'utf8');
  const app = setup({ html, url: 'https://my-rasp.tpu.ru/gruppa_44510/2026/11/view.html' });
  t.after(() => app.dom.window.close()); await tick();
  const cell = [...app.document.querySelectorAll('td.cell')].find(node => node.textContent.includes('Склярова Е. А.'));
  const first = cell.querySelector('.tpu-lesson');
  app.click(first, 'Скрывать всегда');
  app.click(app.document.querySelector('dialog'), 'Скрывать всегда'); await tick();
  const visible = [...cell.querySelectorAll('.tpu-lesson')].filter(node => !node.hidden);
  assert.equal(visible.length, 1);
  assert.match(visible[0].textContent, /Физика 2.8 ИТ/);
  assert.match(visible[0].textContent, /Чистякова Н. В./);
  assert.equal(visible[0].classList.contains('tpu-divider'), false);
});


test('hidden count uses Russian forms without a schedule total', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  const table = app.document.createElement('table');
  app.document.body.append(table);
  const panel = app.window.TpuFilter.ui.createPanel(table, () => {}, () => {});
  for (const [count, expected] of [[0, 'Скрыто 0 пар'], [1, 'Скрыта 1 пара'], [2, 'Скрыто 2 пары'],
    [5, 'Скрыто 5 пар'], [11, 'Скрыто 11 пар'], [21, 'Скрыта 21 пара'], [22, 'Скрыто 22 пары']]) {
    panel.render(rules.emptyState(), count, false);
    assert.equal(panel.panel.querySelector('.tpu-count').textContent, expected);
  }
  assert.equal(panel.panel.querySelector('.tpu-count').getAttribute('aria-live'), 'polite');
});
test('empty cells drop only the subject tint and restore the original style', async t => {
  for (const declaration of ['background-color: rgba(111,189,1,0.3) !important',
    'background-color: rgb(98,130,32)', 'border: 1px solid black']) {
    const html = fixture.replace('id="lecture"', `id="lecture" style="${declaration}"`);
    const app = setup({ html }); t.after(() => app.dom.window.close()); await tick();
    const cell = app.document.querySelector('#lecture');
    const original = cell.style.getPropertyValue('background-color');
    const priority = cell.style.getPropertyPriority('background-color');
    const border = cell.style.border;
    app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
    assert.equal(cell.style.getPropertyValue('background-color'), '');
    assert.equal(cell.style.getPropertyPriority('background-color'), '');
    assert.equal(cell.style.border, border);
    app.document.querySelector('.tpu-toggle input').click(); await tick();
    assert.equal(cell.style.backgroundColor, original);
    assert.equal(cell.style.getPropertyPriority('background-color'), priority);
    const restore = app.visible('lecture')[0].querySelector('.tpu-restore');
    assert.equal(restore.hidden, false);
    assert.equal(restore.closest('details'), null);
    assert.equal(app.visible('lecture')[0].querySelector('.tpu-actions').hidden, true);
    app.document.querySelector('.tpu-toggle input').click(); await tick();
    assert.equal(cell.style.getPropertyValue('background-color'), '');
    app.document.querySelector('.tpu-toggle input').click(); await tick();
    app.click(app.visible('lecture')[0], 'Вернуть эту пару'); await tick();
    assert.equal(cell.style.backgroundColor, original);
    assert.equal(cell.style.getPropertyPriority('background-color'), priority);
  }
});
test('a hidden lesson keeps the site highlight of the current day', async t => {
  const html = fixture
    .replace('<td class="cell" id="lecture">', '<td class="cell cur-day" id="lecture">')
    .replace('</style>', '.timetable td.cur-day { background-color: rgb(232, 245, 233) !important; }</style>');
  const app = setup({ html }); t.after(() => app.dom.window.close()); await tick();
  const style = app.document.createElement('style');
  style.textContent = readFileSync(join(__dirname, '../extension/content/styles.css'), 'utf8');
  app.document.head.append(style);
  const cell = app.document.querySelector('#lecture');
  assert.equal(app.window.getComputedStyle(cell).backgroundColor, 'rgb(232, 245, 233)');
  app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
  assert.equal(cell.style.getPropertyValue('background-color'), '');
  assert.equal(app.window.getComputedStyle(cell).backgroundColor, 'rgb(232, 245, 233)');
});
test('successful skip closes the menu and focuses the remaining lesson or full view toggle', async t => {
  const app = setup(); t.after(() => app.dom.window.close()); await tick();
  const first = app.visible('double')[0];
  const button = [...first.querySelectorAll('button')].find(node => node.textContent === 'Пропустить пару');
  first.querySelector('details').open = true;
  button.focus(); button.click(); await tick();
  assert.equal(first.querySelector('details').open, false);
  assert.equal(app.document.activeElement, app.visible('double')[0].querySelector('summary'));
  app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
  assert.equal(app.document.activeElement, app.document.querySelector('.tpu-toggle input'));
  app.document.querySelector('.tpu-toggle input').click(); await tick();
  app.click(app.visible('lecture')[0], 'Вернуть эту пару'); await tick();
  assert.equal(app.document.activeElement, app.visible('lecture')[0].querySelector('summary'));
  app.click(app.visible('lecture')[0], 'Пропустить пару'); await tick();
  assert.equal(app.document.activeElement, app.visible('lecture')[0].querySelector('.tpu-restore'));
});
