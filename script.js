document.addEventListener('DOMContentLoaded', () => {
  const rawMdUrl = 'https://raw.githubusercontent.com/bakinazik/rss/main/README.md';
  const output = document.getElementById('output');
  const themeToggle = document.getElementById('checkbox');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const chipsContainer = document.getElementById('chipsContainer');
  const chipsScroll = document.getElementById('chipsScroll');

  let allRssItems = [];
  let categories = [];
  let selectedSet = new Set();
  let currentCategory = '';
  let currentSearchTerm = '';
  let displayedCount = 0;
  const BATCH_SIZE = 15;
  let isLoading = false;
  let scrollSentinel = null;
  let currentFilteredItems = [];

  const selectAllBtn = document.getElementById('selectAllBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');
  const exportBtn = document.getElementById('exportBtn');
  const selectedCountSpan = document.getElementById('selectedCount');
  const totalCountSpan = document.getElementById('totalCount');

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
      themeToggle.checked = !prefersDarkScheme.matches;
      setTheme(!prefersDarkScheme.matches);
    }
  };

  themeToggle.addEventListener('change', () => setTheme(themeToggle.checked));
  initializeTheme();

  // Logo tıklanınca aramayı ve filtreleri sıfırla
  const logoArea = document.querySelector('.logo-area');
  if (logoArea) {
    logoArea.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      currentCategory = '';
      updateUrlParameter('');
      displayedCount = 0;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      renderList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  let isDragging = false;
  let startDragX = 0;
  let startScrollLeft = 0;

  chipsContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startDragX = e.pageX;
    startScrollLeft = chipsContainer.scrollLeft;
    chipsContainer.style.cursor = 'grabbing';
    chipsContainer.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = (e.pageX - startDragX) * 2;
    chipsContainer.scrollLeft = startScrollLeft - dx;
    e.preventDefault();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      chipsContainer.style.cursor = 'grab';
      chipsContainer.style.userSelect = '';
    }
  });

  chipsContainer.addEventListener('wheel', (e) => {
    if (chipsContainer.scrollWidth > chipsContainer.clientWidth) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 400 : -400; // 3-4 kat hız
      chipsContainer.scrollBy({
        left: delta,
        behavior: 'smooth'
      });
    }
  }, { passive: false });

  chipsContainer.style.cursor = 'grab';

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  function handleSearch() {
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    updateUrlParameter(currentSearchTerm);
    displayedCount = 0;
    renderList();
  }

  function clearSearch() {
    searchInput.value = '';
    currentSearchTerm = '';
    updateUrlParameter('');
    displayedCount = 0;
    renderList();
    searchInput.focus();
  }

  searchInput.addEventListener('input', handleSearch);
  searchClearBtn?.addEventListener('click', clearSearch);

  const updateUrlParameter = (searchTerm) => {
    const url = new URL(window.location);
    if (searchTerm) url.searchParams.set('q', searchTerm);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  };

  function buildChips() {
    chipsScroll.innerHTML = '';
    
    categories.forEach(cat => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      if (currentCategory === cat) chip.classList.add('active');
      chip.setAttribute('data-category', cat);
      const itemCount = allRssItems.filter(i => i.category === cat).length;
      chip.textContent = `${cat} (${itemCount})`;
      
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedCat = chip.getAttribute('data-category');
        
        if (currentCategory === selectedCat) {
          currentCategory = '';
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        } else {
          currentCategory = selectedCat;
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
        
        displayedCount = 0;
        renderList();
      });
      
      chipsScroll.appendChild(chip);
    });
  }

  function renderList(reset = true) {
    let filtered = [...allRssItems];
    
    if (currentCategory) {
      filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    if (currentSearchTerm) {
      filtered = filtered.filter(item =>
        item.siteName.toLowerCase().includes(currentSearchTerm) ||
        item.rssLink.toLowerCase().includes(currentSearchTerm)
      );
    }
    
    filtered.sort((a, b) => a.siteName.localeCompare(b.siteName, 'tr'));
    currentFilteredItems = filtered;
    
    if (reset) {
      displayedCount = Math.min(BATCH_SIZE, filtered.length);
    }
    
    if (filtered.length === 0) {
      output.innerHTML = `
        <div class="no-results">
          <svg  xmlns="http://www.w3.org/2000/svg"  width="65"  height="65"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-mood-sad"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 10l.01 0" /><path d="M15 10l.01 0" /><path d="M9.5 15.25a3.5 3.5 0 0 1 5 0" /></svg>
          <p>Aramayla eşleşen bir sonuç bulunamadı</p>
          <a href="https://github.com/bakinazik/rss/issues/new" target="_blank" class="btn github-issue-btn">Eksik bağlantıyı bildir</a>
        </div>
      `;
      return;
    }
    
    let searchInfo = '';
    
    const itemsToShow = filtered.slice(0, displayedCount);
    let html = searchInfo + '<div class="rss-list">';
    
    itemsToShow.forEach(item => {
      const isChecked = selectedSet.has(item.rssLink);
      const domain = getDomain(item.rssLink);
      html += `
        <div class="rss-item" data-rss-link="${escapeHtml(item.rssLink)}">
          <input type="checkbox" class="rss-checkbox" data-rss="${escapeHtml(item.rssLink)}" data-site="${escapeHtml(item.siteName)}" ${isChecked ? 'checked' : ''}>
          <img class="favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%2371717a%22><path d=%22M4 4h16v16H4z%22/></svg>'">
          <div class="site-info">
            <div class="site-name">${escapeHtml(item.siteName)}</div>
            <a href="${item.rssLink}" target="_blank" class="rss-url" title="${item.rssLink}">${escapeHtml(item.rssLink)}</a>
          </div>
          <div class="item-actions">
            <button class="copy-btn" data-url="${item.rssLink}" data-tooltip="Kopyala">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2v-12.5a1.5 1.5 0 0 0 -1.5 -1.5h-9a1.5 1.5 0 0 0 -1.5 1.5z"/>
                <path d="M16 18v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h2"/>
              </svg>
            </button>
            <a href="${item.rssLink}" target="_blank" class="external-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h6"/>
                <path d="M15 3h6v6"/><path d="M10 14l11 -11"/>
              </svg>
            </a>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    if (displayedCount < filtered.length) {
      html += `<div class="loading-more" id="loadingMore"><div class="loader-small"></div><span>Daha fazla yükleniyor...</span></div>`;
    }
    
    output.innerHTML = html;
    
    attachCheckboxListeners();
    attachCopyButtons();
    attachItemClickListeners();
  }
  
  function loadMore() {
    if (isLoading) return;
    if (displayedCount >= currentFilteredItems.length) return;
    
    isLoading = true;
    const loadingMore = document.getElementById('loadingMore');
    if (loadingMore) loadingMore.style.opacity = '0.5';
    
    setTimeout(() => {
      displayedCount = Math.min(displayedCount + BATCH_SIZE, currentFilteredItems.length);
      renderList(false);
      isLoading = false;
      setupScrollObserver();
    }, 100);
  }
  
  function setupScrollObserver() {
    if (scrollSentinel) {
      scrollSentinel.removeEventListener('click', loadMore);
    }
    scrollSentinel = document.getElementById('scrollSentinel');
    if (scrollSentinel) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedCount < currentFilteredItems.length) {
          loadMore();
        }
      }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
      
      observer.observe(scrollSentinel);
    }
  }
  
  function attachItemClickListeners() {
    document.querySelectorAll('.rss-item').forEach(item => {
      item.removeEventListener('click', itemClickHandler);
      item.addEventListener('click', itemClickHandler);
    });
  }
  
  function itemClickHandler(e) {
    if (e.target.type !== 'checkbox' && !e.target.closest('.copy-btn') && !e.target.closest('.external-link') && !e.target.closest('.rss-url')) {
      const cb = this.querySelector('.rss-checkbox');
      if (cb) {
        cb.checked = !cb.checked;
        const changeEvent = new Event('change', { bubbles: true });
        cb.dispatchEvent(changeEvent);
      }
    }
  }
  
  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }
  
  function attachCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.removeEventListener('click', copyHandler);
      btn.addEventListener('click', copyHandler);
    });
  }
  
  async function copyHandler(e) {
    e.stopPropagation();
    const url = this.getAttribute('data-url');
    if (url) {
      await navigator.clipboard.writeText(url);
      const original = this.innerHTML;
      this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
      setTimeout(() => this.innerHTML = original, 1500);
    }
  }
  
  function attachCheckboxListeners() {
    document.querySelectorAll('.rss-checkbox').forEach(cb => {
      cb.removeEventListener('change', onCheckboxChange);
      cb.addEventListener('change', onCheckboxChange);
    });
  }
  
  function onCheckboxChange(e) {
    e.stopPropagation();
    const rss = e.target.getAttribute('data-rss');
    if (e.target.checked) {
      selectedSet.add(rss);
    } else {
      selectedSet.delete(rss);
    }
    updateSelectedCount();
  }
  
  function updateSelectedCount() {
    const count = selectedSet.size;
    const countSpan = selectedCountSpan.querySelector('span');
    if (countSpan) countSpan.textContent = count;
    
    document.querySelectorAll('.rss-checkbox').forEach(cb => {
      const rss = cb.getAttribute('data-rss');
      cb.checked = selectedSet.has(rss);
    });
  }
  
  function selectAll() {
    let itemsToSelect = [...allRssItems];
    
    if (currentCategory) {
      itemsToSelect = itemsToSelect.filter(item => item.category === currentCategory);
    }
    
    if (currentSearchTerm) {
      itemsToSelect = itemsToSelect.filter(item =>
        item.siteName.toLowerCase().includes(currentSearchTerm) ||
        item.rssLink.toLowerCase().includes(currentSearchTerm)
      );
    }
    
    itemsToSelect.forEach(item => selectedSet.add(item.rssLink));
    updateSelectedCount();
    renderList();
  }
  
  function clearSelection() {
    selectedSet.clear();
    updateSelectedCount();
    renderList();
  }
    
  function buildOPML() {
    if (selectedSet.size === 0) {
      alert('Dışa aktarmak için en az bir RSS kaynağı seçin.');
      return null;
    }
    
    const categoryMap = new Map();
    selectedSet.forEach(rss => {
      const item = allRssItems.find(it => it.rssLink === rss);
      if (item) {
        if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
        categoryMap.get(item.category).push(item);
      }
    });
    
    let outlines = [];
    for (const [category, items] of categoryMap) {
      const subOutlines = items.map(item => 
        `<outline type="rss" text="${escapeXml(item.siteName)}" title="${escapeXml(item.siteName)}" xmlUrl="${escapeXml(item.rssLink)}"/>`
      ).join('\n      ');
      outlines.push(`<outline text="${escapeXml(category)}" title="${escapeXml(category)}">\n      ${subOutlines}\n    </outline>`);
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="1.0">\n  <head>\n    <title>RSS Bağlantıları - Seçili Kaynaklar</title>\n  </head>\n  <body>\n    ${outlines.join('\n    ')}\n  </body>\n</opml>`;
  }
  
  function exportOPML() {
    const opml = buildOPML();
    if (!opml) return;
    
    const blob = new Blob([opml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    a.href = url;
    a.download = `rss-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.opml`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  selectAllBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    selectAll();
  });
  
  clearSelectionBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSelection();
  });
  
  exportBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    exportOPML();
  });
  
  function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
  }
  
  function escapeXml(s) {
    return String(s).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
  }
  
  fetch(rawMdUrl)
    .then(res => res.text())
    .then(md => {
      const categoryRegex = /#\s+([^\n]+)\n\n\| Site Adı \| RSS Bağlantısı \|\n\|:-------- \| -----------:\|\n([\s\S]+?)(?=\n# |$)/g;
      let match;
      
      while ((match = categoryRegex.exec(md)) !== null) {
        const category = match[1].trim();
        const tableContent = match[2].trim();
        
        const items = tableContent.split('\n').map(line => {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length === 4 && parts[0] === '' && parts[3] === '') {
            return { siteName: parts[1], rssLink: parts[2], category };
          }
          return null;
        }).filter(item => item !== null);
        
        if (items.length > 0) {
          categories.push(category);
          allRssItems.push(...items);
        }
      }
      
      totalCountSpan.textContent = allRssItems.length;
      buildChips();
      renderList();
      setupScrollObserver();
      
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('q');
      if (searchQuery) {
        searchInput.value = searchQuery;
        currentSearchTerm = searchQuery;
        renderList();
      }
    })
    .catch(err => {
      output.innerHTML = `<div class="no-results"><p>❌ Veri yüklenemedi: ${err.message}</p><small>Lütfen daha sonra tekrar deneyin.</small></div>`;
      console.error('Fetch error:', err);
    });

  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});