// electron-builder always drops node_modules/*/examples, so copy the three.js files the renderer needs.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'three');
const out = path.join(__dirname, '..', 'renderer', 'vendor', 'three');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'addons'), { recursive: true });
for (const f of ['three.module.js', 'three.core.js']) fs.copyFileSync(path.join(src, 'build', f), path.join(out, f));
fs.copyFileSync(path.join(src, 'LICENSE'), path.join(out, 'LICENSE'));
for (const dir of ['controls', 'postprocessing', 'shaders']) {
  fs.cpSync(path.join(src, 'examples', 'jsm', dir), path.join(out, 'addons', dir), { recursive: true });
}
console.log('three.js gevendord naar renderer/vendor/three');
