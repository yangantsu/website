(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  //  related-tags.js
  //  Loads reports.json, finds the current report by filename,
  //  and renders three dropdowns:
  //    1. Series    — other months in the same series
  //    2. Channels  — same vertical, different channels
  //    3. Verticals — same channel, different verticals
  //  The current item is hidden in the popover; the trigger
  //  label communicates the current value.
  // ─────────────────────────────────────────────────────────

  const CHANNEL_LABELS = {
    'tiktok':   'TikTok',
    'amazon':   'Amazon',
    'industry': 'Industry'
  };

  const VERTICAL_LABELS = {
    'pet-supplies':       'Pet Goods',
    'home-improvement':   'Home Improvement',
    'home-appliances':    'Appliances',
    'consumer-tools':     'Consumer Tools',
    'apparel':            'Apparel',
    'outdoor':            'Outdoor',
    'beauty':             'Beauty'
  };

  const SERIES_LABELS = {
    'TikTok Shop Monthly': 'TikTok Shop Monthly'
  };

  // The current filename is set on the target container's data-filename attribute
  function getCurrentFilename() {
    const container = document.getElementById('related');
    return container ? container.getAttribute('data-filename') : null;
  }

  function labelFor(key, table) {
    return (table && table[key]) || key;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMonth(iso) {
    // Accepts "2026-05" or full ISO. Returns "May 2026".
    if (!iso) return '';
    const parts = String(iso).slice(0, 7).split('-');
    if (parts.length !== 2) return iso;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[monthIdx]} ${year}`;
  }

  // Pick the best representative from a set of reports in the same bucket
  // Strategy: most recent date. If tied, the one with the highest series_no.
  function pickRepresentative(reports) {
    if (!reports || reports.length === 0) return null;
    return reports.slice().sort((a, b) => {
      const d = (b.date || '').localeCompare(a.date || '');
      if (d !== 0) return d;
      return (b.series_no || 0) - (a.series_no || 0);
    })[0];
  }

  function buildList(items, current, kind) {
    // items = all reports in this bucket
    // current = current report
    // kind = "series" | "channel" | "vertical"
    // Returns array of { filename, label, isCurrent }
    if (kind === 'series') {
      // De-dupe by date — if a series has multiple reports in the same month,
      // the series popover shows one entry per month, pointing to the most
      // recent report in that (date, series) bucket.
      const byDate = {};
      items.forEach(r => {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push(r);
      });
      const dates = Object.keys(byDate)
        .filter(d => byDate[d].some(r => r.filename !== current.filename))
        .sort((a, b) => b.localeCompare(a));
      return dates.map(d => {
        const rep = pickRepresentative(byDate[d].filter(r => r.filename !== current.filename));
        return rep ? {
          filename: rep.filename,
          label: formatMonth(d),
          isCurrent: false
        } : null;
      }).filter(Boolean);
    }
    if (kind === 'channel') {
      // For each channel bucket, pick the most recent report and show its label
      const byChannel = {};
      items.forEach(r => {
        if (!byChannel[r.channel]) byChannel[r.channel] = [];
        byChannel[r.channel].push(r);
      });
      const channels = Object.keys(byChannel).filter(c => c !== current.channel);
      return channels.sort().map(c => {
        const rep = pickRepresentative(byChannel[c]);
        return rep ? {
          filename: rep.filename,
          label: labelFor(c, CHANNEL_LABELS),
          isCurrent: false
        } : null;
      }).filter(Boolean);
    }
    if (kind === 'vertical') {
      const byVertical = {};
      items.forEach(r => {
        if (!byVertical[r.vertical]) byVertical[r.vertical] = [];
        byVertical[r.vertical].push(r);
      });
      const verticals = Object.keys(byVertical).filter(v => v !== current.vertical);
      return verticals.sort().map(v => {
        const rep = pickRepresentative(byVertical[v]);
        return rep ? {
          filename: rep.filename,
          label: labelFor(v, VERTICAL_LABELS),
          isCurrent: false
        } : null;
      }).filter(Boolean);
    }
    return [];
  }

  function renderDropdown(triggerLabel, items, dropdownId) {
    // items = [{ filename, label, isCurrent }]
    const itemsHtml = items.length === 0
      ? '<li class="related-popover-empty">No other reports yet</li>'
      : items.map(it =>
          `<li><a href="${escapeHtml(it.filename)}">${escapeHtml(it.label)}</a></li>`
        ).join('');

    return `
      <div class="related-dropdown" data-dropdown="${dropdownId}">
        <button class="related-trigger" type="button" aria-haspopup="true" aria-expanded="false">
          <span class="related-trigger-label">${escapeHtml(triggerLabel)}</span>
          <svg class="related-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="3 5 6 8 9 5"/></svg>
        </button>
        <ul class="related-popover" role="menu" hidden>
          ${itemsHtml}
        </ul>
      </div>
    `;
  }

  function renderEmpty(container) {
    const dropdowns = container.querySelector('.related-dropdowns');
    if (dropdowns) dropdowns.innerHTML = '';
    else container.innerHTML = '';
    container.classList.add('is-empty');
  }

  function renderError(container, message) {
    // Only replace the dropdowns slot — keep the static back link visible.
    const dropdowns = container.querySelector('.related-dropdowns');
    const errHtml = `<p class="related-error">${escapeHtml(message)}</p>`;
    if (dropdowns) dropdowns.innerHTML = errHtml;
    else container.innerHTML = errHtml;
  }

  function bindDropdowns(container) {
    const triggers = container.querySelectorAll('.related-trigger');
    let openId = null;

    function closeAll() {
      triggers.forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        const pop = t.parentElement.querySelector('.related-popover');
        if (pop) pop.hidden = true;
      });
      openId = null;
    }

    function open(trigger) {
      const pop = trigger.parentElement.querySelector('.related-popover');
      if (!pop) return;
      // Position: anchor below the trigger
      trigger.setAttribute('aria-expanded', 'true');
      pop.hidden = false;
      openId = trigger.parentElement.getAttribute('data-dropdown');
    }

    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = trigger.parentElement.getAttribute('data-dropdown');
        if (openId === id) {
          closeAll();
        } else {
          closeAll();
          open(trigger);
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) closeAll();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  async function init() {
    const container = document.getElementById('related');
    if (!container) return;

    const currentFilename = getCurrentFilename();
    if (!currentFilename) {
      renderError(container, 'Related: missing data-filename attribute on #related.');
      return;
    }

    let manifest;
    try {
      const res = await fetch('reports.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifest = await res.json();
    } catch (e) {
      renderError(container, `Related: failed to load reports.json (${e.message}).`);
      return;
    }

    if (!Array.isArray(manifest) || manifest.length === 0) {
      renderEmpty(container);
      return;
    }

    const current = manifest.find(r => r.filename === currentFilename);
    if (!current) {
      // Current report not in manifest — clear dropdowns, keep static back link.
      const dropdowns = container.querySelector('.related-dropdowns');
      if (dropdowns) dropdowns.innerHTML = '';
      return;
    }

    // Compute the three buckets
    const sameSeries = current.series
      ? manifest.filter(r => r.series === current.series)
      : [];
    const sameVertical = current.vertical
      ? manifest.filter(r => r.vertical === current.vertical && r.channel !== current.channel)
      : [];
    const sameChannel = current.channel
      ? manifest.filter(r => r.channel === current.channel && r.vertical !== current.vertical)
      : [];

    const seriesList = buildList(sameSeries, current, 'series');
    const channelList = buildList(manifest.filter(r => r.vertical === current.vertical), current, 'channel');
    const verticalList = buildList(manifest.filter(r => r.channel === current.channel), current, 'vertical');

    // Trigger labels
    const seriesTrigger = current.series
      ? `${labelFor(current.series, SERIES_LABELS)} · ${formatMonth(current.date)}`
      : 'This report';
    const channelTrigger = current.channel
      ? labelFor(current.channel, CHANNEL_LABELS)
      : 'Channel';
    const verticalTrigger = current.vertical
      ? labelFor(current.vertical, VERTICAL_LABELS)
      : 'Vertical';

    // Hide dropdowns that have nothing to show. Series is hidden when there
    // is only one date in the series (no other month to navigate to).
    // Channel/vertical are hidden when current is the only one of their kind.
    const showSeries = seriesList.length > 1;
    const showChannel = channelList.length > 0;
    const showVertical = verticalList.length > 0;

    // Render only into the dropdowns slot — the back link is in static HTML
    // and must remain even if the dropdowns fail to populate.
    const dropdowns = container.querySelector('.related-dropdowns');
    if (!dropdowns) {
      // Defensive: report file may not have the static markup. Fall back to
      // full replacement.
      container.innerHTML = `
        <div class="related-bar">
          <a class="related-back" href="index.html" aria-label="Back to all reports">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 12 6 8 10 4"/></svg>
            <span>All reports</span>
          </a>
          <div class="related-dropdowns">
            ${showSeries ? renderDropdown(seriesTrigger, seriesList, 'series') : ''}
            ${showChannel ? renderDropdown(channelTrigger, channelList, 'channel') : ''}
            ${showVertical ? renderDropdown(verticalTrigger, verticalList, 'vertical') : ''}
          </div>
        </div>`;
      bindDropdowns(container);
      return;
    }

    dropdowns.innerHTML = [
      showSeries ? renderDropdown(seriesTrigger, seriesList, 'series') : '',
      showChannel ? renderDropdown(channelTrigger, channelList, 'channel') : '',
      showVertical ? renderDropdown(verticalTrigger, verticalList, 'vertical') : ''
    ].join('');

    bindDropdowns(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
