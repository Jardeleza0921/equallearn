import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'www');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const item of ['index.html','about.html','developers.html','login.html','register.html','admin','teacher','student','assets','manifest.webmanifest','service-worker.js']) {
  await cp(resolve(root,item), resolve(out,item), { recursive: true });
}
console.log('EqualLearn web files copied to www/ for Capacitor.');
