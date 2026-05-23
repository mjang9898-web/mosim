// Shared building blocks for the Step 1 Trip variations.
// Reuses the landing page's visual system: Apple-style senior-friendly
// typography (Inter + Nanum Myeongjo), magenta accent #B21464, pill CTAs.
// Each variation pulls from this file to stay consistent.

const KW = {
  ink: '#1d1d1f',
  ink2: '#2a2a2c',
  ink3: '#4a4a4d',
  rule: '#e8e8ed',
  line: '#d2d2d7',
  bgSoft: '#f5f5f7',
  bgWarm: '#f0eee9',
  accent: '#B21464',
  accentDeep: '#8a0e4d',
  accentSoft: 'rgba(178,20,100,.08)',
  gold: '#b48a3a',
};

// ─── Han mark (brand symbol) ────────────────────────────────────────────
function HanMark({ size = 32, bg = '#ffffff', fg = '#B21464' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: 'block', flex: 'none' }}>
      <defs>
        <clipPath id={`han-clip-${size}`}><rect width="200" height="200" rx="28" /></clipPath>
      </defs>
      <g clipPath={`url(#han-clip-${size})`}>
        <rect width="200" height="200" fill={bg} />
        <g fill={fg}>
          <rect x="18" y="18" width="73" height="83" />
          <rect x="109" y="18" width="73" height="83" />
          <rect x="18" y="118" width="73" height="64" />
          <rect x="109" y="118" width="73" height="64" />
        </g>
        <rect x="1.5" y="1.5" width="197" height="197" rx="27" fill="none" stroke={bg} strokeWidth="3" />
      </g>
    </svg>
  );
}

// ─── Sticky top nav (matches landing) ──────────────────────────────────
function BrandNav({ active = 'plan' }) {
  // href:
  //   - Page-level menu items (Trip/Medical/Culture/Food&Beverage) link straight to their step page.
  //   - The remaining items (How it works/Insurance/FAQ/About) scroll to an anchor on the landing page.
  const items = [
    { id: 'how',       label: 'How it works',        href: 'index.html#process' },
    { id: 'trip',      label: 'Trip',                href: 'step1.html' },
    { id: 'medical',   label: 'Medical',             href: 'step2.html' },
    { id: 'culture',   label: 'Culture',             href: 'step3.html' },
    { id: 'food',      label: 'Food&Beverage',       href: 'step4.html' },
    { id: 'insurance', label: 'Insurance Navigator', href: 'index.html#insurance' },
    { id: 'faq',       label: 'FAQ',                 href: 'index.html#faq' },
    { id: 'about',     label: 'About Us',            href: 'index.html#about' },
  ];
  return (
    <nav className="kw-nav">
      <div className="kw-nav-inner">
        <a className="kw-brand" href="index.html">
          <HanMark size={32} bg="#ffffff" fg="#B21464" />
          <span className="kw-wm">K-Wellness</span>
        </a>
        <ul className="kw-navlist">
          {items.map(i => (
            <li key={i.id}><a href={i.href} className={i.id === active ? 'is-active' : ''}>{i.label}</a></li>
          ))}
        </ul>
        <div className="kw-nav-right">
          <a href="index.html#contact" className="kw-link-q">Sign in</a>
          <a href="step1.html" className="kw-cta kw-cta-sm">Plan Korea</a>
        </div>
      </div>
    </nav>
  );
}

// ─── 5-step indicator (Trip · Medical · Culture · Cuisine · Your Week) ──
const MAIN_STEPS = [
  { num: '01', label: 'Trip' },
  { num: '02', label: 'Medical' },
  { num: '03', label: 'Culture' },
  { num: '04', label: 'Cuisine' },
  { num: '05', label: 'Your Week' },
];

