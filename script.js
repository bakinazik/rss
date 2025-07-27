document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');

  fetch(rawMdUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.text();
    })
    .then(md => {
      const categoryRegex = /# ([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|([\s\S]+?)(?=\n# |$)/g;
      let htmlContent = '';
      let match;

      while ((match = categoryRegex.exec(md)) !== null) {
        const category = match[1].trim();
        const tableContent = match[2].trim();

        // Split table content into lines and filter out empty ones
        const lines = tableContent.split('\n').filter(line => line.trim() !== '');

        // Skip the header and separator lines for actual data
        const dataLines = lines.slice(2);

        let tableHtml = '<table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';

        dataLines.forEach(line => {
          const parts = line.split('|').map(part => part.trim()).filter(part => part !== '');
          if (parts.length === 2) {
            const siteName = parts[0];
            const rssLink = parts[1];
            tableHtml += `<tr><td data-label="Site Adı">${siteName}</td><td data-label="RSS Bağlantısı"><a href="${rssLink}" target="_blank">${rssLink}</a></td></tr>`;
          }
        });
        tableHtml += '</tbody></table>';

        htmlContent += `
          <div class="category">
            <div class="category-header" data-category="${category}">
              ${category} (${dataLines.length} URL)
            </div>
            <div class="category-content">
              ${tableHtml}
            </div>
          </div>
        `;
      }
      output.innerHTML = htmlContent;

      // Add event listeners for toggling content
      document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
          header.classList.toggle('expanded');
          const content = header.nextElementSibling;
          if (content.style.display === 'block') {
            content.style.display = 'none';
          } else {
            content.style.display = 'block';
          }
        });
      });
    })
    .catch(err => {
      output.textContent = `Hata: İçerik yüklenemedi. Detay: ${err.message}`;
      console.error('Fetch error:', err);
    });
});
