# About Us (Founder) Section — Design

**Date:** 2026-05-29
**Status:** Approved for implementation planning
**Author:** Brainstormed with founder (Michael Jang) via Claude

## 1. Goal

Add a founder "About Us" section to the landing page (`index.html`) that builds trust by telling Michael Jang's personal story — why he started the company, what problem he solves, and what he promises — anchored by his professional B&W portrait and the meaning of the brand name **Mosim (모심)**. This also fixes the currently **dead `#about` nav anchor** (the nav links to `#about` but no element has that id).

## 2. Placement & structure

- **New `#about` section** added to `index.html`, positioned **immediately after the existing PHILOSOPHY section** ("To be received in HAN…"). Rationale: state the brand belief (HAN), then introduce the person who holds it.
- The nav item `<a href="#about">About Us</a>` (index.html:1376) already exists and will resolve to this new section once it has `id="about"`.
- **PHILOSOPHY section cleanup:** it currently carries a placeholder founder signature — `Soo‑hyun Park · Founder & Head Concierge` (index.html:1814–1815). Since the new About section now owns founder identity, **remove that signature block** from PHILOSOPHY, leaving it as a pure brand-belief moment. (Do not delete the PHILOSOPHY section itself — the "HAN" typographic moment is a deliberate brand element.)
- Approach chosen: **Option A** (new section + keep Philosophy, signature removed). Options B (merge) and C (delete Philosophy) were rejected to preserve the HAN brand moment.

## 3. Content (final, approved copy)

Voice: **first person, empathetic** (not preachy about the US system). Brand name used: **Mosim**.

- **Eyebrow:** `The person behind Mosim`
- **Headline:** `I built the trip I wish my own family could have had.`
- **Body (4 paragraphs):**

> I was born and raised in Seoul, and I've spent the last twenty years building a life in the United States — business school in Philadelphia, a career that keeps me moving between both countries. Somewhere along the way, I became the person friends and colleagues called whenever they were headed to Korea. I'd plan their days, book their clinics, and walk them through the parts of Seoul you only find if someone who loves the city takes you there.
>
> I loved doing it. And I noticed something: the people I hosted didn't just leave with good photos — they left with care they couldn't get at home, and they were stunned by how accessible it was.
>
> I know that gap personally. I've felt the cost and the complexity of getting care in the States — the bills, the waiting, the sense that the system isn't built for you. Korea quietly offers another way: world-class medicine, traditional healing, and a culture that treats a guest as someone to be looked after completely.
>
> There's a Korean word for that kind of care: **모심 — *mosim***. It means to attend to someone with reverence — the way you look after your parents, your elders, an honored guest in your home. Not service rendered for a fee, but devotion. I named this company Mosim because it's the only promise I know how to make: I'll give you exactly what I give the people I love — one person who knows both worlds, handling everything, so you can simply arrive and be cared for.

- **Signature:** `— Sunggun Michael Jang, Founder`

**Mosim highlight:** within the 4th paragraph, the word `모심 · mosim` and its gloss `to attend to, with reverence` are visually emphasized as an inline callout (see layout). Note `모심` is the native Korean noun from 모시다 (to attend to/serve a respected person) — not the Sino-Korean 模心.

## 4. Layout

Approved layout: **photo left, story right** (the existing `journey`/two-column patterns in the page are the visual precedent).

```
┌─────────────────────────────────────────┐
│  The person behind Mosim                  │
│  ┌─────────┐  I built the trip I wish...  │
│  │  B&W    │  [4-paragraph story]         │
│  │ PORTRAIT│  ...a word: 모심 · mosim     │
│  │ Michael │  ┌──────────────────────┐    │
│  │ on stool│  │ to attend to, with   │    │
│  └─────────┘  │ reverence            │    │
│               └──────────────────────┘    │
│            — Sunggun Michael Jang, Founder│
└─────────────────────────────────────────┘
```

- Container: `.wrap` (1080px) or `.wrap-wide` (1320px) to match adjacent sections — pick whichever aligns visually with the Philosophy/Journeys sections (likely `.wrap`).
- Two-column grid: left ~40% photo, right ~60% text. Use CSS grid/flex consistent with existing patterns.
- **Photo**: rounded corners consistent with site cards; `object-fit: cover` with a portrait aspect ratio so the near-square source crops gracefully. Stays B&W (the source is already B&W).
- **Mosim inline callout**: the `모심 · mosim` word emphasized (larger, magenta `--kw-accent`/`#B21464` or ink-strong), with the gloss "to attend to, with reverence" in a small bordered/offset block. Do NOT reuse the giant "HAN" typographic device (the Philosophy section directly above already uses it — avoid repetition).
- **Signature** styled like the existing `.sig` pattern (name + role).
- **Responsive**: on narrow screens (≤ ~700px), columns stack — photo on top, text below. Photo caps at a sensible max-width when stacked (don't let it dominate the fold).
- **Body copy** ≥ 19px per design.md; grays no lighter than `--ink-3`. Magenta only `#B21464`.

## 5. Photo asset

- Source: founder portrait, 1193×1216 PNG (~1MB), already black & white.
- Process: convert/optimize to **WebP**, place at `assets/founder/michael-jang.webp` (new `assets/founder/` dir). Keep a reasonable max dimension (~900px wide) and quality to land well under ~150KB.
- Reference directly via `<img src="assets/founder/michael-jang.webp" ...>` with descriptive `alt` (e.g., `"Sunggun Michael Jang, founder of Mosim"`). Do NOT use the `<image-slot>` placeholder element — this is a real, final image.
- Include `width`/`height` (or aspect-ratio CSS) to avoid layout shift, and `loading="lazy"` since it's below the fold.

## 6. Brand naming note

The site currently mixes brand names: nav wordmark says **K-Wellness**, the result page says **Mosim**, the domain is **mosim.vercel.app**. This brainstorm confirms **Mosim is the company name and motto** (모심). The About copy uses "Mosim". A **site-wide K-Wellness → Mosim reconciliation is OUT OF SCOPE for this section** but is flagged as a separate follow-up (nav wordmark, philosophy section copy, titles, etc.).

## 7. Files touched

- **Modify:** `index.html` — add `#about` section markup (after PHILOSOPHY), add its CSS to the page's `<style>`, remove the placeholder `.sig` block from the PHILOSOPHY section.
- **Create:** `assets/founder/michael-jang.webp` — optimized portrait.
- No JS changes (static section). No new dependencies. No build-step changes (not JSX).

## 8. Out of scope (not this section)

- Site-wide K-Wellness → Mosim rename.
- A separate `/about.html` page (this is an on-landing section per the no-new-pages rule in CLAUDE.md).
- Team/multi-person bios (founder only).
- Naming the specific Philadelphia business school (kept general unless founder provides it later).
- Other landing-page gaps from the 2026-05-29 site audit (dead links, SEO, analytics, itinerary wiring) — tracked separately.

## 9. Acceptance check (manual)

- Clicking nav "About Us" smooth-scrolls to the founder section (anchor resolves).
- Section renders: eyebrow, headline, B&W portrait, 4-paragraph story, emphasized 모심 callout, signature.
- Desktop: photo left / text right. Mobile (≤700px): stacked, photo not oversized, text ≥19px.
- PHILOSOPHY section no longer shows the "Soo-hyun Park" placeholder signature; "HAN" moment intact.
- Portrait loads as optimized WebP, < ~150KB, with alt text; no layout shift; Lighthouse unaffected (≥90).
