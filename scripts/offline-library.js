(() => {
  async function update() {
    const root = document.getElementById('downloads');
    if (!root || !('caches' in window)) return;
    root.textContent = '';
    const names = (await caches.keys()).filter((n) => n.startsWith('pause-public-education-'));
    const seen = new Set();
    for (const name of names) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        const path = new URL(req.url).pathname;
        if (!path.startsWith('/offline-education/') || seen.has(path)) continue;
        seen.add(path);
        const row = document.createElement('div');
        row.className = 'download-item';
        const link = document.createElement('a');
        link.href = path;
        link.textContent = path.split('/').pop().replace('.html', '').replaceAll('-', ' ');
        const remove = document.createElement('button');
        remove.className = 'outline';
        remove.textContent = 'Hapus';
        remove.onclick = async () => {
          for (const n of names) await (await caches.open(n)).delete(req);
          await update();
        };
        row.append(link, remove);
        root.append(row);
      }
    }
    if (!seen.size) root.textContent = 'Belum ada bacaan yang diunduh.';
  }
  update().catch(() => {
    document.getElementById('downloads').textContent = 'Daftar unduhan belum dapat dibuka.';
  });
})();
