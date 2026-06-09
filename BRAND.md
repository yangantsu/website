# The Portfolio — Brand Guide

> **A brand book for a content site that is opinionated, contrarian, and built around the long view.**

This guide is the source of truth for the visual identity, voice, and structural
patterns of **The Portfolio** — a personal site by **杨安祖 / 安祖羊 (ANZUYANG)** that
publishes essays (`Articles`) and field research (`Reports`), and is the public
surface of a 15-year marketing practice focused on cross-border trade, brand
building, and the AI era.

It exists so that every new article, report, or chrome change is immediately
recognisable as part of the same body of work — even if the author is in a
different mood, on a different platform, five years from now.

---

## 1. Brand philosophy — the three principles

These are not design rules. They are the **load-bearing beliefs** of the brand.
Every other choice in this guide is a downstream consequence of these.

### 1.1 The signal, not the amplifier

> *AI不是你的敌人。AI是你的放大器。但它放大的，是你这个人。*

The site is not about the author. The site is about what the author stands for:
a position, a frame, a way of seeing. Tools come and go. The site treats its
own existence the same way — the chrome is restrained on purpose, so the
content (the signal) can be loud.

**Concretely:** chrome stays dark and quiet; the article body and the pull
quote are the loudest things on any given page.

### 1.2 Go against the current

> *在所有人都往同一个方向走的时候，你往反方向走一步。就这一步，就够了。*

The brand rejects the default. It does not follow UI trends, colour fads, or
"professional" palettes (pale grey, soft blue, gentle beige) just because they
are the safe choice. The dark navy + coral red is a deliberate departure
from what a "marketing strategist's portfolio" is expected to look like.

**Concretely:** the accent colour is a warm coral, not a corporate blue. The
display typeface is a heavy serif, not a sans-serif. Cards have hard edges
(sharp `border-radius: 2-4px` and visible borders), not soft drop-shadowed
pillows.

### 1.3 The signature belongs to the author, not the platform

Every article ends with the same five characters: `— 安祖羊`. The site chrome
repeats the same signature, in the same coral red, in the same place. The
point is **provenance** — a reader should always know whose words they are
reading, and whose voice is shaping the UI they are looking at.

**Concretely:** no part of the chrome is allowed to use a colour or type
treatment that competes with the article signature. The signature wins,
always.

---

## 2. Identity

| Slot | ZH | EN / Pinyin | Notes |
| --- | --- | --- | --- |
| Site name | 作品集 | **The Portfolio** | Used as the nav brand. Plain, archival, no flourish. |
| Author (real) | 杨安祖 | Yang Anzu | Used on the home hero and about page. |
| Author (pen) | 安祖羊 | ANZUYANG | Used as article signature and report author. |
| Motto | 逆流而上，洞见本质。 | Go against the current, see the essence. | Site-wide. |

**The three names are not interchangeable.** The home hero uses the real
name. The article nav and signature use the pen name. The nav brand uses the
site name. This separation is intentional — it lets the brand read as a
publication, not a personal feed.

---

## 3. Visual identity

### 3.1 Colour tokens

The palette is built on a **dark navy base** with a **coral red accent** and
a **gold highlight**. It is the only palette the site uses. There is no
light-mode toggle; the site is dark, full stop.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0D1117` | Page background |
| `--bg-secondary` | `#1A1A2E` | Inner cards, inputs |
| `--bg-card` | `#161B22` | List items, sections |
| `--bg-soft` | `#161B22` | Reader header, raised surfaces |
| `--bg-nav` | `rgba(13, 17, 23, 0.78)` | Sticky nav (blurred) |
| `--accent` | `#E94560` | Coral red — the brand colour |
| `--accent-dim` | `rgba(233, 69, 96, 0.15)` | Pill backgrounds, focus halos |
| `--accent-soft` | `rgba(233, 69, 96, 0.08)` | Hover states, card glows |
| `--accent-glow` | `rgba(233, 69, 96, 0.35)` | Shadows on coral elements |
| `--gold` | `#FFD700` | Highlight strokes, progress bar end |
| `--text` | `#F0F4F8` | Primary text |
| `--text-dim` | `#8B95A5` | Secondary text, meta |
| `--text-mute` | `#6B7280` | Tertiary, hint copy |
| `--border` | `#0F3460` | Card borders, dividers |
| `--border-card` | `rgba(15, 52, 96, 0.3)` | Lighter card border |
| `--accent-border` | `rgba(233, 69, 96, 0.2)` | Coral-tinted border |

