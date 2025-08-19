document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('checkbox');
  const searchInput = document.getElementById('searchInput');
  const mainHeaderH1 = document.querySelector('.main-header h1');
  const body = document.body;

  let allCategoriesData = [];
  let allRssItems = [];
  const selectAllBtn = document.getElementById('selectAllBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  const exportBtn = document.getElementById('exportBtn');
  const selectedCountSpan = document.getElementById('selectedCount');
  const selectedSet = new Set();

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
  searchInput.setAttribute('placeholder', 'Ne arıyorsun? (Ctrl+K)');

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
  
  const searchClearBtn = document.getElementById('searchClearBtn');

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    updateUrlParameter(searchTerm);
    if (searchTerm === '') {
      renderCategories(allCategoriesData);
      searchInput.classList.remove('has-value');
      searchClearBtn.style.display = 'none';
    } else {
      filterAndRenderSearchResults(searchTerm);
      searchInput.classList.add('has-value');
      searchClearBtn.style.display = 'block';
    }
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    updateUrlParameter('');
    renderCategories(allCategoriesData);
    searchInput.classList.remove('has-value');
    searchClearBtn.style.display = 'none';
    searchInput.focus();
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
      let resultsHtml = '<div class="search-results-list"><table><thead><tr><th></th><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      filteredItems.forEach(item => {
        try {
          const domain = new URL(item.rssLink).hostname;
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
          const checked = selectedSet.has(item.rssLink) ? 'checked' : '';
          resultsHtml += `<tr><td data-label="Seç"><input type="checkbox" class="rss-checkbox" data-rss="${item.rssLink}" data-site="${escapeHtml(item.siteName)}" ${checked}></td><td data-label="Site Adı"><img src="${faviconUrl}" alt="Favicon" class="favicon">${escapeHtml(item.siteName)}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
        } catch (e) {
          console.error('Invalid URL:', item.rssLink, e);
          const checked = selectedSet.has(item.rssLink) ? 'checked' : '';
          resultsHtml += `<tr><td data-label="Seç"><input type="checkbox" class="rss-checkbox" data-rss="${item.rssLink}" data-site="${escapeHtml(item.siteName)}" ${checked}></td><td data-label="Site Adı">${escapeHtml(item.siteName)}</td><td data-label="RSS Bağlantısı" style="color: red;">Geçersiz URL: ${item.rssLink}</td></tr>`;
        }
      });
      resultsHtml += '</tbody></table></div>';
      output.innerHTML = resultsHtml;
      attachCheckboxListeners();
    } else {
      const searchTerm = searchInput.value.trim();
      const githubIssueUrl = searchTerm
        ? `https://github.com/bakinazik/rss/issues/new?title=RSS%20isteği:%20${encodeURIComponent(searchTerm)}`
        : 'https://github.com/bakinazik/rss/issues/new';
      output.innerHTML = `
        <div class="no-results">
          Aradığınız kriterlere uygun sonuç bulunamadı.<br>
          <a href="${githubIssueUrl}" target="_blank" class="btn github-issue-btn" style="margin-top:32px;display:inline-block;">Eklenmesini istediğiniz RSS bağlantısını bize bildirin</a>
        </div>
      `;
    }
  };

  const renderCategories = (data) => {
    let htmlContent = '';
    data.forEach((categoryData, catIdx) => {
      let tableHtml = '<table><thead><tr><th>Seç</th><th>Site Adı</th><th>RSS Bağlantısı</th></tr></thead><tbody>';
      categoryData.items.forEach(item => {
        try {
          let urlForFavicon = item.rssLink;
          let domain;
          try {
            domain = new URL(urlForFavicon).hostname;
          } catch (e) {
            const urlMatch = urlForFavicon.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
            domain = urlMatch ? urlMatch[1] : null;
          }
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
          const checked = selectedSet.has(item.rssLink) ? 'checked' : '';
          tableHtml += `<tr><td data-label="Seç"><input type="checkbox" class="rss-checkbox" data-rss="${item.rssLink}" data-site="${escapeHtml(item.siteName)}" ${checked}></td><td data-label="Site Adı"><img src="${faviconUrl}" alt="Favicon" class="favicon">${escapeHtml(item.siteName)}</td><td data-label="RSS Bağlantısı"><a href="${item.rssLink}" target="_blank">${item.rssLink}</a></td></tr>`;
        } catch (e) {
          console.error('Invalid URL:', item.rssLink, e);
          const checked = selectedSet.has(item.rssLink) ? 'checked' : '';
          tableHtml += `<tr><td data-label="Seç"><input type="checkbox" class="rss-checkbox" data-rss="${item.rssLink}" data-site="${escapeHtml(item.siteName)}" ${checked}></td><td data-label="Site Adı">${escapeHtml(item.siteName)}</td><td data-label="RSS Bağlantısı" style="color: red;">Geçersiz URL: ${item.rssLink}</td></tr>`;
        }
      });
      tableHtml += '</tbody></table>';

      const selectedInCategory = categoryData.items.filter(item => selectedSet.has(item.rssLink)).length;
      const totalInCategory = categoryData.items.length;
      let counterText = `${totalInCategory}`;
      let counterClass = 'category-count';
      if (selectedInCategory > 0) {
        counterText = `${selectedInCategory}/${totalInCategory}`;
        counterClass = 'category-count selected';
      }

      htmlContent += `
        <div class="category">
          <div class="category-header" data-category="${categoryData.category}">
            <span class="${counterClass}">${counterText}</span>
            <p>${categoryData.category}</p>
            <button class="btn select-category-btn" data-cat="${catIdx}" style="display:none;">Tümünü Seç</button>
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
    attachCheckboxListeners();
    attachCategorySelectListeners();
    updateCategorySelectBtnVisibility();
  };

  function updateCategorySelectBtnVisibility() {
    document.querySelectorAll('.category').forEach(cat => {
      const header = cat.querySelector('.category-header');
      const btn = cat.querySelector('.select-category-btn');
      if (header.classList.contains('expanded')) {
        btn.style.display = 'inline-block';
      } else {
        btn.style.display = 'none';
      }
    });
  }

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
        setTimeout(updateCategorySelectBtnVisibility, 350);
      });
    });
  };

  function attachCheckboxListeners() {
    document.querySelectorAll('.rss-checkbox').forEach(cb => {
      cb.removeEventListener('change', onCheckboxChange);
      cb.addEventListener('change', onCheckboxChange);
    });
  }

  function onCheckboxChange(e) {
    const rss = e.target.getAttribute('data-rss');
    const site = e.target.getAttribute('data-site') || '';
    if (e.target.checked) {
      selectedSet.add(rss);
    } else {
      selectedSet.delete(rss);
    }
    updateSelectedCount();
  }

  function updateSelectedCount() {
    selectedCountSpan.textContent = `${selectedSet.size} seçili`;
    if (selectedSet.size > 0) {
      selectedCountSpan.classList.add('active');
    } else {
      selectedCountSpan.classList.remove('active');
    }
    document.querySelectorAll('.category').forEach((cat, idx) => {
      const header = cat.querySelector('.category-header');
      const category = allCategoriesData[idx];
      if (!header || !category) return;
      const selectedInCategory = category.items.filter(item => selectedSet.has(item.rssLink)).length;
      const totalInCategory = category.items.length;
      const span = header.querySelector('span');
      if (span) {
        if (selectedInCategory > 0) {
          span.textContent = `${selectedInCategory}/${totalInCategory}`;
          span.classList.add('selected');
        } else {
          span.textContent = `${totalInCategory}`;
          span.classList.remove('selected');
        }
      }
    });
  }

  function selectAll() {
    document.querySelectorAll('.rss-checkbox').forEach(cb => {
      cb.checked = true;
      selectedSet.add(cb.getAttribute('data-rss'));
    });
    updateSelectedCount();
  }

  function clearSelection() {
    document.querySelectorAll('.rss-checkbox').forEach(cb => {
      cb.checked = false;
    });
    selectedSet.clear();
    updateSelectedCount();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildOPML() {
    if (selectedSet.size === 0) {
      alert('İndirmek için en az bir RSS seçin.');
      return null;
    }

    const categoryMap = {};
    selectedSet.forEach(rss => {
      const item = allRssItems.find(it => it.rssLink === rss);
      if (!item) return;
      if (!categoryMap[item.category]) categoryMap[item.category] = [];
      categoryMap[item.category].push(item);
    });

    let outlines = [];
    Object.entries(categoryMap).forEach(([category, items]) => {
      let subOutlines = items.map(item => {
        const title = escapeXml(item.siteName || item.rssLink);
        const xmlUrl = escapeXml(item.rssLink);
        return `<outline type="rss" text="${title}" title="${title}" xmlUrl="${xmlUrl}"/>`;
      }).join('\n      ');
      outlines.push(`<outline text="${escapeXml(category)}" title="${escapeXml(category)}">\n      ${subOutlines}\n    </outline>`);
    });

    const opml = `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="1.0">\n  <head>\n    <title>RSS Bağlantıları - Seçim</title>\n  </head>\n  <body>\n    ${outlines.join('\n    ')}\n  </body>\n</opml>`;
    return opml;
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  selectAllBtn?.addEventListener('click', (e) => { e.preventDefault(); selectAll(); });
  clearSelectionBtn?.addEventListener('click', (e) => { e.preventDefault(); clearSelection(); });
  exportBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const opml = buildOPML();
    if (!opml) return;
    const blob = new Blob([opml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth()+1).padStart(2,'0');
    const dd = String(now.getDate()).padStart(2,'0');
    const hh = String(now.getHours()).padStart(2,'0');
    const min = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    const rand = Math.floor(Math.random()*10000);
    const filename = `rss-${yyyy}${mm}${dd}-${hh}${min}${ss}-${rand}.opml`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  function attachCategorySelectListeners() {
    document.querySelectorAll('.select-category-btn').forEach(btn => {
      btn.removeEventListener('click', btn._catSelectHandler);
      btn._catSelectHandler = function() {
        const catIdx = this.getAttribute('data-cat');
        const category = allCategoriesData[catIdx];
        if (!category) return;
        category.items.forEach(item => {
          selectedSet.add(item.rssLink);
          const cb = document.querySelector(`.rss-checkbox[data-rss="${item.rssLink}"]`);
          if (cb) cb.checked = true;
        });
        updateSelectedCount();
      };
      btn.addEventListener('click', btn._catSelectHandler);
    });
  }

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

      const categoryRegex = /#\s+([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|\n\|:-------- \| -----------:\|\n([\s\S]+?)(?=\n# |$)/g;
      let match;

      while ((match = categoryRegex.exec(md)) !== null) {
        const category = match[1].trim();
        const tableContent = match[2].trim();

        const items = tableContent.split('\n').map(line => {
          const parts = line.split('|').map(part => part.trim());
          if (parts.length === 4 && parts[0] === '' && parts[3] === '') {
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

  const stickyBar = document.querySelector('.sticky-action-bar');
  if (stickyBar) {
    const yapildiSpan = stickyBar.querySelector('.yapildi-span');
    const issueBtn = document.createElement('a');
    issueBtn.href = 'https://github.com/bakinazik/rss/issues/new';
    issueBtn.target = '_blank';
    issueBtn.className = 'btn issue-footer-btn';
    issueBtn.textContent = 'Sorun Bildir';
    issueBtn.style.background = '#e53935';
    issueBtn.style.color = '#fff';
    issueBtn.style.fontWeight = 'bold';
    issueBtn.style.marginLeft = '16px';
    issueBtn.style.borderRadius = '6px';
    issueBtn.style.padding = '6px 16px';
    issueBtn.style.boxShadow = '0 2px 8px rgba(229,57,53,0.12)';
    issueBtn.style.display = 'inline-block';
    issueBtn.style.verticalAlign = 'middle';
    if (yapildiSpan) {
      yapildiSpan.parentNode.insertBefore(issueBtn, yapildiSpan.nextSibling);
    } else {
      stickyBar.appendChild(issueBtn);
    }
  }
});