function StepBar({ active = 0, variant = 'horizontal' }) {
  return (
    <div className={`kw-stepbar kw-stepbar-${variant}`}>
      {MAIN_STEPS.map((s, i) => {
        const state = i < active ? 'done' : i === active ? 'active' : 'todo';
        return (
          <React.Fragment key={s.num}>
            <div className={`kw-step kw-step-${state}`}>
              <span className="kw-step-num">{state === 'done' ? '✓' : s.num}</span>
              <span className="kw-step-label">{s.label}</span>
            </div>
            {i < MAIN_STEPS.length - 1 && <span className="kw-step-rule" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Brand-mark placeholders for airlines and hotels ───────────────────
// We don't have actual logo art; these stylised marks use each brand's
// known palette so the grid reads as a real logo wall.
// US-focused carriers (the ones that actually fly to ICN from the States),
// plus the two Korean flag carriers and ANA as the common Japan-routing
// option. Real airline logos served from kiwi.com's public CDN.
const AIRLINES = [
  { code: 'DL', name: 'Delta Air Lines',     logo: 'https://images.kiwi.com/airlines/128/DL.png' },
  { code: 'AA', name: 'American Airlines',   logo: 'https://images.kiwi.com/airlines/128/AA.png' },
  { code: 'UA', name: 'United Airlines',     logo: 'https://images.kiwi.com/airlines/128/UA.png' },
  { code: 'AS', name: 'Alaska Airlines',     logo: 'https://images.kiwi.com/airlines/128/AS.png' },
  { code: 'B6', name: 'JetBlue',             logo: 'https://images.kiwi.com/airlines/128/B6.png' },
  { code: 'WN', name: 'Southwest Airlines',  logo: 'assets/airlines/southwest.jpeg' },
  { code: 'HA', name: 'Hawaiian Airlines',   logo: 'https://images.kiwi.com/airlines/128/HA.png' },
  { code: 'KE', name: 'Korean Air',          logo: 'https://images.kiwi.com/airlines/128/KE.png' },
  { code: 'OZ', name: 'Asiana Airlines',     logo: 'https://images.kiwi.com/airlines/128/OZ.png' },
  { code: 'NH', name: 'ANA',                 logo: 'https://images.kiwi.com/airlines/128/NH.png' },
];

// Hotel chains — wordmark SVGs drawn directly (stable, no CDN dependency).
// Each entry pairs a brand name with a render-key the HotelLogo switch uses.
const HOTELS = [
  { code: 'MR', name: 'Marriott Bonvoy',     logo: 'assets/hotels/marriott.avif' },
  { code: 'HH', name: 'Hilton Honors',       logo: 'assets/hotels/hilton.webp' },
  { code: 'FS', name: 'Four Seasons',        logo: 'assets/hotels/four-seasons.png' },
  { code: 'HY', name: 'World of Hyatt',      logo: 'assets/hotels/hyatt.png' },
  { code: 'RC', name: 'Ritz‑Carlton' },
  { code: 'MO', name: 'Mandarin Oriental' },
  { code: 'AM', name: 'Aman' },
  { code: 'SH', name: 'The Shilla' },
  { code: 'LT', name: 'Lotte Hotels' },
  { code: 'IH', name: 'IHG Hotels' },
];

// Hand-drawn hotel wordmarks. Rendered as styled HTML (more reliable than
// SVG <text>, which can fail to measure in some webkit contexts), with
// inline SVG used only for accompanying mark glyphs.
function HotelLogo({ code }) {
  const serif = "'Playfair Display', 'Times New Roman', 'Cormorant Garamond', serif";
  const sans  = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const row = { display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1, whiteSpace: 'nowrap' };

  switch (code) {
    case 'MR': // Marriott — red italic serif wordmark
      return (
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 700,
                      fontSize: 22, color: '#b00029', letterSpacing: '0.3px', lineHeight: 1 }}>
          Marriott
        </div>
      );

    case 'HH': // Hilton — navy slim sans
      return (
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 22,
                      color: '#002f5f', letterSpacing: '0.4px', lineHeight: 1 }}>
          Hilton
        </div>
      );

    case 'FS': // Four Seasons — tree mark + bold caps serif
      return (
        <div style={row}>
          <svg width="20" height="22" viewBox="0 0 22 24" aria-hidden="true">
            <path d="M11 2 C5 6 3 12 3 18 L19 18 C19 12 17 6 11 2 Z" fill="#1a1a1a" />
            <rect x="10" y="17" width="2" height="5" fill="#1a1a1a" />
          </svg>
          <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 11,
                         color: '#1a1a1a', letterSpacing: '2.2px', lineHeight: 1 }}>
            FOUR&nbsp;SEASONS
          </span>
        </div>
      );

    case 'HY': // Hyatt — black bold sans caps
      return (
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 22,
                      color: '#1d1d1f', letterSpacing: '2px', lineHeight: 1 }}>
          HYATT
        </div>
      );

    case 'RC': // Ritz-Carlton — lion-ish mark + serif caps in navy/gold
      return (
        <div style={{ ...row, gap: 5 }}>
          <svg width="20" height="22" viewBox="0 0 24 26" aria-hidden="true">
            <circle cx="12" cy="14" r="9" fill="#0e2a47" />
            <path d="M6 6 L12 2 L18 6 L17 9 L7 9 Z" fill="#0e2a47" />
            <circle cx="9.5" cy="13" r="1.2" fill="#c9a96e" />
            <circle cx="14.5" cy="13" r="1.2" fill="#c9a96e" />
            <path d="M7 17 Q12 20 17 17" stroke="#c9a96e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 7,
                           color: '#0e2a47', letterSpacing: '2px', lineHeight: 1 }}>THE</span>
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 10,
                           color: '#0e2a47', letterSpacing: '1.4px', lineHeight: 1 }}>
              RITZ‑CARLTON
            </span>
          </div>
        </div>
      );

    case 'MO': // Mandarin Oriental — fan mark + crimson serif
      return (
        <div style={{ ...row, gap: 6 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="#a01b3c" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="12" cy="20" r="1.6" fill="#a01b3c" stroke="none" />
              <path d="M12 20 L12 5" />
              <path d="M12 20 L4 9" />
              <path d="M12 20 L20 9" />
              <path d="M12 20 L7 6" />
              <path d="M12 20 L17 6" />
              <path d="M4 12 Q12 4 20 12" />
            </g>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 10,
                           color: '#a01b3c', letterSpacing: '1.2px', lineHeight: 1 }}>MANDARIN</span>
            <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 10,
                           color: '#a01b3c', letterSpacing: '1.2px', lineHeight: 1 }}>ORIENTAL</span>
          </div>
        </div>
      );

    case 'AM': // Aman — minimalist lowercase, very wide-tracked
      return (
        <div style={{ fontFamily: sans, fontWeight: 300, fontSize: 24,
                      color: '#1e1a16', letterSpacing: '8px', lineHeight: 1, paddingLeft: 8 }}>
          aman
        </div>
      );

    case 'SH': // The Shilla — wordmark + serif caps
      return (
        <div style={{ ...row, gap: 8 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 700, fontSize: 22,
                         color: '#1a3a2e', lineHeight: 1 }}>Shilla</span>
          <span style={{ width: 1, height: 16, background: '#c9a96e' }} />
          <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 12,
                         color: '#1a3a2e', letterSpacing: '2.4px', lineHeight: 1 }}>SEOUL</span>
        </div>
      );

    case 'LT': // Lotte — red caps stack
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontFamily: sans, fontWeight: 800, fontSize: 20,
                         color: '#a31818', letterSpacing: '3px', lineHeight: 1 }}>LOTTE</span>
          <span style={{ fontFamily: sans, fontWeight: 500, fontSize: 7,
                         color: '#a31818', letterSpacing: '3.6px', lineHeight: 1 }}>
            HOTELS&nbsp;&amp;&nbsp;RESORTS
          </span>
        </div>
      );

    case 'IH': // IHG — navy bold sans
      return (
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 26,
                      color: '#22325c', letterSpacing: '1.5px', lineHeight: 1 }}>
          IHG
        </div>
      );

    default:
      return null;
  }
}