**Backgrounds are never flat.** The body uses
`radial-gradient(ellipse at top, #1A1A2E 0%, #0D1117 50%)` plus a 4%-opacity
SVG noise overlay. This matches the article design exactly.

**Coral is rationed.** It is used for: the brand wordmark, the motto, the
section underline, focus rings, primary buttons, the pull-quote mark, the
signature, and the progress bar end. Nothing else. If a new element is
tempted to use coral, find a way to use `--accent-soft` or
`--accent-border` first.

### 3.2 Typography

| Role | Family | Weight | Use |
| --- | --- | --- | --- |
| Display (Latin) | **Fraunces** | 600–900 | Hero name, page titles, card h2, pull quotes |
| Display (CJK) | **Noto Serif SC** | 600–900 | Same as above, Chinese contexts |
| Body (Latin) | system-ui | 400–600 | Article body, list items, UI chrome |
| Body (CJK) | **Noto Sans SC** | 400–700 | Article body, list items, UI chrome |
| Mono | SF Mono / Menlo | 400 | Code in inline `code` elements |

**Stack with fallbacks:** `'Noto Sans SC', -apple-system, BlinkMacSystemFont,
'Segoe UI', system-ui, sans-serif`. For display: `'Noto Serif SC', 'Fraunces',
Georgia, serif`.

**Two type rules:**

1. **Display is heavy and short.** `font-weight: 700-900`,
   `letter-spacing: 0.01-0.08em` (slightly *wider* for CJK). Lines are short
   (~640-800px max width).
2. **Body is light and generous.** `font-size: 14-17px`,
   `line-height: 1.7-1.85`, `letter-spacing: 0` for CJK, very small for
   Latin. Generous whitespace.

**There is no italic display type.** Italics belong to blockquotes in the
body. Display headlines are upright.

### 3.3 Spacing & shape

- **Hard edges, not soft.** Default `border-radius` is `2-4px` on pills and
  `12-16px` on cards. Never `border-radius: 50%` on rectangular elements
  (the only exception is the avatar and the illustration in
  `Coming Soon`).
- **Visible borders over shadows.** Cards have a 1px border in
  `--border-card`; hover swaps it to `--accent-border`. Drop shadows are
  reserved for the floating hero and card hover; they are dark, not glowy.
- **One accent stroke per top edge.** Cards and sections have a 2px
  coral top stroke (sometimes paired with a 20px gold lead-in). The reader
  header has a 1px navy bottom border. This creates a recognisable rhythm:
  coral line at the top, content below, navy line as a footer-rule.

### 3.4 Motion

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for entrances,
  `cubic-bezier(0.4, 0, 0.2, 1)` for state changes.
- **Hero entrance:** elements rise from `translateY(28px)` with
  `opacity: 0 → 1`, staggered 50–100ms.
- **Card hover:** `translateY(-2px → -4px)` and a 3px coral left bar slides
  in (or a 2px top bar on home cards). No rotating, no scaling beyond 1.05.
- **Avatar ring:** the only continuously rotating element, 18s/turn,
  coral→gold conic gradient.
- **Reduce motion:** all animations collapse to `0.01ms` when
  `prefers-reduced-motion: reduce` is set.

---

## 4. The five visual components

These are the load-bearing elements that appear on multiple pages. If you
add a new chrome component, copy one of these patterns first.

### 4.1 The page title

```html
<h1 class="page-title">
  <span data-lang-en>Articles</span>
  <span data-lang-zh>文章</span>
</h1>
```

- Serif display, 36-48px, weight 700.
- 2px coral underline with a 20px gold lead-in, positioned `bottom: 0`.
- Optionally paired with a `.count-inline` for "6 items" in the same row.

### 4.2 The list item

The article/report card on a list page.

- 1px navy border, dark card bg, 12px radius.
- Meta row: track badge (coral dim) → date (text-dim, tabular numerals) →
  optional right-aligned hint (coral, or "Locked" lock icon).
- Title: serif display, 20px, weight 600, line-height 1.4.
- Excerpt: 14px, text-dim, 1.75 line-height.
- Tags row: 10px uppercase, navy bg, dim text — never coral (coral is rationed).
- Hover: translateY(-2px) + accent-border + 3px coral left bar slides in.

### 4.3 The pull quote

Used inside article bodies, never in chrome.

- 28px serif display, weight 800, centered.
- A 80px coral `"` mark above the text (Georgia serif), 20px negative margin.
- No border, no background — just a typographic pause.

### 4.4 The unlock banner

Reports-only. Replaces the "Coming Soon" pattern for password-gated content.

- 64px circular coral-dim icon, 24px coral heading, dim subhead, 360px-wide
  form with a single password input + coral primary button.
