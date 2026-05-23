// Step 2 — Medical care selection (luxe redesign · v6).
// 11 K-medical categories ordered by Sunggun's spec + 1 custom tile.
// Footer shows average procedure duration (replaces clinic name).
// Sub-step structure: Step Ⅰ Choose care · Step Ⅱ Your preferences.

// ─── Medical icon set (used inside photo as a subtle hint) ────────────
function MedIcon({ code }) {
  const sw = 1.7;
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (code) {
    case 'checkup':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M6 3v6a4 4 0 0 0 8 0V3" />
          <path d="M10 13v3a4 4 0 0 0 4 4h2a3 3 0 0 0 3-3v-2" />
          <circle cx="19" cy="13" r="2" />
          <circle cx="6" cy="3" r=".8" fill="currentColor" />
          <circle cx="14" cy="3" r=".8" fill="currentColor" />
        </svg>
      );
    case 'derm':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 3c4.5 0 7.5 3 7.5 8 0 4-2.5 9-7.5 9s-7.5-5-7.5-9c0-5 3-8 7.5-8Z" />
          <path d="M9 11h.01M15 11h.01" />
          <path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
        </svg>
      );
    case 'aesthetic':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 21l4-4" />
          <path d="M7 17l2-2M9 15l-1-1M16 8l1 1M14 6l1 1" />
          <path d="M8 16l8-8 2 2-8 8z" fill="currentColor" fillOpacity=".15" />
          <path d="M14 6l4-4M17 5l2 2" />
        </svg>
      );
    case 'plastic':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M14 7l6 6-9 9-3-3 6-6-3-3z" fill="currentColor" fillOpacity=".1" />
          <path d="M3 21l5-5" />
          <path d="M14 7l3 3" />
        </svg>
      );
    case 'hair':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M6 21c0-4 2-6 2-9s-2-5-2-7" />
          <path d="M10 21c0-4 2-6 2-9s-2-5-2-7" />
          <path d="M14 21c0-4 2-6 2-9s-2-5-2-7" />
          <path d="M18 21c0-4 2-6 2-9s-2-5-2-7" />
        </svg>
      );
    case 'dental':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 3c-2 0-3.5 1.5-3.5 3.5 0 2 .5 3.5 1 5.5l1.5 6c.5 2 1.5 3 2.5 3s1.5-1 2-3l1-3.5c.2-.7.7-.7.9 0l1 3.5c.5 2 1 3 2 3s2-1 2.5-3l1.5-6c.5-2 1-3.5 1-5.5C19.5 4.5 18 3 16 3c-1.5 0-3 .5-4 1.5C11 3.5 9.5 3 8 3Z" />
        </svg>
      );
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'ortho':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M5 4c0 2 1 3 2.5 3S10 8 10 9.5 9 12 9 13.5 10 15 10 16.5 9 19 7.5 19 5 18 5 16" />
          <path d="M19 20c0-2-1-3-2.5-3S14 16 14 14.5 15 12 15 10.5 14 9 14 7.5 15 5 16.5 5 19 6 19 8" />
        </svg>
      );
    case 'stemcell':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
        </svg>
      );
    case 'iv':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 2v3" />
          <rect x="8" y="5" width="8" height="9" rx="1.5" />
          <path d="M10 8h4M10 11h4" strokeWidth="1.2" />
          <path d="M12 14v6" />
          <circle cx="12" cy="21" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'hanbang':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 21V9" />
          <path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 8z" fill="currentColor" fillOpacity=".18" />
          <path d="M12 14c0-3-2.5-5-6-5 0 3.5 2.5 6 6 6z" fill="currentColor" fillOpacity=".1" />
        </svg>
      );
    case 'custom':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 5v14M5 12h14" strokeWidth="2" />
        </svg>
      );
    default: return null;
  }
}

