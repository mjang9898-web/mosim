// Step 4 — Cuisine / Food & Beverage. Pick what you'd like to eat and
// drink in Korea, then tell us about allergies, religion, and spice.
// Reuses Step 3's page-tab + grid pattern, but adds a thorough Dietary
// sub-step the kitchen and concierge can plan around.

const { useState } = React;

// ─── Curated dining packages ──────────────────────────────────────────
const FB_PACKAGES = [
{
  id: 'classic',
  palette: 'classic',
  letter: 'A',
  eyebrow: 'Most popular',
  name: 'Greatest Hits of Korea',
  desc: 'Every dish a first-time guest should taste — BBQ, bibimbap, fried chicken, market food, and a tea ceremony to slow down.',
  chips: ['Korean BBQ', 'Bibimbap', 'Chimaek', 'Tteokbokki', 'Gwangjang Market', 'Tea ceremony', 'Hotteok'],
  codes: ['samgyeopsal', 'bibimbap', 'chimaek', 'tteokbokki', 'gwangjang-tour', 'tea-ceremony', 'hotteok'],
  duration: '7 tastings · ~3 days'
},
{
  id: 'vegetarian',
  palette: 'quiet',
  letter: 'B',
  eyebrow: 'Plant-forward',
  name: 'The Vegetarian Path',
  desc: 'Korea has a deep plant tradition — temple cuisine, mountain banchan, doenjang stews, and seasonal jeon.',
  chips: ['Temple cuisine', 'Sanchae bibimbap', 'Doenjang-jjigae', 'Jeon platter', 'Royal tea', 'Tofu set'],
  codes: ['balwoo', 'sanchae-bibimbap', 'doenjang-jjigae', 'jeon', 'tea-ceremony', 'sundubu'],
  duration: '6 tastings · ~3 days'
},
{
  id: 'foodie',
  palette: 'kwave',
  letter: 'C',
  eyebrow: 'For the curious palate',
  name: 'The Deep Dive',
  desc: 'A serious-eater\'s week — Michelin hansik, a soju distillery, hanwoo dry-age, market-stall crawl, and a midnight pojangmacha.',
  chips: ['Mingles tasting', 'Hanwoo dry-age', 'Soju distillery', 'Pojangmacha', 'Pansori dinner', 'Makgeolli flight'],
  codes: ['mingles', 'hanwoo', 'soju-distillery', 'pojangmacha', 'royal-cuisine', 'makgeolli-flight'],
  duration: '6 tastings · ~4 days'
}];


