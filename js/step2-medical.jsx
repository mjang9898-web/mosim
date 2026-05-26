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

// Reuse the same /thumbs/ pattern as step3/step4 — single source for
// list thumbs and full-res drawer photos.
const thumbUrl = (path) => path && path.replace(/\/([^/]+\.webp)$/, '/thumbs/$1');

// ─── 11 categories ordered by Sunggun's spec ─────────────────────────
// Order: Checkup · Eye · Dental · Plastic · Dermatology · Orthopedic · Hanbang · Hair loss · IV · Other (aesthetic, stem cell)
// Footer now shows average duration instead of clinic name.
const MEDICAL = [
  { code: 'checkup',   mono: 'I',    eyebrow: '01 / Screening',     name: 'Executive health screening',  desc: 'Comprehensive 4–8h panel — cancer markers, MRI/CT, cardiac, endoscopy.',   price: 'From $850',  duration: '4–8 hours',           image: '/assets/medical/medical-banner-58cbc748.webp' },
  { code: 'eye',       mono: 'II',   eyebrow: '02 / Vision',        name: 'Ophthalmology · LASIK',       desc: 'Korea-pioneered SMILE & LASEK, cataract, dry-eye care.',                  price: 'From $1,600', duration: '1–2 hours',           image: '/assets/medical/medical-banner-968dc090.webp' },
  { code: 'dental',    mono: 'III',  eyebrow: '03 / Dental',        name: 'Dental',                      desc: 'Implants, crowns, scaling, whitening, root canal, orthodontics.',         price: 'From $220',  duration: '1–3 visits',          image: '/assets/medical/medical-banner-d3e277e3.webp' },
  { code: 'plastic',   mono: 'IV',   eyebrow: '04 / Surgery',       name: 'Plastic surgery',             desc: 'Cosmetic & reconstructive procedures with concierge recovery suite.',     price: 'From $3,500', duration: '2–7 days recovery',   image: '/assets/medical/medical-gemini-g3zmjr.webp' },
  { code: 'derm',      mono: 'V',    eyebrow: '05 / Dermatology',   name: 'Dermatology',                 desc: 'Medical skin care — laser, anti-aging, pigmentation, K-beauty consult.',  price: 'From $200',  duration: '30–60 min',           image: '/assets/medical/medical-chatgpt-092412.webp' },
  { code: 'ortho',     mono: 'VI',   eyebrow: '06 / Orthopedic',    name: 'Orthopedic & joint',          desc: 'Stem-cell knee, PRP, joint injection, MRI-guided diagnosis.',             price: 'From $500',  duration: '1–2 hours',           image: '/assets/medical/medical-chatgpt-100205.webp' },
  { code: 'hanbang',   mono: 'VII',  eyebrow: '07 / Hanbang',       name: 'Korean traditional medicine', desc: 'Pulse diagnosis, acupuncture, herbal regimen, cupping — Heo Jun lineage.', price: 'From $90',  duration: 'Half day',            image: '/assets/medical/medical-gemini-uycgpl.webp' },
  { code: 'hair',      mono: 'VIII', eyebrow: '08 / Hair',          name: 'Hair restoration',            desc: 'FUE transplants, PRP, scalp therapy, low-level laser.',                   price: 'From $4,200', duration: '6–8 hours',           image: '/assets/medical/medical-chatgpt-095746.webp' },
  { code: 'iv',        mono: 'IX',   eyebrow: '09 / Infusion',      name: 'IV nutrient therapy',         desc: 'Glutathione, NAD+, vitamin C, Myers cocktail — concierge-delivered.',     price: 'From $180',  duration: '30–60 min',           image: '/assets/medical/medical-istock-665515600.webp' },
  { code: 'aesthetic', mono: 'X',    eyebrow: '10 / Aesthetic',     name: 'Aesthetic medicine',          desc: 'Non-surgical injectables — Botox, fillers, threads, skin boosters.',      price: 'From $300',  duration: '30–60 min',           image: '/assets/medical/medical-chatgpt-092118.webp' },
  { code: 'stemcell',  mono: 'XI',   eyebrow: '11 / Regenerative',  name: 'Stem cell & regenerative',    desc: 'Mesenchymal, NK-cell, exosomes, anti-aging infusion protocols.',          price: 'From $2,800', duration: 'Half day',            image: '/assets/medical/medical-istock-1326646524.webp' },
];

