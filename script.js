document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('theme-toggle');
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  let allCategoriesData = []; // Store the parsed data

  // Theme Toggling
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    document.body.classList.toggle('theme-light');
    // Save theme preference to localStorage
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
  });

  // Apply saved theme on load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${savedTheme}`);
  } else {
    // Default to light theme if no preference is saved
    document.body.classList.add('theme-light');
  }

  // Search Functionality
  searchButton.addEventListener('click', () => {
    searchInput.classList.toggle('visible');
    if (searchInput.classList.contains('visible')) {
      searchInput.focus();
    } else {
      searchInput.value = ''; // Clear search on hide
      renderCategories(allCategoriesData); // Restore all categories
    }
  });

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterCategories(searchTerm);
  });

  const renderCategories = (categoriesToRender) => {
    let htmlContent = '';
    if (categoriesToRender.length === 0 && searchInput.value.trim() !== '') {
      htmlContent = '<div class="no-results">Aradığınız kriterlere uygun sonuç bulunamadı.</div>';
    } else {
      categoriesToRender.forEach(({ category, tablesHtml, dataLinesCount }) => {
        htmlContent += `
          <div class="category">
            <div class="category-header" data-category="${category}">
              ${category} <span>${dataLinesCount}</span>
            </div>
            <div class="category-content">
              ${tablesHtml}
            </div>
          </div>
        `;
      });
    }
    output.innerHTML = htmlContent;

    // Add event listeners for toggling content after rendering
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
  };

  const filterCategories = (searchTerm) => {
    const filteredData = [];
    allCategoriesData.forEach(categoryData => {
      const filteredTablesHtml = [];
      let currentCategoryMatchCount = 0;

      // Filter within each category's tables
      categoryData.rawTableLines.forEach(line => {
        if (line.toLowerCase().includes(searchTerm)) {
          const parts = line.split('|').map(part => part.trim()).filter(part => part !== '');
          if (parts.length === 2) {
            const siteName = parts[0];
            const rssLink = parts[1];
            filteredTablesHtml.push(`<tr><td data-label="Site Adı">${siteName}</td><td data-label="RSS Bağlantısı"><a href="${rssLink}" target="_blank">${rssLink}</a></td></tr>`);
            currentCategoryMatchCount++;
          }
        }
      });

      if (categoryData.category.toLowerCase().includes(searchTerm) || currentCategoryMatchCount > 0) {
        let tableHtml = '';
        if (filteredTablesHtml.length > 0) {
          tableHtml = '<table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
          tableHtml += filteredTablesHtml.join('');
          tableHtml += '</tbody></table>';
        } else if (categoryData.category.toLowerCase().includes(searchTerm) && searchTerm.length > 0) {
          // If category name matches but no RSS links, still show the category header
          tableHtml = categoryData.tablesHtml; // show all RSS links if category name searched
          currentCategoryMatchCount = categoryData.dataLinesCount; // Show original count
        } else {
          tableHtml = ''; // No match in category name or content
        }

        if (tableHtml) {
          filteredData.push({
            category: categoryData.category,
            tablesHtml: tableHtml,
            dataLinesCount: currentCategoryMatchCount > 0 ? currentCategoryMatchCount : categoryData.dataLinesCount, // Use filtered count or original if category name matched
            rawTableLines: categoryData.rawTableLines // Keep for future filtering
          });
        }
      }
    });

    renderCategories(filteredData);
  };


  fetch(rawMdUrl)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.text();
    })
    .then(md => {
      const categoryRegex = /# ([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|([\s\S]+?)(?=\n# |$)/g;
      let match;

      while ((match = categoryRegex.exec(md)) !== null) {
        const category = match[1].trim();
        const tableContent = match[2].trim();

        const lines = tableContent.split('\n').filter(line => line.trim() !== '');
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

        allCategoriesData.push({
          category: category,
          tablesHtml: tableHtml,
          dataLinesCount: dataLines.length,
          rawTableLines: dataLines // Store raw lines for searching
        });
      }
      renderCategories(allCategoriesData);
    })
    .catch(err => {
      output.textContent = `Hata: İçerik yüklenemedi. Detay: ${err.message}`;
      console.error('Fetch error:', err);
    });
});
