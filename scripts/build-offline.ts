import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { renderMarkdown } from './render-markdown.mjs';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';
const root = process.cwd();
const publicDir = path.join(root, 'public');
const write = async (name: string, value: string | Buffer) => {
  const file = path.join(publicDir, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, value);
};
const fontDir = path.join(root, 'node_modules/@fontsource');
for (const [pkg, file, out] of [
  ['dm-serif-display', 'dm-serif-display-latin-400-normal.woff2', 'dm-serif-regular.woff2'],
  ['dm-serif-display', 'dm-serif-display-latin-400-italic.woff2', 'dm-serif-italic.woff2'],
  ['dm-sans', 'dm-sans-latin-400-normal.woff2', 'dm-sans.woff2'],
])
  await write('fonts/' + out, await fs.readFile(path.join(fontDir, pkg, 'files', file)));
for (const pkg of ['dm-serif-display', 'dm-sans']) await write('fonts/' + pkg + '-LICENSE.txt', await fs.readFile(path.join(fontDir, pkg, 'LICENSE')));
const icon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#F8F5EC"/><circle cx="256" cy="256" r="164" fill="#F5D7C4"/><rect x="184" y="162" width="48" height="188" rx="24" fill="#425844"/><rect x="280" y="162" width="48" height="188" rx="24" fill="#425844"/></svg>';
await write('icons/pause.svg', icon);
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
] as const)
  await write('icons/' + name, await sharp(Buffer.from(icon)).resize(size, size).png().toBuffer());
const shell = (title: string, body: string, script = '') =>
  '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#F8F5EC"><title>' +
  title +
  ' · Pause</title><link rel="icon" href="/icons/icon-192.png"><link rel="stylesheet" href="/offline-help/style.css"></head><body><header><a class="logo" href="/">Pause.</a><a href="/">Kembali ke beranda</a></header><main id="main">' +
  body +
  '</main>' +
  script +
  '</body></html>';
const help = JSON.parse(await fs.readFile(path.join(root, 'content/help.json'), 'utf8'));
const guideLinks = '<div class="actions"><button class="outline" data-guide="home">Ganti panduan</button><a class="button outline" href="/">Keluar</a></div>';
const helpBody =
  '<div class="center"><span class="eyebrow">BANTUAN TANPA INTERNET · TANPA DATA PRIBADI</span><section id="home"><h1 tabindex="-1">Berikan dirimu<br><em>sedikit ruang.</em></h1><p>' +
  help.intro +
  '</p><div class="actions"><button data-guide="breath">Panduan napas</button><button class="outline" data-guide="focus">Fokus ke sekitar</button></div><p class="notice">Panduan ini berjalan di perangkatmu. Tidak ada respons sesi yang disimpan.</p></section><section id="breath" hidden><h1 tabindex="-1">Pelan-pelan,<br><em>sesuai ritmemu.</em></h1><p id="breath-copy"></p><div id="circle" class="circle" data-phase="idle"><div class="breath-visual" aria-hidden="true"><svg class="breath-motion" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle cx="100" cy="100" r="90" pathLength="100" stroke-dasharray="36 64" transform="rotate(-90 100 100)"/><circle cx="100" cy="100" r="88" pathLength="100" stroke-dasharray="22 78" transform="rotate(90 100 100)" opacity="0.5"/></svg></div><span id="breath-label">sesuai ritmemu</span></div><div id="text-panel" class="panel" hidden><h2 id="text-instruction"></h2></div><div class="actions"><button id="start">Mulai panduan</button><button id="text-mode" class="outline">Mode teks</button></div><p id="discomfort"></p>' +
  guideLinks +
  '</section><section id="focus" hidden><h1 tabindex="-1">Satu hal, <em>pada satu waktu.</em></h1><div class="panel"><span id="step-count" class="eyebrow"></span><h2 id="step-title" tabindex="-1"></h2><p id="step-body"></p></div><div class="actions"><button id="next">Lanjut</button><button id="skip" class="outline">Lewati</button><button id="finish" class="outline">Selesai</button></div>' +
  guideLinks +
  '</section><section id="finished" hidden><h2 tabindex="-1">Terima kasih sudah memberi ruang.</h2><p>Tidak ada perasaan tertentu yang harus dicapai. Kamu boleh berhenti di sini.</p>' +
  guideLinks +
  '</section></div><details class="medical"><summary>Kapan mencari bantuan medis</summary><p id="medical-copy"></p><p><strong id="medical-action"></strong></p><p id="professional-copy"></p></details>';