// ─── Food & beverage catalog, paginated ────────────────────────────────
const FB_PAGES = [
{
  id: 'hansik',
  eyebrow: 'Page Ⅰ',
  label: 'Hansik',
  items: [
  { code: 'bibimbap', mono: 'I', theme: 'rice', eyebrow: 'Rice bowl', name: 'Bibimbap — Mixed Rice with Vegetables', meta: 'Lunch · 45 min' },
  { code: 'sanchae-bibimbap', mono: 'II', theme: 'veg', eyebrow: 'Mountain', name: 'Sanchae Bibimbap — Wild Mountain Greens', meta: 'Lunch · 45 min · vegan-friendly' },
  { code: 'samgyetang', mono: 'III', theme: 'soup', eyebrow: 'Soup', name: 'Samgyetang — Ginseng Chicken Soup', meta: 'Lunch · 60 min · restorative' },
  { code: 'sundubu', mono: 'IV', theme: 'stew', eyebrow: 'Stew', name: 'Sundubu-jjigae — Soft Tofu Stew', meta: 'Lunch · 45 min · spicy' },
  { code: 'kimchi-jjigae', mono: 'V', theme: 'stew', eyebrow: 'Stew', name: 'Kimchi-jjigae — Aged Kimchi Stew', meta: 'Lunch · 45 min · spicy' },
  { code: 'doenjang-jjigae', mono: 'VI', theme: 'banchan', eyebrow: 'Stew', name: 'Doenjang-jjigae — Soybean Paste Stew', meta: 'Lunch · 45 min · earthy' },
  { code: 'japchae', mono: 'VII', theme: 'noodle', eyebrow: 'Noodle', name: 'Japchae — Sweet Potato Glass Noodles', meta: 'Side or main · 30 min' },
  { code: 'naengmyeon', mono: 'VIII', theme: 'noodle', eyebrow: 'Cold noodle', name: 'Naengmyeon — Icy Buckwheat Noodles', meta: 'Lunch · 30 min · summer' },
  { code: 'tteokguk', mono: 'IX', theme: 'soup', eyebrow: 'Soup', name: 'Tteokguk — Rice Cake & Beef Soup', meta: 'Breakfast · 30 min' },
  { code: 'kimbap', mono: 'X', theme: 'rice', eyebrow: 'Roll', name: 'Kimbap — Seaweed Rice Rolls', meta: 'Snack · 15 min' },
  { code: 'mandu', mono: 'XI', theme: 'rice', eyebrow: 'Dumpling', name: 'Mandu — Hand-folded Dumplings', meta: 'Side · 30 min' },
  { code: 'jeon', mono: 'XII', theme: 'veg', eyebrow: 'Pancake', name: 'Jeon — Savory Vegetable & Seafood Pancakes', meta: 'Side · 30 min · pairs w/ makgeolli' },
  { code: 'bossam', mono: 'XIII', theme: 'bbq', eyebrow: 'Wrap', name: 'Bossam — Boiled Pork Belly Wraps', meta: 'Dinner · 60 min · communal' },
  { code: 'hanjeongsik', mono: 'XIV', theme: 'banchan', eyebrow: 'Tasting', name: 'Hanjeongsik — Full Banchan Course', meta: 'Dinner · 2 hrs · 12+ dishes' },
  { code: 'royal-cuisine', mono: 'XV', theme: 'banchan', eyebrow: 'Royal', name: 'Surasang — Royal Court Cuisine', meta: 'Dinner · 2 hrs · ceremonial' },
  { code: 'sundubu-temple', mono: 'XVI', theme: 'veg', eyebrow: 'Temple', name: 'Sachal Eumsik — Temple Cuisine Set', meta: 'Lunch · 90 min · vegan, no alliums' }]

},
{
  id: 'street',
  eyebrow: 'Page Ⅱ',
  label: 'Street',
  items: [
  { code: 'tteokbokki', mono: 'XVII', theme: 'stew', eyebrow: 'Street', name: 'Tteokbokki — Spicy Rice Cakes', meta: 'Snack · spicy · iconic' },
  { code: 'hotteok', mono: 'XVIII', theme: 'sweet', eyebrow: 'Sweet', name: 'Hotteok — Brown Sugar Syrup Pancakes', meta: 'Snack · winter staple' },
  { code: 'bungeoppang', mono: 'XIX', theme: 'sweet', eyebrow: 'Sweet', name: 'Bungeoppang — Fish-shaped Red Bean Cakes', meta: 'Snack · winter staple' },
  { code: 'odeng', mono: 'XX', theme: 'seafood', eyebrow: 'Skewer', name: 'Odeng — Fish Cake Skewers in Broth', meta: 'Snack · warm · cold-weather' },
  { code: 'sundae', mono: 'XXI', theme: 'bbq', eyebrow: 'Sausage', name: 'Sundae — Korean Blood Sausage Plate', meta: 'Snack · adventurous' },
  { code: 'twigim', mono: 'XXII', theme: 'fried', eyebrow: 'Fried', name: 'Twigim — Mixed Korean Tempura', meta: 'Snack · 20 min' },
  { code: 'gyeran-bbang', mono: 'XXIII', theme: 'sweet', eyebrow: 'Bread', name: 'Gyeran-ppang — Egg Bread Cups', meta: 'Snack · breakfast' },
  { code: 'kkochi', mono: 'XXIV', theme: 'bbq', eyebrow: 'Skewer', name: 'Kkochi — Grilled Skewers, Various', meta: 'Snack · grill smoke' },
  { code: 'tornado-potato', mono: 'XXV', theme: 'fried', eyebrow: 'Fried', name: 'Hweori-gamja — Tornado Spiral Potato', meta: 'Snack · 10 min' },
  { code: 'pajeon', mono: 'XXVI', theme: 'veg', eyebrow: 'Pancake', name: 'Haemul-pajeon — Seafood Scallion Pancake', meta: 'Snack · pairs w/ makgeolli' },
  { code: 'gwangjang-tour', mono: 'XXVII', theme: 'market-c', eyebrow: 'Market', name: 'Gwangjang Market Food Tour', meta: '2 hrs · with foodie guide' },
  { code: 'tongin-tour', mono: 'XXVIII', theme: 'market-c', eyebrow: 'Market', name: 'Tongin Market Doshirak Lunch Box', meta: '90 min · build-your-own' },
  { code: 'noryangjin', mono: 'XXIX', theme: 'seafood', eyebrow: 'Market', name: 'Noryangjin Fish Market — Sashimi Floor', meta: '2 hrs · raw fish · evening' },
  { code: 'pojangmacha', mono: 'XXX', theme: 'soju', eyebrow: 'Tent', name: 'Pojangmacha — Midnight Tent Crawl', meta: '3 hrs · soju + late food' }]

},
{
  id: 'grill',
  eyebrow: 'Page Ⅲ',
  label: 'Grill',
  items: [
  { code: 'samgyeopsal', mono: 'XXXI', theme: 'bbq', eyebrow: 'BBQ', name: 'Samgyeopsal — Pork Belly Grill', meta: 'Dinner · 90 min · communal' },
  { code: 'hanwoo', mono: 'XXXII', theme: 'bbq', eyebrow: 'BBQ', name: 'Hanwoo — Premium Korean Beef Tasting', meta: 'Dinner · 2 hrs · grade 1++' },
  { code: 'galbi', mono: 'XXXIII', theme: 'bbq', eyebrow: 'BBQ', name: 'Galbi — Marinated Short Rib Grill', meta: 'Dinner · 90 min · sweet-savory' },
  { code: 'la-galbi', mono: 'XXXIV', theme: 'bbq', eyebrow: 'BBQ', name: 'LA Galbi — Cross-cut Beef Ribs', meta: 'Dinner · 90 min · family-style' },
  { code: 'dak-galbi', mono: 'XXXV', theme: 'stew', eyebrow: 'Stir-fry', name: 'Dak-galbi — Spicy Chicken Stir-fry', meta: 'Dinner · 60 min · spicy' },
  { code: 'jeyuk', mono: 'XXXVI', theme: 'stew', eyebrow: 'Stir-fry', name: 'Jeyuk-bokkeum — Fiery Pork Stir-fry', meta: 'Lunch · 45 min · very spicy' },
  { code: 'sutbul-galbi', mono: 'XXXVII', theme: 'bbq', eyebrow: 'Charcoal', name: 'Sutbul-Galbi — Charcoal Grill House', meta: 'Dinner · 2 hrs · smoky' },
  { code: 'chimaek', mono: 'XXXVIII', theme: 'fried', eyebrow: 'Chimaek', name: 'Chimaek — Korean Fried Chicken & Beer', meta: 'Evening · 90 min · iconic' },
  { code: 'jokbal', mono: 'XXXIX', theme: 'bbq', eyebrow: 'Braise', name: 'Jokbal — Soy-braised Pig Trotters', meta: 'Dinner · 90 min · late-night' },
  { code: 'gopchang', mono: 'XL', theme: 'bbq', eyebrow: 'Offal', name: 'Gopchang — Grilled Beef Intestines', meta: 'Dinner · 90 min · adventurous' },
  { code: 'eel', mono: 'XLI', theme: 'bbq', eyebrow: 'Seafood', name: 'Jangeo-gui — Grilled Freshwater Eel', meta: 'Dinner · 60 min · stamina food' },
  { code: 'budae', mono: 'XLII', theme: 'stew', eyebrow: 'Hot pot', name: 'Budae-jjigae — Army Base Hot Pot', meta: 'Dinner · 60 min · communal' }]

},
{
  id: 'drinks',
  eyebrow: 'Page Ⅳ',
  label: 'Drinks',
  items: [
  { code: 'tea-ceremony', mono: 'XLIII', theme: 'tea-h', eyebrow: 'Tea', name: 'Private Korean Tea Ceremony', meta: '90 min · with master' },
  { code: 'omija', mono: 'XLIV', theme: 'tea-h', eyebrow: 'Tea', name: 'Omija — Five-Flavor Berry Tea Tasting', meta: '45 min · seasonal' },
  { code: 'yujacha', mono: 'XLV', theme: 'tea-h', eyebrow: 'Tea', name: 'Yujacha — Citron Honey Tea Service', meta: '30 min · winter staple' },
  { code: 'daechu', mono: 'XLVI', theme: 'tea-h', eyebrow: 'Tea', name: 'Daechu — Jujube Date Tea Tasting', meta: '30 min · restorative' },
  { code: 'temple-tea', mono: 'XLVII', theme: 'temple-c', eyebrow: 'Tea', name: 'Buddhist Temple Tea & Talk', meta: '2 hrs · with monk' },
  { code: 'makgeolli-flight', mono: 'XLVIII', theme: 'makgeolli', eyebrow: 'Makgeolli', name: 'Makgeolli Flight — Five Brewers', meta: '90 min · with jeon pairing' },
  { code: 'makgeolli-brew', mono: 'XLIX', theme: 'makgeolli', eyebrow: 'Brewery', name: 'Makgeolli Brewery Visit', meta: 'Half day · with brewer' },
  { code: 'soju-distillery', mono: 'L', theme: 'soju', eyebrow: 'Soju', name: 'Soju Distillery Day Trip', meta: 'Half day · Andong / Hwayo' },
  { code: 'andong-soju', mono: 'LI', theme: 'soju', eyebrow: 'Soju', name: 'Andong Premium Soju Tasting', meta: '60 min · single-distillery' },
  { code: 'craft-beer', mono: 'LII', theme: 'soju', eyebrow: 'Beer', name: 'Seoul Craft Beer Crawl', meta: '3 hrs · Itaewon → Mapo' },
  { code: 'cocktail', mono: 'LIII', theme: 'cocktail', eyebrow: 'Cocktail', name: 'Korean Mixology Speakeasy', meta: '2 hrs · Charles H · Le Chamber' },
  { code: 'coffee-seongsu', mono: 'LIV', theme: 'coffee', eyebrow: 'Coffee', name: 'Seongsu Specialty Coffee Walk', meta: '3 hrs · 4 roasters' },
  { code: 'coffee-anguk', mono: 'LV', theme: 'coffee', eyebrow: 'Coffee', name: 'Anguk Hanok-Café Crawl', meta: '2 hrs · old-town vibe' },
  { code: 'dalgona', mono: 'LVI', theme: 'sweet', eyebrow: 'Treat', name: 'Bingsu & Dalgona Dessert Tasting', meta: '60 min · sweet finale' }]

},
{
  id: 'fine',
  eyebrow: 'Page Ⅴ',
  label: 'Fine Dining',
  items: [
  { code: 'mingles', mono: 'LVII', theme: 'michelin', eyebrow: '★★★', name: 'Mingles — Three-Star New Korean', meta: 'Dinner · 2.5 hrs · tasting' },
  { code: 'onjium', mono: 'LVIII', theme: 'michelin', eyebrow: '★', name: 'Onjium — Royal Court Reinterpreted', meta: 'Lunch · 2 hrs · hanok dining' },
  { code: 'layeon', mono: 'LIX', theme: 'michelin', eyebrow: '★★★', name: 'La Yeon — Traditional Hansik at the Shilla', meta: 'Dinner · 2.5 hrs · view' },
  { code: 'jungsik', mono: 'LX', theme: 'michelin', eyebrow: '★★', name: 'Jungsik Seoul — Contemporary Korean', meta: 'Dinner · 2.5 hrs · tasting' },
  { code: 'balwoo', mono: 'LXI', theme: 'temple-c', eyebrow: '★', name: 'Balwoo Gongyang — Temple Tasting', meta: 'Dinner · 2 hrs · vegan' },
  { code: 'kwonsook', mono: 'LXII', theme: 'michelin', eyebrow: '★★', name: 'Kwon Sook Soo — Banchan Hanjeongsik', meta: 'Dinner · 2.5 hrs · classic' },
  { code: 'gaon', mono: 'LXIII', theme: 'michelin', eyebrow: '★★★', name: 'Gaon — Heritage Hansik & Ceramic Art', meta: 'Dinner · 2.5 hrs · ceremonial' },
  { code: 'chefs-table', mono: 'LXIV', theme: 'michelin', eyebrow: 'Private', name: 'Private Chef\'s Table at Your Hanok', meta: 'Dinner · 3 hrs · in-room' }]

},
{
  id: 'packages',
  eyebrow: 'Page Ⅵ',
  label: 'Packages',
  kind: 'packages',
  items: []
}];


