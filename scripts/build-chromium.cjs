const {
  copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} = require('node:fs');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const defaults = {
  sourceDir: join(root, 'extension'),
  templateDir: join(root, 'chromium'),
  outDir: join(root, 'dist', 'chromium'),
};

// The shared extension sources stay untouched. Only the manifest and the two
// Chromium entry points differ, so both builds use the same filtering code.
function createChromiumManifest(source) {
  const manifest = structuredClone(source);
  delete manifest.browser_specific_settings;
  manifest.minimum_chrome_version = '109';
  manifest.background = { service_worker: 'chromium-background.js' };
  const content = manifest.content_scripts && manifest.content_scripts[0];
  if (!content || !Array.isArray(content.js) || !content.js.length) {
    throw new Error('The Firefox manifest has no content script list to adapt.');
  }
  content.js = ['chromium-compat.js', ...content.js];
  return manifest;
}

function buildChromium(options = {}) {
  const { sourceDir, templateDir, outDir } = { ...defaults, ...options };
  for (const required of ['manifest.json', 'background.js']) {
    if (!existsSync(join(sourceDir, required))) throw new Error(`Missing ${join(sourceDir, required)}.`);
  }
  for (const required of ['compat.js', 'background.js']) {
    if (!existsSync(join(templateDir, required))) throw new Error(`Missing ${join(templateDir, required)}.`);
  }
  const source = JSON.parse(readFileSync(join(sourceDir, 'manifest.json'), 'utf8'));
  const manifest = createChromiumManifest(source);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(sourceDir, outDir, { recursive: true });
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  copyFileSync(join(templateDir, 'compat.js'), join(outDir, 'chromium-compat.js'));
  copyFileSync(join(templateDir, 'background.js'), join(outDir, 'chromium-background.js'));
  return { outDir, manifest };
}

if (require.main === module) {
  const { outDir } = buildChromium();
  console.log(`Chromium extension written to ${outDir}`);
}

module.exports = { buildChromium, createChromiumManifest };