// ─── 11 categories ordered by Sunggun's spec ─────────────────────────
// Order: Checkup · Eye · Dental · Plastic · Dermatology · Orthopedic · Hanbang · Hair loss · IV · Other (aesthetic, stem cell)
// Footer now shows average duration instead of clinic name.
const MEDICAL = [
  { code: 'checkup',   mono: 'I',    eyebrow: '01 / Screening',     name: 'Executive health screening',  desc: 'Comprehensive 4–8h panel — cancer markers, MRI/CT, cardiac, endoscopy.',   price: 'From $850',  duration: '4–8 hours' },
  { code: 'eye',       mono: 'II',   eyebrow: '02 / Vision',        name: 'Ophthalmology · LASIK',       desc: 'Korea-pioneered SMILE & LASEK, cataract, dry-eye care.',                  price: 'From $1,600', duration: '1–2 hours' },
  { code: 'dental',    mono: 'III',  eyebrow: '03 / Dental',        name: 'Dental',                      desc: 'Implants, crowns, scaling, whitening, root canal, orthodontics.',         price: 'From $220',  duration: '1–3 visits' },
  { code: 'plastic',   mono: 'IV',   eyebrow: '04 / Surgery',       name: 'Plastic surgery',             desc: 'Cosmetic & reconstructive procedures with concierge recovery suite.',     price: 'From $3,500', duration: '2–7 days recovery' },
  { code: 'derm',      mono: 'V',    eyebrow: '05 / Dermatology',   name: 'Dermatology',                 desc: 'Medical skin care — laser, anti-aging, pigmentation, K-beauty consult.',  price: 'From $200',  duration: '30–60 min' },
  { code: 'ortho',     mono: 'VI',   eyebrow: '06 / Orthopedic',    name: 'Orthopedic & joint',          desc: 'Stem-cell knee, PRP, joint injection, MRI-guided diagnosis.',             price: 'From $500',  duration: '1–2 hours' },
  { code: 'hanbang',   mono: 'VII',  eyebrow: '07 / Hanbang',       name: 'Korean traditional medicine', desc: 'Pulse diagnosis, acupuncture, herbal regimen, cupping — Heo Jun lineage.', price: 'From $90',  duration: 'Half day' },
  { code: 'hair',      mono: 'VIII', eyebrow: '08 / Hair',          name: 'Hair restoration',            desc: 'FUE transplants, PRP, scalp therapy, low-level laser.',                   price: 'From $4,200', duration: '6–8 hours' },
  { code: 'iv',        mono: 'IX',   eyebrow: '09 / Infusion',      name: 'IV nutrient therapy',         desc: 'Glutathione, NAD+, vitamin C, Myers cocktail — concierge-delivered.',     price: 'From $180',  duration: '30–60 min' },
  { code: 'aesthetic', mono: 'X',    eyebrow: '10 / Aesthetic',     name: 'Aesthetic medicine',          desc: 'Non-surgical injectables — Botox, fillers, threads, skin boosters.',      price: 'From $300',  duration: '30–60 min' },
  { code: 'stemcell',  mono: 'XI',   eyebrow: '11 / Regenerative',  name: 'Stem cell & regenerative',    desc: 'Mesenchymal, NK-cell, exosomes, anti-aging infusion protocols.',          price: 'From $2,800', duration: 'Half day' },
];

