(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────
  //  filters.js
  //  Faceted filter rail for collection pages (Reports, Articles).
  //
  //  Each page declares its facets via PortfolioFilters.init(...):
  //    facets: [
  //      { key, label, items?, sourceField?, granularity?,
  //        valueMap?, labels?, controlStyle: 'chips' | 'dropdown' }
  //    ]
  //
  //  Facets are evaluated in order. A facet's options and counts
  //  are derived from items that match all higher-priority facets.
  //  Selecting a value on facet N resets all facets below N to
  //  'all'. (Vertical → Channel → Period cascade.)
  //
  //  Two engine paths:
  //    - opts.facets  : new faceted engine (used by Reports)
  //    - opts.axes    : legacy 2-axis engine (used by Articles)
  //  Both share label maps, render primitives, and item rendering.
  // ─────────────────────────────────────────────────────────

  const CHANNEL_LABELS = {
    tiktok:   'TikTok',
    amazon:   'Amazon',
    industry: 'Industry'
  };

  const VERTICAL_LABELS = {
    'pet-supplies':       'Pet Goods',
    'home-improvement':   'Home Improvement',
    'home-appliances':    'Home Appliances',
    'consumer-tools':     'Consumer Tools'
  };

  const TRACK_LABELS = {
    i:  { en: 'Track I',  zh: '赛道一' },
    ii: { en: 'Track II', zh: '赛道二' }
  };

  const MAX_INLINE_TAGS = 6;

  // ── Utilities ───────────────────────────────────────────
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function labelForChannel(v) { return CHANNEL_LABELS[v] || v; }
  function labelForVertical(v) { return VERTICAL_LABELS[v] || v; }
  function labelForTrack(v) { return TRACK_LABELS[v] ? TRACK_LABELS[v].en : v; }
  function labelForFacetValue(facet, v) {
    if (v === 'all') return 'All';
    if (facet.labels && facet.labels[v]) return facet.labels[v];
    if (facet.key === 'channel') return labelForChannel(v);
    if (facet.key === 'vertical') return labelForVertical(v);
    if (facet.key === 'track') return labelForTrack(v);
    return v;
  }

  // ── URL state ───────────────────────────────────────────
  function readStateFromUrl(keys) {
    const params = new URLSearchParams(global.location.search);
    const out = {};
    keys.forEach(k => { out[k] = params.get(k) || 'all'; });
    return out;
  }

  function writeStateToUrl(state) {
    const params = new URLSearchParams(global.location.search);
    Object.keys(state).forEach(k => {
      if (!state[k] || state[k] === 'all') params.delete(k);
      else params.set(k, state[k]);
    });
    const qs = params.toString();
    const url = global.location.pathname + (qs ? '?' + qs : '') + global.location.hash;
    global.history.replaceState(state, '', url);
  }

  // ── Facet value resolution ──────────────────────────────
  // Given a facet, derive the list of values to render in its control.
  // For a static-items facet: returns facet.items.
  // For a date-derived facet: scans items[facet.sourceField], bucketed
  //   by facet.granularity (currently 'month'), returns sorted list.
  function getFacetValues(facet, items) {
    if (facet.items) return facet.items.slice();
    if (facet.sourceField === 'date' && facet.granularity === 'month') {
      const set = new Set();
      items.forEach(it => {
        const d = (it[facet.sourceField] || '').slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(d)) set.add(d);
      });
      return [...set].sort().reverse(); // newest first
    }
    return [];
  }

  function labelForDateValue(iso) {
    // '2026-05' -> 'May 2026'
    if (!iso) return iso;
    const [y, m] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const idx = parseInt(m, 10) - 1;
    if (isNaN(idx)) return iso;
    return `${months[idx]} ${y}`;
  }

  // ── Facet value matching (item ↔ state) ────────────────
  function itemMatchesFacet(item, facet, sel) {
    if (!sel || sel === 'all') return true;
    if (facet.valueMap) {
      const dataVal = facet.valueMap[sel];
      if (dataVal !== undefined) return item[facet.key] === dataVal;
    }
    if (facet.sourceField === 'tags') {
      return (item.tags || []).includes(sel);
    }
    if (facet.sourceField === 'date' && facet.granularity === 'month') {
      return (item[facet.sourceField] || '').slice(0, 7) === sel;
    }
    return item[facet.key] === sel;
  }

  // ── Counts per facet (cascading) ────────────────────────
  // For each value V in the facet's possible values, count items that
  // match all higher-priority facets AND have V on this facet.
  // 'all' on this facet = count of items matching higher-priority facets only.
  function countsForFacet(items, facet, facetIndex, facets, state) {
    // higher-priority facets' selection
    const higher = [];
    for (let i = 0; i < facetIndex; i++) {
      higher.push({ facet: facets[i], sel: state[facets[i].key] });
    }
    const matchesHigher = it => higher.every(h => itemMatchesFacet(it, h.facet, h.sel));

    const values = getFacetValues(facet, items);
    const counts = {};
    values.forEach(v => {
      counts[v] = items.filter(it => matchesHigher(it) && itemMatchesFacet(it, facet, v)).length;
    });
    counts.all = items.filter(matchesHigher).length;
    return counts;
  }

  // ── Item filtering (all facets) ─────────────────────────
  function filterItemsByFacets(items, state, facets) {
    return items.filter(it =>
      facets.every(f => itemMatchesFacet(it, f, state[f.key]))
    );
  }

  // ── Item rendering (replicates app.js template) ─────────
  function renderItemHtml(item, kind) {
    const href = escapeHtml(item.filename);
    const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const track = trackSpan(item);
    const date = dateSpan(item.date, kind);
    const title = titleSpan(item);
    const excerpt = excerptSpan(item);
    const openHint = kind === 'report'
      ? `<span class="open-hint"><span data-lang-en>Read ›</span><span data-lang-zh>阅读 ›</span></span>`
      : '';
    return `
      <a class="list-item" href="${href}">
        <div class="meta">
          ${track}
          ${date}
          ${openHint}
        </div>
        <h3>${title}</h3>
        ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ''}
        ${tags ? `<div class="tags">${tags}</div>` : ''}
      </a>`;
  }

  function trackSpan(item) {
    if (item.track_en && item.track) {
      return `<span class="track"><span data-lang-en>${escapeHtml(item.track_en)}</span><span data-lang-zh>${escapeHtml(item.track)}</span></span>`;
    }
    return '';
  }
  function dateSpan(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    let en = iso, zh = iso;
    if (!isNaN(d.getTime())) {
      en = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      zh = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return `<span class="date"><span data-lang-en>${escapeHtml(en)}</span><span data-lang-zh>${escapeHtml(zh)}</span></span>`;
  }
  function titleSpan(item) {
    const en = escapeHtml(item.title || '');
    const zh = escapeHtml(item.title_zh || '');
    if (en && zh) return `<span data-lang-en>${en}</span><span data-lang-zh>${zh}</span>`;
    if (en) return `<span data-lang-en>${en}</span>`;
    if (zh) return `<span data-lang-zh>${zh}</span>`;
    return '';
  }
  function excerptSpan(item) {
    const en = escapeHtml(item.excerpt || '');
    const zh = escapeHtml(item.excerpt_zh || '');
    if (en && zh) return `<span data-lang-en>${en}</span><span data-lang-zh>${zh}</span>`;
    if (zh) return `<span data-lang-zh>${zh}</span>`;
    if (en) return `<span data-lang-en>${en}</span>`;
    return '';
  }

  // ── Facet renderers ─────────────────────────────────────
  function renderChip(value, label, count, isActive) {
    const activeCls = isActive ? ' active' : '';
    const countHtml = (typeof count === 'number') ? `<span class="chip-count">${count}</span>` : '';
    return `<button type="button" class="chip${activeCls}" data-value="${escapeHtml(value)}">${escapeHtml(label)}${countHtml}</button>`;
  }

  // Renders a single facet's control. Returns a string of HTML.
  function renderFacetRow(facet, facetIndex, state, items) {
    const isPrimary = facetIndex === 0;
    const values = getFacetValues(facet, items);
    const counts = countsForFacet(items, facet, facetIndex, getActiveFacets(), state);
    const isDateFacet = facet.sourceField === 'date' && facet.granularity === 'month';

    // value → display label
    const displayLabel = v => {
      if (v === 'all') return 'All';
      return isDateFacet ? labelForDateValue(v) : labelForFacetValue(facet, v);
    };

    if (facet.controlStyle === 'dropdown') {
      // Dropdown trigger + popover with all values
      const allValues = ['all', ...values];
      const currentVal = state[facet.key];
      const triggerLabel = (() => {
        if (currentVal === 'all') {
          return `All ${escapeHtml(facet.allLabel || facet.label.toLowerCase())}` +
                 (counts.all > 0 ? ` · <span class="chip-count">${counts.all}</span>` : '');
        }
        return `${escapeHtml(displayLabel(currentVal))} · <span class="chip-count">${counts[currentVal] || 0}</span>`;
      })();
      const popoverItems = allValues.map(v => {
        const lbl = v === 'all'
          ? `All ${escapeHtml(facet.allLabel || facet.label.toLowerCase())}`
          : displayLabel(v);
        const isActive = currentVal === v;
        return `<button type="button" class="more-popover-item${isActive ? ' is-active' : ''}" data-value="${escapeHtml(v)}">${escapeHtml(lbl)}<span class="chip-count">${counts[v]}</span></button>`;
      }).join('');

      return `
        <div class="filter-row filter-row--dropdown${isPrimary ? ' filter-row--primary' : ' filter-row--secondary'}" data-row="${facet.key}">
          <div class="filter-row-label">
            <span class="filter-row-label-text">${escapeHtml(facet.label)}</span>
          </div>
          <div class="filter-chips">
            <span class="more-trigger-wrap">
              <button type="button" class="more-trigger dropdown-trigger" aria-haspopup="true" aria-expanded="false">
                <span class="dropdown-trigger-label">${triggerLabel}</span>
                <svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 5 6 8 9 5"/></svg>
              </button>
              <div class="more-popover dropdown-popover" hidden>
                <div class="more-popover-list">${popoverItems}</div>
              </div>
            </span>
          </div>
        </div>`;
    }

    // Chips mode
    const allValues = ['all', ...values];
    const chips = allValues.map(v => {
      const isActive = state[facet.key] === v;
      return renderChip(v, displayLabel(v), counts[v], isActive);
    }).join('');

    return `
      <div class="filter-row${isPrimary ? ' filter-row--primary' : ' filter-row--secondary'}" data-row="${facet.key}">
        <div class="filter-row-label">
          <span class="filter-row-label-text">${escapeHtml(facet.label)}</span>
        </div>
        <div class="filter-chips">${chips}</div>
      </div>`;
  }

  // ── Faceted engine ──────────────────────────────────────
  let _activeFacets = []; // ref to current facets for getActiveFacets() in renderFacetRow
  function getActiveFacets() { return _activeFacets; }

  async function initFaceted(opts) {
    const { page, manifestPath, listSelector, facets, kind = 'article' } = opts;
    if (!Array.isArray(facets) || facets.length === 0) {
      console.error('[filters] init(): facets[] required');
      return;
    }
    _activeFacets = facets;

    const list = document.querySelector(listSelector);
    if (!list) { console.error('[filters] list container not found:', listSelector); return; }
    if (list.children.length === 0 && !list.querySelector('.coming-soon')) return;

    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.setAttribute('data-page-filter', page);
    list.parentNode.insertBefore(bar, list);

    let items;
    try {
      const res = await fetch(manifestPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = await res.json();
    } catch (e) { console.error('[filters] failed to fetch manifest:', e); return; }
    if (!Array.isArray(items)) return;

    const keys = facets.map(f => f.key);
    let state = readStateFromUrl(keys);

    function rerender() {
      const html = facets.map((f, i) => renderFacetRow(f, i, state, items)).join('');
      bar.innerHTML = html;

      const filtered = filterItemsByFacets(items, state, facets);
      list.innerHTML = filtered.length === 0
        ? `<p class="filter-empty">
            <span data-lang-en>No items match this filter.</span>
            <span data-lang-zh>没有符合此筛选条件的项目。</span>
          </p>`
        : filtered.map(it => renderItemHtml(it, kind)).join('');

      // Wire chip clicks
      bar.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const facetKey = btn.closest('.filter-row').dataset.row;
          const idx = facets.findIndex(f => f.key === facetKey);
          const v = btn.dataset.value;
          state[facetKey] = v;
          // Reset all lower-priority facets
          for (let i = idx + 1; i < facets.length; i++) state[facets[i].key] = 'all';
          writeStateToUrl(state);
          rerender();
        });
      });
      // Wire popover items
      bar.querySelectorAll('.more-popover-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const facetKey = btn.closest('.filter-row').dataset.row;
          const idx = facets.findIndex(f => f.key === facetKey);
          const v = btn.dataset.value;
          state[facetKey] = v;
          for (let i = idx + 1; i < facets.length; i++) state[facets[i].key] = 'all';
          writeStateToUrl(state);
          rerender();
          bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
          bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
        });
      });
      // Wire popover triggers
      bar.querySelectorAll('.more-trigger').forEach(trigger => {
        const popover = trigger.parentElement.querySelector('.more-popover');
        if (!popover) return;
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = !popover.hidden;
          bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
          bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
          if (!isOpen) {
            popover.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
    }

    document.addEventListener('click', (e) => {
      if (!bar.contains(e.target)) {
        bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
        bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
        bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
      }
    });
    global.addEventListener('popstate', () => {
      state = readStateFromUrl(keys);
      rerender();
    });

    rerender();
  }

  // ── Legacy 2-axis engine (used by Articles) ─────────────
  // Kept verbatim from the prior version so the Articles page
  // continues to work without a config change.
  function chipCountsForAxis(items, axisKey, axisOptions, currentState, valueMap) {
    const otherAxes = Object.keys(currentState).filter(k => k !== axisKey);
    const matchesOthers = it => otherAxes.every(k => {
      const sel = currentState[k];
      if (!sel || sel === 'all') return true;
      return it[k] === sel;
    });
    const counts = {};
    axisOptions.forEach(v => {
      const dataVal = valueMap ? valueMap[v] : v;
      counts[v] = items.filter(it => matchesOthers(it) && it[axisKey] === dataVal).length;
    });
    counts.all = items.filter(matchesOthers).length;
    return counts;
  }
  function chipCountsForTagAxis(items, axisKey, tagOptions, currentState) {
    const otherAxes = Object.keys(currentState).filter(k => k !== axisKey);
    const matchesOthers = it => otherAxes.every(k => {
      const sel = currentState[k];
      if (!sel || sel === 'all') return true;
      return it[k] === sel;
    });
    const counts = {};
    tagOptions.forEach(t => {
      counts[t] = items.filter(it => matchesOthers(it) && (it.tags || []).includes(t)).length;
    });
    counts.all = items.filter(matchesOthers).length;
    return counts;
  }
  function legacyFilterItems(items, state, axes) {
    return items.filter(it => {
      const primarySel = state[axes.primary.key];
      if (primarySel !== 'all') {
        const dataVal = axes.primary.valueMap ? axes.primary.valueMap[primarySel] : primarySel;
        if (it[axes.primary.key] !== dataVal) return false;
      }
      if (axes.secondary) {
        const secSel = state[axes.secondary.key];
        if (secSel !== 'all') {
          if (axes.secondary.dependsOn) {
            const depKey = Object.keys(axes.secondary.dependsOn)[0];
            const depVal = axes.secondary.dependsOn[depKey];
            if (state[depKey] === depVal) {
              if (axes.secondary.sourceField === 'tags') {
                if (!(it.tags || []).includes(secSel)) return false;
              } else {
                if (it[axes.secondary.key] !== secSel) return false;
              }
            }
          } else {
            if (axes.secondary.sourceField === 'tags') {
              if (!(it.tags || []).includes(secSel)) return false;
            } else {
              if (it[axes.secondary.key] !== secSel) return false;
            }
          }
        }
      }
      return true;
    });
  }
  function legacyRenderPrimaryRow(state, axes, counts) {
    const items = axes.primary.items;
    const hasSubRowFor = axes.secondary && axes.secondary.dependsOn
      ? Object.values(axes.secondary.dependsOn)[0] : null;
    const labelMap = axes.primary.labels || {};
    const chips = ['all', ...items].map(v => {
      const label = v === 'all' ? 'All' : (labelMap[v] || labelForChannel(v));
      const isActive = state[axes.primary.key] === v;
      const caret = v === hasSubRowFor
        ? '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 5 6 8 9 5"/></svg>'
        : '';
      const activeCls = isActive ? ' active' : '';
      const countHtml = (typeof counts[v] === 'number') ? `<span class="chip-count">${counts[v]}</span>` : '';
      return `<button type="button" class="chip${activeCls}" data-value="${escapeHtml(v)}">${escapeHtml(label)}${countHtml}${caret}</button>`;
    }).join('');
    return `
      <div class="filter-row filter-row--primary" data-row="${axes.primary.key}">
        <div class="filter-row-label">
          <span class="filter-row-label-text">${escapeHtml(axes.primary.label || 'Filter')}</span>
        </div>
        <div class="filter-chips">${chips}</div>
      </div>`;
  }
  function legacyRenderSecondaryRow(state, axes, items) {
    if (!axes.secondary) return { visible: false, html: '' };
    const secKey = axes.secondary.key;
    const isTagAxis = axes.secondary.sourceField === 'tags';
    let visible = true;
    if (axes.secondary.dependsOn) {
      const depKey = Object.keys(axes.secondary.dependsOn)[0];
      const depVal = axes.secondary.dependsOn[depKey];
      visible = state[depKey] === depVal;
    }
    if (!visible) return { visible: false, html: '' };
    let chipValues, moreValues = [];
    if (isTagAxis) {
      const tagCounts = new Map();
      items.forEach(it => (it.tags || []).forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
      const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      chipValues = sorted.slice(0, MAX_INLINE_TAGS).map(([t]) => t);
      moreValues = sorted.slice(MAX_INLINE_TAGS).map(([t]) => t);
    } else {
      chipValues = axes.secondary.items;
    }
    const secCounts = isTagAxis
      ? chipCountsForTagAxis(items, secKey, chipValues.concat(moreValues), state)
      : chipCountsForAxis(items, secKey, chipValues, state);
    const secLabels = axes.secondary.labels || {};
    const chips = ['all', ...chipValues].map(v => {
      let label;
      if (v === 'all') label = 'All';
      else if (secLabels[v]) label = secLabels[v];
      else if (isTagAxis) label = v;
      else label = labelForVertical(v);
      const isActive = state[secKey] === v;
      const activeCls = isActive ? ' active' : '';
      const countHtml = (typeof secCounts[v] === 'number') ? `<span class="chip-count">${secCounts[v]}</span>` : '';
      return `<button type="button" class="chip${activeCls}" data-value="${escapeHtml(v)}">${escapeHtml(label)}${countHtml}</button>`;
    }).join('');
    const moreHtml = moreValues.length
      ? `<button type="button" class="more-trigger" aria-haspopup="true" aria-expanded="false">+ ${moreValues.length} more</button>
         <div class="more-popover" hidden>
           <div class="more-popover-list">${moreValues.map(v => {
             const isActive = state[secKey] === v;
             return `<button type="button" class="more-popover-item${isActive ? ' is-active' : ''}" data-value="${escapeHtml(v)}">${escapeHtml(v)}<span class="chip-count">${secCounts[v]}</span></button>`;
           }).join('')}</div>
         </div>` : '';
    return {
      visible: true,
      html: `<div class="filter-row filter-row--secondary" data-row="${secKey}">
        <div class="filter-row-label"><span class="filter-row-label-text">${escapeHtml(axes.secondary.label || 'Sub')}</span></div>
        <div class="filter-chips">${chips}${moreHtml}</div>
      </div>`
    };
  }
  async function initLegacy(opts) {
    const { page, manifestPath, listSelector, axes, kind = 'article' } = opts;
    if (!axes || !axes.primary) { console.error('[filters] init(): missing axes.primary'); return; }
    const list = document.querySelector(listSelector);
    if (!list) { console.error('[filters] list container not found:', listSelector); return; }
    if (list.children.length === 0 && !list.querySelector('.coming-soon')) return;
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.setAttribute('data-page-filter', page);
    list.parentNode.insertBefore(bar, list);
    let items;
    try {
      const res = await fetch(manifestPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = await res.json();
    } catch (e) { console.error('[filters] failed to fetch manifest:', e); return; }
    if (!Array.isArray(items)) return;
    const axisKeys = [axes.primary.key];
    if (axes.secondary) axisKeys.push(axes.secondary.key);
    let state = readStateFromUrl(axisKeys);
    function rerender() {
      const primaryCounts = chipCountsForAxis(items, axes.primary.key, axes.primary.items, state, axes.primary.valueMap);
      const primaryHtml = legacyRenderPrimaryRow(state, axes, primaryCounts);
      const sec = legacyRenderSecondaryRow(state, axes, items);
      bar.innerHTML = primaryHtml + (sec.visible ? sec.html : '');
      const filtered = legacyFilterItems(items, state, axes);
      list.innerHTML = filtered.length === 0
        ? `<p class="filter-empty"><span data-lang-en>No items match this filter.</span><span data-lang-zh>没有符合此筛选条件的项目。</span></p>`
        : filtered.map(it => renderItemHtml(it, kind)).join('');
      bar.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.value;
          state[axes.primary.key] = v;
          if (axes.secondary && axes.secondary.dependsOn) {
            const depKey = Object.keys(axes.secondary.dependsOn)[0];
            const depVal = axes.secondary.dependsOn[depKey];
            if (v !== depVal) state[axes.secondary.key] = 'all';
          }
          writeStateToUrl(state);
          rerender();
        });
      });
      if (sec.visible && axes.secondary) {
        const secKey = axes.secondary.key;
        bar.querySelectorAll(`.filter-row--secondary .chip`).forEach(btn => {
          btn.addEventListener('click', () => {
            state[secKey] = btn.dataset.value;
            writeStateToUrl(state);
            rerender();
          });
        });
        bar.querySelectorAll('.more-popover-item').forEach(btn => {
          btn.addEventListener('click', () => {
            state[secKey] = btn.dataset.value;
            writeStateToUrl(state);
            rerender();
            const popover = bar.querySelector('.more-popover');
            const trigger = bar.querySelector('.more-trigger');
            if (popover) popover.hidden = true;
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
          });
        });
        const trigger = bar.querySelector('.more-trigger');
        const popover = bar.querySelector('.more-popover');
        if (trigger && popover) {
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !popover.hidden;
            bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
            bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
            if (!isOpen) {
              popover.hidden = false;
              trigger.setAttribute('aria-expanded', 'true');
            }
          });
        }
      }
    }
    document.addEventListener('click', (e) => {
      if (!bar.contains(e.target)) {
        bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
        bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        bar.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
        bar.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
      }
    });
    global.addEventListener('popstate', () => { state = readStateFromUrl(axisKeys); rerender(); });
    rerender();
  }

  // ── Bootstrap ───────────────────────────────────────────
  function init(opts) {
    if (opts.facets) return initFaceted(opts);
    if (opts.axes) return initLegacy(opts);
    console.error('[filters] init(): must provide either `facets` or `axes`');
  }

  function bootstrap() {
    if (!global.PortfolioFiltersInit) return;
    global.PortfolioFiltersInit.forEach(opts => {
      try { init(opts); } catch (e) { console.error('[filters] init failed:', e); }
    });
  }
  if (document.readyState === 'complete') bootstrap();
  else global.addEventListener('load', bootstrap);

  global.PortfolioFilters = { init };
})(window);
