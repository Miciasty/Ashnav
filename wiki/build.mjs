// Publish only browser assets. Authoring tools and installed packages stay local.
import {cp, mkdir, readdir, rm, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = path.resolve(root, '_site');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== '_site') throw new Error('Unexpected output directory');
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
for (const entry of ['index.html', '.nojekyll', 'assets', 'content']) {
  await cp(path.join(root, entry), path.join(output, entry), {recursive:true});
}
for (const entry of ['LICENSE', 'NOTICE']) await copyFile(path.join(root, '..', entry), path.join(output, entry));
console.log(`Built wiki/_site: ${(await readdir(output)).join(', ')}`);