function Step2Medical() {
  const { useState } = React;

  // No pre-selection — the guest builds their own chart.
  const [selected, setSelected]   = useState([]);   // array of codes
  const [customText, setCustomText]   = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [clinicNotes, setClinicNotes] = useState('');
  const [clinicRec, setClinicRec]     = useState('best'); // 'best' | 'top' | 'near'

  function toggle(code) {
    setSelected(function (prev) {
      return prev.indexOf(code) !== -1
        ? prev.filter(function (c) { return c !== code; })
        : prev.concat([code]);
    });
  }
  function clearAll() { setSelected([]); }

  const chosen = MEDICAL.filter(function (m) { return selected.indexOf(m.code) !== -1; });

  function onContinue() {
    const medical = {
      // array of readable names — feeds the result page chip list
      selected: chosen.map(function (m) { return m.name; }),
      // codes kept as a string so the result generator skips it
      selectedCodes: selected.join(','),
      custom: customText.trim(),
      healthNotes: healthNotes.trim(),
      clinicNotes: clinicNotes.trim(),
      clinicRecommend: clinicRec,
    };
    if (window.kwState) window.kwState.saveStep('medical', medical);
    window.location.href = 'step3.html';
  }
  function goBack() { window.location.href = 'step1.html'; }

  return (
    <div className="kw-screen">
      <BrandNav active="medical" />

      <div className="kw-wrap">
        <StepBar active={1} />

        <header className="kw-page-hero">
          <SectionEyebrow num="02" label="Step 02 of 05" />
          <h1>What care brings you <span className="kw-accent">to Korea?</span></h1>
          <p>
            Pick what interests you — we'll pre-screen every choice for fit before booking.
          </p>
        </header>

        {/* ── Sub-step Ⅰ — Choose your care ─────────────────────── */}
        <div className="kw-substep">
          <div className="kw-substep-l">
            <span className="kw-substep-numeral">Step Ⅰ</span>
            <span className="kw-substep-title">Choose your care</span>
          </div>
          <span className="kw-substep-hint">
            Price &amp; duration shown are baseline.
          </span>
        </div>

        <section className="kw-q-row kw-q-row-full">
          <div className="kw-q-input">
            <div className="kw-med-grid">
              {MEDICAL.map(function (m) {
                const sel = selected.indexOf(m.code) !== -1;
                return (
                  <div key={m.code}
                       className={'kw-med ' + (sel ? 'is-selected' : '')}
                       style={{ cursor: 'pointer' }}
                       onClick={function () { toggle(m.code); }}>
                    <div className={'kw-med-photo kw-photo-' + m.code}>
                      <span className="kw-med-monogram">{m.mono}</span>
                    </div>
                    <span className="kw-med-view">View details →</span>
                    <div className="kw-med-body">
                      <span className="kw-med-eyebrow">{m.eyebrow}</span>
                      <div className="kw-med-name">{m.name}</div>
                      <p className="kw-med-desc">{m.desc}</p>
                      <div className="kw-med-foot">
                        <div className="kw-med-foot-meta">
                          <span className="kw-med-price">{m.price}</span>
                          <span className="kw-med-clinic">{m.duration}</span>
                        </div>
                        <button className="kw-med-add"
                                onClick={function (e) { e.stopPropagation(); toggle(m.code); }}>
                          {sel
                            ? <span>✓ Added</span>
                            : <span><span className="kw-med-add-plus">+</span> Add to chart</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 12th tile — custom request */}
              <div className="kw-med kw-med-custom">
                <div className="kw-med-photo kw-photo-custom">
                  <span className="kw-med-monogram">+</span>
                </div>
                <div className="kw-med-body">
                  <span className="kw-med-eyebrow">12 / Other</span>
                  <div className="kw-med-name">Something else?</div>
                  <textarea
                    className="kw-med-custom-textarea"
                    value={customText}
                    onChange={function (e) { setCustomText(e.target.value); }}
                    placeholder="e.g. Gut microbiome assessment, sleep clinic, fertility screening…"
                  />
                </div>
              </div>

              {/* Chart — live collection of picked items */}
              <div className="kw-med-basket">
                <div className="kw-basket-head">
                  <span className="kw-basket-eyebrow">
                    Your chart
                    <span className="kw-basket-count">
                      {' · ' + chosen.length + ' ' + (chosen.length === 1 ? 'selection' : 'selections')}
                    </span>
                  </span>
                  {chosen.length > 0 &&
                    <button className="kw-basket-clear"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={clearAll}>Clear all</button>}
                </div>
                <div className="kw-basket-items">
                  {chosen.length === 0 &&
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--kw-ink-3)' }}>
                      No care selected yet — tap a card above to add it to your chart.
                    </span>}
                  {chosen.map(function (m) {
                    return (
                      <div key={m.code} className={'kw-basket-item kw-photo-' + m.code}>
                        <div className="kw-basket-thumb">{m.mono}</div>
                        <div className="kw-basket-item-info">
                          <div className="kw-basket-item-name">{m.name}</div>
                          <div className="kw-basket-item-meta">{m.price} · {m.duration}</div>
                        </div>
                        <button className="kw-basket-item-remove" aria-label={'Remove ' + m.name}
                                onClick={function () { toggle(m.code); }}>×</button>
                      </div>
                    );
                  })}
                </div>
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
            Clinic preferences and health notes.
          </span>
        </div>

        {/* ── 01. HEALTH NOTES ──────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="01" label="Health notes" />
            <h2 className="kw-q-title">Your health profile</h2>
            <p className="kw-q-help">
              Current medications, allergies, chronic conditions, recent surgeries,
              and pregnancy. We need a clear picture before clearing any procedure.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-notes-card">
              <div className="kw-notes-card-head">
                <span className="kw-notes-card-label">
                  <span className="kw-notes-card-pen">✎</span>
                  Write your medical notes here
                </span>
                <span className="kw-notes-card-secure">• Confidential</span>
              </div>
              <textarea
                className="kw-textarea"
                rows={7}
                value={healthNotes}
                onChange={function (e) { setHealthNotes(e.target.value); }}
                placeholder="e.g. Wife: knee surgery January 2026 — avoid high-impact during recovery. Mild hypertension, on Lisinopril 10mg daily. No allergies. Husband: prediabetic, A1C 5.9 last checkup."
              />
              <div className="kw-notes-card-foot">
                We don't store this anywhere. A human concierge reviews it only as a reference — and only after you purchase our service.
              </div>
            </div>
          </div>
        </section>

        {/* ── 02. CLINIC / DOCTOR ──────────────────────────── */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="02" label="Clinic" />
            <h2 className="kw-q-title">Any clinic or doctor preferences?</h2>
            <p className="kw-q-help">
              If you've researched a specific clinic, doctor, or hospital — tell us. Otherwise our medical
              team recommends from a curated network of Seoul's top facilities.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-notes-card">
              <div className="kw-notes-card-head">
                <span className="kw-notes-card-label">
                  <span className="kw-notes-card-pen">✎</span>
                  Write your clinic preferences here
                </span>
                <span className="kw-notes-card-secure">• Optional</span>
              </div>
              <textarea
                className="kw-textarea"
                rows={4}
                value={clinicNotes}
                onChange={function (e) { setClinicNotes(e.target.value); }}
                placeholder="e.g. Specifically interested in Dr. Cho at Banobagi. Open to Asan or Samsung Medical for screening."
              />
              <div className="kw-notes-card-foot">
                Or pick how we should recommend on your behalf:
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div className="kw-segmented">
                  <button className={clinicRec === 'best' ? 'is-active' : ''}
                          onClick={function () { setClinicRec('best'); }}>Recommend best fit</button>
                  <button className={clinicRec === 'top' ? 'is-active' : ''}
                          onClick={function () { setClinicRec('top'); }}>Recommend top-rated</button>
                  <button className={clinicRec === 'near' ? 'is-active' : ''}
                          onClick={function () { setClinicRec('near'); }}>Closest to hotel</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Action bar ──────────────────────────────────── */}
        <div className="kw-actionbar">
          <div className="kw-actionbar-l">
            <button className="kw-cta kw-cta-ghost kw-cta-sm"
                    style={{ height: 50, fontSize: 15, padding: '0 22px' }}
                    onClick={goBack}>
              ← Back to Trip
            </button>
            <span className="kw-actionbar-note">Your answers carry through to the next steps.</span>
          </div>
          <button className="kw-cta kw-cta-lg" onClick={onContinue}>
            Continue to Culture &nbsp;›
          </button>
        </div>
      </div>
    </div>
  );
}

window.Step2Medical = Step2Medical;