// ─── Per-procedure detail content (drawer body) ────────────────────────
// Each entry mirrors the new Step 2 design: positioning + partnered
// hospitals + 4 photos + a 3-tier package picker + a handful of optional
// add-ons. Photos resolve from /assets/medical-drawer/<code>{,-N}.webp.
const MEDICAL_DETAILS = {

  checkup: {
    positioning: "A full executive screening in one half-day visit — cancer markers, cardiac CT, MRI, endoscopy, and a same-day physician consult, all reported in English within 48 hours.",
    hospitals: ['Asan Medical Center', 'Samsung Medical Center', 'Severance', "Seoul St. Mary's", 'Seoul National Univ. Hospital'],
    photos: [
      '/assets/medical-drawer/checkup.webp',
      '/assets/medical-drawer/checkup-2.webp',
      '/assets/medical-drawer/checkup-3.webp',
      '/assets/medical-drawer/checkup-4.webp',
    ],
    tiers: [
      { id: 'essential', name: 'Essential',  duration: '4 hours · half day',   price: '850',   blurb: 'Bloodwork, EKG, chest X-ray, abdominal ultrasound, and a same-day physician consult.',
        includes: ['Full lab panel (CBC, lipid, A1C, liver, kidney)', 'Cancer markers (CEA, CA-125, PSA)', 'EKG + chest X-ray', 'Abdominal ultrasound', 'Same-day physician consult'] },
      { id: 'premium',   name: 'Premium',    duration: '6 hours · full morning', price: '1,450', blurb: 'Adds upper endoscopy and cardiac CT for a comprehensive look.',
        includes: ['All Essential coverage', 'Upper endoscopy (gastroscopy)', 'Coronary CT angiography', 'Carotid ultrasound', 'Bone density (DEXA)'] },
      { id: 'concierge', name: 'Concierge',  duration: '8 hours · 2 day option', price: '2,800', blurb: 'Whole-body MRI, full endoscopy suite, written English report within 48 h.',
        includes: ['All Premium coverage', 'Whole-body MRI (3T)', 'Colonoscopy (full prep)', 'PET-CT (if indicated)', 'Written English report in 48 h'] },
    ],
    addons: [
      { name: 'NK-cell immunity panel',                 price: '$220' },
      { name: 'Microbiome / SIBO screen',               price: '$180' },
      { name: 'Stress hormone curve (cortisol)',        price: '$140' },
      { name: 'Concierge transport (3 days)',           price: '$280' },
    ],
  },

  eye: {
    positioning: "Korea pioneered the SMILE laser refractive technique and runs the world's highest LASIK volume per capita — same-day procedures, English-speaking ophthalmologists, and an overnight follow-up before you fly home.",
    hospitals: ['BGN Eye Hospital', 'Dream Eye Center', 'Saevit Eye', 'BalGeunSesang', 'Yonsei Severance Ophthalmology'],
    photos: [
      '/assets/medical-drawer/eye.webp',
      '/assets/medical-drawer/eye-2.webp',
      '/assets/medical-drawer/eye-3.webp',
      '/assets/medical-drawer/eye-4.webp',
    ],
    tiers: [
      { id: 'lasik',  name: 'LASIK',          duration: '1 hour · same day', price: '1,600', blurb: 'The classic flap procedure — fast recovery, mature technology.',
        includes: ['Pre-op screening + topography', 'Wavefront-guided LASIK both eyes', 'Same-day discharge', 'Next-day follow-up', '6 months of drops included'] },
      { id: 'smile',  name: 'SMILE Pro',      duration: '2 hours · same day', price: '2,400', blurb: 'Korea-pioneered keyhole technique — no flap, faster healing.',
        includes: ['All LASIK coverage', 'Femtosecond SMILE both eyes', 'Reduced dry-eye risk', '24-hour recovery window', 'English-speaking surgeon'] },
      { id: 'icl',    name: 'ICL (Lens)',     duration: 'Half day',           price: '4,200', blurb: 'For high prescriptions — an implantable lens, reversible if needed.',
        includes: ['Pre-op imaging & sizing', 'Visian ICL implant both eyes', 'Anesthesia + suite', '1-week follow-up', 'No corneal tissue removed'] },
    ],
    addons: [
      { name: 'Dry-eye intense-pulse-light (IPL)',     price: '$320' },
      { name: 'Cataract bilateral co-procedure',       price: '$3,400' },
      { name: 'Night-vision lens upgrade',             price: '$280' },
      { name: 'Concierge airport transfer',            price: '$120' },
    ],
  },

  dental: {
    positioning: "Korea offers the world's best price-quality ratio on implants, crowns, and orthodontics — Seoul dental hubs run 6-day-a-week clinics with German materials at a third of US prices.",
    hospitals: ['SNU Dental', 'Yonsei Dental Hospital', 'Apsun Dental', 'Dr. Lee Dental', 'Bluedent Apgujeong'],
    photos: [
      '/assets/medical-drawer/dental.webp',
      '/assets/medical-drawer/dental-2.webp',
      '/assets/medical-drawer/dental-3.webp',
      '/assets/medical-drawer/dental-4.webp',
    ],
    tiers: [
      { id: 'hygiene', name: 'Hygiene & exam',  duration: '90 min · 1 visit', price: '220',   blurb: 'Scaling, polish, X-ray, and a full dental review.',
        includes: ['Scaling + polish', 'Panoramic X-ray', 'Cavity check + plan', 'Whitening session', 'Take-home tray'] },
      { id: 'crown',   name: 'Crown / Veneer',   duration: '2 visits · 3 days', price: '480',   blurb: 'Per-tooth German ceramic crown or veneer with one-day turnaround.',
        includes: ['Digital impression', 'CAD-cut zirconia or e.max', 'Same-week fitting', 'Bite adjustment', '5-year material warranty'] },
      { id: 'implant', name: 'Implant',          duration: '2 visits · 6 months', price: '1,200', blurb: 'Osstem/Straumann implant with bone grafting if required.',
        includes: ['CBCT 3D scan + plan', 'Implant + abutment + crown', 'Bone graft if needed', '6-month osseointegration visit', '10-year manufacturer warranty'] },
    ],
    addons: [
      { name: 'Whitening upgrade (Zoom)',              price: '$180' },
      { name: 'Invisalign / clear-aligner consult',    price: '$120' },
      { name: 'Wisdom-tooth extraction (per tooth)',   price: '$160' },
      { name: 'Sedation / anxiety package',            price: '$240' },
    ],
  },

  plastic: {
    positioning: "Seoul performs more cosmetic procedures per capita than anywhere in the world — board-certified surgeons, dedicated concierge recovery suites, and the Korean Plastic Surgery Society's strict accreditation standards.",
    hospitals: ['Banobagi', 'JK Plastic Surgery', 'BIO Plastic', "Dream Medical Group", 'ID Hospital'],
    photos: [
      '/assets/medical-drawer/plastic.webp',
      '/assets/medical-drawer/plastic-2.webp',
      '/assets/medical-drawer/plastic-3.webp',
      '/assets/medical-drawer/plastic-4.webp',
    ],
    tiers: [
      { id: 'consult',   name: 'Consult & plan',    duration: '90 min',           price: '300',    blurb: 'Sit-down with two surgeons, 3D imaging, and a written quote.',
        includes: ['Two surgeon opinions', 'Vectra 3D simulation', 'Written quote and timeline', 'Korean Surgery Society credential review', 'No commitment'] },
      { id: 'standard',  name: 'Standard package',  duration: '2 days · 5 day stay', price: '3,500', blurb: 'A single procedure (rhinoplasty, blepharoplasty, etc.) with recovery suite.',
        includes: ['One major procedure', 'In-clinic recovery suite (1 night)', '4-day post-op care', 'Nursing concierge', 'Suture removal and final check'] },
      { id: 'premium',   name: 'Premium combo',     duration: '4 days · 10 day stay', price: '8,800', blurb: 'Two procedures with double-room concierge suite and on-call nursing.',
        includes: ['Two coordinated procedures', 'Private recovery suite (5 nights)', '24/7 nursing on call', 'Lymphatic drainage daily', 'Full discharge package'] },
    ],
    addons: [
      { name: 'PRP scar healing accelerator',          price: '$420' },
      { name: 'Recovery hotel upgrade (5-star)',       price: '$1,200' },
      { name: 'Photo + video documentation',           price: '$240' },
      { name: 'In-flight medical escort (one-way)',    price: '$1,800' },
    ],
  },

  derm: {
    positioning: "K-beauty's clinical engine — laser, anti-aging, pigmentation, and the K-skin facial protocols that built the entire global K-beauty category. Same-day visits, no downtime, English consult included.",
    hospitals: ['Dr. Mom Clinic', 'CNP Cha & Park', 'Lim Sunsoo', "Oracle Dermatology", 'Dr. Jart Skin Clinic'],
    photos: [
      '/assets/medical-drawer/derm.webp',
      '/assets/medical-drawer/derm-2.webp',
      '/assets/medical-drawer/derm-3.webp',
      '/assets/medical-drawer/derm-4.webp',
    ],
    tiers: [
      { id: 'kskin',    name: 'K-skin facial',  duration: '45 min',         price: '200',  blurb: 'Aqua-peel + LED + ampoule layering — the original Seoul derm facial.',
        includes: ['Skin diagnosis', 'Aqua-peel hydrodermabrasion', 'LED red/blue light therapy', 'Custom ampoule', 'Take-home K-skin sample kit'] },
      { id: 'laser',    name: 'Laser package',  duration: '1 hour',         price: '550',  blurb: 'Pico-toning + IPL for pigmentation, pores, and overall tone.',
        includes: ['Pico-laser toning', 'IPL for pigmentation', 'Cooling and recovery mask', 'Numbing cream as needed', '2-week follow-up review'] },
      { id: 'antiage',  name: 'Anti-aging program', duration: 'Half day',   price: '1,100', blurb: 'Ulthera HIFU + Thermage + injectable refresh — the K-celeb maintenance trio.',
        includes: ['Ulthera HIFU (600 lines)', 'Thermage 600 shots', 'Botox + filler refresh (0.5cc)', 'PDRN salmon DNA boost', 'Photo documentation'] },
    ],
    addons: [
      { name: 'Skin booster (Profhilo)',               price: '$420' },
      { name: 'Carbon laser peel',                     price: '$180' },
      { name: 'Eyelash perm + lift',                   price: '$80' },
      { name: 'Take-home K-beauty kit ($300 value)',   price: '$120' },
    ],
  },

  ortho: {
    positioning: "Korea is the global leader in stem-cell knee and joint regenerative care — the first country to approve commercial autologous cell therapy for cartilage. Includes MRI-guided diagnosis and a phased recovery plan.",
    hospitals: ['SNU Bundang', 'Seoul National Univ. Hospital', 'Asan Medical', 'Severance', 'Bumin Hospital'],
    photos: [
      '/assets/medical-drawer/ortho.webp',
      '/assets/medical-drawer/ortho-2.webp',
      '/assets/medical-drawer/ortho-3.webp',
      '/assets/medical-drawer/ortho-4.webp',
    ],
    tiers: [
      { id: 'consult',  name: 'Consult & MRI',     duration: '2 hours · same day', price: '500',  blurb: 'MRI-guided diagnosis with a sports-medicine orthopedist.',
        includes: ['Targeted MRI (knee, hip, or shoulder)', 'Sports-medicine consult', 'Treatment options + cost', 'Written report', 'No-commitment plan'] },
      { id: 'prp',      name: 'PRP / Prolotherapy', duration: '1 hour · 3 sessions',  price: '1,800', blurb: 'Platelet-rich plasma injections — the staple non-surgical joint protocol.',
        includes: ['PRP draw + spin + inject', '3 sessions over 6 weeks', 'Ultrasound-guided placement', 'Physical therapy intro', '3-month check-in'] },
      { id: 'stemcell', name: 'Stem-cell knee',    duration: '4 hours · 2 days',     price: '5,800', blurb: 'Cartistem mesenchymal cells — Korea-only, FDA-approved-equivalent regenerative treatment.',
        includes: ['Pre-screening MRI', 'Autologous stem cell harvest', 'Image-guided implantation', 'In-clinic overnight observation', '6-month recovery roadmap'] },
    ],
    addons: [
      { name: 'Sports-medicine physiotherapy (3 visits)', price: '$420' },
      { name: 'Body-composition + gait analysis',        price: '$220' },
      { name: 'Knee brace (custom-fit)',                 price: '$180' },
      { name: 'In-home physio (Seoul only · 1 visit)',   price: '$240' },
    ],
  },

  hanbang: {
    positioning: "Korea's centuries-old traditional medicine — pulse diagnosis, acupuncture, herbal regimens, and cupping — practiced today inside fully licensed Korean medicine hospitals (KOM) alongside Western care.",
    hospitals: ['Kyung Hee Korean Medicine Hospital', 'Daejeon Univ. KOM Hospital', 'Jaseng Hospital', 'Insan KOM Clinic', 'Ahn Korean Medicine'],
    photos: [
      '/assets/medical-drawer/hanbang.webp',
      '/assets/medical-drawer/hanbang-2.webp',
      '/assets/medical-drawer/hanbang-3.webp',
      '/assets/medical-drawer/hanbang-4.webp',
    ],
    tiers: [
      { id: 'tasting',  name: 'Diagnosis & taster', duration: '90 min · half day', price: '90',  blurb: 'Pulse + tongue + abdominal diagnosis, a tasting of three herbal teas.',
        includes: ['Pulse diagnosis', 'Tongue + abdominal palpation', 'Constitutional reading (Sasang)', 'Tea tasting × 3', 'Take-home herbal sachet'] },
      { id: 'session',  name: 'Treatment session',  duration: 'Half day',          price: '320', blurb: 'Acupuncture + cupping + electric needle therapy in one extended session.',
        includes: ['Full body acupuncture', 'Fire and dry cupping', 'Electro-acupuncture if indicated', 'Moxibustion warming', 'Personalised herb pack (7 days)'] },
      { id: 'program',  name: '4-day immersion',    duration: '4 days',            price: '1,800', blurb: 'Daily treatments + tailored herbal regimen + dietary protocol.',
        includes: ['Daily acupuncture × 4', 'Custom herbal decoction (28 days)', 'Dietary + lifestyle consult', 'Sasang constitutional book', 'Take-home moxa kit'] },
    ],
    addons: [
      { name: 'Bee venom acupuncture (per session)',   price: '$60' },
      { name: 'Herbal pill compounding (gongjindan)',  price: '$280' },
      { name: 'Korean medicine MRI (radiomics)',       price: '$180' },
      { name: 'Hanbang spa day (Cha & Spa)',           price: '$220' },
    ],
  },

  hair: {
    positioning: "Korea's hair restoration scene is the world's most clinically advanced — FUE non-shaven techniques, low-level laser therapy combined with PRP, and surgeons who routinely place 4,000+ grafts in a single session.",
    hospitals: ['Forleaders', 'Mosaic Hair', 'Beauty Han', 'CNP Hair Clinic', 'Seoul Hair Transplant Center'],
    photos: [
      '/assets/medical-drawer/hair.webp',
      '/assets/medical-drawer/hair-2.webp',
      '/assets/medical-drawer/hair-3.webp',
      '/assets/medical-drawer/hair-4.webp',
    ],
    tiers: [
      { id: 'diagnosis', name: 'Diagnosis & PRP', duration: '2 hours · same day', price: '600',  blurb: 'Trichoscopy diagnosis with one platelet-rich plasma boost.',
        includes: ['Digital trichoscopy', 'Hair density mapping', 'PRP scalp injection', 'Personalised shampoo + scalp serum', '6-month progression photos'] },
      { id: 'fue',       name: 'FUE transplant',   duration: '6 hours · 1 day',    price: '4,200', blurb: 'Up to 2,500 graft non-shaven FUE — the K-celeb default.',
        includes: ['Up to 2,500 grafts', 'Non-shaven FUE technique', 'PRP recovery boost', '7-day post-op kit', '1-year check-in photos'] },
      { id: 'megasession', name: 'Mega-session FUE', duration: '8 hours · 2 days', price: '8,400', blurb: 'Up to 5,000 grafts in one extended session for advanced hair loss.',
        includes: ['Up to 5,000 grafts', 'Combined FUE + strip if needed', 'Overnight observation', 'Three PRP sessions over 6 months', '2-year warranty'] },
    ],
    addons: [
      { name: 'Low-level laser therapy (3 sessions)',  price: '$420' },
      { name: 'Mesotherapy scalp booster',             price: '$280' },
      { name: 'Eyebrow micropigmentation',             price: '$680' },
      { name: 'Beard transplant (up to 500 grafts)',   price: '$1,800' },
    ],
  },

  iv: {
    positioning: "Glutathione, NAD+, vitamin C megadose, and the Myers cocktail — concierge-delivered to your hotel or to a private clinic suite within an hour of booking. Same-day blood panel optional.",
    hospitals: ['Concierge MD Korea', 'Royal Wellness IV', 'Cha & Spa Wellness', 'YS Clinic', 'Doctor My Health'],
    photos: [
      '/assets/medical-drawer/iv.webp',
      '/assets/medical-drawer/iv-2.webp',
      '/assets/medical-drawer/iv-3.webp',
      '/assets/medical-drawer/iv-4.webp',
    ],
    tiers: [
      { id: 'myers',     name: "Myers' cocktail",  duration: '45 min',  price: '180', blurb: 'Magnesium, B-complex, vitamin C — the classic restorative IV.',
        includes: ['Magnesium + B-complex + C', 'Saline base 500 mL', 'Clinic or hotel delivery', 'Vital signs monitoring', 'Quick recovery snack'] },
      { id: 'glutathione', name: 'Glutathione boost', duration: '60 min', price: '320', blurb: "Korea's signature anti-oxidation + skin-brightening protocol.",
        includes: ["Myers' cocktail base", 'High-dose glutathione (1200 mg)', 'Vitamin C megadose (15 g)', 'Hydration top-up', 'Hotel delivery (Seoul only)'] },
      { id: 'nad',       name: 'NAD+ premium',     duration: '2 hours', price: '780', blurb: 'NAD+ longevity protocol with cellular energy markers re-tested.',
        includes: ['NAD+ 500 mg slow drip', 'Pre & post energy marker panel', 'Sleep and recovery briefing', 'Hotel delivery', 'Next-day follow-up'] },
    ],
    addons: [
      { name: 'Same-day blood panel (50 markers)',     price: '$240' },
      { name: 'Concierge in-room delivery (Seoul)',    price: '$80' },
      { name: 'Hangover recovery upgrade',             price: '$60' },
      { name: 'IV + facial combo at Cha & Spa',        price: '$340' },
    ],
  },

  aesthetic: {
    positioning: "Non-surgical Korean aesthetic medicine — botox, fillers, threads, and skin boosters — done by board-certified dermatologists who train the next generation of K-beauty practitioners worldwide.",
    hospitals: ['Banobagi Aesthetic', 'Lemon Aesthetic', 'Renewme', 'Apgujeong Aesthetic', 'Dr. Park Aesthetic'],
    photos: [
      '/assets/medical-drawer/aesthetic.webp',
      '/assets/medical-drawer/aesthetic-2.webp',
      '/assets/medical-drawer/aesthetic-3.webp',
      '/assets/medical-drawer/aesthetic-4.webp',
    ],
    tiers: [
      { id: 'refresh',   name: 'Refresh',        duration: '30 min',   price: '300',  blurb: 'A single area — Botox forehead, glabella, or crow\'s feet.',
        includes: ['One injectable area', 'Korean-brand Botox (Nabota)', 'Numbing topical', 'Quick recovery review', '2-week touch-up if needed'] },
      { id: 'full',      name: 'Full refresh',   duration: '60 min',   price: '780',  blurb: 'Three areas + light filler (cheeks, chin, or lips).',
        includes: ['Up to 3 Botox areas', 'Filler 1 cc (cheek/chin/lips)', 'Vectra 3D documentation', 'Same-day discharge', '2-week touch-up'] },
      { id: 'shilhouette', name: 'Shilhouette',  duration: '90 min',   price: '1,800', blurb: 'PDO threads + filler + skin booster — the Korean V-line lift maintenance.',
        includes: ['PDO threads (20 mid-face)', 'Filler 1 cc cheek/chin', 'Profhilo skin booster', 'Cooling and recovery mask', 'Photo + video documentation'] },
    ],
    addons: [
      { name: 'Korean-brand filler upgrade (Restylane)', price: '$240' },
      { name: 'Eyebrow lift threads (4 threads)',        price: '$420' },
      { name: 'Lip filler add-on (0.5cc)',               price: '$280' },
      { name: 'Recovery LED + cooling mask',             price: '$80' },
    ],
  },

  stemcell: {
    positioning: "Korea is the only OECD country with commercial autologous stem cell therapy approved — anti-aging, NK-cell immunity, exosomes, and the regenerative protocols that the global longevity community now flies in for.",
    hospitals: ['CHA Stem Cell Center', 'Pharmicell', 'Asan Stem Cell', 'Severance Cell Therapy', 'Anti-Aging Korea (CHA)'],
    photos: [
      '/assets/medical-drawer/stemcell.webp',
      '/assets/medical-drawer/stemcell-2.webp',
      '/assets/medical-drawer/stemcell-3.webp',
      '/assets/medical-drawer/stemcell-4.webp',
    ],
    tiers: [
      { id: 'consult',  name: 'Consult & screen', duration: 'Half day',           price: '480',   blurb: 'Eligibility screening — labs, immune profile, family history.',
        includes: ['100-marker blood panel', 'Immune (NK / T-cell) profile', 'Family history review', 'Personalised protocol options', 'No-commitment plan'] },
      { id: 'nk',       name: 'NK-cell boost',    duration: 'Half day · 2 visits', price: '4,800', blurb: 'Autologous NK-cell extraction, expansion, and IV reinfusion.',
        includes: ['NK cell extraction', '10-day lab expansion', 'IV reinfusion (1 round)', '2-month immune marker re-test', 'Written report'] },
      { id: 'mesenchymal', name: 'Mesenchymal protocol', duration: '3 days',     price: '12,800', blurb: 'Mesenchymal stem cells + exosomes — the full Korean longevity protocol.',
        includes: ['Mesenchymal extraction (adipose)', 'Stem cell IV + targeted injections', 'Exosome IV booster', '6-month longevity-marker tracking', 'On-call physician for 30 days'] },
    ],
    addons: [
      { name: 'Exosome facial add-on',                 price: '$680' },
      { name: 'Longevity marker panel (90 markers)',   price: '$420' },
      { name: 'Telomere length test',                  price: '$280' },
      { name: 'Hyperbaric oxygen (3 sessions)',        price: '$540' },
    ],
  },

};

