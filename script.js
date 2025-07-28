document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('checkbox');
  const searchInput = document.getElementById('searchInput');

  let allCategoriesData = [];
  let allRssItems = [];

  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = (isDark, enableTransition = false) => {
    const rootElement = document.documentElement;
    if (enableTransition) {
      rootElement.classList.add('theme-transition-active');
    } else {
      rootElement.classList.remove('theme-transition-active');
    }
    rootElement.classList.toggle('dark-mode', isDark);
    themeToggle.checked = isDark;
  };

  const initializeTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    let isDark;

    if (storedTheme !== null) {
      isDark = (storedTheme === 'dark');
    } else {
      isDark = prefersDarkScheme.matches;
    }
    themeToggle.checked = isDark;

    setTimeout(() => {
      document.documentElement.classList.add('theme-transition-active');
    }, 0);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark-mode');
    applyTheme(!isDark, true);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  themeToggle.addEventListener('change', toggleTheme);
  prefersDarkScheme.addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) {
      applyTheme(e.matches, true);
    }
  });

  initializeTheme();
  document.getElementById('searchInput')?.focus();
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    updateUrlParameter(searchTerm);
    if (searchTerm === '') {
      renderCategories(allCategoriesData);
    } else {
      filterAndRenderSearchResults(searchTerm);
    }
  });

  const updateUrlParameter = (searchTerm) => {
    const url = new URL(window.location);
    if (searchTerm) {
      url.searchParams.set('q', searchTerm);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
  };

  const filterAndRenderSearchResults = (searchTerm) => {
    output.innerHTML = '';

    const filteredItems = allRssItems.filter(item =>
      item.siteName.toLowerCase().includes(searchTerm) ||
      item.rssLink.toLowerCase().includes(searchTerm)
    );

    if (filteredItems.length > 0) {
      let resultsHtml = '<div class="search-results-list"><table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      filteredItems.forEach(item => {
        const domain = new URL(item.rssLink).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        resultsHtml += `<tr><td data-label="Site Adı"><img src="${faviconUrl}" alt="Favicon" class="favicon">${item.siteName}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
      });
      resultsHtml += '</tbody></table></div>';
      output.innerHTML = resultsHtml;
    } else {
      output.innerHTML = '<div class="no-results">Aradığınız kriterlere uygun sonuç bulunamadı.</div>';
    }
  };

  const renderCategories = (data) => {
    let htmlContent = '';
    data.forEach(categoryData => {
      let tableHtml = '<table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      categoryData.items.forEach(item => {
        const domain = new URL(item.rssLink).hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        tableHtml += `<tr><td data-label="Site Adı"><img src="${faviconUrl}" alt="Favicon" class="favicon">${item.siteName}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
      });
      tableHtml += '</tbody></table>';

      htmlContent += `
        <div class="category">
          <div class="category-header" data-category="${categoryData.category}">
            ${categoryData.category} <span>${categoryData.items.length}</span>
          </div>
          <div class="category-content">
            ${tableHtml}
          </div>
        </div>
      `;
    });
    output.innerHTML = htmlContent;
    addToggleListeners();
  };

  const addToggleListeners = () => {
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

        const items = dataLines.map(line => {
          const parts = line.split('|').map(part => part.trim()).filter(part => part !== '');
          if (parts.length === 2) {
            return { siteName: parts[0], rssLink: parts[1], category: category };
          }
          return null;
        }).filter(item => item !== null);

        allCategoriesData.push({ category, items });
        allRssItems.push(...items);
      }
      renderCategories(allCategoriesData);

      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('q');
      if (searchQuery) {
        searchInput.value = searchQuery;
        filterAndRenderSearchResults(searchQuery);
      }
    })
    .catch(err => {
      output.textContent = `Hata: İçerik yüklenemedi. Detay: ${err.message}`;
      console.error('Fetch error:', err);
    });
});
