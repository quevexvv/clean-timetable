const { copyFileSync, cpSync, rmSync } = require('node:fs');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const outDir = join(root, 'dist', 'firefox');

rmSync(outDir, { recursive: true, force: true });
cpSync(join(root, 'src', 'extension'), outDir, { recursive: true });
copyFileSync(join(root, 'LICENSE'), join(outDir, 'LICENSE'));
console.log(`Firefox extension written to ${outDir}`);