function Step2Medical() {
  const { useState } = React;

  // No pre-selection — the guest builds their own chart.
  const [selected, setSelected]   = useState([]);   // array of codes
  const [customText, setCustomText]   = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [clinicNotes, setClinicNotes] = useState('');
  const [clinicRec, setClinicRec]     = useState('best'); // 'best' | 'top' | 'near'
  const [detailCode, setDetailCode]   = useState(null);

  function toggle(code) {
    setSelected(function (prev) {
      return prev.indexOf(code) !== -1
        ? prev.filter(function (c) { return c !== code; })
        : prev.concat([code]);
    });
  }
  function clearAll() { setSelected([]); }
  function openDetail(code) {
    if (MEDICAL_DETAILS[code]) setDetailCode(code);
  }

  const chosen = MEDICAL.filter(function (m) { return selected.indexOf(m.code) !== -1; });
  const detailItem = detailCode ? MEDICAL.find(function (m) { return m.code === detailCode; }) : null;

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
                       onClick={function () { openDetail(m.code); }}>
                    <div
                      className={'kw-med-photo kw-photo-' + m.code + (m.image ? ' has-image' : '')}
                      style={m.image ? { backgroundImage: "url('" + thumbUrl(m.image) + "')" } : undefined}
                    >
                      {!m.image && <span className="kw-med-monogram">{m.mono}</span>}
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

      {detailItem &&
        <MedicalDetailDrawer
          item={detailItem}
          detail={MEDICAL_DETAILS[detailItem.code]}
          isSelected={selected.indexOf(detailItem.code) !== -1}
          onToggle={function () { toggle(detailItem.code); }}
          onClose={function () { setDetailCode(null); }} />}
    </div>
  );
}

