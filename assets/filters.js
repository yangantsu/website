(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────
  //  filters.js
  //  Layered filter rail for collection pages (Reports, Articles).
  //  Each page declares its axes via PortfolioFilters.init(...).
  //  filters.js loads on `load` so app.js has already populated
  //  the underlying list, then takes over the rendering of the
  //  list and the chip rails. If app.js failed, bail.
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

  // Articles tag labels — the slug is the label. No mapping needed.
  // But we render the count next to each chip.

  const MAX_INLINE_TAGS = 6; // top-N tags shown in the rail; rest go in popover

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── URL state ──────────────────────────────────────────
  function readStateFromUrl(axisKeys) {
    const params = new URLSearchParams(global.location.search);
    const out = {};
    axisKeys.forEach(k => {
      const v = params.get(k);
      out[k] = v ? v : 'all';
    });
    return out;
  }

  function writeStateToUrl(state, replace) {
    const params = new URLSearchParams(global.location.search);
    Object.keys(state).forEach(k => {
      if (!state[k] || state[k] === 'all') params.delete(k);
      else params.set(k, state[k]);
    });
    const qs = params.toString();
    const url = global.location.pathname + (qs ? '?' + qs : '') + global.location.hash;
    if (replace) global.history.replaceState(state, '', url);
    else global.history.pushState(state, '', url);
  }

  // ── Counts (axis-relative) ─────────────────────────────
  // chipCountsForAxis(items, axisKey, axisOptions, currentState, valueMap):
  //   For each value in axisOptions, count items that:
  //     - have that value on `axisKey` (or the value-mapped version)
  //     - match currentState on ALL OTHER axes
  //   The 'all' option is the count of items matching the sibling axes only.
  // valueMap (optional): { axisValue: dataFieldValue }. E.g. { i: "赛道一" }
  //   lets the URL store readable "i" while the data field is "赛道一".
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

  // Special: for articles' tag axis, the value is in `it.tags[]` not `it.tag`.
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

  // ── Filtering ──────────────────────────────────────────
  // valueMap: { axisValue: dataFieldValue }. Used for the primary axis.
  // For the secondary axis (e.g. vertical), the axis value IS the data field value
  // (we don't expose a valueMap for it).
  function filterItems(items, state, axes) {
    return items.filter(it => {
      // Primary axis
      const primarySel = state[axes.primary.key];
      if (primarySel !== 'all') {
        const dataVal = axes.primary.valueMap ? axes.primary.valueMap[primarySel] : primarySel;
        if (it[axes.primary.key] !== dataVal) return false;
      }
      // Secondary axis — only apply if the current primary selection gates the sub-row
      // (matches dependsOn) OR if the secondary is always visible
      if (axes.secondary) {
        const secSel = state[axes.secondary.key];
        if (secSel !== 'all') {
          // does this primary selection gate the sub-row?
          if (axes.secondary.dependsOn) {
            const depKey = Object.keys(axes.secondary.dependsOn)[0];
            const depVal = axes.secondary.dependsOn[depKey];
            if (state[depKey] === depVal) {
              // gated — apply filter
              if (axes.secondary.sourceField === 'tags') {
                if (!(it.tags || []).includes(secSel)) return false;
              } else {
                if (it[axes.secondary.key] !== secSel) return false;
              }
            }
            // else: not gated, no filter applied (e.g. tag axis always visible)
          } else {
            // no dependsOn — always apply
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

  // ── List rendering (re-implements app.js item shape) ───
  // Kept in sync with assets/app.js's renderList / renderReportList templates.
  // If app.js changes its template, this needs to change too.
  function renderItemHtml(item, kind) {
    const href = escapeHtml(item.filename);
    const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const track = trackSpan(item);
    const date = dateSpan(item.date, kind);
    const title = titleSpan(item);
    const excerpt = excerptSpan(item);
    const openHint = `<span class="open-hint">
        <span data-lang-en>Read ›</span>
        <span data-lang-zh>阅读 ›</span>
      </span>`;
    return `
      <a class="list-item" href="${href}">
        <div class="meta">
          ${track}
          ${date}
          ${kind === 'report' ? openHint : ''}
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

  function dateSpan(iso, kind) {
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

  // ── Chip rail rendering ────────────────────────────────
  function labelForChannel(v) { return CHANNEL_LABELS[v] || v; }
  function labelForVertical(v) { return VERTICAL_LABELS[v] || v; }
  function labelForTrack(v) { return TRACK_LABELS[v] ? TRACK_LABELS[v].en : v; }

  function renderChip(opts) {
    const { value, label, count, isActive, hasSubRow } = opts;
    const activeCls = isActive ? ' active' : '';
    const countHtml = (typeof count === 'number') ? `<span class="chip-count">${count}</span>` : '';
    const caret = hasSubRow
      ? '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 5 6 8 9 5"/></svg>'
      : '';
    return `<button type="button" class="chip${activeCls}" data-value="${escapeHtml(value)}">${escapeHtml(label)}${countHtml}${caret}</button>`;
  }

  function renderPrimaryRow(state, axes, counts) {
    const items = axes.primary.items;
    const hasSubRowFor = axes.secondary && axes.secondary.dependsOn
      ? Object.values(axes.secondary.dependsOn)[0]
      : null;

    const labelMap = axes.primary.labels || {};
    const chips = ['all', ...items].map(v => {
      let label;
      if (v === 'all') label = 'All';
      else if (labelMap[v]) label = labelMap[v];
      else label = labelForChannel(v);
      const isActive = state[axes.primary.key] === v;
      return renderChip({
        value: v,
        label,
        count: counts[v],
        isActive,
        hasSubRow: v === hasSubRowFor
      });
    }).join('');

    return `
      <div class="filter-row filter-row--primary" data-row="${axes.primary.key}">
        <div class="filter-row-label">
          <span class="filter-row-label-text">${escapeHtml(axes.primary.label || 'Filter')}</span>
        </div>
        <div class="filter-chips">${chips}</div>
      </div>`;
  }

  // Returns { visible: bool, html: string }
  function renderSecondaryRow(state, axes, items) {
    if (!axes.secondary) return { visible: false, html: '' };

    const secKey = axes.secondary.key;
    const isTagAxis = axes.secondary.sourceField === 'tags';

    // Visibility: gated by dependsOn (reports), or always visible (articles)
    let visible = true;
    if (axes.secondary.dependsOn) {
      const depKey = Object.keys(axes.secondary.dependsOn)[0];
      const depVal = axes.secondary.dependsOn[depKey];
      visible = state[depKey] === depVal;
    }

    if (!visible) return { visible: false, html: '' };

    // Build chip list
    let chipValues, moreValues = [];
    if (isTagAxis) {
      // tag axis: top N most frequent tags in the current pool, rest in popover
      const tagCounts = new Map();
      items.forEach(it => {
        (it.tags || []).forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
      });
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
      return renderChip({
        value: v,
        label,
        count: secCounts[v],
        isActive: state[secKey] === v
      });
    }).join('');

    const moreHtml = moreValues.length
      ? `<button type="button" class="more-trigger" aria-haspopup="true" aria-expanded="false">
           + ${moreValues.length} more
         </button>
         <div class="more-popover" hidden>
           <div class="more-popover-list">
             ${moreValues.map(v => {
               const isActive = state[secKey] === v;
               return `<button type="button" class="more-popover-item${isActive ? ' is-active' : ''}" data-value="${escapeHtml(v)}">${escapeHtml(v)}<span class="chip-count">${secCounts[v]}</span></button>`;
             }).join('')}
           </div>
         </div>`
      : '';

    return {
      visible: true,
      html: `
        <div class="filter-row filter-row--secondary" data-row="${secKey}">
          <div class="filter-row-label">
            <span class="filter-row-label-text">${escapeHtml(axes.secondary.label || 'Sub')}</span>
          </div>
          <div class="filter-chips">
            ${chips}
            ${moreHtml}
          </div>
        </div>`
    };
  }

  // ── Main init ──────────────────────────────────────────
  async function init(opts) {
    const { page, manifestPath, listSelector, axes, kind = 'article' } = opts;
    if (!axes || !axes.primary) {
      console.error('[filters] init(): missing axes.primary');
      return;
    }

    const list = document.querySelector(listSelector);
    if (!list) {
      console.error('[filters] list container not found:', listSelector);
      return;
    }

    // Wait until app.js has populated the list. app.js runs on DOMContentLoaded;
    // we run on `load`, so by this point the list is rendered. But it could also
    // be empty if the manifest was empty — handle both.
    const listIsReady = list.children.length > 0 || list.querySelector('.coming-soon');
    if (!listIsReady) {
      // app.js errored or manifest is empty. Inject a "no items" message and bail.
      return;
    }

    // Insert filter bar above the list
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.setAttribute('data-page-filter', page);
    list.parentNode.insertBefore(bar, list);

    // Fetch the manifest (same one app.js loaded)
    let items;
    try {
      const res = await fetch(manifestPath, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      items = await res.json();
    } catch (e) {
      console.error('[filters] failed to fetch manifest:', e);
      return;
    }
    if (!Array.isArray(items)) return;

    const axisKeys = [axes.primary.key];
    if (axes.secondary) axisKeys.push(axes.secondary.key);
    let state = readStateFromUrl(axisKeys);

    function rerender() {
      // counts for the primary row use the full secondary state
      const primaryCounts = chipCountsForAxis(
        items, axes.primary.key, axes.primary.items, state, axes.primary.valueMap
      );

      const primaryHtml = renderPrimaryRow(state, axes, primaryCounts);
      const sec = renderSecondaryRow(state, axes, items);

      bar.innerHTML = primaryHtml + (sec.visible ? sec.html : '');

      // Re-render the list
      const filtered = filterItems(items, state, axes);
      if (filtered.length === 0) {
        list.innerHTML = `<p class="filter-empty">
          <span data-lang-en>No items match this filter.</span>
          <span data-lang-zh>没有符合此筛选条件的项目。</span>
        </p>`;
      } else {
        list.innerHTML = filtered.map(it => renderItemHtml(it, kind)).join('');
      }

      // Wire up chip clicks
      bar.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.value;
          state[axes.primary.key] = v;
          if (axes.secondary) {
            // Reset secondary if the new primary no longer gates the sub-row
            const sec = axes.secondary;
            if (sec.dependsOn) {
              const depKey = Object.keys(sec.dependsOn)[0];
              const depVal = sec.dependsOn[depKey];
              if (v !== depVal) state[sec.key] = 'all';
            }
          }
          writeStateToUrl(state, true);
          rerender();
        });
      });

      // Wire up secondary chip clicks
      if (sec.visible && axes.secondary) {
        const secKey = axes.secondary.key;
        // Inline chips in the sub-row
        bar.querySelectorAll(`.filter-row--secondary .chip`).forEach(btn => {
          btn.addEventListener('click', () => {
            state[secKey] = btn.dataset.value;
            writeStateToUrl(state, true);
            rerender();
          });
        });
        // Popover items
        bar.querySelectorAll('.more-popover-item').forEach(btn => {
          btn.addEventListener('click', () => {
            state[secKey] = btn.dataset.value;
            writeStateToUrl(state, true);
            rerender();
            // Close popover
            const popover = bar.querySelector('.more-popover');
            const trigger = bar.querySelector('.more-trigger');
            if (popover) popover.hidden = true;
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
          });
        });
        // Popover trigger
        const trigger = bar.querySelector('.more-trigger');
        const popover = bar.querySelector('.more-popover');
        if (trigger && popover) {
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !popover.hidden;
            // close all
            document.querySelectorAll('.more-popover').forEach(p => p.hidden = true);
            document.querySelectorAll('.more-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
            if (!isOpen) {
              popover.hidden = false;
              trigger.setAttribute('aria-expanded', 'true');
            }
          });
        }
      }
    }

    // Close popover on outside click
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

    // Back/forward
    global.addEventListener('popstate', () => {
      state = readStateFromUrl(axisKeys);
      rerender();
    });

    rerender();
  }

  // ── Bootstrap ──────────────────────────────────────────
  function bootstrap() {
    if (!global.PortfolioFiltersInit) return; // page didn't call init()
    global.PortfolioFiltersInit.forEach(opts => {
      try { init(opts); } catch (e) { console.error('[filters] init failed:', e); }
    });
  }

  if (document.readyState === 'complete') {
    bootstrap();
  } else {
    global.addEventListener('load', bootstrap);
  }

  // Expose for inline scripts that register init() configs.
  global.PortfolioFilters = { init };
})(window);