// ─── Allergens — common Korean-food vectors ───────────────────────────
const ALLERGENS = [
{ code: 'shellfish', mono: 'S', pal: 'shrimp', name: 'Shellfish & Shrimp', sub: 'Often in kimchi (saeujeot), sauces, broths' },
{ code: 'crustacean', mono: 'C', pal: 'shell', name: 'Crab & Lobster', sub: 'Hot pots and seafood courses' },
{ code: 'fish', mono: 'F', pal: 'fish', name: 'Fish & Anchovy', sub: 'In dashi broth — present in most stews' },
{ code: 'eggs', mono: 'E', pal: 'egg', name: 'Eggs', sub: 'Bibimbap, kimbap, mandu, egg bread' },
{ code: 'dairy', mono: 'D', pal: 'dairy', name: 'Dairy', sub: 'Western dishes only — rare in hansik' },
{ code: 'soy', mono: 'S', pal: 'soy', name: 'Soy', sub: 'Soy sauce, doenjang, tofu — extremely common' },
{ code: 'wheat', mono: 'W', pal: 'wheat', name: 'Wheat / Gluten', sub: 'Noodles, soy sauce, fried foods' },
{ code: 'buckwheat', mono: 'B', pal: 'buck', name: 'Buckwheat', sub: 'Naengmyeon noodles, makguksu' },
{ code: 'sesame', mono: 'X', pal: 'sesame', name: 'Sesame', sub: 'In nearly every banchan — oil and seed' },
{ code: 'peanut', mono: 'P', pal: 'peanut', name: 'Peanut', sub: 'Some banchan, sauces, desserts' },
{ code: 'treenut', mono: 'T', pal: 'nut', name: 'Tree Nuts', sub: 'Walnut, almond — desserts and gangjeong' },
{ code: 'pinenut', mono: 'I', pal: 'pine', name: 'Pine Nut', sub: 'Topping on royal court dishes' }];


