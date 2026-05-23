// V1 — Minimal · One Screen (interactive build)
// Four questions: When · Who · Departure · Notes.
// Fully interactive React state — calendar range picker, party selector
// with steppers, city→airport autocomplete, and a notes box.
// On Continue, all answers are persisted to sessionStorage via kwState.

const { useState } = React;

// ─── Party-type defaults (selecting a type seeds the steppers) ──────────
const PARTY_DEFAULTS = {
  solo:     { adults: 1, children: 0 },
  couple:   { adults: 2, children: 0 },
  family:   { adults: 2, children: 2 },
  friends:  { adults: 4, children: 0 },
  business: { adults: 2, children: 0 },
};

// ─── City → airport dataset, with average flight time to Seoul (ICN) ────
const CITIES = [
  { city: 'New York', airports: [
    { code: 'JFK', name: 'John F. Kennedy International', dur: '14h 25m', stops: 'nonstop' },
    { code: 'EWR', name: 'Newark Liberty International',   dur: '14h 50m', stops: 'nonstop' },
    { code: 'LGA', name: 'LaGuardia',                     dur: '16h 30m', stops: '1 stop' },
  ]},
  { city: 'Los Angeles', airports: [
    { code: 'LAX', name: 'Los Angeles International',      dur: '13h 05m', stops: 'nonstop' },
  ]},
  { city: 'San Francisco', airports: [
    { code: 'SFO', name: 'San Francisco International',    dur: '12h 30m', stops: 'nonstop' },
  ]},
  { city: 'Seattle', airports: [
    { code: 'SEA', name: 'Seattle–Tacoma International',   dur: '11h 00m', stops: 'nonstop' },
  ]},
  { city: 'Chicago', airports: [
    { code: 'ORD', name: "O'Hare International",           dur: '14h 05m', stops: 'nonstop' },
  ]},
  { city: 'Dallas', airports: [
    { code: 'DFW', name: 'Dallas/Fort Worth International', dur: '14h 30m', stops: 'nonstop' },
  ]},
  { city: 'Atlanta', airports: [
    { code: 'ATL', name: 'Hartsfield–Jackson Atlanta Intl', dur: '14h 35m', stops: 'nonstop' },
  ]},
  { city: 'Washington', airports: [
    { code: 'IAD', name: 'Washington Dulles International', dur: '14h 10m', stops: 'nonstop' },
  ]},
  { city: 'Boston', airports: [
    { code: 'BOS', name: 'Boston Logan International',     dur: '14h 30m', stops: 'nonstop' },
  ]},
  { city: 'Honolulu', airports: [
    { code: 'HNL', name: 'Daniel K. Inouye International', dur: '10h 00m', stops: 'nonstop' },
  ]},
  { city: 'Las Vegas', airports: [
    { code: 'LAS', name: 'Harry Reid International',       dur: '13h 30m', stops: '1 stop' },
  ]},
  { city: 'Toronto', airports: [
    { code: 'YYZ', name: 'Toronto Pearson International',  dur: '13h 30m', stops: 'nonstop' },
  ]},
  { city: 'Vancouver', airports: [
    { code: 'YVR', name: 'Vancouver International',        dur: '10h 50m', stops: 'nonstop' },
  ]},
  { city: 'London', airports: [
    { code: 'LHR', name: 'Heathrow',                      dur: '11h 20m', stops: 'nonstop' },
    { code: 'LGW', name: 'Gatwick',                       dur: '13h 40m', stops: '1 stop' },
  ]},
  { city: 'Paris', airports: [
    { code: 'CDG', name: 'Charles de Gaulle',             dur: '11h 30m', stops: 'nonstop' },
  ]},
  { city: 'Sydney', airports: [
    { code: 'SYD', name: 'Sydney Kingsford Smith',        dur: '10h 20m', stops: 'nonstop' },
  ]},
  { city: 'Tokyo', airports: [
    { code: 'NRT', name: 'Narita International',          dur: '2h 30m',  stops: 'nonstop' },
    { code: 'HND', name: 'Haneda',                       dur: '2h 25m',  stops: 'nonstop' },
  ]},
  { city: 'Singapore', airports: [
    { code: 'SIN', name: 'Changi',                       dur: '6h 30m',  stops: 'nonstop' },
  ]},
  { city: 'Hong Kong', airports: [
    { code: 'HKG', name: 'Hong Kong International',       dur: '3h 40m',  stops: 'nonstop' },
  ]},
  { city: 'Dubai', airports: [
    { code: 'DXB', name: 'Dubai International',           dur: '9h 00m',  stops: 'nonstop' },
  ]},
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WD_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function ymAdd(y, m, add) {
  const t = m + add;
  return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}
function cmpYMD(a, b) {
  return (a.y - b.y) || (a.m - b.m) || (a.d - b.d);
}

function TripV1Minimal() {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  // ── state ────────────────────────────────────────────────────
  const [dateMode, setDateMode]   = useState('specific');  // 'specific' | 'flexible'
  const [monthOffset, setMonthOffset] = useState(0);       // 0 = current month on the left
  const [rangeStart, setRangeStart]   = useState(null);    // {y,m,d}
  const [rangeEnd, setRangeEnd]       = useState(null);

  const [partyType, setPartyType] = useState('couple');
  const [adults, setAdults]       = useState(2);
  const [children, setChildren]   = useState(0);

  const [originText, setOriginText]     = useState('');
  const [originFocused, setOriginFocused] = useState(false);
  const [airport, setAirport]           = useState(null);  // {code,name,dur,stops,city}

  const [note, setNote] = useState('');

  // ── party ────────────────────────────────────────────────────
  function selectParty(id) {
    setPartyType(id);
    setAdults(PARTY_DEFAULTS[id].adults);
    setChildren(PARTY_DEFAULTS[id].children);
  }

  // ── calendar ─────────────────────────────────────────────────
  function isPast(y, m, d) {
    return new Date(y, m, d) < new Date(todayY, todayM, todayD);
  }
  function pickDay(y, m, d) {
    const cur = { y, m, d };
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(cur); setRangeEnd(null); return;
    }
    const c = cmpYMD(cur, rangeStart);
    if (c < 0) { setRangeStart(cur); }
    else if (c > 0) { setRangeEnd(cur); }
    // c === 0 → ignore (waiting for an end date)
  }
  function resetRange() { setRangeStart(null); setRangeEnd(null); }

  function nights() {
    if (!rangeStart || !rangeEnd) return 0;
    return Math.round(
      (new Date(rangeEnd.y, rangeEnd.m, rangeEnd.d) - new Date(rangeStart.y, rangeStart.m, rangeStart.d)) / 86400000
    );
  }
  function fmtDay(o) {
    const wd = WD_ABBR[new Date(o.y, o.m, o.d).getDay()];
    return wd + ' ' + MONTHS_ABBR[o.m] + ' ' + o.d;
  }

  function renderMonth(y, m) {
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="kw-cal-month">
        <div className="kw-cal-month-title">{MONTHS[m]} {y}</div>
        <div className="kw-cal-dow">{WD_ABBR.map((d, i) => <span key={i}>{d.slice(0, 2)}</span>)}</div>
        <div className="kw-cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <span key={'b' + i} className="kw-cal-day kw-cal-blank" />;
            const past = isPast(y, m, d);
            const cur = { y, m, d };
            let cls = 'kw-cal-day';
            if (past) {
              cls += ' kw-cal-past';
            } else {
              cls += ' kw-pick';
              if (rangeStart && rangeEnd && cmpYMD(cur, rangeStart) > 0 && cmpYMD(cur, rangeEnd) < 0) cls += ' kw-cal-in';
              if (rangeStart && cmpYMD(cur, rangeStart) === 0) cls += ' kw-cal-start';
              if (rangeEnd && cmpYMD(cur, rangeEnd) === 0) cls += ' kw-cal-end';
            }
            return (
              <span key={'d' + d} className={cls}
                    onClick={past ? undefined : () => pickDay(y, m, d)}>{d}</span>
            );
          })}
        </div>
      </div>
    );
  }

  const leftYM  = ymAdd(todayY, todayM, monthOffset);
  const rightYM = ymAdd(todayY, todayM, monthOffset + 1);

  // ── airport autocomplete ─────────────────────────────────────
  const q = originText.trim().toLowerCase();
  let matches = [];
  if (q) {
    CITIES.forEach(function (c) {
      if (c.city.toLowerCase().indexOf(q) !== -1) {
        c.airports.forEach(function (a) {
          matches.push({ code: a.code, name: a.name, dur: a.dur, stops: a.stops, city: c.city });
        });
      }
    });
  }
  const showDropdown = originFocused && q.length >= 1 && !airport;
  const matchCityLabel = (function () {
    if (matches.length === 0) return originText;
    const cities = {};
    matches.forEach(function (m) { cities[m.city] = 1; });
    const keys = Object.keys(cities);
    return keys.length === 1 ? keys[0] : originText;
  })();

  function selectAirport(a) {
    setAirport(a);
    setOriginText(a.city);
    setOriginFocused(false);
  }
  function clearAirport() {
    setAirport(null); setOriginText('');
  }

  // ── navigation ───────────────────────────────────────────────
  function onContinue() {
    let datesLabel;
    if (dateMode === 'flexible') {
      datesLabel = 'Flexible — AI recommends';
    } else if (rangeStart && rangeEnd) {
      datesLabel = fmtDay(rangeStart) + ' → ' + fmtDay(rangeEnd) + ' · ' + nights() + ' nights';
    } else if (rangeStart) {
      datesLabel = fmtDay(rangeStart) + ' (end date not set)';
    } else {
      datesLabel = 'Not set';
    }
    // Short label for the result-page hero (avoids a long date string)
    let monthLabel;
    if (dateMode === 'flexible') monthLabel = 'Flexible dates';
    else if (rangeStart) monthLabel = MONTHS[rangeStart.m] + ' ' + rangeStart.y;
    else monthLabel = '';

    const trip = {
      dateMode: dateMode,
      dates: datesLabel,
      monthLabel: monthLabel,
      startDate: rangeStart ? (rangeStart.y + '-' + (rangeStart.m + 1) + '-' + rangeStart.d) : '',
      endDate: rangeEnd ? (rangeEnd.y + '-' + (rangeEnd.m + 1) + '-' + rangeEnd.d) : '',
      nights: nights(),
      partyType: partyType,
      adults: adults,
      children: children,
      origin: airport ? airport.city : originText,
      airport: airport ? airport.code : '',
      airportName: airport ? airport.name : '',
      flightDuration: airport ? airport.dur : '',
      note: note,
    };
    if (window.kwState) window.kwState.saveStep('trip', trip);
    window.location.href = 'step2.html';
  }
  function goBack() { window.location.href = 'index.html'; }

  // ── stepper sub-render ───────────────────────────────────────
  function stepper(label, hint, value, setValue, min, max) {
    return (
      <div className="kw-stepper">
        <div className="kw-stepper-info">
          <div className="kw-stepper-label">{label}</div>
          <div className="kw-stepper-hint">{hint}</div>
        </div>
        <div className="kw-stepper-ctrl">
          <button className="kw-stepper-btn" disabled={value <= min}
                  onClick={() => setValue(Math.max(min, value - 1))}>−</button>
          <span className="kw-stepper-val">{value}</span>
          <button className="kw-stepper-btn" disabled={value >= max}
                  onClick={() => setValue(Math.min(max, value + 1))}>+</button>
        </div>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="kw-screen kw-v1">
      <BrandNav active="trip" />

      <div className="kw-wrap">
        <StepBar active={0} />

        <header className="kw-page-hero">
          <SectionEyebrow num="01" label="Step 01 of 05" />
          <h1>Tell us about <span className="kw-accent">your trip.</span></h1>
          <p>
            The essentials before we compose your week — when you'd like to come,
            who's travelling, where you're flying from, and anything else we should know.
            Takes about two minutes.
          </p>
        </header>

        {/* ── 01. WHEN ─────────────────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="01" label="When" />
            <h2 className="kw-q-title">When would you like to come?</h2>
            <p className="kw-q-help">
              Pick exact dates if you've decided, or stay flexible and let our AI choose for you.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-segmented" style={{ marginBottom: 20 }}>
              <button className={dateMode === 'specific' ? 'is-active' : ''}
                      onClick={() => setDateMode('specific')}>Specific dates</button>
              <button className={dateMode === 'flexible' ? 'is-active' : ''}
                      onClick={() => setDateMode('flexible')}>I'm flexible</button>
            </div>

            {dateMode === 'specific' ? (
              <div>
                <div className="kw-cal-nav">
                  <button className="kw-cal-arrow" disabled={monthOffset === 0}
                          onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}>‹</button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kw-ink-3)' }}>
                    Tap a start date, then an end date
                  </span>
                  <button className="kw-cal-arrow" disabled={monthOffset >= 11}
                          onClick={() => setMonthOffset(Math.min(11, monthOffset + 1))}>›</button>
                </div>
                <div className="kw-cal">
                  {renderMonth(leftYM.y, leftYM.m)}
                  {renderMonth(rightYM.y, rightYM.m)}
                </div>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 999, background: 'var(--kw-accent)' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--kw-ink)' }}>
                      {rangeStart && rangeEnd
                        ? <span>{fmtDay(rangeStart)} → {fmtDay(rangeEnd)} · <span style={{ color: 'var(--kw-ink-3)', fontWeight: 500 }}>{nights()} nights</span></span>
                        : rangeStart
                          ? <span>{fmtDay(rangeStart)} — <span style={{ color: 'var(--kw-ink-3)', fontWeight: 500 }}>pick an end date</span></span>
                          : <span style={{ color: 'var(--kw-ink-3)', fontWeight: 500 }}>No dates selected yet</span>}
                    </span>
                  </div>
                  {(rangeStart || rangeEnd) &&
                    <button onClick={resetRange}
                            style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--kw-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Reset
                    </button>}
                </div>
              </div>
            ) : (
              <div className="kw-flex-msg">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>✨</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--kw-ink)', marginBottom: 6 }}>
                      We'll find your perfect window
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--kw-ink-2)', lineHeight: 1.55 }}>
                      Stay flexible — based on the experiences you choose in the next steps
                      (medical, culture, and cuisine), our AI will recommend the best dates
                      to visit Korea and the ideal trip length for everything on your list.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 02. WHO ──────────────────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="02" label="Who's coming" />
            <h2 className="kw-q-title">Who's traveling with you?</h2>
            <p className="kw-q-help">
              Affects everything from room configuration to itinerary pace.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-party-grid">
              {PARTY.map(function (p) {
                return (
                  <div key={p.id}
                       className={'kw-party' + (partyType === p.id ? ' is-selected' : '')}
                       onClick={() => selectParty(p.id)}>
                    <div className="kw-party-icon"><PartyIcon id={p.id} /></div>
                    <div>
                      <div className="kw-party-label">{p.label}</div>
                      <div className="kw-party-sub">{p.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
              {stepper('Adults', 'Age 18+', adults, setAdults, 1, 12)}
              {stepper('Children', 'Age 0–17', children, setChildren, 0, 10)}
            </div>
          </div>
        </section>

        {/* ── 03. DEPARTURE ────────────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="03" label="Departure" />
            <h2 className="kw-q-title">Where are you flying from?</h2>
            <p className="kw-q-help">
              Start typing your city — pick your airport and we'll show the average flight time to Seoul (ICN).
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-airport-search">
              <div className="kw-airport-field">
                <svg className="kw-airport-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
                </svg>
                <input
                  className="kw-airport-input"
                  value={originText}
                  placeholder="Type your departure city…"
                  onChange={(e) => { setOriginText(e.target.value); setAirport(null); }}
                  onFocus={() => setOriginFocused(true)}
                  onBlur={() => setTimeout(() => setOriginFocused(false), 160)} />
                {originText &&
                  <span className="kw-airport-clear" onClick={clearAirport}>×</span>}
              </div>

              {showDropdown && matches.length > 0 &&
                <div className="kw-airport-results">
                  <div className="kw-airport-row kw-airport-row-head">
                    <span>{matches.length} airport{matches.length > 1 ? 's' : ''} near <b>{matchCityLabel}</b></span>
                    <span>Flight time to ICN</span>
                  </div>
                  {matches.map(function (a) {
                    return (
                      <div key={a.code} className="kw-airport-row" onClick={() => selectAirport(a)}>
                        <span className="kw-airport-code">{a.code}</span>
                        <span className="kw-airport-name">
                          {a.name}
                          <span className="kw-airport-hint">{a.city} · {a.stops}</span>
                        </span>
                        <span className="kw-airport-dist">{a.dur}</span>
                      </div>
                    );
                  })}
                </div>}

              {showDropdown && matches.length === 0 &&
                <div className="kw-airport-results">
                  <div className="kw-airport-row" style={{ cursor: 'default', gridTemplateColumns: '1fr' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--kw-ink-3)' }}>
                      No match — try a major city like New York, London, or Tokyo.
                    </span>
                  </div>
                </div>}

              {airport && !showDropdown &&
                <div className="kw-airport-results">
                  <div className="kw-airport-row is-selected" style={{ cursor: 'default' }}>
                    <span className="kw-airport-code">{airport.code}</span>
                    <span className="kw-airport-name">
                      {airport.name}
                      <span className="kw-airport-hint">{airport.city} · {airport.stops}</span>
                    </span>
                    <span className="kw-airport-dist">{airport.dur} to ICN</span>
                  </div>
                </div>}
            </div>
            {airport &&
              <p className="kw-input-helper">
                Average flight time from {airport.code} to Seoul Incheon (ICN): <b style={{ color: 'var(--kw-accent)' }}>{airport.dur}</b> ({airport.stops}).
              </p>}
          </div>
        </section>

        {/* ── 04. NOTES ────────────────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="04" label="Notes" />
            <h2 className="kw-q-title">Anything you want us to know?</h2>
            <p className="kw-q-help">
              Allergies, mobility, occasions, religious observances, preferred languages,
              things you'd love to do, things you'd rather skip. The more we know, the better we compose.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-notes-card">
              <div className="kw-notes-card-head">
                <span className="kw-notes-card-label">
                  <span className="kw-notes-card-pen">✎</span>
                  Write your notes here
                </span>
                <span className="kw-notes-card-secure">• Optional</span>
              </div>
              <textarea
                className="kw-textarea"
                rows={6}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Celebrating our 25th anniversary. My wife had knee surgery in January, so we'd prefer to avoid long walking days early in the trip. We love Korean royal court cuisine and would like at least one private tea ceremony. No shellfish, please." />
              <div className="kw-notes-card-foot">
                We don't store this anywhere. A human concierge reviews it only as a reference — and only after you purchase our service.
              </div>
            </div>
          </div>
        </section>

        {/* ── Action bar ───────────────────────────────────── */}
        <div className="kw-actionbar">
          <div className="kw-actionbar-l">
            <button className="kw-cta kw-cta-ghost kw-cta-sm"
                    style={{ height: 50, fontSize: 15, padding: '0 22px' }}
                    onClick={goBack}>
              ← Back to home
            </button>
            <span className="kw-actionbar-note">Your answers carry through to the next steps.</span>
          </div>
          <button className="kw-cta kw-cta-lg" onClick={onContinue}>
            Continue to Medical &nbsp;›
          </button>
        </div>
      </div>
    </div>
  );
}

window.TripV1Minimal = TripV1Minimal;
