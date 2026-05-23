// Step 3 — Culture. 50 cultural experiences split across 3 paginated
// pages: Heritage & Royal · Crafts & Wellness · Modern & Performing.
// Same card pattern as Step 2 Medical but denser (4 cols), tighter
// footers, and a tab-based pager.

const { useState } = React;

// ─── Curated packages — for guests who want a pre-set bundle ──────────
// Selecting a package replaces the current basket with its codes.
const PACKAGES = [
  {
    id: 'classic',
    palette: 'classic',
    letter: 'A',
    eyebrow: 'Most popular',
    name: 'The Classic Seoul',
    desc: 'Everything a first-time American visitor wants: palaces, hanok, hanbok, market street food, and the city skyline.',
    chips: ['Royal Palace', 'Hanok Village', 'Hanbok shoot', 'Tea ceremony', 'Namsan Tower', 'Gwangjang Market', 'DMZ tour'],
    codes: ['gyeongbokgung', 'bukchon', 'hanbok', 'tea', 'namsan-tower', 'gwangjang', 'dmz'],
    duration: '7 experiences · ~3 days',
  },
  {
    id: 'kwave',
    palette: 'kwave',
    letter: 'B',
    eyebrow: 'For the K-Wave fan',
    name: 'K-Pop & City Life',
    desc: 'The modern Seoul most American visitors come for — concerts, dance, shopping, and skyline sunsets.',
    chips: ['K-Pop concert', 'HYBE tour', 'Dance class', 'Hongdae fashion', 'Seongsu walk', 'SkyDeck sunset', 'Han River yacht'],
    codes: ['kpop-concert', 'hybe', 'kpop-class', 'hongdae', 'seongsu', 'lotte', 'hanriver-yacht'],
    duration: '7 experiences · ~3 days',
  },
  {
    id: 'quiet',
    palette: 'quiet',
    letter: 'C',
    eyebrow: 'Quiet & reflective',
    name: 'Heritage & Stillness',
    desc: 'A slower, deeper week — templestay, meditation, royal music, calligraphy, and the secret garden of kings.',
    chips: ['Templestay', 'Meditation', 'Tea ceremony', "King's Garden", 'Calligraphy', 'Royal Court Music', 'Pansori'],
    codes: ['haeinsa', 'meditation', 'tea', 'huwon', 'calligraphy', 'royalmusic', 'pansori'],
    duration: '7 experiences · ~3 days',
  },
];

