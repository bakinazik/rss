const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', '..', 'README.md');
const outputPath = path.join(__dirname, '..', 'data.json');

const md = fs.readFileSync(readmePath, 'utf8');
const categoryRegex = /#\s+([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|\n\|:-------- \| -----------:\|\n([\s\S]+?)(?=\n# |$)/g;

const categories = [];
const items = [];
let match;

while ((match = categoryRegex.exec(md)) !== null) {
  const category = match[1].trim();
  const tableContent = match[2].trim();

  const categoryItems = tableContent.split('\n').map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length === 4 && parts[0] === '' && parts[3] === '') {
      return { siteName: parts[1], rssLink: parts[2], category };
    }
    return null;
  }).filter(item => item !== null);

  if (categoryItems.length > 0) {
    categories.push(category);
    items.push(...categoryItems);
  }
}

if (items.length === 0) {
  throw new Error('README.md içinde hiç RSS kaynağı bulunamadı, data.json üretilmedi.');
}

fs.writeFileSync(outputPath, JSON.stringify({ categories, items }));
console.log(`data.json oluşturuldu: ${categories.length} kategori, ${items.length} kaynak.`);