// ─── Diet / religion / lifestyle ──────────────────────────────────────
const DIETS = [
{ code: 'vegetarian', tag: 'Diet', name: 'Vegetarian',
  desc: 'No meat or fish. We\'ll plan around hansik vegetable courses, doenjang, and temple cuisine.' },
{ code: 'vegan', tag: 'Diet', name: 'Vegan',
  desc: 'No animal products. Korean temple cuisine is naturally vegan; many side dishes can be adjusted.' },
{ code: 'pescatarian', tag: 'Diet', name: 'Pescatarian',
  desc: 'Fish and seafood, no other meat. Easy to plan around — Korea has world-class seafood.' },
{ code: 'halal', tag: 'Religion', name: 'Halal',
  desc: 'No pork. No alcohol-based marinades. We\'ll book Korea Muslim Federation-certified restaurants.' },
{ code: 'kosher', tag: 'Religion', name: 'Kosher',
  desc: 'No pork or shellfish; certified preparation. Chabad Korea catering arranged on request.' },
{ code: 'hindu', tag: 'Religion', name: 'Hindu — No Beef',
  desc: 'No beef. Hanwoo and bulgogi excluded; chicken, pork, and seafood available.' },
{ code: 'jain', tag: 'Lifestyle', name: 'Jain — No Roots',
  desc: 'No onion, garlic, potato, ginger. Many Korean dishes need adjustment; we\'ll curate carefully.' },
{ code: 'gluten-free', tag: 'Diet', name: 'Gluten-Free',
  desc: 'Most Korean soy sauces contain wheat — we source tamari and verify with each chef.' },
{ code: 'temple', tag: 'Lifestyle', name: 'Buddhist Temple-style',
  desc: 'Plant-based, no alliums (the 5 pungent vegetables). Naturally aligned with sachal eumsik.' }];