// ─── Inline 2-month calendar (visual only) ─────────────────────────────
// Renders Apr & May 2026 with a sample range selected Apr 6 → Apr 13.
function InlineCalendar({ start = 6, end = 13, startMonth = 'Apr', endMonth = 'Apr',
                          monthA = 'April 2026', monthB = 'May 2026',
                          aStart = 3 /* Wed */, aDays = 30,
                          bStart = 5 /* Fri */, bDays = 31 }) {
  // build day cells for a month
  const monthCells = (firstDow, days) => {
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ blank: true, key: `b-${i}` });
    for (let d = 1; d <= days; d++) cells.push({ n: d, key: `d-${d}` });
    return cells;
  };
  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const renderMonth = (title, cells, monthLabel) => (
    <div className="kw-cal-month">
      <div className="kw-cal-month-title">{title}</div>
      <div className="kw-cal-dow">{DOW.map(d => <span key={d}>{d}</span>)}</div>
      <div className="kw-cal-grid">
        {cells.map(c => {
          if (c.blank) return <span key={c.key} className="kw-cal-day kw-cal-blank" />;
          const inRange = monthLabel === startMonth && c.n >= start && c.n <= end;
          const isStart = monthLabel === startMonth && c.n === start;
          const isEnd = monthLabel === endMonth && c.n === end;
          let cls = 'kw-cal-day';
          if (inRange) cls += ' kw-cal-in';
          if (isStart) cls += ' kw-cal-start';
          if (isEnd) cls += ' kw-cal-end';
          return <span key={c.key} className={cls}>{c.n}</span>;
        })}
      </div>
    </div>
  );

  return (
    <div className="kw-cal">
      {renderMonth(monthA, monthCells(aStart, aDays), 'Apr')}
      {renderMonth(monthB, monthCells(bStart, bDays), 'May')}
    </div>
  );
}

