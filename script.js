const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';

fetch(rawMdUrl)
  .then(res => res.text())
  .then(md => {
    const output = document.getElementById('output');
    const categoryRegex = /# ([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|([\s\S]+?)(?=\n# |$)/g;

    let html = '';
    let match;
    while ((match = categoryRegex.exec(md)) !== null) {
      const category = match[1].trim();
      const table = match[2];
      const count = (table.match(/\n\|/g) || []).length;
      html += `<div class="category"><strong>${category}</strong>: ${count} RSS linki</div>`;
    }

    output.innerHTML = html;
  })
  .catch(err => {
    document.getElementById('output').textContent = 'Hata: README.md içeriği alınamadı.';
    console.error(err);
  });
