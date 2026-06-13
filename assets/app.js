(function () {
  'use strict';

  const LANG_KEY = 'the-portfolio-lang';

  // ── i18n ──────────────────────────────────────────────
  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute('data-lang', lang);
    updateLangToggleUI();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function updateLangToggleUI() {
    const lang = getLang();
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langTarget === lang);
    });
  }

  // ── Init ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setLang(getLang());
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.langTarget));
    });

    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    else if (page === 'articles') initListPage('articles.json', 'article');
    else if (page === 'reports') initReportsPage();
  });

  // ── Date formatting ───────────────────────────────────
  function formatDate(iso, lang) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    if (lang === 'zh') {
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function dateSpans(iso) {
    return `<span data-lang-en>${escapeHtml(formatDate(iso, 'en'))}</span>` +
           `<span data-lang-zh>${escapeHtml(formatDate(iso, 'zh'))}</span>`;
  }

  // ── Bilingual title/excerpt renderer ─────────────────
  function titleSpans(item) {
    const en = escapeHtml(item.title || '');
    const zh = escapeHtml(item.title_zh || '');
    if (en && zh) return `<span data-lang-en>${en}</span><span data-lang-zh>${zh}</span>`;
    if (en) return `<span data-lang-en>${en}</span>`;
    if (zh) return `<span data-lang-zh>${zh}</span>`;
    return '<span data-lang-en>(untitled)</span>';
  }

  function excerptSpans(item) {
    const en = escapeHtml(item.excerpt || '');
    const zh = escapeHtml(item.excerpt_zh || '');
    if (en && zh) return `<span data-lang-en>${en}</span><span data-lang-zh>${zh}</span>`;
    if (en) return `<span data-lang-en>${en}</span>`;
    if (zh) return `<span data-lang-zh>${zh}</span>`;
    return '';
  }

  // ── Home: live counts ────────────────────────────────
  async function initHome() {
    await Promise.all([
      fetchCount('articles/articles.json', document.getElementById('articleCount')),
      fetchCount('reports/reports.json', document.getElementById('reportCount')),
    ]);
  }

  async function fetchCount(manifestPath, el) {
    if (!el) return 0;
    try {
      const res = await fetch(manifestPath);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const n = Array.isArray(data) ? data.length : 0;
      el.dataset.lastN = String(n);
      renderCount(el, n);
    } catch (e) {
      el.textContent = '—';
      el.classList.add('is-empty');
    }
  }

  function renderCount(el, n) {
    if (n === 0) {
      el.classList.add('is-empty');
      el.innerHTML = '<span data-lang-en>Coming soon</span><span data-lang-zh>敬请期待</span>';
    } else {
      el.classList.remove('is-empty');
      el.innerHTML = `<span data-lang-en>${n} ${n === 1 ? 'item' : 'items'}</span><span data-lang-zh>共 ${n} 篇</span>`;
    }
  }

  // Re-render counts when language changes
  document.addEventListener('langchange', () => {
    if (document.body.dataset.page === 'home') {
      const a = document.getElementById('articleCount');
      const r = document.getElementById('reportCount');
      if (a && a.dataset.lastN !== undefined) renderCount(a, parseInt(a.dataset.lastN, 10));
      if (r && r.dataset.lastN !== undefined) renderCount(r, parseInt(r.dataset.lastN, 10));
    }
  });

  // ── List page (articles) ─────────────────────────────
  async function initListPage(manifestPath, kind) {
    const container = document.getElementById('list');
    if (!container) return;
    try {
      const res = await fetch(manifestPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${manifestPath}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        renderComingSoon(container, kind);
        return;
      }
      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      renderList(container, data, kind);
    } catch (e) {
      console.error('[portfolio] list page failed:', e);
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px;">Failed to load content. (${escapeHtml(e.message)})</p>`;
    }
  }

  function renderList(container, items, kind) {
    container.innerHTML = items.map(item => {
      // List page lives in the same folder as the content files,
      // so hrefs are relative to the current page.
      const href = item.filename;
      const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const excerpt = excerptSpans(item);
      const track = trackSpans(item);
      return `
        <a class="list-item" href="${escapeHtml(href)}">
          <div class="meta">
            ${track}
            <span class="date">${dateSpans(item.date)}</span>
          </div>
          <h3>${titleSpans(item)}</h3>
          ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ''}
          ${tags ? `<div class="tags">${tags}</div>` : ''}
        </a>`;
    }).join('');
  }

  function trackSpans(item) {
    const en = escapeHtml(item.track_en || '');
    const zh = escapeHtml(item.track || '');
    if (en && zh) return `<span class="track"><span data-lang-en>${en}</span><span data-lang-zh>${zh}</span></span>`;
    if (zh) return `<span class="track"><span data-lang-zh>${zh}</span></span>`;
    if (en) return `<span class="track"><span data-lang-en>${en}</span></span>`;
    return '';
  }

  // ── Reports page (list) ──────────────────────────────
  async function initReportsPage() {
    const container = document.getElementById('reportList');
    if (!container) return;
    try {
      const res = await fetch('reports.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching reports.json`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        renderComingSoon(container, 'report');
        return;
      }
      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      renderReportList(container, data);
    } catch (e) {
      console.error('[portfolio] reports page failed:', e);
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px;">Failed to load content. (${escapeHtml(e.message)})</p>`;
    }
  }

  function renderReportList(container, items) {
    container.innerHTML = items.map(item => {
      const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const excerpt = excerptSpans(item);
      const track = trackSpans(item);
      return `
        <a class="list-item" href="${escapeHtml(item.filename)}">
          <div class="meta">
            ${track}
            <span class="date">${dateSpans(item.date)}</span>
            <span class="open-hint">
              <span data-lang-en>Read ›</span>
              <span data-lang-zh>阅读 ›</span>
            </span>
          </div>
          <h3>${titleSpans(item)}</h3>
          ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ''}
          ${tags ? `<div class="tags">${tags}</div>` : ''}
        </a>`;
    }).join('');
  }

  // ── Coming Soon ───────────────────────────────────────
  function renderComingSoon(container, kind) {
    const isReport = kind === 'report';
    const iconSvg = isReport
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>';
    container.innerHTML = `
      <div class="coming-soon">
        <div class="illustration">${iconSvg}</div>
        <div class="label">
          <span data-lang-en>Coming Soon</span>
          <span data-lang-zh>敬请期待</span>
        </div>
        <p class="hint">
          <span data-lang-en>${isReport ? 'Reports will be published here. Each is a standalone HTML file in the <code>reports/</code> folder, listed in <code>reports.json</code>.' : 'Articles will be published here. Each is a standalone HTML file in the <code>articles/</code> folder, listed in <code>articles.json</code>.'}</span>
          <span data-lang-zh>${isReport ? '报告将发布在此处。每篇报告是 <code>reports/</code> 文件夹中的独立 HTML 文件，并在 <code>reports.json</code> 中登记。' : '文章将发布在此处。每篇文章是 <code>articles/</code> 文件夹中的独立 HTML 文件，并在 <code>articles.json</code> 中登记。'}</span>
        </p>
      </div>`;
  }

  // ── Utilities ────────────────────────────────────────
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