// ─── MedicalDetailDrawer — right-side panel for a procedure ───────────
// Hero (positioning + hospital chips + 4 photos) → tier picker (3 packages
// with includes lists) → add-on grid → footer with running total. State is
// local: tier and addons reset when the drawer closes.
function MedicalDetailDrawer({ item, detail, isSelected, onToggle, onClose }) {
  const { useState, useEffect } = React;
  const [tierId, setTierId] = useState((detail.tiers[0] || {}).id || null);
  const [addons, setAddons] = useState([]);

  useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return function () {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Reset selections when switching dishes.
  useEffect(function () {
    setTierId((detail.tiers[0] || {}).id || null);
    setAddons([]);
  }, [item.code]);

  function toggleAddon(idx) {
    setAddons(function (prev) {
      return prev.indexOf(idx) !== -1
        ? prev.filter(function (i) { return i !== idx; })
        : prev.concat([idx]);
    });
  }

  const tier = detail.tiers.find(function (t) { return t.id === tierId; }) || detail.tiers[0];
  const addonTotal = addons.reduce(function (sum, idx) {
    const a = detail.addons[idx];
    if (!a) return sum;
    const n = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
    return sum + n;
  }, 0);
  const tierPrice = parseFloat((tier.price || '').replace(/[^0-9.]/g, '')) || 0;
  const total = tierPrice + addonTotal;

  return (
    <>
      <div className="kw-drawer-scrim" onClick={onClose} />
      <aside
        className={'kw-drawer kw-photo-' + item.code}
        role="dialog"
        aria-modal="true"
        aria-label={item.name + ' details'}>

        <header className="kw-drawer-top">
          <nav className="kw-drawer-crumb" aria-label="Breadcrumb">
            <a href="#" onClick={function (e) { e.preventDefault(); onClose(); }}>
              ← Step 2 · Medical
            </a>
            <span className="kw-drawer-crumb-sep" aria-hidden="true">/</span>
            <span className="kw-drawer-crumb-now">{item.name}</span>
          </nav>
          <button className="kw-drawer-close" onClick={onClose} aria-label="Close details">×</button>
        </header>

        <div className="kw-drawer-body">
          <section className="kw-detail-hero">
            <div>
              <span className="kw-detail-eyebrow">{item.eyebrow}</span>
              <h2 className="kw-detail-title">{item.name}</h2>
              <p className="kw-detail-positioning">{detail.positioning}</p>
              <div className="kw-detail-hospitals">
                <span className="kw-detail-hospitals-label">Trusted partner hospitals</span>
                <ul>
                  {detail.hospitals.map(function (h) {
                    return <li key={h}>{h}</li>;
                  })}
                </ul>
              </div>
            </div>
            <div className="kw-detail-hero-r">
              {detail.photos.map(function (p, i) {
                return (
                  <div key={p}
                       className={'kw-detail-photo' + (i === 0 ? ' kw-detail-photo-main' : '')}
                       style={{ backgroundImage: "url('" + p + "')" }}
                       role="img"
                       aria-label={item.name + ' photo ' + (i + 1)} />
                );
              })}
            </div>
          </section>

          <section className="kw-detail-section">
            <div className="kw-detail-section-head">
              <h3 className="kw-detail-h3">Choose your package</h3>
              <p className="kw-detail-help">
                Three tiers. Each price is the published starting baseline from our partner hospitals — the final quote follows your screening visit.
              </p>
            </div>
            <div className="kw-tier-grid">
              {detail.tiers.map(function (t) {
                const active = t.id === tierId;
                return (
                  <label key={t.id}
                         className={'kw-tier' + (active ? ' is-selected' : '')}>
                    <input type="radio"
                           name={'tier-' + item.code}
                           checked={active}
                           onChange={function () { setTierId(t.id); }} />
                    <span className="kw-tier-radio"><span className="kw-tier-radio-dot" /></span>
                    <div className="kw-tier-head">
                      <span className="kw-tier-name">{t.name}</span>
                      <span className="kw-tier-duration">{t.duration}</span>
                    </div>
                    <div className="kw-tier-price">
                      <span className="kw-tier-price-from">From</span>
                      <span className="kw-tier-price-num">${t.price}</span>
                    </div>
                    <p className="kw-tier-blurb">{t.blurb}</p>
                    <ul className="kw-tier-includes">
                      {t.includes.map(function (line) {
                        return <li key={line}>{line}</li>;
                      })}
                    </ul>
                  </label>
                );
              })}
            </div>
          </section>

          {detail.addons && detail.addons.length > 0 &&
            <section className="kw-detail-section">
              <div className="kw-detail-section-head">
                <h3 className="kw-detail-h3">Optional add-ons</h3>
                <p className="kw-detail-help">
                  Booked together so they fit your schedule. None are required — pick what matters to you.
                </p>
              </div>
              <div className="kw-addon-grid">
                {detail.addons.map(function (a, idx) {
                  const active = addons.indexOf(idx) !== -1;
                  return (
                    <label key={a.name}
                           className={'kw-addon' + (active ? ' is-selected' : '')}>
                      <input type="checkbox"
                             checked={active}
                             onChange={function () { toggleAddon(idx); }} />
                      <span className="kw-addon-check">{active ? '✓' : ''}</span>
                      <span className="kw-addon-name">{a.name}</span>
                      <span className="kw-addon-price">{a.price}</span>
                    </label>
                  );
                })}
              </div>
            </section>}

          <p className="kw-detail-disclaimer">
            Prices are starting baselines from our partner hospitals. Final quotes follow a screening visit. All procedures are pre-cleared for medical fit before booking.
          </p>
        </div>

        <footer className="kw-drawer-foot">
          <div className="kw-drawer-foot-l">
            <span className="kw-drawer-foot-label">Estimated total</span>
            <span className="kw-drawer-foot-total">${total.toLocaleString('en-US')}</span>
            <span className="kw-drawer-foot-meta">{tier.name} package{addons.length > 0 ? ' + ' + addons.length + ' add-on' + (addons.length === 1 ? '' : 's') : ''}</span>
          </div>
          <div className="kw-drawer-foot-r">
            <button
              className="kw-cta kw-cta-ghost"
              style={{ height: 50, fontSize: 15, padding: '0 22px' }}
              onClick={onClose}>
              Close
            </button>
            <button className="kw-cta kw-cta-lg" onClick={onToggle}>
              {isSelected ? '✓ Remove from chart' : 'Add to chart'} &nbsp;›
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

window.Step2Medical = Step2Medical;