await write(
  'offline-help/index.html',
  shell('Bantuan tanpa internet', helpBody, '<script id="help-data" type="application/json">' + JSON.stringify(help).replaceAll('<', '\\u003c') + '</script><script src="/offline-help/guide.js" defer></script>'),
);
await write('offline-help/style.css', await fs.readFile('scripts/offline-help.css', 'utf8'));
await write('offline-help/guide.js', await fs.readFile('scripts/offline-help.js', 'utf8'));
await write('offline-help/library.js', await fs.readFile('scripts/offline-library.js', 'utf8'));
const escape = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });
const articleUrls: string[] = [];
for (const file of (await fs.readdir('content/education')).filter((f) => f.endsWith('.md'))) {
  const { data, content } = matter(await fs.readFile(path.join('content/education', file), 'utf8'));
  const url = '/offline-education/' + data.slug + '.html';
  articleUrls.push(url);
  const html = await renderMarkdown(content);
  await write(
    url.slice(1),
    shell(
      data.title,
      '<span class="eyebrow">' +
        escape(data.category) +
        ' · BACAAN OFFLINE</span><h1>' +
        escape(data.title) +
        '</h1><p class="notice">Materi edukasi prototipe; belum ditinjau tenaga profesional.</p><article class="prose">' +
        html +
        '</article><section class="sources"><h2>Sumber bacaan</h2><p>Sumber diperiksa: ' +
        data.sourceCheckedAt +
        '. Bukan peninjauan klinis.</p><ul>' +
        data.sourceUrls.map((u: string) => '<li><a href="' + escape(u) + '" rel="noopener noreferrer">' + escape(u) + '</a></li>').join('') +
        '</ul></section><a class="button outline" href="/offline-help/index.html">Buka bantuan tanpa internet</a>',
    ),
  );
}
await write(
  'offline-fallback.html',
  shell(
    'Koneksi sedang terputus',
    '<span class="eyebrow">PAUSE / OFFLINE</span><h1>Sedikit ruang,<br><em>tanpa koneksi.</em></h1><p>Halaman ini belum tersedia offline. Jurnal, rencana, kontak, dan akun memerlukan koneksi. Data pribadi tidak disalin ke cache.</p><a class="button" href="/offline-help/index.html">Buka bantuan tanpa internet</a><h2>Bacaan yang kamu unduh</h2><div id="downloads"></div><p class="notice">Browser dapat menghapus penyimpanan offline. Coba buka kembali saat tersambung.</p>',
    '<script src="/offline-help/library.js" defer></script>',
  ),
);
const precache = [
  '/offline-fallback.html',
  '/offline-help/index.html',
  '/offline-help/style.css',
  '/offline-help/guide.js',
  '/offline-help/library.js',
  '/fonts/dm-serif-regular.woff2',
  '/fonts/dm-serif-italic.woff2',
  '/fonts/dm-sans.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];
const template = await fs.readFile('scripts/sw-template.js', 'utf8');
const hash = createHash('sha256').update(template);
for (const url of [...precache, ...articleUrls]) hash.update(await fs.readFile(path.join(publicDir, url)));
const version = hash.digest('hex').slice(0, 16);
await write('sw.js', template.replace('__VERSION__', JSON.stringify(version)).replace('__PRECACHE__', JSON.stringify(precache)).replace('__ARTICLES__', JSON.stringify(articleUrls)));
console.log('Pause: font lokal, ikon, bantuan offline, ' + articleUrls.length + ' artikel publik, SW ' + version + ' berhasil dibuat.');