// ─── 50 cultural experiences ──────────────────────────────────────────
// Spread across 3 thematic pages: Heritage / Shop / Famous.
// Tour-name strings are English-concept first — original Korean place
// names live in `code` and surface only on the detail screen.
const CULTURE_PAGES = [
  {
    id: 'heritage',
    eyebrow: 'Page Ⅰ',
    label: 'Heritage',
    items: [
      { code: 'gyeongbokgung',  mono: 'I',      theme: 'palace',   eyebrow: 'Palace',     name: 'Korean Royal Palace Tour',         meta: 'Half day · with historian' },
      { code: 'changdeokgung',  mono: 'II',     theme: 'palace',   eyebrow: 'Palace',     name: 'Royal Garden Palace Visit',        meta: '3 hours · UNESCO' },
      { code: 'deoksugung',     mono: 'III',    theme: 'palace',   eyebrow: 'Palace',     name: 'Evening Lantern Palace Walk',      meta: '2 hours · evening' },
      { code: 'changgyeonggung',mono: 'IV',     theme: 'palace',   eyebrow: 'Palace',     name: 'Moonlit Palace Night Opening',     meta: '2 hours · seasonal' },
      { code: 'jongmyo',        mono: 'V',      theme: 'palace',   eyebrow: 'Shrine',     name: 'Royal Ancestral Shrine',           meta: '2 hours · UNESCO' },
      { code: 'huwon',          mono: 'VI',     theme: 'garden',   eyebrow: 'Garden',     name: "The King's Secret Garden Walk",    meta: '90 min · guided' },
      { code: 'bukchon',        mono: 'VII',    theme: 'hanok',    eyebrow: 'Hanok',      name: 'Traditional Hanok Village Stroll', meta: '2 hours · walking' },
      { code: 'bongeunsa',      mono: 'VIII',   theme: 'temple',   eyebrow: 'Temple',     name: 'City Mountain Temple Visit',       meta: '90 min · meditation' },
      { code: 'jogyesa',        mono: 'IX',     theme: 'temple',   eyebrow: 'Temple',     name: 'Flower Lantern Temple Visit',      meta: '60 min · seasonal' },
      { code: 'haeinsa',        mono: 'X',      theme: 'temple',   eyebrow: 'Templestay', name: 'Tripitaka Templestay Overnight',   meta: '24 hours · with monk' },
      { code: 'meditation',     mono: 'XI',     theme: 'temple',   eyebrow: 'Meditation', name: 'Buddhist Meditation Session',      meta: '2 hours · with monk' },
      { code: 'tea',            mono: 'XII',    theme: 'tea',      eyebrow: 'Tea',        name: 'Private Tea Ceremony',             meta: '90 min · private room' },
      { code: 'calligraphy',    mono: 'XIII',   theme: 'crafts',   eyebrow: 'Brush',      name: 'Brush Calligraphy with Master',    meta: '2 hours · private' },
      { code: 'hanbok',         mono: 'XIV',    theme: 'heritage', eyebrow: 'Hanbok',     name: 'Royal Dress Fitting & Photoshoot', meta: 'Half day · private' },
      { code: 'royalcuisine',   mono: 'XV',     theme: 'heritage', eyebrow: 'Cuisine',    name: 'Royal Court Cuisine Tasting',      meta: '2 hours · with sommelier' },
      { code: 'nationalmuseum', mono: 'XVI',    theme: 'museum',   eyebrow: 'Museum',     name: 'National History Museum',          meta: '3 hours · curator-led' },
      { code: 'warmemorial',    mono: 'XVII',   theme: 'museum',   eyebrow: 'Museum',     name: 'War Memorial & Monument',          meta: '2 hours · guided' },
      { code: 'cheonggye',      mono: 'XVIII',  theme: 'garden',   eyebrow: 'Stream',     name: 'Cheonggyecheon Stream Walk',       meta: '90 min · evening best' },
    ],
  },
  {
    id: 'shop',
    eyebrow: 'Page Ⅱ',
    label: 'Shop',
    items: [
      { code: 'seongsu',       mono: 'XIX',    theme: 'shop',    eyebrow: 'District', name: 'Brooklyn-of-Seoul Café & Boutique Walk', meta: '3 hours · self-paced' },
      { code: 'myeongdong',    mono: 'XX',     theme: 'market',  eyebrow: 'District', name: 'Main Shopping Street & K-Beauty',        meta: '3 hours · with stylist' },
      { code: 'apgujeong',     mono: 'XXI',    theme: 'shop',    eyebrow: 'Luxury',   name: 'Designer Luxury Boutique Row',           meta: 'Half day · concierge' },
      { code: 'coex',          mono: 'XXII',   theme: 'modern',  eyebrow: 'Mall',     name: 'Starfield Library & Mega Mall',          meta: '3 hours · indoors' },
      { code: 'garosugil',     mono: 'XXIII',  theme: 'shop',    eyebrow: 'District', name: 'Tree-lined Boutique Avenue',             meta: '2 hours · walking' },
      { code: 'hongdae',       mono: 'XXIV',   theme: 'shop',    eyebrow: 'District', name: 'Youth Street Fashion Quarter',           meta: '3 hours · evening best' },
      { code: 'ikseondong',    mono: 'XXV',    theme: 'hanok',   eyebrow: 'Hanok',    name: 'Hanok Alleys, Cafés & Boutiques',        meta: '2 hours · self-paced' },
      { code: 'gwangjang',     mono: 'XXVI',   theme: 'market',  eyebrow: 'Market',   name: 'Traditional Street Food Market',         meta: '90 min · with foodie' },
      { code: 'namdaemun',     mono: 'XXVII',  theme: 'market',  eyebrow: 'Market',   name: 'Largest Night Market',                   meta: '2 hours · evening' },
      { code: 'ddp',           mono: 'XXVIII', theme: 'modern',  eyebrow: 'District', name: 'Modern Design Plaza & Shopping',         meta: '2 hours · Zaha Hadid' },
      { code: 'ddm',           mono: 'XXIX',   theme: 'modern',  eyebrow: 'Market',   name: 'Midnight Fashion Wholesale',             meta: '3 hours · 11pm–5am' },
      { code: 'kbeauty',       mono: 'XXX',    theme: 'shop',    eyebrow: 'K-Beauty', name: 'K-Beauty Flagship Tour',                 meta: 'Half day · with samples' },
      { code: 'insadong',      mono: 'XXXI',   theme: 'crafts',  eyebrow: 'Crafts',   name: 'Traditional Craft & Antique Lanes',      meta: '3 hours · with curator' },
      { code: 'hannam',        mono: 'XXXII',  theme: 'shop',    eyebrow: 'Gallery',  name: 'Boutique Gallery & Concept Row',         meta: '3 hours · walking' },
      { code: 'commonground',  mono: 'XXXIII', theme: 'modern',  eyebrow: 'Market',   name: 'Container Market & Pop-ups',             meta: '2 hours · self-paced' },
      { code: 'taxfree',       mono: 'XXXIV',  theme: 'shop',    eyebrow: 'Outlet',   name: 'Tax-Free Designer Outlet Day',           meta: 'Full day · with driver' },
    ],
  },
  {
    id: 'famous',
    eyebrow: 'Page Ⅲ',
    label: 'Famous',
    items: [
      { code: 'baseball',     mono: 'XXXV',    theme: 'sport',   eyebrow: 'Sports',    name: 'KBO Baseball with Private Box',      meta: '3 hours · with snacks' },
      { code: 'golf',         mono: 'XXXVI',   theme: 'sport',   eyebrow: 'Sports',    name: 'Signature Golf Course Round',        meta: 'Full day · 18 holes' },
      { code: 'kpop-concert', mono: 'XXXVII',  theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Concert with VIP Access',      meta: '3 hours · soundcheck pass' },
      { code: 'hybe',         mono: 'XXXVIII', theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Label Studio Tour',            meta: '90 min · BTS HQ' },
      { code: 'smtown',       mono: 'XXXIX',   theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Artists Museum',               meta: '2 hours · self-paced' },
      { code: 'kpop-class',   mono: 'XL',      theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Dance Class',                  meta: '2 hours · private' },
      { code: 'namsan-tower', mono: 'XLI',     theme: 'modern',  eyebrow: 'View',      name: 'N Seoul Tower at Sunset',            meta: '2 hours · cable car' },
      { code: 'lotte',        mono: 'XLII',    theme: 'modern',  eyebrow: 'View',      name: 'Skyscraper SkyDeck at Sunset',       meta: '60 min · 555m' },
      { code: 'hanriver-yacht', mono: 'XLIII', theme: 'nature',  eyebrow: 'River',     name: 'Han River Sunset Yacht Cruise',      meta: '2 hours · with champagne' },
      { code: 'hanriver',     mono: 'XLIV',    theme: 'nature',  eyebrow: 'River',     name: 'Han River Sunrise Kayak',            meta: '90 min · sunrise' },
      { code: 'forestbath',   mono: 'XLV',     theme: 'nature',  eyebrow: 'Forest',    name: 'Mountain Forest Bathing',            meta: 'Half day · with guide' },
      { code: 'dmz',          mono: 'XLVI',    theme: 'dmz',     eyebrow: 'History',   name: 'Border Zone Private Tour',           meta: 'Full day · pre-cleared' },
      { code: 'royalmusic',   mono: 'XLVII',   theme: 'music',   eyebrow: 'Music',     name: 'Royal Court Music Recital',          meta: '90 min · private' },
      { code: 'bboy',         mono: 'XLVIII',  theme: 'perform', eyebrow: 'Dance',     name: 'B-Boy Showcase in Hongdae',          meta: '90 min · world champions' },
      { code: 'nanta',        mono: 'XLIX',    theme: 'perform', eyebrow: 'Show',      name: 'Non-Verbal Drum Show',               meta: '90 min · family-friendly' },
      { code: 'pansori',      mono: 'L',       theme: 'perform', eyebrow: 'Vocal',     name: 'Korean Epic Vocal Performance',      meta: '90 min · with translator' },
    ],
  },
  {
    id: 'beyond',
    eyebrow: 'Page Ⅳ',
    label: 'Beyond Seoul',
    kind: 'cities',
    items: [
      {
        code: 'jeju', mono: 'J', theme: 'jeju',
        name: 'Jeju Island',
        region: 'Volcanic island · 1h flight',
        desc: 'Sub-tropical UNESCO island — volcanic peaks, sea-women heritage, lava caves, and Korea\'s gentlest coastline.',
        activities: ['Sunrise Peak hike', 'Hallasan summit', 'Coastal Olleh trail', 'Haenyeo diving heritage', 'Lava-tube caves', 'Citrus farm'],
      },
      {
        code: 'busan', mono: 'B', theme: 'ocean',
        name: 'Busan',
        region: 'Southern coast · 2.5h KTX',
        desc: 'Korea\'s second city — beachside sashimi mornings, hillside film-set villages, and a mountain temple above the sea.',
        activities: ['Haeundae beach day', 'Gamcheon culture village', 'Jagalchi fish market', 'Beomeosa mountain temple', 'Gukje street market'],
      },
      {
        code: 'gyeongju', mono: 'G', theme: 'heritage',
        name: 'Gyeongju',
        region: 'Ancient capital · 2h KTX',
        desc: 'The thousand-year Silla capital — UNESCO temple, royal grotto, tumulus mounds, and observatory of the stars.',
        activities: ['Bulguksa Temple', 'Seokguram Grotto', 'Royal tomb park', 'Cheomseongdae observatory', 'Gyochon hanok village'],
      },
      {
        code: 'jeonju', mono: 'J', theme: 'hanok',
        name: 'Jeonju',
        region: 'Hanok town · 2h KTX',
        desc: 'Korea\'s preserved hanok village — birthplace of bibimbap and a slow afternoon of tile-roof alleys.',
        activities: ['Hanok village stroll', 'Bibimbap tasting', 'Hanji paper workshop', 'Soju cellars', 'Pungnammun gate walk'],
      },
      {
        code: 'gangwon', mono: 'G', theme: 'nature',
        name: 'Gangwon-do',
        region: 'East mountains & coast · 2–3h',
        desc: 'Korea\'s alpine east — national parks, ski slopes, beach coffee streets, and the Olympic mountain town.',
        activities: ['Seoraksan National Park', 'Gangneung coffee street', 'Sokcho beach & sashimi', 'Pyeongchang Olympic site', 'Naksansa seaside temple'],
      },
      {
        code: 'incheon', mono: 'I', theme: 'modern',
        name: 'Incheon',
        region: 'Gateway city · 1h from Seoul',
        desc: 'Where Korea meets the world — Korea\'s oldest Chinatown, the futurist Songdo skyline, and a heritage island.',
        activities: ['Songdo Central Park', 'Chinatown & Wolmido', 'Ganghwa heritage island', 'Korean Open-Air Museum', 'Sunset airport vista'],
      },
    ],
  },
  {
    id: 'packages',
    eyebrow: 'Page Ⅴ',
    label: 'Packages',
    kind: 'packages',
    items: [],   // packages page renders PACKAGES instead
  },
];

// Pace options + the helper line shown beneath the selector.
const PACE = [
  { id: 'slow',     label: 'Slow & contemplative', hint: 'Slow & contemplative — a gentle pace with generous rest, roughly one cultural moment every other day.' },
  { id: 'balanced', label: 'Balanced',             hint: 'Balanced — typically 1 cultural moment per day, paired with rest or cuisine.' },
  { id: 'curious',  label: 'Curious explorer',     hint: 'Curious explorer — two cultural touchpoints most days, with room to wander.' },
  { id: 'max',      label: 'Maximum immersion',    hint: 'Maximum immersion — a full, active week with multiple experiences daily.' },
];

function Step3Culture() {
  const [pageIdx, setPageIdx] = useState(0);
  const [selected, setSelected] = useState(() => new Set());  // no pre-selection
  const [notes, setNotes] = useState('');
  const [pace, setPace] = useState('balanced');

  const currentPage = CULTURE_PAGES[pageIdx];
  const allSelectedItems = CULTURE_PAGES.flatMap(p => p.items.filter(it => selected.has(it.code)));

  const toggle = code => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const clearAll = () => setSelected(new Set());

  // Which package is "active" — defined as: the basket exactly matches a
  // package's codes (set equality). Lets us highlight the selected pkg
  // and toggle re-selection.
  const activePkgId = (() => {
    for (const p of PACKAGES) {
      if (p.codes.length !== selected.size) continue;
      if (p.codes.every(c => selected.has(c))) return p.id;
    }
    return null;
  })();
  const applyPackage = (pkg) => {
    if (activePkgId === pkg.id) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pkg.codes));
    }
  };

  // Per-experience detail pages are added later. For now this is a
  // placeholder — when the detail pages exist, navigate to them here.
  const openDetail = (item) => {
    // TODO: window.location.href = 'culture-detail.html?id=' + item.code;
    alert('Detail page for "' + item.name + '" — coming soon.');
  };

  const onContinue = () => {
    const culture = {
      selected: allSelectedItems.map((it) => it.name),   // names → result page
      selectedCodes: Array.from(selected).join(','),      // codes (string, internal)
      notes: notes.trim(),
      pace: pace,
    };
    if (window.kwState) window.kwState.saveStep('culture', culture);
    window.location.href = 'step4.html';
  };
  const goBack = () => { window.location.href = 'step2.html'; };

  return (
    <div className="kw-screen">
      <BrandNav active="culture" />

      <div className="kw-wrap">
        <StepBar active={2} />

        <header className="kw-page-hero">
          <SectionEyebrow num="03" label="Step 03 of 05" />
          <h1>What culture would you like <span className="kw-accent">to receive?</span></h1>
          <p>
            From Seoul day-trips to Jeju weekends — pick what calls to you.
          </p>
        </header>

        {/* ── Sub-step Ⅰ — Choose your experiences ─────────────────── */}
        <div className="kw-substep">
          <div className="kw-substep-l">
            <span className="kw-substep-numeral">Step Ⅰ</span>
            <span className="kw-substep-title">Choose your experiences</span>
          </div>
          <span className="kw-substep-hint">
            Five curated pages — Heritage, Shop, Famous, Beyond Seoul, Packages.
          </span>
        </div>

        <section className="kw-q-row kw-q-row-full">
          <div className="kw-q-input">

            {/* Page tabs */}
            <div className="kw-pagetabs">
              {CULTURE_PAGES.map((p, i) => {
                const pageSelCount = p.items.filter(it => selected.has(it.code)).length;
                return (
                  <button
                    key={p.id}
                    className={`kw-pagetab ${i === pageIdx ? 'is-active' : ''}`}
                    onClick={() => setPageIdx(i)}
                  >
                    <span className="kw-pagetab-num">{p.eyebrow}</span>
                    <span className="kw-pagetab-label">
                      {p.label}
                      {p.kind !== 'packages' && (
                        <span className="kw-pagetab-count">
                          {p.kind === 'cities'
                            ? `${p.items.length} cities`
                            : `${p.items.length}${pageSelCount > 0 ? ` · ${pageSelCount} picked` : ''}`}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Page content — items grid · curated packages · or city cards */}
            {currentPage.kind === 'cities' ? (
              <div className="kw-city-grid">
                {currentPage.items.map(c => (
                  <div key={c.code} className={`kw-city kw-photo-${c.theme}`}>
                    <div className="kw-city-photo">
                      <span className="kw-city-monogram">{c.mono}</span>
                      <span className="kw-city-photo-region">{c.region}</span>
                    </div>
                    <div className="kw-city-body">
                      <div className="kw-city-name">{c.name}</div>
                      <p className="kw-city-desc">{c.desc}</p>
                      <div className="kw-city-acts">
                        {c.activities.map(a => (
                          <span key={a} className="kw-city-chip">{a}</span>
                        ))}
                      </div>
                      <div className="kw-city-foot">
                        <span className="kw-city-count">{c.activities.length} activities</span>
                        <a href="#" className="kw-city-cta">View all →</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentPage.kind === 'packages' ? (
              <>
                <div className="kw-pkg-band">
                  <span className="kw-pkg-band-title">Not sure where to start?</span>
                  <span className="kw-pkg-band-hint">
                    Pick a ready-made package — selecting one replaces your basket.
                  </span>
                </div>

                <div className="kw-pkg-grid">
                  {PACKAGES.map(p => {
                    const active = activePkgId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`kw-pkg kw-pkg-${p.palette} ${active ? 'is-selected' : ''}`}
                        onClick={() => applyPackage(p)}
                      >
                        <div className="kw-pkg-banner">
                          <span className="kw-pkg-banner-letter">{p.letter}</span>
                          <span className="kw-pkg-banner-cap">{p.eyebrow}</span>
                        </div>
                        <div className="kw-pkg-body">
                          <div className="kw-pkg-name">{p.name}</div>
                          <p className="kw-pkg-desc">{p.desc}</p>
                          <div className="kw-pkg-includes">
                            {p.chips.map(c => (
                              <span key={c} className="kw-pkg-chip">{c}</span>
                            ))}
                          </div>
                          <div className="kw-pkg-foot">
                            <span className="kw-pkg-meta">{p.duration}</span>
                            <button
                              className="kw-pkg-cta"
                              onClick={(e) => { e.stopPropagation(); applyPackage(p); }}
                            >
                              {active ? '✓ Selected' : 'Pick this package'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="kw-cul-grid">
              {currentPage.items.map(it => {
                const sel = selected.has(it.code);
                return (
                  <div
                    key={it.code}
                    className={`kw-cul kw-photo-${it.theme} ${sel ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetail(it)}
                  >
                    <div className="kw-cul-photo">
                      <span className="kw-cul-monogram">{it.mono}</span>
                    </div>
                    <span className="kw-cul-view">View details →</span>
                    <div className="kw-cul-body">
                      <span className="kw-cul-eyebrow">{it.eyebrow}</span>
                      <div className="kw-cul-name">{it.name}</div>
                      <div className="kw-cul-foot">
                        <span className="kw-cul-meta">{it.meta}</span>
                        <button
                          className="kw-cul-add"
                          onClick={(e) => { e.stopPropagation(); toggle(it.code); }}
                        >
                          {sel ? <>✓ Added</> : <><span className="kw-cul-add-plus">+</span> Add</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Pagination */}
            <div className="kw-pagination">
              <button
                className="kw-pagination-btn"
                onClick={() => setPageIdx(i => Math.max(0, i - 1))}
                disabled={pageIdx === 0}
              >
                ← Previous
              </button>
              {CULTURE_PAGES.map((p, i) => (
                <button
                  key={p.id}
                  className={`kw-pagination-btn kw-pagination-num ${i === pageIdx ? 'is-active' : ''}`}
                  onClick={() => setPageIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
              <span className="kw-pagination-info">Page {pageIdx + 1} of {CULTURE_PAGES.length}</span>
              <button
                className="kw-pagination-btn"
                onClick={() => setPageIdx(i => Math.min(CULTURE_PAGES.length - 1, i + 1))}
                disabled={pageIdx === CULTURE_PAGES.length - 1}
              >
                Next →
              </button>
            </div>

            {/* Basket — visible across pages */}
            <div className="kw-cul-basket">
              <div className="kw-basket-head">
                <span className="kw-basket-eyebrow">
                  Your basket
                  <span className="kw-basket-count">· {allSelectedItems.length} selection{allSelectedItems.length === 1 ? '' : 's'}</span>
                </span>
                {allSelectedItems.length > 0 &&
                  <a href="#" className="kw-basket-clear" onClick={(e) => { e.preventDefault(); clearAll(); }}>Clear all</a>
                }
              </div>
              <div className="kw-basket-items">
                {allSelectedItems.map(it => (
                  <div key={it.code} className={`kw-basket-item kw-photo-${it.theme}`}>
                    <div className="kw-basket-thumb">{it.mono}</div>
                    <div className="kw-basket-item-info">
                      <div className="kw-basket-item-name">{it.name}</div>
                      <div className="kw-basket-item-meta">{it.meta}</div>
                    </div>
                    <button
                      className="kw-basket-item-remove"
                      aria-label={`Remove ${it.name}`}
                      onClick={() => toggle(it.code)}
                    >×</button>
                  </div>
                ))}
                <a href="#" className="kw-basket-add" onClick={(e) => e.preventDefault()}>
                  <span className="kw-basket-add-icon">+</span>
                  <span>Browse more</span>
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* ── Sub-step Ⅱ — Your preferences ──────────────────────── */}
        <div className="kw-substep">
          <div className="kw-substep-l">
            <span className="kw-substep-numeral">Step Ⅱ</span>
            <span className="kw-substep-title">Your preferences</span>
          </div>
          <span className="kw-substep-hint">
            Pace, interests, and anything else.
          </span>
        </div>

        {/* 01. NOTES */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="01" label="Notes" />
            <h2 className="kw-q-title">Anything you'd love to do?</h2>
            <p className="kw-q-help">
              A specific master you want to study with, a temple you've read about,
              a memory you'd like to recreate. Tell us.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-notes-card">
              <div className="kw-notes-card-head">
                <span className="kw-notes-card-label">
                  <span className="kw-notes-card-pen">✎</span>
                  Write your cultural notes here
                </span>
                <span className="kw-notes-card-secure">• Optional</span>
              </div>
              <textarea
                className="kw-textarea"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I've been wanting to study calligraphy with Kim Jong-won. Hoping to see the cherry blossoms at Changdeokgung at night. Open to anything quiet and contemplative."
              />
            </div>
          </div>
        </section>

        {/* 02. PACE */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="02" label="Pace" />
            <h2 className="kw-q-title">How active should your week feel?</h2>
            <p className="kw-q-help">
              Affects how many cultural touchpoints we thread between medical and rest days.
            </p>
          </div>
          <div className="kw-q-input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <div className="kw-segmented" style={{ display: 'inline-flex', background: 'var(--kw-bg-soft)', padding: 4, borderRadius: 12, gap: 4 }}>
              {PACE.map((p) => (
                <button
                  key={p.id}
                  className={pace === p.id ? 'is-active' : ''}
                  style={pace === p.id ? pillBtnActive : pillBtn}
                  onClick={() => setPace(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--kw-ink-3)', textAlign: 'right' }}>
              {(PACE.find((p) => p.id === pace) || PACE[1]).hint}
            </p>
          </div>
        </section>

        {/* Action bar */}
        <div className="kw-actionbar">
          <div className="kw-actionbar-l">
            <button className="kw-cta kw-cta-ghost kw-cta-sm"
                    style={{ height: 50, fontSize: 15, padding: '0 22px' }}
                    onClick={goBack}>
              ← Back to Medical
            </button>
            <span className="kw-actionbar-note">Your answers carry through to the next steps.</span>
          </div>
          <button className="kw-cta kw-cta-lg" onClick={onContinue}>
            Continue to Cuisine &nbsp;›
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline pill styles for the segmented Pace control (matches Step 2)
const pillBtn = {
  height: 40, padding: '0 18px',
  border: 'none', borderRadius: 9,
  background: 'transparent',
  fontSize: 14, fontWeight: 600,
  color: 'var(--kw-ink-3)',
  cursor: 'pointer',
};
const pillBtnActive = {
  ...pillBtn,
  background: '#fff',
  color: 'var(--kw-ink)',
  boxShadow: '0 1px 3px rgba(0,0,0,.08), 0 1px 0 rgba(0,0,0,.04)',
};

window.Step3Culture = Step3Culture;