// ─── Spice tolerance ──────────────────────────────────────────────────
const SPICE_LEVELS = [
{ code: 'none', pips: 0, label: 'No spice', sub: 'Hold the gochugaru' },
{ code: 'mild', pips: 1, label: 'Mild', sub: 'A whisper of warmth' },
{ code: 'medium', pips: 2, label: 'Korean medium', sub: 'How locals eat' },
{ code: 'spicy', pips: 3, label: 'Spicy', sub: 'Bring it on' },
{ code: 'extra', pips: 4, label: 'Maximum heat', sub: "Don't hold back" }];


function Step4Cuisine() {
  const [pageIdx, setPageIdx] = useState(0);
  const [selected, setSelected] = useState(
    () => new Set(['bibimbap', 'samgyeopsal', 'chimaek', 'tteokbokki', 'tea-ceremony', 'makgeolli-flight'])
  );
  const [allergens, setAllergens] = useState(() => new Set(['shellfish', 'peanut']));
  const [diets, setDiets] = useState(() => new Set());
  const [spice, setSpice] = useState('medium');

  const currentPage = FB_PAGES[pageIdx];
  const allSelectedItems = FB_PAGES.flatMap((p) => p.items.filter((it) => selected.has(it.code)));

  const toggle = (code) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);else next.add(code);
      return next;
    });
  };
  const clearAll = () => setSelected(new Set());
  const toggleSet = (setter) => (code) => setter((prev) => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code);else next.add(code);
    return next;
  });
  const toggleAllergen = toggleSet(setAllergens);
  const toggleDiet = toggleSet(setDiets);

  const activePkgId = (() => {
    for (const p of FB_PACKAGES) {
      if (p.codes.length !== selected.size) continue;
      if (p.codes.every((c) => selected.has(c))) return p.id;
    }
    return null;
  })();
  const applyPackage = (pkg) => {
    if (activePkgId === pkg.id) setSelected(new Set());else
    setSelected(new Set(pkg.codes));
  };

  return (
    <div className="kw-screen">
      <BrandNav active="food" />

      <div className="kw-wrap">
        <StepBar active={3} />

        <header className="kw-page-hero">
          <SectionEyebrow num="04" label="Step 04 of 05" />
          <h1>What would you love <span className="kw-accent">to taste?</span></h1>
          <p style={{ maxWidth: "90ch" }}>From a bubbling Kimchi-stew to a three-star tasting menu — pick the food and beverage you want in your week. We'll handle the reservations, the allergens, and everything in between.</p>
        </header>

        {/* ── Sub-step Ⅰ — Choose your tastings ───────────────────── */}
        <div className="kw-substep">
          <div className="kw-substep-l">
            <span className="kw-substep-numeral">Step Ⅰ</span>
            <span className="kw-substep-title">Choose your tastings</span>
          </div>
          <span className="kw-substep-hint">
            Six pages — Hansik, Street, Grill, Drinks, Fine Dining, Packages.
          </span>
        </div>

        <section className="kw-q-row kw-q-row-full">
          <div className="kw-q-input">

            {/* Page tabs */}
            <div className="kw-pagetabs">
              {FB_PAGES.map((p, i) => {
                const pageSelCount = p.items.filter((it) => selected.has(it.code)).length;
                return (
                  <button
                    key={p.id}
                    className={`kw-pagetab ${i === pageIdx ? 'is-active' : ''}`}
                    onClick={() => setPageIdx(i)} style={{ fontFamily: "-apple-system" }}>

                    <span className="kw-pagetab-num" style={{ fontFamily: "-apple-system" }}>{p.eyebrow}</span>
                    <span className="kw-pagetab-label" style={{ fontFamily: "Inter" }}>
                      {p.label}
                      {p.kind !== 'packages' &&
                      <span className="kw-pagetab-count">
                          {`${p.items.length}${pageSelCount > 0 ? ` · ${pageSelCount} picked` : ''}`}
                        </span>
                      }
                    </span>
                  </button>);
              })}
            </div>

            {/* Page content */}
            {currentPage.kind === 'packages' ?
            <>
                <div className="kw-pkg-band">
                  <span className="kw-pkg-band-title">Not sure where to start?</span>
                  <span className="kw-pkg-band-hint">
                    Pick a ready-made dining plan — selecting one replaces your basket.
                  </span>
                </div>

                <div className="kw-pkg-grid">
                  {FB_PACKAGES.map((p) => {
                  const active = activePkgId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`kw-pkg kw-pkg-${p.palette} ${active ? 'is-selected' : ''}`}
                      onClick={() => applyPackage(p)}>

                        <div className="kw-pkg-banner">
                          <span className="kw-pkg-banner-letter">{p.letter}</span>
                          <span className="kw-pkg-banner-cap">{p.eyebrow}</span>
                        </div>
                        <div className="kw-pkg-body">
                          <div className="kw-pkg-name">{p.name}</div>
                          <p className="kw-pkg-desc">{p.desc}</p>
                          <div className="kw-pkg-includes">
                            {p.chips.map((c) =>
                          <span key={c} className="kw-pkg-chip">{c}</span>
                          )}
                          </div>
                          <div className="kw-pkg-foot">
                            <span className="kw-pkg-meta">{p.duration}</span>
                            <button
                            className="kw-pkg-cta"
                            onClick={(e) => {e.stopPropagation();applyPackage(p);}}>
                              {active ? '✓ Selected' : 'Pick this package'}
                            </button>
                          </div>
                        </div>
                      </div>);
                })}
                </div>
              </> :

            <div className="kw-cul-grid">
                {currentPage.items.map((it) => {
                const sel = selected.has(it.code);
                return (
                  <div
                    key={it.code}
                    className={`kw-cul kw-photo-${it.theme} ${sel ? 'is-selected' : ''}`}>

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
                          onClick={() => toggle(it.code)}>
                            {sel ? <>✓ Added</> : <><span className="kw-cul-add-plus">+</span> Add</>}
                          </button>
                        </div>
                      </div>
                    </div>);
              })}
              </div>
            }

            {/* Pagination */}
            <div className="kw-pagination">
              <button
                className="kw-pagination-btn"
                onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                disabled={pageIdx === 0}>
                ← Previous
              </button>
              {FB_PAGES.map((p, i) =>
              <button
                key={p.id}
                className={`kw-pagination-btn kw-pagination-num ${i === pageIdx ? 'is-active' : ''}`}
                onClick={() => setPageIdx(i)}>
                  {i + 1}
                </button>
              )}
              <span className="kw-pagination-info">Page {pageIdx + 1} of {FB_PAGES.length}</span>
              <button
                className="kw-pagination-btn"
                onClick={() => setPageIdx((i) => Math.min(FB_PAGES.length - 1, i + 1))}
                disabled={pageIdx === FB_PAGES.length - 1}>
                Next →
              </button>
            </div>

            {/* Basket */}
            <div className="kw-cul-basket">
              <div className="kw-basket-head">
                <span className="kw-basket-eyebrow">
                  Your tasting basket
                  <span className="kw-basket-count">· {allSelectedItems.length} item{allSelectedItems.length === 1 ? '' : 's'}</span>
                </span>
                {allSelectedItems.length > 0 &&
                <a href="#" className="kw-basket-clear" onClick={(e) => {e.preventDefault();clearAll();}}>Clear all</a>
                }
              </div>
              <div className="kw-basket-items">
                {allSelectedItems.map((it) =>
                <div key={it.code} className={`kw-basket-item kw-photo-${it.theme}`}>
                    <div className="kw-basket-thumb">{it.mono}</div>
                    <div className="kw-basket-item-info">
                      <div className="kw-basket-item-name">{it.name}</div>
                      <div className="kw-basket-item-meta">{it.meta}</div>
                    </div>
                    <button
                    className="kw-basket-item-remove"
                    aria-label={`Remove ${it.name}`}
                    onClick={() => toggle(it.code)}>
                    ×</button>
                  </div>
                )}
                <a href="#" className="kw-basket-add" onClick={(e) => e.preventDefault()}>
                  <span className="kw-basket-add-icon">+</span>
                  <span>Browse more</span>
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* ── Sub-step Ⅱ — Dietary requirements ────────────────────── */}
        <div className="kw-substep">
          <div className="kw-substep-l">
            <span className="kw-substep-numeral">Step Ⅱ</span>
            <span className="kw-substep-title">Dietary requirements</span>
          </div>
          <span className="kw-substep-hint">
            We verify every dish with the kitchen — be as specific as you'd like.
          </span>
        </div>

        {/* 01. ALLERGIES */}
        <section className="kw-q-row kw-q-row-full">
          <div className="kw-diet-section">
            <div className="kw-diet-header">
              <div>
                <SectionEyebrow num="01" label="Allergies" />
                <h2 className="kw-q-title">Anything you can't eat?</h2>
              </div>
              <p className="kw-diet-header-help">
                Tick every allergen — even mild ones. We brief every chef before service.
              </p>
            </div>
            <div className="kw-allergen-grid">
              {ALLERGENS.map((a) => {
                const sel = allergens.has(a.code);
                return (
                  <button
                    key={a.code}
                    type="button"
                    className={`kw-allergen kw-pal-${a.pal} ${sel ? 'is-selected' : ''}`}
                    onClick={() => toggleAllergen(a.code)}>
                    <span className="kw-allergen-mono">{a.mono}</span>
                    <span className="kw-allergen-info">
                      <span className="kw-allergen-name">{a.name}</span>
                      <span className="kw-allergen-sub">{a.sub}</span>
                    </span>
                    <span className="kw-allergen-check">✓</span>
                  </button>);

              })}
            </div>

            <div className="kw-confband">
              <span className="kw-confband-mark">!</span>
              <div className="kw-confband-body">
                <span className="kw-confband-title">Severe allergy or anaphylaxis?</span>
                <span className="kw-confband-text">
                  Add a note below — we'll arrange an EpiPen-trained guide, English-language
                  ingredient cards, and pre-cleared substitutes for each restaurant.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 02. DIET / RELIGION / LIFESTYLE */}
        <section className="kw-q-row kw-q-row-full">
          <div className="kw-diet-section">
            <div className="kw-diet-header">
              <div>
                <SectionEyebrow num="02" label="Diet & Religion" />
                <h2 className="kw-q-title">Any diet or faith we should honor?</h2>
              </div>
              <p className="kw-diet-header-help">
                Halal, Kosher, temple-style, plant-based — planned around without explaining twice.
              </p>
            </div>
            <div className="kw-diet-grid">
              {DIETS.map((d) => {
                const sel = diets.has(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    className={`kw-diet ${sel ? 'is-selected' : ''}`}
                    onClick={() => toggleDiet(d.code)}>
                    <span className="kw-diet-head">
                      <span className="kw-diet-name">{d.name}</span>
                      <span className="kw-diet-tag">{d.tag}</span>
                    </span>
                    <p className="kw-diet-desc">{d.desc}</p>
                  </button>);
              })}
            </div>
          </div>
        </section>

        {/* 03. SPICE TOLERANCE */}
        <section className="kw-q-row kw-q-row-full">
          <div className="kw-diet-section">
            <div className="kw-diet-header">
              <div>
                <SectionEyebrow num="03" label="Spice" />
                <h2 className="kw-q-title">How spicy do you like it?</h2>
              </div>
              <p className="kw-diet-header-help">
                From gentle doenjang to face-melting buldak — tell us where your palate lives.
              </p>
            </div>
            <div className="kw-spice">
              {SPICE_LEVELS.map((s) => {
                const active = spice === s.code;
                return (
                  <button
                    key={s.code}
                    type="button"
                    className={`kw-spice-opt ${active ? 'is-active' : ''}`}
                    onClick={() => setSpice(s.code)}>
                    <span className="kw-spice-pips">
                      {[0, 1, 2, 3].map((i) =>
                      <span key={i} className={`kw-spice-pip ${i < s.pips ? 'on' : ''}`} />
                      )}
                    </span>
                    <span className="kw-spice-label">{s.label}</span>
                    <span className="kw-spice-sub">{s.sub}</span>
                  </button>);
              })}
            </div>
          </div>
        </section>

        {/* 04. NOTES */}
        <section className="kw-q-row">
          <div>
            <SectionEyebrow num="04" label="Notes" />
            <h2 className="kw-q-title">Anything else to tell the kitchen?</h2>
            <p className="kw-q-help">
              A dish you've been dreaming about, a restaurant on your list, a sensitivity that
              doesn't fit the boxes above, or the time your mother made you a meal you want to recreate.
            </p>
          </div>
          <div className="kw-q-input">
            <div className="kw-notes-card">
              <div className="kw-notes-card-head">
                <span className="kw-notes-card-label">
                  <span className="kw-notes-card-pen">✎</span>
                  Write your dietary notes here
                </span>
                <span className="kw-notes-card-secure">• Shared with chefs · optional</span>
              </div>
              <textarea
                className="kw-textarea"
                rows={5}
                placeholder="e.g. Severe peanut allergy — anaphylactic. I've always wanted to try makgeolli at a brewery. My partner is FODMAP-sensitive so no garlic-heavy dishes. Hoping for one fine-dining night and otherwise casual." />
            </div>
          </div>
        </section>

        {/* Action bar */}
        <div className="kw-actionbar">
          <div className="kw-actionbar-l">
            <a href="step3.html"
            className="kw-cta kw-cta-ghost kw-cta-sm"
            style={{ height: 50, fontSize: 15, padding: '0 22px' }}>
              ← Back to Culture
            </a>
            <span className="kw-actionbar-note">Your answers are saved as you type.</span>
          </div>
          <button className="kw-cta kw-cta-lg">
            Generate my AI Trip &nbsp;›
          </button>
        </div>
      </div>
    </div>);
}

window.Step4Cuisine = Step4Cuisine;