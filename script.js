document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('checkbox');
  const searchInput = document.getElementById('searchInput');
  const mainHeaderH1 = document.querySelector('.main-header h1');
  const body = document.body;

  let allCategoriesData = [];
  let allRssItems = [];

  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function setTheme(isLight) {
    if (isLight) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      themeToggle.checked = true;
      setTheme(true);
    } else if (savedTheme === 'dark') {
        themeToggle.checked = false;
        setTheme(false);
    } else {
        if (prefersDarkScheme.matches) {
            themeToggle.checked = false;
            setTheme(false);
        } else {
            themeToggle.checked = true;
            setTheme(true);
        }
    }
  };

  themeToggle.addEventListener('change', function() {
    setTheme(this.checked);
  });

  prefersDarkScheme.addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) {
      setTheme(!e.matches);
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

  mainHeaderH1.addEventListener('click', () => {
    searchInput.value = '';
    updateUrlParameter('');
    renderCategories(allCategoriesData);
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
        try {
          const domain = new URL(item.rssLink).hostname;
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
          tableHtml += `<tr><td data-label="Site Adı"><img src="${faviconUrl}" alt="Favicon" class="favicon">${item.siteName}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
        } catch (e) {
          console.error('Invalid URL:', item.rssLink, e);
          tableHtml += `<tr><td data-label="Site Adı">${item.siteName}</td><td data-label="RSS Bağlantısı" style="color: red;">Geçersiz URL: ${item.rssLink}</td></tr>`;
        }
      });
      tableHtml += '</tbody></table>';

      htmlContent += `
        <div class="category">
          <div class="category-header" data-category="${categoryData.category}">
            ${categoryData.category} <span>${categoryData.items.length}</span>
            <svg class="icon icon-tabler icon-tabler-menu closed-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8l16 0" /><path d="M4 16l16 0" /></svg>
            <svg class="icon icon-tabler icon-tabler-x open-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
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
        const content = header.nextElementSibling;
        const isExpanded = header.classList.contains('expanded');

        const handleTransitionEnd = () => {
          content.removeEventListener('transitionend', handleTransitionEnd);
          if (!header.classList.contains('expanded')) {
            content.style.display = 'none';
          } else {
            content.style.height = 'auto';
          }
        };

        if (isExpanded) {
          content.style.height = content.scrollHeight + 'px'; 
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              header.classList.remove('expanded');
              content.style.opacity = '0';
              content.style.height = '0';
              content.style.marginBottom = '0';
              content.style.visibility = 'hidden';
              content.addEventListener('transitionend', handleTransitionEnd);
            });
          });
        } else {
          content.style.display = 'block';
          content.style.height = 'auto';
          const contentHeight = content.scrollHeight;

          content.style.height = '0';
          content.style.opacity = '0';
          content.style.visibility = 'visible';

          requestAnimationFrame(() => {
            header.classList.add('expanded');
            content.style.height = contentHeight + 'px';
            content.style.opacity = '1';
            content.style.marginBottom = '20px';
            content.addEventListener('transitionend', handleTransitionEnd);
          });
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
    allCategoriesData = [];
    allRssItems = [];

    const categoryRegex = /#\s+(.+?)\n\n\| Site Adı \| RSS Bağlantısı \|\n\|:.*?:\|.*?:\|\n((?:\|.*\|\n?)*)/g;
    let match;

    while ((match = categoryRegex.exec(md)) !== null) {
      const category = match[1].trim();
      const tableContent = match[2].trim();

      const items = tableContent.split('\n').map(line => {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 4) {
          const siteName = parts[1];
          const rssLink = parts[2];
          return { siteName, rssLink, category };
        }
        return null;
      }).filter(item => item !== null);

      if (items.length > 0) {
        allCategoriesData.push({ category, items });
        allRssItems.push(...items);
      }
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