// ─── Logo card (brand placeholder, selectable) ──────────────────────────
function LogoCard({ brand, selected, kind = 'air' }) {
  return (
    <div className={`kw-logo ${selected ? 'is-selected' : ''}`}>
      <div className="kw-logo-mark" style={{ background: '#ffffff' }}>
        {brand.logo
          ? <img src={brand.logo} alt={brand.name} className="kw-logo-img" />
          : (kind === 'air'
              ? <span className="kw-logo-air">{brand.mark}</span>
              : <HotelLogo code={brand.code} />)}
      </div>
      <div className="kw-logo-name">{brand.name}</div>
      {selected && <span className="kw-logo-check">✓</span>}
    </div>
  );
}

// ─── Party-type card (Solo, Couple, etc.) ──────────────────────────────
const PARTY = [
  { id: 'solo',     label: 'Solo',     hint: 'Just me',           sub: 'A private journey' },
  { id: 'couple',   label: 'Couple',   hint: 'Two of us',         sub: 'Anniversary or romance' },
  { id: 'family',   label: 'Family',   hint: 'With children',     sub: 'Multi‑generational' },
  { id: 'friends',  label: 'Friends',  hint: 'Small group',       sub: 'A trip together' },
  { id: 'business', label: 'Business', hint: 'Work or executive', sub: 'Client or wellness' },
];

function PartyIcon({ id }) {
  // Simple, abstract iconography matching landing's stroked SVG style.
  const stroke = '#1d1d1f';
  const sw = 1.6;
  if (id === 'solo') return (
    <svg viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="11" r="5" /><path d="M6 27c1.5-5 5.5-7.5 10-7.5s8.5 2.5 10 7.5" />
    </svg>
  );
  if (id === 'couple') return (
    <svg viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="4" /><circle cx="21" cy="11" r="4" />
      <path d="M3 27c1-4 4-6 8-6s7 2 8 6M19 27c1-4 4-6 8-6" />
    </svg>
  );
  if (id === 'family') return (
    <svg viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="10" r="3.5" /><circle cx="23" cy="10" r="3.5" /><circle cx="16" cy="20" r="2.5" />
      <path d="M3 25c1-3 3-5 6-5s5 2 6 5M17 25c1-3 3-5 6-5s5 2 6 5M12 28c.6-2 2-3 4-3s3.4 1 4 3" />
    </svg>
  );
  if (id === 'friends') return (
    <svg viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="11" r="3.5" /><circle cx="16" cy="9" r="3.5" /><circle cx="24" cy="11" r="3.5" />
      <path d="M2 25c.6-3 2.4-4.5 6-4.5s5.4 1.5 6 4.5M10 25c.6-3 2.4-4.5 6-4.5s5.4 1.5 6 4.5M18 25c.6-3 2.4-4.5 6-4.5s5.4 1.5 6 4.5" />
    </svg>
  );
  if (id === 'business') return (
    <svg viewBox="0 0 32 32" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="13" width="22" height="14" rx="2" />
      <path d="M12 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4M5 19h22" />
    </svg>
  );
  return null;
}

// ─── Section header used inside variations ─────────────────────────────
function SectionEyebrow({ num, label }) {
  return (
    <div className="kw-eyebrow">
      <span className="kw-eyebrow-num">{num}</span>
      <span className="kw-eyebrow-text">{label}</span>
    </div>
  );
}

// ─── Stepper for traveler counts ───────────────────────────────────────
function Stepper({ label, hint, value, min = 0, max = 9 }) {
  return (
    <div className="kw-stepper">
      <div className="kw-stepper-info">
        <div className="kw-stepper-label">{label}</div>
        {hint && <div className="kw-stepper-hint">{hint}</div>}
      </div>
      <div className="kw-stepper-ctrl">
        <button className="kw-stepper-btn" disabled={value <= min}>−</button>
        <span className="kw-stepper-val">{value}</span>
        <button className="kw-stepper-btn">+</button>
      </div>
    </div>
  );
}

// expose to other babel scripts
Object.assign(window, {
  KW, HanMark, BrandNav, StepBar, MAIN_STEPS,
  AIRLINES, HOTELS, LogoCard, HotelLogo,
  InlineCalendar, PARTY, PartyIcon,
  SectionEyebrow, Stepper,
});