- The submit button is the only place on the site where coral fully fills a
  rectangular element. The 8px radius is intentional — it does not match
  the soft 12-16px card radii, signalling "this is a CTA, not a card".

### 4.5 The signature

Appears at the end of every article (`— 安祖羊`) and in the site footer.
Coral red, 13-20px, `letter-spacing: 0.2em`, weight 700-800. No punctuation
variation. Always em-dash, space, then the four characters.

---

## 5. The two tracks (赛道)

Every article carries a `track` field. The track is the **author's internal
taxonomy**, not a user-facing filter — it appears as a small coral badge in
the list item meta row.

| Track | Name | Subject |
| --- | --- | --- |
| **Track I** | 赛道一 | **Mindset, identity, the long view.** First-person essays on the AI era, action vs. knowing, the inner life. |
| **Track II** | 赛道二 | **Marketing, AI practice, the trade.** Practitioner essays on brand strategy, vibemarketing, moats, execution. |

When adding a new article, pick the track that matches the **subject**, not
the audience. A piece on "how AI changes my morning routine" is Track I; a
piece on "how AI changes my client's launch plan" is Track II.

The brand rule: **Track I pieces lead with the personal. Track II pieces
lead with the work.** Both still sign off with the same `— 安祖羊`.

---

## 6. Voice & tone

### 6.1 The four rules

1. **Contrarian first, useful second.** Open with the inversion of the
   conventional wisdom, *then* deliver the substance.
2. **One sentence per line.** The body text is fragmented on purpose. The
   reader's eye drops; the rhythm is felt, not read.
3. **Second person.** Address the reader as `你`. The author speaks *to* a
   peer operator, not *at* a passive audience.
4. **Data as punctuation, not proof.** A number ("90%") is a load-bearing
   rhetorical beat, not a citation. Sources are not footnoted. This is
   essay, not journalism.

### 6.2 The signature moves

These are rhetorical devices that recur. Use them — but don't overuse
any one of them in a single piece.

- **The "X but Y" pivot.** "Vibe Coding is a tool. Vibe Marketing is a way
  of thinking. Tools expire; thinking doesn't." A two-clause assertion with
  a hard reframe.
- **The 80/20 frame.** "80% of brand-customer connection comes from 20% of
  touchpoints." A specific, falsifiable, memorable ratio.
- **The negation by inversion.** "The question is not whether AI will take
  your job. The question is whether you have built anything it could
  take." A re-framing that names the conventional question, then refuses it.
- **The short closing aphorism.** The final paragraph often ends on a
  single-sentence statement with no softener. "AI is the amplifier; you
  are the signal." This is the line that gets quoted.

### 6.3 What the brand does not say

- "I'm humbled to announce..."
- "Hope this helps!"
- "As an AI..."
- "In conclusion, ..."
- Anything that begins with "I think that..." — the author is paid to have
  a position, not to hedge.

---

## 7. Component do's and don'ts

### Do

- Use coral for the **wordmark, motto, primary CTA, focus ring, signature,
  progress bar, and the 2px top stroke** on cards/sections. Nowhere else.
- Use `border-radius: 2-4px` on chips and pills. Use `12-16px` on cards.
- Pair every coral underline with a 20px gold lead-in stroke. This is the
  brand's typographic signature.
- Keep the body 640-800px wide. The site is not full-bleed. The width is
  a reading decision, not a layout default.
- Add a 2-4% noise texture overlay on every page (the article rule).

### Don't

- Don't use `border-radius: 50%` on rectangular elements.
- Don't use drop shadows on card surfaces. The border does the work.
- Don't use gradients on text. The home hero's display name is solid
  white, not a gradient. Gradients compete with the article pull quote.
- Don't use sans-serif display type. Display is always a serif.
- Don't introduce a fourth colour. The palette is closed: navy, coral,
  gold, white. If a new element needs accent, derive it from
  `--accent-soft` or `--accent-border`.
- Don't add a light-mode toggle. The site is dark. It is always dark.

---

## 8. File structure

```
/
├── index.html              ← home / hero
├── about.html              ← profile + contact
├── articles/
│   ├── index.html          ← list page
│   ├── articles.json       ← manifest (see §9)
│   └── *.html              ← standalone article documents
├── reports/
│   ├── index.html          ← list page + unlock + iframe reader
│   ├── reports.json        ← manifest
│   └── *.html              ← standalone report documents
├── assets/
│   ├── style.css           ← all chrome styling
│   └── app.js              ← i18n, manifest fetching, password gate
├── BRAND.md                ← this file
└── .gitignore
```

