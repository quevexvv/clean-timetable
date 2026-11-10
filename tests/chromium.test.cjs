const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const vm = require('node:vm');
const { buildChromium, createChromiumManifest } = require('../scripts/build-chromium.cjs');

const root = join(__dirname, '..');
const compatSource = readFileSync(join(root, 'chromium', 'compat.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function loadCompat(existingBrowser) {
  const listeners = [];
  const chromeApi = {
    runtime: { id: 'test-extension', onMessage: { addListener(listener) { listeners.push(listener); } } },
    storage: { local: {} },
  };
  const context = vm.createContext({ chrome: chromeApi, browser: existingBrowser, console });
  vm.runInContext(compatSource, context);
  return { context, chromeApi, listeners };
}

test('chromium compat exposes browser and adapts Promise listeners to sendResponse', async () => {
  const { context, chromeApi, listeners } = loadCompat(undefined);
  const nativeAddListener = chromeApi.runtime.onMessage.addListener;
  assert.equal(context.browser.runtime.id, chromeApi.runtime.id);
  assert.equal(context.browser.storage, chromeApi.storage);
  assert.equal(chromeApi.runtime.onMessage.addListener, nativeAddListener);
  const seen = [];
  context.browser.runtime.onMessage.addListener((message, sender) => {
    seen.push({ message, sender });
    return Promise.resolve({ state: { rules: [] } });
  });
  assert.equal(listeners.length, 1);
  let response;
  const keepAlive = listeners[0]({ kind: 'tpu:get' }, { url: 'https://my-rasp.tpu.ru/' },
    value => { response = value; });
  assert.equal(keepAlive, true);
  assert.deepEqual(seen, [{ message: { kind: 'tpu:get' }, sender: { url: 'https://my-rasp.tpu.ru/' } }]);
  await tick();
  assert.deepEqual(response, { state: { rules: [] } });

  let failed;
  context.browser.runtime.onMessage.addListener(() => Promise.reject(new Error('no access')));
  listeners[1]({}, {}, value => { failed = value; });
  await tick();
  assert.equal(failed.error, 'Фоновый обработчик недоступен.');
});

test('chromium compat leaves plain listeners and Firefox browser objects alone', () => {
  const { context, listeners } = loadCompat(undefined);
  const plain = () => undefined;
  context.browser.runtime.onMessage.addListener(plain);
  assert.equal(listeners[0]({}, {}, () => { throw new Error('unexpected response'); }), undefined);
  const { context: firefox, listeners: unused } = loadCompat({ runtime: { id: 'firefox' } });
  assert.equal(firefox.browser.runtime.id, 'firefox');
  assert.equal(unused.length, 0);
});

test('built Chromium service worker answers messages through the Chrome API shim', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'tpu-chromium-worker-'));
  try {
    const outDir = join(temp, 'chromium');
    buildChromium({ outDir });
    const listeners = [];
    const data = {};
    const chromeApi = {
      runtime: { id: 'test-extension', onMessage: { addListener(listener) { listeners.push(listener); } } },
      storage: { local: {
        async get(key) { return { [key]: data[key] }; },
        async set(values) { Object.assign(data, values); },
      } },
    };
    const context = vm.createContext({ chrome: chromeApi, console, URL, structuredClone });
    context.importScripts = (...files) => {
      for (const file of files) {
        vm.runInContext(readFileSync(join(outDir, file), 'utf8'), context, { filename: file });
      }
    };
    vm.runInContext(readFileSync(join(outDir, 'chromium-background.js'), 'utf8'), context,
      { filename: 'chromium-background.js' });
    assert.equal(listeners.length, 1);
    let response;
    const keepAlive = listeners[0]({ kind: 'tpu:get' },
      { id: 'test-extension', url: 'https://ro-rasp.tpu.ru/gruppa_44510/2026/11/view.html' },
      value => { response = value; });
    assert.equal(keepAlive, true);
    await tick();
    assert.equal(response.state.version, 1);
    assert.equal(response.state.rules.length, 0);
    assert.equal(response.state.skipped.length, 0);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('chromium manifest keeps shared sources and swaps only Chromium entry points', () => {
  const source = JSON.parse(readFileSync(join(root, 'extension', 'manifest.json'), 'utf8'));
  const original = structuredClone(source);
  const manifest = createChromiumManifest(source);
  assert.deepEqual(source, original);
  assert.equal(manifest.browser_specific_settings, undefined);
  assert.deepEqual(manifest.background, { service_worker: 'chromium-background.js' });
  assert.equal(manifest.minimum_chrome_version, '109');
  assert.deepEqual(manifest.content_scripts[0].js,
    ['chromium-compat.js', ...original.content_scripts[0].js]);
  assert.deepEqual(manifest.content_scripts[0].matches, original.content_scripts[0].matches);
  assert.deepEqual(manifest.content_scripts[0].matches, ['my-rasp', 'ro-rasp'].flatMap(host => [
    `https://${host}.tpu.ru/gruppa_*/view.html`, `https://${host}.tpu.ru/gruppa_*/*/view.html`,
  ]));
  assert.deepEqual(manifest.permissions, ['storage']);
});

test('chromium build output has the expected Chromium entry points', () => {
  const files = ['manifest.json', 'background.js', 'core/site.js', 'core/rules.js', 'core/store.js',
    'content/parser.js', 'content/ui.js', 'content/app.js', 'content/styles.css'];
  const before = files.map(file => readFileSync(join(root, 'extension', file), 'utf8'));
  const temp = mkdtempSync(join(tmpdir(), 'tpu-chromium-'));
  try {
    const outDir = join(temp, 'chromium');
    const { manifest } = buildChromium({ outDir });
    const after = files.map(file => readFileSync(join(root, 'extension', file), 'utf8'));
    assert.deepEqual(after, before);
    assert.equal(manifest.background.service_worker, 'chromium-background.js');
    assert.match(readFileSync(join(outDir, 'chromium-compat.js'), 'utf8'),
      /globalThis\.browser = \{ storage: chromeApi\.storage, runtime \}/);
    assert.match(readFileSync(join(outDir, 'chromium-background.js'), 'utf8'),
      /importScripts\('chromium-compat\.js', 'core\/site\.js', 'core\/rules\.js', 'core\/store\.js', 'background\.js'\)/);
    for (const file of files.filter(name => name !== 'manifest.json')) {
      assert.equal(readFileSync(join(outDir, file), 'utf8'), before[files.indexOf(file)]);
    }
    const built = JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8'));
    assert.equal(built.version, manifest.version);
    assert.equal(built.browser_specific_settings, undefined);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
