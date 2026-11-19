// Fails if any built page links to "#", "#0", a missing internal page, or a missing anchor.
import fs from 'node:fs';
import path from 'node:path';

const root = 'dist';
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
})(root);

const problems = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url === '#' || url === '#0') { problems.push(`${f}: empty link ${url}`); continue; }
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const [p, hash] = url.split('#');
    let target = f;
    if (p) {
      const clean = p.split('?')[0];
      target = path.join(root, clean.endsWith('/') ? clean + 'index.html' : clean);
      if (!fs.existsSync(target)) { problems.push(`${f}: missing ${url}`); continue; }
    }
    if (hash && !fs.readFileSync(target, 'utf8').includes(`id="${hash}"`)) problems.push(`${f}: missing anchor ${url}`);
  }
}
console.log(`${files.length} pages checked, ${problems.length} problems`);
problems.forEach((p) => console.log('  ' + p));
process.exit(problems.length ? 1 : 0);