The site is **pure static HTML/CSS/JS** — no build step, no framework. The
article and report bodies are **standalone documents** with their own inline
styles, designed to be readable in an iframe, as a raw file, and on mobile.

---

## 9. The manifest schema

Both `articles/articles.json` and `reports/reports.json` are arrays. The
list page fetches its manifest, sorts by `date` descending, and renders.
A new file added to disk is invisible to the site until it has an entry in
the manifest.

```json
{
  "filename": "ai-era-5-things.html",
  "title": "AI时代，普通人最需要做的事，没有一件是学AI工具",
  "title_zh": "AI时代，普通人最需要做的事，没有一件是学AI工具",
  "title_en": "In the AI Era, Nothing an Ordinary Person Needs Most Is Learning AI Tools",
  "date": "2026-05-07",
  "track": "赛道一",
  "track_en": "Track I",
  "excerpt_zh": "一个数据：2026年全球已有超过40%的企业把AI嵌入日常工作流...",
  "excerpt_en": "AI is not your enemy — AI is your amplifier. But what it multiplies is you.",
  "tags": ["ai-era", "mindset", "personal-brand", "long-view", "self-knowledge"]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `filename` | yes | Must match the file on disk. |
| `date` | yes | ISO `YYYY-MM-DD`. Used for sort order. |
| `title_zh` or `title` | yes | If only one is provided, it is shown in both languages as a fallback. |
| `title_en` | optional | If absent, the zh title is shown in EN mode. |
| `excerpt_zh` | optional | Tweet-length ZH hook (1-2 sentences). |
| `excerpt_en` | optional | English equivalent. |
| `track` | yes (articles) | `赛道一` or `赛道二`. |
| `track_en` | optional | `Track I` or `Track II`. |
| `tags` | optional | 3-5 lowercase, hyphenated. Display-only. |

**Coming Soon is automatic.** If the manifest array is `[]`, the list page
renders the "Coming Soon / 敬请期待" empty state. There is no second
fallback; an empty array *is* the empty state.

---

## 10. The article body — what the chrome expects

Articles in `articles/` are **not** styled by `assets/style.css`. They are
self-contained documents with their own inline `<style>` block. This is
intentional: the article is the product, and the chrome wraps it.

For consistency, every new article should follow the established pattern:

- `--bg-primary: #0D1117`, `--accent: #E94560`, `--gold: #FFD700` — the
  same tokens, inlined.
- A sticky `nav` with `back-link` (← 返回首页) and `nav-brand` (安祖羊).
- A `progress-bar` div at the top of `<body>`, 2px high, coral→gold
  gradient, width-driven by a scroll listener.
- A `article-hero` block with a `meta-tag` (the track), a date, a reading
  time, an h1, and a `deck` paragraph (the in-house term for subtitle).
- An `article-body` with h2 section breaks (each H2 has a 60px coral
  underline), one-sentence-per-line body, occasional `<strong>` in coral
  and `<span class="highlight">` in gold.
- A `pull-quote` block before the closing section.
- An `end-cta` with the `— 安祖羊` signature.
- A `body::before` 4%-opacity noise overlay.

If you are writing a new article, copy `ai-era-5-things.html` first. It
is the canonical template.

---

## 11. How to add new content

### Add an article

1. Copy `articles/ai-era-5-things.html` → `articles/<slug>.html`.
2. Edit the title, deck, body, tags, and track inside the new file.
3. Add a manifest entry to `articles/articles.json` (see §9).
4. Commit. The list page picks it up on next page load.

### Add a report

1. Write the report as a self-contained HTML file in `reports/`.
2. Add a manifest entry to `reports/reports.json`. Reports are
   password-gated; the password lives in `assets/app.js` (`REPORTS_PASSWORD`).
3. The reports page renders the list, prompts for the password, and opens
   the report in an iframe when unlocked.

### Change the password

`REPORTS_PASSWORD` in `assets/app.js`. There is no server-side
validation — this is a soft gate. The lock state is in-memory and resets
on every page load (no `localStorage`).

---

## 12. Out of scope (deliberately)

- A light mode. The site is dark.
- A search box. With 6 articles, the manifest *is* the search.
- A comments system. The author prefers to be quoted elsewhere.
- A tag filter UI. Tags are display-only on the list page.
- An RSS feed. Trivial to add later as a static `feed.xml`.
- A build step. The site stays pure HTML/CSS/JS so it can be served
  from any static host (currently GitHub Pages).

---

*Last updated: 2026-06-08. The brand is a living document — when the
practice changes, this file changes with it.*
