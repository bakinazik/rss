document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('checkbox');
  const searchInput = document.getElementById('searchInput');

  let allCategoriesData = []; // To store parsed data for search
  let allRssItems = []; // To store a flat list of all RSS items for direct search

  // --- Theme Logic ---
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = (isDark, enableTransition = false) => {
    const rootElement = document.documentElement; // Target <html> element
    if (enableTransition) {
      rootElement.classList.add('theme-transition-active'); // Add class to enable transition
    } else {
      // Ensure transition is removed for initial load or if explicitly disabled
      rootElement.classList.remove('theme-transition-active');
    }
    rootElement.classList.toggle('dark-mode', isDark);
    themeToggle.checked = isDark; // Set the checkbox state based on the theme
  };

  const initializeTheme = () => {
    // This function runs after the inline script has already set the initial theme.
    // Its main purpose now is to set up the toggle's initial state and enable transitions.
    const storedTheme = localStorage.getItem('theme');
    let isDark;

    if (storedTheme !== null) {
      isDark = (storedTheme === 'dark');
    } else {
      isDark = prefersDarkScheme.matches;
    }
    themeToggle.checked = isDark; // Set the toggle to match the already applied theme

    // Immediately add the transition class after the page is loaded
    // This ensures that all *subsequent* changes will have a transition.
    // A timeout of 0ms ensures it runs after current rendering cycle, without visual flicker.
    setTimeout(() => {
      document.documentElement.classList.add('theme-transition-active');
    }, 0);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark-mode');
    applyTheme(!isDark, true); // Enable transition when toggling
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  themeToggle.addEventListener('change', toggleTheme);
  prefersDarkScheme.addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) { // Only change if no manual override
      applyTheme(e.matches, true); // Enable transition for system preference changes
    }
  });

  initializeTheme(); // Call this to set up toggle state and enable transitions

  // --- Search Logic ---
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (searchTerm === '') {
      renderCategories(allCategoriesData); // Show all categories if search is empty
    } else {
      filterAndRenderSearchResults(searchTerm);
    }
  });

  const filterAndRenderSearchResults = (searchTerm) => {
    output.innerHTML = ''; // Clear current content

    const filteredItems = allRssItems.filter(item =>
      item.siteName.toLowerCase().includes(searchTerm) ||
      item.rssLink.toLowerCase().includes(searchTerm)
    );

    if (filteredItems.length > 0) {
      let resultsHtml = '<div class="search-results-list"><table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      filteredItems.forEach(item => {
        resultsHtml += `<tr><td data-label="Site Adı">${item.siteName}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
      });
      resultsHtml += '</tbody></table></div>';
      output.innerHTML = resultsHtml;
    } else {
      output.innerHTML = '<div class="no-results">Aradığınız kriterlere uygun sonuç bulunamadı.</div>';
    }
  };

  // --- Render Categories (Original View) ---
  const renderCategories = (data) => {
    let htmlContent = '';
    data.forEach(categoryData => {
      let tableHtml = '<table><thead><tr><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      categoryData.items.forEach(item => {
        tableHtml += `<tr><td data-label="Site Adı">${item.siteName}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
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
    addToggleListeners(); // Re-add listeners for newly rendered categories
  };

  // --- Add Toggle Listeners for Category Headers ---
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

  // --- Fetch and Parse Markdown ---
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
        const dataLines = lines.slice(2); // Skip header and separator

        const items = dataLines.map(line => {
          const parts = line.split('|').map(part => part.trim()).filter(part => part !== '');
          if (parts.length === 2) {
            return { siteName: parts[0], rssLink: parts[1], category: category }; // Add category for context if needed later
          }
          return null;
        }).filter(item => item !== null);

        allCategoriesData.push({ category, items });
        allRssItems.push(...items); // Populate flat list for search
      }
      renderCategories(allCategoriesData); // Initial render with categories
    })
    .catch(err => {
      output.textContent = `Hata: İçerik yüklenemedi. Detay: ${err.message}`;
      console.error('Fetch error:', err);
    });
});
