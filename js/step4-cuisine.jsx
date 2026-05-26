// Step 4 — Cuisine / Food & Beverage. Pick what you'd like to eat and
// drink in Korea, then tell us about allergies, religion, and spice.
// Reuses Step 3's page-tab + grid pattern, but adds a thorough Dietary
// sub-step the kitchen and concierge can plan around.

const { useState } = React;

// Reuse the same /thumbs/ pattern as step3 so a single source can serve
// both list thumbnails and drawer photos.
const thumbUrl = (path) => path && path.replace(/\/([^/]+\.webp)$/, '/thumbs/$1');

// ─── Food & beverage catalog, paginated ────────────────────────────────
const FB_PAGES = [
{
  id: 'hansik',
  eyebrow: 'Page Ⅰ',
  label: 'Hansik',
  items: [
  { code: 'bibimbap',         mono: 'I',    theme: 'rice',    eyebrow: 'Rice bowl',   name: 'Bibimbap — Mixed Rice with Vegetables',       meta: 'Lunch · 45 min',                  image: '/assets/cuisine-hansik/bibimbap.webp' },
  { code: 'sanchae-bibimbap', mono: 'II',   theme: 'veg',     eyebrow: 'Mountain',    name: 'Sanchae Bibimbap — Wild Mountain Greens',     meta: 'Lunch · 45 min · vegan-friendly', image: '/assets/cuisine-hansik/sanchae-bibimbap.webp' },
  { code: 'samgyetang',       mono: 'III',  theme: 'soup',    eyebrow: 'Soup',        name: 'Samgyetang — Ginseng Chicken Soup',           meta: 'Lunch · 60 min · restorative',    image: '/assets/cuisine-hansik/samgyetang.webp' },
  { code: 'sundubu',          mono: 'IV',   theme: 'stew',    eyebrow: 'Stew',        name: 'Sundubu-jjigae — Soft Tofu Stew',             meta: 'Lunch · 45 min · spicy',          image: '/assets/cuisine-hansik/sundubu.webp' },
  { code: 'kimchi-jjigae',    mono: 'V',    theme: 'stew',    eyebrow: 'Stew',        name: 'Kimchi-jjigae — Aged Kimchi Stew',            meta: 'Lunch · 45 min · spicy',          image: '/assets/cuisine-hansik/kimchi-jjigae.webp' },
  { code: 'doenjang-jjigae',  mono: 'VI',   theme: 'banchan', eyebrow: 'Stew',        name: 'Doenjang-jjigae — Soybean Paste Stew',        meta: 'Lunch · 45 min · earthy',         image: '/assets/cuisine-hansik/doenjang-jjigae.webp' },
  { code: 'japchae',          mono: 'VII',  theme: 'noodle',  eyebrow: 'Noodle',      name: 'Japchae — Sweet Potato Glass Noodles',        meta: 'Side or main · 30 min',           image: '/assets/cuisine-hansik/japchae.webp' },
  { code: 'naengmyeon',       mono: 'VIII', theme: 'noodle',  eyebrow: 'Cold noodle', name: 'Naengmyeon — Icy Buckwheat Noodles',          meta: 'Lunch · 30 min · summer',         image: '/assets/cuisine-hansik/naengmyeon.webp' },
  { code: 'tteokguk',         mono: 'IX',   theme: 'soup',    eyebrow: 'Soup',        name: 'Tteokguk — Rice Cake & Beef Soup',            meta: 'Breakfast · 30 min',              image: '/assets/cuisine-hansik/tteokguk.webp' },
  { code: 'kimbap',           mono: 'X',    theme: 'rice',    eyebrow: 'Roll',        name: 'Kimbap — Seaweed Rice Rolls',                 meta: 'Snack · 15 min',                  image: '/assets/cuisine-hansik/kimbap.webp' },
  { code: 'mandu',            mono: 'XI',   theme: 'rice',    eyebrow: 'Dumpling',    name: 'Mandu — Hand-folded Dumplings',               meta: 'Side · 30 min',                   image: '/assets/cuisine-hansik/mandu.webp' },
  { code: 'jeon',             mono: 'XII',  theme: 'veg',     eyebrow: 'Pancake',     name: 'Jeon — Savory Vegetable & Seafood Pancakes',  meta: 'Side · 30 min · pairs w/ makgeolli', image: '/assets/cuisine-hansik/jeon.webp' },
  { code: 'bossam',           mono: 'XIII', theme: 'bbq',     eyebrow: 'Wrap',        name: 'Bossam — Boiled Pork Belly Wraps',            meta: 'Dinner · 60 min · communal',      image: '/assets/cuisine-hansik/bossam.webp' },
  { code: 'hanjeongsik',      mono: 'XIV',  theme: 'banchan', eyebrow: 'Tasting',     name: 'Hanjeongsik — Full Banchan Course',           meta: 'Dinner · 2 hrs · 12+ dishes',     image: '/assets/cuisine-hansik/hanjeongsik.webp' },
  { code: 'royal-cuisine',    mono: 'XV',   theme: 'banchan', eyebrow: 'Royal',       name: 'Surasang — Royal Court Cuisine',              meta: 'Dinner · 2 hrs · ceremonial',     image: '/assets/cuisine-hansik/royal-cuisine.webp' },
  { code: 'sundubu-temple',   mono: 'XVI',  theme: 'veg',     eyebrow: 'Temple',      name: 'Sachal Eumsik — Temple Cuisine Set',          meta: 'Lunch · 90 min · vegan, no alliums', image: '/assets/cuisine-hansik/sundubu-temple.webp' }]

},
{
  id: 'street',
  eyebrow: 'Page Ⅱ',
  label: 'Street',
  items: [
  { code: 'tteokbokki',     mono: 'XVII',   theme: 'stew',     eyebrow: 'Street',  name: 'Tteokbokki — Spicy Rice Cakes',           meta: 'Snack · spicy · iconic',         image: '/assets/cuisine-street/tteokbokki.webp' },
  { code: 'hotteok',         mono: 'XVIII',  theme: 'sweet',    eyebrow: 'Sweet',   name: 'Hotteok — Brown Sugar Syrup Pancakes',    meta: 'Snack · winter staple',          image: '/assets/cuisine-street/hotteok.webp' },
  { code: 'bungeoppang',     mono: 'XIX',    theme: 'sweet',    eyebrow: 'Sweet',   name: 'Bungeoppang — Fish-shaped Red Bean Cakes', meta: 'Snack · winter staple',         image: '/assets/cuisine-street/bungeoppang.webp' },
  { code: 'odeng',           mono: 'XX',     theme: 'seafood',  eyebrow: 'Skewer',  name: 'Odeng — Fish Cake Skewers in Broth',      meta: 'Snack · warm · cold-weather',    image: '/assets/cuisine-street/odeng.webp' },
  { code: 'sundae',          mono: 'XXI',    theme: 'bbq',      eyebrow: 'Sausage', name: 'Sundae — Korean Blood Sausage Plate',     meta: 'Snack · adventurous',            image: '/assets/cuisine-street/sundae.webp' },
  { code: 'twigim',          mono: 'XXII',   theme: 'fried',    eyebrow: 'Fried',   name: 'Twigim — Mixed Korean Tempura',           meta: 'Snack · 20 min',                 image: '/assets/cuisine-street/twigim.webp' },
  { code: 'gyeran-bbang',    mono: 'XXIII',  theme: 'sweet',    eyebrow: 'Bread',   name: 'Gyeran-ppang — Egg Bread Cups',           meta: 'Snack · breakfast',              image: '/assets/cuisine-street/gyeran-bbang.webp' },
  { code: 'kkochi',          mono: 'XXIV',   theme: 'bbq',      eyebrow: 'Skewer',  name: 'Kkochi — Grilled Skewers, Various',       meta: 'Snack · grill smoke',            image: '/assets/cuisine-street/kkochi.webp' },
  { code: 'tornado-potato',  mono: 'XXV',    theme: 'fried',    eyebrow: 'Fried',   name: 'Hweori-gamja — Tornado Spiral Potato',    meta: 'Snack · 10 min',                 image: '/assets/cuisine-street/tornado-potato.webp' },
  { code: 'pajeon',          mono: 'XXVI',   theme: 'veg',      eyebrow: 'Pancake', name: 'Haemul-pajeon — Seafood Scallion Pancake',meta: 'Snack · pairs w/ makgeolli',     image: '/assets/cuisine-street/pajeon.webp' },
  { code: 'gwangjang-tour',  mono: 'XXVII',  theme: 'market-c', eyebrow: 'Market',  name: 'Gwangjang Market Food Tour',              meta: '2 hrs · with foodie guide',      image: '/assets/cuisine-street/gwangjang-tour.webp' },
  { code: 'tongin-tour',     mono: 'XXVIII', theme: 'market-c', eyebrow: 'Market',  name: 'Tongin Market Doshirak Lunch Box',        meta: '90 min · build-your-own',        image: '/assets/cuisine-street/tongin-tour.webp' },
  { code: 'noryangjin',      mono: 'XXIX',   theme: 'seafood',  eyebrow: 'Market',  name: 'Noryangjin Fish Market — Sashimi Floor',  meta: '2 hrs · raw fish · evening',     image: '/assets/cuisine-street/noryangjin.webp' },
  { code: 'pojangmacha',     mono: 'XXX',    theme: 'soju',     eyebrow: 'Tent',    name: 'Pojangmacha — Midnight Tent Crawl',       meta: '3 hrs · soju + late food',       image: '/assets/cuisine-street/pojangmacha.webp' }]

},
{
  id: 'grill',
  eyebrow: 'Page Ⅲ',
  label: 'Grill',
  items: [
  { code: 'samgyeopsal',  mono: 'XXXI',    theme: 'bbq',   eyebrow: 'BBQ',      name: 'Samgyeopsal — Pork Belly Grill',          meta: 'Dinner · 90 min · communal',     image: '/assets/cuisine-grill/samgyeopsal.webp' },
  { code: 'hanwoo',       mono: 'XXXII',   theme: 'bbq',   eyebrow: 'BBQ',      name: 'Hanwoo — Premium Korean Beef Tasting',    meta: 'Dinner · 2 hrs · grade 1++',     image: '/assets/cuisine-grill/hanwoo.webp' },
  { code: 'galbi',        mono: 'XXXIII',  theme: 'bbq',   eyebrow: 'BBQ',      name: 'Galbi — Marinated Short Rib Grill',       meta: 'Dinner · 90 min · sweet-savory', image: '/assets/cuisine-grill/galbi.webp' },
  { code: 'la-galbi',     mono: 'XXXIV',   theme: 'bbq',   eyebrow: 'BBQ',      name: 'LA Galbi — Cross-cut Beef Ribs',          meta: 'Dinner · 90 min · family-style', image: '/assets/cuisine-grill/la-galbi.webp' },
  { code: 'dak-galbi',    mono: 'XXXV',    theme: 'stew',  eyebrow: 'Stir-fry', name: 'Dak-galbi — Spicy Chicken Stir-fry',      meta: 'Dinner · 60 min · spicy',        image: '/assets/cuisine-grill/dak-galbi.webp' },
  { code: 'jeyuk',        mono: 'XXXVI',   theme: 'stew',  eyebrow: 'Stir-fry', name: 'Jeyuk-bokkeum — Fiery Pork Stir-fry',     meta: 'Lunch · 45 min · very spicy',    image: '/assets/cuisine-grill/jeyuk.webp' },
  { code: 'sutbul-galbi', mono: 'XXXVII',  theme: 'bbq',   eyebrow: 'Charcoal', name: 'Sutbul-Galbi — Charcoal Grill House',     meta: 'Dinner · 2 hrs · smoky',         image: '/assets/cuisine-grill/sutbul-galbi.webp' },
  { code: 'chimaek',      mono: 'XXXVIII', theme: 'fried', eyebrow: 'Chimaek',  name: 'Chimaek — Korean Fried Chicken & Beer',   meta: 'Evening · 90 min · iconic',      image: '/assets/cuisine-grill/chimaek.webp' },
  { code: 'jokbal',       mono: 'XXXIX',   theme: 'bbq',   eyebrow: 'Braise',   name: 'Jokbal — Soy-braised Pig Trotters',       meta: 'Dinner · 90 min · late-night',   image: '/assets/cuisine-grill/jokbal.webp' },
  { code: 'gopchang',     mono: 'XL',      theme: 'bbq',   eyebrow: 'Offal',    name: 'Gopchang — Grilled Beef Intestines',      meta: 'Dinner · 90 min · adventurous',  image: '/assets/cuisine-grill/gopchang.webp' },
  { code: 'eel',          mono: 'XLI',     theme: 'bbq',   eyebrow: 'Seafood',  name: 'Jangeo-gui — Grilled Freshwater Eel',     meta: 'Dinner · 60 min · stamina food', image: '/assets/cuisine-grill/eel.webp' },
  { code: 'budae',        mono: 'XLII',    theme: 'stew',  eyebrow: 'Hot pot',  name: 'Budae-jjigae — Army Base Hot Pot',        meta: 'Dinner · 60 min · communal',     image: '/assets/cuisine-grill/budae.webp' }]

},
{
  id: 'drinks',
  eyebrow: 'Page Ⅳ',
  label: 'Drinks',
  items: [
  { code: 'tea-ceremony',     mono: 'XLIII',   theme: 'tea-h',     eyebrow: 'Tea',       name: 'Private Korean Tea Ceremony',           meta: '90 min · with master',           image: '/assets/cuisine-drinks/tea-ceremony.webp' },
  { code: 'omija',            mono: 'XLIV',    theme: 'tea-h',     eyebrow: 'Tea',       name: 'Omija — Five-Flavor Berry Tea Tasting', meta: '45 min · seasonal',              image: '/assets/cuisine-drinks/omija.webp' },
  { code: 'yujacha',          mono: 'XLV',     theme: 'tea-h',     eyebrow: 'Tea',       name: 'Yujacha — Citron Honey Tea Service',    meta: '30 min · winter staple',         image: '/assets/cuisine-drinks/yujacha.webp' },
  { code: 'daechu',           mono: 'XLVI',    theme: 'tea-h',     eyebrow: 'Tea',       name: 'Daechu — Jujube Date Tea Tasting',      meta: '30 min · restorative',           image: '/assets/cuisine-drinks/daechu.webp' },
  { code: 'temple-tea',       mono: 'XLVII',   theme: 'temple-c',  eyebrow: 'Tea',       name: 'Buddhist Temple Tea & Talk',            meta: '2 hrs · with monk',              image: '/assets/cuisine-drinks/temple-tea.webp' },
  { code: 'makgeolli-flight', mono: 'XLVIII',  theme: 'makgeolli', eyebrow: 'Makgeolli', name: 'Makgeolli Flight — Five Brewers',       meta: '90 min · with jeon pairing',     image: '/assets/cuisine-drinks/makgeolli-flight.webp' },
  { code: 'makgeolli-brew',   mono: 'XLIX',    theme: 'makgeolli', eyebrow: 'Brewery',   name: 'Makgeolli Brewery Visit',               meta: 'Half day · with brewer',         image: '/assets/cuisine-drinks/makgeolli-brew.webp' },
  { code: 'soju-distillery',  mono: 'L',       theme: 'soju',      eyebrow: 'Soju',      name: 'Soju Distillery Day Trip',              meta: 'Half day · Andong / Hwayo',      image: '/assets/cuisine-drinks/soju-distillery.webp' },
  { code: 'andong-soju',      mono: 'LI',      theme: 'soju',      eyebrow: 'Soju',      name: 'Andong Premium Soju Tasting',           meta: '60 min · single-distillery',     image: '/assets/cuisine-drinks/andong-soju.webp' },
  { code: 'craft-beer',       mono: 'LII',     theme: 'soju',      eyebrow: 'Beer',      name: 'Seoul Craft Beer Crawl',                meta: '3 hrs · Itaewon → Mapo',         image: '/assets/cuisine-drinks/craft-beer.webp' },
  { code: 'cocktail',         mono: 'LIII',    theme: 'cocktail',  eyebrow: 'Cocktail',  name: 'Korean Mixology Speakeasy',             meta: '2 hrs · Charles H · Le Chamber', image: '/assets/cuisine-drinks/cocktail.webp' },
  { code: 'coffee-seongsu',   mono: 'LIV',     theme: 'coffee',    eyebrow: 'Coffee',    name: 'Seongsu Specialty Coffee Walk',         meta: '3 hrs · 4 roasters',             image: '/assets/cuisine-drinks/coffee-seongsu.webp' },
  { code: 'coffee-anguk',     mono: 'LV',      theme: 'coffee',    eyebrow: 'Coffee',    name: 'Anguk Hanok-Café Crawl',                meta: '2 hrs · old-town vibe',          image: '/assets/cuisine-drinks/coffee-anguk.webp' },
  { code: 'dalgona',          mono: 'LVI',     theme: 'sweet',     eyebrow: 'Treat',     name: 'Bingsu & Dalgona Dessert Tasting',      meta: '60 min · sweet finale',          image: '/assets/cuisine-drinks/dalgona.webp' }]

}];


// ─── Per-dish detail content (drawer body) ────────────────────────────
// Each entry mirrors Step 3's CULTURE_DETAILS shape (hero · facts · 6
// photos · YouTube embed) plus a `dietary` block the kitchen / concierge
// can plan around: contains[] uses ALLERGENS codes, suitable[]/notSuitable[]
// use DIETS codes, spice is 0–4 matching SPICE_LEVELS, notes is a free
// adaptation line.
const CUISINE_DETAILS = {

  bibimbap: {
    hero: {
      eyebrow: 'Mixed rice bowl · Jeonju heritage',
      tagline: "Korea's most beloved one-bowl meal — seasonal namul vegetables, sesame-oil rice, beef, a sunny egg, and a spoon of gochujang stirred together at the table.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 45 minutes · single-bowl meal' },
      { label: 'Profile',    value: 'Comforting · gentle heat · umami · sesame-forward' },
      { label: 'Where',      value: 'Jeonju (origin) · hansik tables across Korea · home kitchens' },
      { label: 'Contains',   value: 'Soy · Sesame · Eggs · Beef (often) · Gochujang' },
      { label: 'Dietary',    value: 'Vegetarian and vegan on request · gluten-free with tamari · pork-free naturally' },
    ],
    photos: [
      '/assets/cuisine-hansik/bibimbap.webp',
      '/assets/cuisine-hansik/bibimbap-2.webp',
      '/assets/cuisine-hansik/bibimbap-3.webp',
      '/assets/cuisine-hansik/bibimbap-4.webp',
      '/assets/cuisine-hansik/bibimbap-5.webp',
      '/assets/cuisine-hansik/bibimbap-6.webp',
    ],
    youtubeId: 'L_sDgKqIXbY',
    videoTitle: 'How to make bibimbap & dolsot bibimbap · Korean rice bowl',
    dietary: {
      contains: ['soy', 'sesame', 'eggs'],
      suitable: ['halal', 'hindu', 'kosher'],
      notSuitable: ['vegan'],
      spice: 2,
      notes: 'Beef can be omitted for a vegetarian bowl; the egg can be dropped for a vegan version.',
    },
  },

  'sanchae-bibimbap': {
    hero: {
      eyebrow: 'Mountain greens bibimbap · Plant-forward',
      tagline: "A wild-greens cousin of bibimbap — five or six seasonal sanchae foraged from the mountains, lightly seasoned and arranged over warm rice with sesame oil.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 45 minutes · single bowl · vegan-friendly base' },
      { label: 'Profile',    value: 'Earthy · grassy · clean · sesame-forward · gently bitter' },
      { label: 'Where',      value: 'Temple stays · mountain villages · Gangwon-do · Jirisan region' },
      { label: 'Contains',   value: 'Soy · Sesame · (no animal products in the classic temple version)' },
      { label: 'Dietary',    value: 'Naturally vegetarian and vegan · gluten-free with tamari · pescatarian & halal & kosher friendly' },
    ],
    photos: [
      '/assets/cuisine-hansik/sanchae-bibimbap.webp',
      '/assets/cuisine-hansik/sanchae-bibimbap-2.webp',
      '/assets/cuisine-hansik/sanchae-bibimbap-3.webp',
      '/assets/cuisine-hansik/sanchae-bibimbap-4.webp',
      '/assets/cuisine-hansik/sanchae-bibimbap-5.webp',
      '/assets/cuisine-hansik/sanchae-bibimbap-6.webp',
    ],
    youtubeId: '30xZdtHY4_Y',
    videoTitle: "Cathlyn Choi · Sanchae Namul Bibimbap (PBS)",
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: ['jain'],
      spice: 1,
      notes: 'Often includes a small amount of allium (green onion). Strict Jain or alliums-free can be served temple-style.',
    },
  },

  samgyetang: {
    hero: {
      eyebrow: 'Ginseng chicken soup · Restorative summer dish',
      tagline: "A whole young chicken stuffed with sticky rice, ginseng, jujube, and garlic — slow-simmered into a milky-clean broth eaten on the hottest days of the year for stamina.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 60 minutes · individual cast-iron stoneware' },
      { label: 'Profile',    value: 'Clean · slightly bitter (ginseng) · deeply restorative · barely seasoned' },
      { label: 'Where',      value: 'Tosokchon (Seoul classic) · season peak: July sambok days' },
      { label: 'Contains',   value: 'Chicken · Ginseng · Glutinous rice · Jujube · Garlic · Pine nuts (sometimes)' },
      { label: 'Dietary',    value: 'Naturally gluten-free · halal on request (certified shops) · not for vegetarian / vegan' },
    ],
    photos: [
      '/assets/cuisine-hansik/samgyetang.webp',
      '/assets/cuisine-hansik/samgyetang-2.webp',
      '/assets/cuisine-hansik/samgyetang-3.webp',
      '/assets/cuisine-hansik/samgyetang-4.webp',
      '/assets/cuisine-hansik/samgyetang-5.webp',
      '/assets/cuisine-hansik/samgyetang-6.webp',
    ],
    youtubeId: 'M3SVJV-wYVY',
    videoTitle: 'Former Royal Chef shares samgyetang · Korean ginseng chicken soup',
    dietary: {
      contains: ['pinenut'],
      suitable: ['gluten-free', 'pescatarian', 'hindu'],
      notSuitable: ['vegetarian', 'vegan'],
      spice: 0,
      notes: 'The classic is unseasoned at the table — salt is added to taste. Naturally dairy-free and soy-free.',
    },
  },

  sundubu: {
    hero: {
      eyebrow: 'Soft tofu stew · Sizzling earthenware',
      tagline: "Silken just-curdled tofu in a fiery red broth, cracked egg stirred in tableside — one of Korea's most-ordered lunches, served in a bubbling stone pot.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 45 minutes · ddukbaegi stone pot · with rice and banchan' },
      { label: 'Profile',    value: 'Spicy · silky · briny umami from seafood or anchovy stock' },
      { label: 'Where',      value: 'Across Korea · seafood version at coastal cities · Gangnam BCD Tofu House' },
      { label: 'Contains',   value: 'Soft tofu · Soy · Sesame · Eggs · Shellfish or anchovy dashi · Gochugaru' },
      { label: 'Dietary',    value: 'Vegan with mushroom or kelp dashi · gluten-free with tamari · halal & kosher on request' },
    ],
    photos: [
      '/assets/cuisine-hansik/sundubu.webp',
      '/assets/cuisine-hansik/sundubu-2.webp',
      '/assets/cuisine-hansik/sundubu-3.webp',
      '/assets/cuisine-hansik/sundubu-4.webp',
      '/assets/cuisine-hansik/sundubu-5.webp',
      '/assets/cuisine-hansik/sundubu-6.webp',
    ],
    youtubeId: 'Mg9zeD01kEw',
    videoTitle: 'Maangchi · Korean spicy soft tofu stew with seafood (Haemul sundubu-jjigae)',
    dietary: {
      contains: ['soy', 'sesame', 'eggs', 'shellfish', 'fish'],
      suitable: ['pescatarian'],
      notSuitable: ['vegan', 'vegetarian'],
      spice: 3,
      notes: 'A fully vegan version is available with mushroom-kelp dashi and no egg — request when booking.',
    },
  },

  'kimchi-jjigae': {
    hero: {
      eyebrow: 'Aged kimchi stew · The taste of home',
      tagline: "The dish every Korean cook makes — months-old sour kimchi simmered with pork belly and tofu until the broth turns deep red and tangy, eaten by the spoonful over rice.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch or dinner · 45 minutes · simmered to order · with rice and banchan' },
      { label: 'Profile',    value: 'Sour · spicy · rich · the deeper the kimchi ages, the better the stew' },
      { label: 'Where',      value: 'Every Korean kitchen and most casual restaurants · best at family-run hansik houses' },
      { label: 'Contains',   value: 'Kimchi (often with anchovy/shellfish sauce) · Pork · Tofu · Soy · Sesame · Gochugaru' },
      { label: 'Dietary',    value: 'Vegan / vegetarian on request (vegan kimchi exists) · halal with vegan kimchi · gluten-free with tamari' },
    ],
    photos: [
      '/assets/cuisine-hansik/kimchi-jjigae.webp',
      '/assets/cuisine-hansik/kimchi-jjigae-2.webp',
      '/assets/cuisine-hansik/kimchi-jjigae-3.webp',
      '/assets/cuisine-hansik/kimchi-jjigae-4.webp',
      '/assets/cuisine-hansik/kimchi-jjigae-5.webp',
      '/assets/cuisine-hansik/kimchi-jjigae-6.webp',
    ],
    youtubeId: 'afE_qNmwToo',
    videoTitle: 'Maangchi · Best kimchi jjigae (kimchi stew)',
    dietary: {
      contains: ['shellfish', 'fish', 'soy', 'sesame'],
      suitable: ['hindu'],
      notSuitable: ['vegetarian', 'vegan', 'halal', 'kosher'],
      spice: 3,
      notes: 'Standard recipe contains pork and seafood-fermented kimchi. Temple-style vegan kimchi version available — please request 24 hrs ahead.',
    },
  },

  'doenjang-jjigae': {
    hero: {
      eyebrow: 'Soybean paste stew · The savoury soul of hansik',
      tagline: "The country's most-eaten home stew — fermented soybean paste simmered with anchovy broth, tofu, summer squash, and chili, eaten over a perfect bowl of rice.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch or dinner · 45 minutes · ddukbaegi stone pot · with rice and banchan' },
      { label: 'Profile',    value: 'Earthy · deeply umami · mildly spicy · the foundation of home cooking' },
      { label: 'Where',      value: 'Every home kitchen · banchan-house lunch sets · countryside markets' },
      { label: 'Contains',   value: 'Doenjang (fermented soy) · Anchovy stock · Tofu · Sesame · Gochugaru' },
      { label: 'Dietary',    value: 'Vegetarian / vegan with kelp-mushroom stock · gluten-free with tamari · pescatarian friendly' },
    ],
    photos: [
      '/assets/cuisine-hansik/doenjang-jjigae.webp',
      '/assets/cuisine-hansik/doenjang-jjigae-2.webp',
      '/assets/cuisine-hansik/doenjang-jjigae-3.webp',
      '/assets/cuisine-hansik/doenjang-jjigae-4.webp',
      '/assets/cuisine-hansik/doenjang-jjigae-5.webp',
      '/assets/cuisine-hansik/doenjang-jjigae-6.webp',
    ],
    youtubeId: '8076I6EtA30',
    videoTitle: 'Maangchi · Beef doenjang-jjigae (Korean soybean paste stew)',
    dietary: {
      contains: ['soy', 'sesame', 'fish', 'shellfish'],
      suitable: ['pescatarian', 'hindu'],
      notSuitable: ['vegan', 'vegetarian'],
      spice: 1,
      notes: 'Vegetarian / vegan version uses mushroom-kelp stock instead of anchovy and pork — request when booking.',
    },
  },

  japchae: {
    hero: {
      eyebrow: 'Sweet-potato glass noodles · Celebration dish',
      tagline: "Glassy chewy noodles tossed with seven kinds of julienned vegetable, soy-sweetened beef, and sesame oil — the dish that turns up at every Korean birthday and wedding.",
    },
    facts: [
      { label: 'Course',     value: 'Side or main · 30 minutes · served warm or room temperature' },
      { label: 'Profile',    value: 'Mildly sweet · savoury · sesame-forward · slippery-chewy glass noodles' },
      { label: 'Where',      value: 'Celebration tables · banchan plates · take-out side from any market' },
      { label: 'Contains',   value: 'Sweet-potato starch noodles · Soy · Sesame · Beef (often) · Egg garnish (sometimes)' },
      { label: 'Dietary',    value: 'Vegetarian / vegan friendly (skip beef and egg) · naturally gluten-free with tamari · halal on request' },
    ],
    photos: [
      '/assets/cuisine-hansik/japchae.webp',
      '/assets/cuisine-hansik/japchae-2.webp',
      '/assets/cuisine-hansik/japchae-3.webp',
      '/assets/cuisine-hansik/japchae-4.webp',
      '/assets/cuisine-hansik/japchae-5.webp',
      '/assets/cuisine-hansik/japchae-6.webp',
    ],
    youtubeId: 'aRepitGPnyw',
    videoTitle: 'Korean stir-fried glass noodle · Japchae (Maangchi style)',
    dietary: {
      contains: ['soy', 'sesame', 'eggs'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'hindu', 'kosher'],
      notSuitable: [],
      spice: 0,
      notes: 'Often the most-recommended dish for kids and spice-averse guests. Glass noodles are wheat-free.',
    },
  },

  naengmyeon: {
    hero: {
      eyebrow: 'Icy buckwheat noodles · Summer staple',
      tagline: "Hand-pulled chewy buckwheat noodles served in a frozen beef-broth slush — Korea's hottest-day antidote, often eaten after Korean BBQ to cleanse the palate.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 30 minutes · two styles: mul (broth) and bibim (spicy mixed)' },
      { label: 'Profile',    value: 'Mul: icy clean · subtly sweet · tangy with vinegar / Bibim: spicy · sweet-savoury · gochujang-forward' },
      { label: 'Where',      value: 'Pyongyang-style at Eulji Myeonok and Ojang-dong · summer pop-up tables citywide' },
      { label: 'Contains',   value: 'Buckwheat · Wheat (in some blends) · Beef broth · Eggs · Cucumber · Asian pear · Mustard' },
      { label: 'Dietary',    value: 'Pescatarian with seafood broth · vegan with vegetable broth (rare) · contains buckwheat allergen' },
    ],
    photos: [
      '/assets/cuisine-hansik/naengmyeon.webp',
      '/assets/cuisine-hansik/naengmyeon-2.webp',
      '/assets/cuisine-hansik/naengmyeon-3.webp',
      '/assets/cuisine-hansik/naengmyeon-4.webp',
      '/assets/cuisine-hansik/naengmyeon-5.webp',
      '/assets/cuisine-hansik/naengmyeon-6.webp',
    ],
    youtubeId: 'yMK4oyE3S3I',
    videoTitle: 'Maangchi · Korean cold noodle soup (Mul-naengmyeon)',
    dietary: {
      contains: ['buckwheat', 'wheat', 'eggs'],
      suitable: ['hindu'],
      notSuitable: ['vegan', 'vegetarian', 'gluten-free'],
      spice: 1,
      notes: 'Bibim-naengmyeon ramps to spice 3. Vegetarian/vegan version requires advance booking — most shops use beef broth.',
    },
  },

  tteokguk: {
    hero: {
      eyebrow: 'Rice cake soup · Lunar New Year ritual',
      tagline: "Oval-sliced rice cakes simmered in a clear beef-and-anchovy broth — eaten every Lunar New Year morning, symbolically adding a year to your age.",
    },
    facts: [
      { label: 'Course',     value: 'Breakfast or lunch · 30 minutes · ceremonial New Year dish' },
      { label: 'Profile',    value: 'Clean · gently savoury · soft-chewy rice cakes · gentle on the stomach' },
      { label: 'Where',      value: 'Every Korean home on Lunar New Year · year-round at hansik kitchens' },
      { label: 'Contains',   value: 'Rice cake (gluten-free starch) · Beef · Eggs · Soy · Sesame · Seaweed garnish' },
      { label: 'Dietary',    value: 'Vegetarian / vegan with mushroom broth · naturally gluten-free with tamari · halal on request' },
    ],
    photos: [
      '/assets/cuisine-hansik/tteokguk.webp',
      '/assets/cuisine-hansik/tteokguk-2.webp',
      '/assets/cuisine-hansik/tteokguk-3.webp',
      '/assets/cuisine-hansik/tteokguk-4.webp',
      '/assets/cuisine-hansik/tteokguk-5.webp',
      '/assets/cuisine-hansik/tteokguk-6.webp',
    ],
    youtubeId: 'plvT0vWBK14',
    videoTitle: 'Maangchi · Rice cake soup (Tteokguk)',
    dietary: {
      contains: ['eggs', 'soy', 'sesame'],
      suitable: ['pescatarian'],
      notSuitable: ['vegan', 'vegetarian', 'hindu'],
      spice: 0,
      notes: 'Vegetarian / vegan version available with mushroom or seaweed stock — request at booking. Hindu-friendly with chicken or seafood stock.',
    },
  },

  kimbap: {
    hero: {
      eyebrow: 'Seaweed rice roll · Picnic staple',
      tagline: "Sesame-oiled rice rolled in toasted seaweed with seven colourful fillings — Korea's bento. School lunches, train rides, and weekend hikes all run on kimbap.",
    },
    facts: [
      { label: 'Course',     value: 'Snack or light lunch · 15 minutes · sold cold at every market' },
      { label: 'Profile',    value: 'Sesame-fragrant rice · crisp seaweed · sweet-pickled radish · endless variations' },
      { label: 'Where',      value: 'Gimbap chains city-wide · Gwangjang Market (mayak kimbap) · convenience stores 24 hrs' },
      { label: 'Contains',   value: 'Rice · Seaweed · Eggs · Sesame · Soy · Wheat (often ham/imitation crab/cheese)' },
      { label: 'Dietary',    value: 'Vegan and vegetarian versions easy · halal & kosher on request · gluten-free with care' },
    ],
    photos: [
      '/assets/cuisine-hansik/kimbap.webp',
      '/assets/cuisine-hansik/kimbap-2.webp',
      '/assets/cuisine-hansik/kimbap-3.webp',
      '/assets/cuisine-hansik/kimbap-4.webp',
      '/assets/cuisine-hansik/kimbap-5.webp',
      '/assets/cuisine-hansik/kimbap-6.webp',
    ],
    youtubeId: 'Y-Y9CXGRJPU',
    videoTitle: 'Maangchi · How to make gimbap (kimbap)',
    dietary: {
      contains: ['eggs', 'sesame', 'soy', 'wheat'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: [],
      spice: 0,
      notes: 'Vegetable kimbap is naturally vegetarian. Tuna, beef bulgogi, kimchi, cheese, and shrimp versions all available.',
    },
  },

  mandu: {
    hero: {
      eyebrow: 'Hand-folded dumplings · The fold-by-hand kind',
      tagline: "Pleated dumpling skins stuffed with pork, tofu, chives, kimchi, or seafood — pan-fried, steamed, boiled, or simmered in mandu-guk soup.",
    },
    facts: [
      { label: 'Course',     value: 'Side or light meal · 30 minutes · share-plate' },
      { label: 'Profile',    value: 'Crisp-bottom or pillow-soft · meaty or vegetable · soy-vinegar dipping' },
      { label: 'Where',      value: 'Mandu houses (Bukchon Son-Mandu, Jaha Son-Mandu) · markets · everyone\'s grandmother' },
      { label: 'Contains',   value: 'Wheat wrapper · Pork (often) · Eggs · Soy · Sesame · Shellfish (some) · Tofu' },
      { label: 'Dietary',    value: 'Vegetarian and vegan mandu available · halal versions in Itaewon · contains wheat' },
    ],
    photos: [
      '/assets/cuisine-hansik/mandu.webp',
      '/assets/cuisine-hansik/mandu-2.webp',
      '/assets/cuisine-hansik/mandu-3.webp',
      '/assets/cuisine-hansik/mandu-4.webp',
      '/assets/cuisine-hansik/mandu-5.webp',
      '/assets/cuisine-hansik/mandu-6.webp',
    ],
    youtubeId: 'zECZXmDmHR0',
    videoTitle: 'Making mandu · Korean dumplings (Maangchi)',
    dietary: {
      contains: ['wheat', 'eggs', 'soy', 'sesame', 'shellfish'],
      suitable: ['pescatarian'],
      notSuitable: ['gluten-free'],
      spice: 0,
      notes: 'Kimchi mandu can be made vegetarian / vegan. Halal mandu (chicken filling) available in Itaewon.',
    },
  },

  jeon: {
    hero: {
      eyebrow: 'Savoury pancakes · Rainy-day pairing',
      tagline: "A family of crisp-edged Korean pancakes — scallion-and-seafood (haemul-pajeon), kimchi, mung bean (bindae-tteok), or whatever's in season — eaten with makgeolli on rainy days.",
    },
    facts: [
      { label: 'Course',     value: 'Side or small plate · 30 minutes · best straight off the skillet' },
      { label: 'Profile',    value: 'Crispy edges · soft chewy centre · the dipping soy-vinegar makes it' },
      { label: 'Where',      value: 'Pojangmacha (tent bars) · Gwangjang Market alley · home kitchens on rainy afternoons' },
      { label: 'Contains',   value: 'Wheat · Eggs · Soy · Sesame · Seafood (haemul) · Shellfish · Kimchi (often)' },
      { label: 'Dietary',    value: 'Vegetable (yachaejeon) is vegetarian / vegan · halal version with chicken · contains wheat' },
    ],
    photos: [
      '/assets/cuisine-hansik/jeon.webp',
      '/assets/cuisine-hansik/jeon-2.webp',
      '/assets/cuisine-hansik/jeon-3.webp',
      '/assets/cuisine-hansik/jeon-4.webp',
      '/assets/cuisine-hansik/jeon-5.webp',
      '/assets/cuisine-hansik/jeon-6.webp',
    ],
    youtubeId: 'GD1PBa9-OEU',
    videoTitle: 'Maangchi · Extra crispy haemul pajeon (seafood scallion pancake)',
    dietary: {
      contains: ['wheat', 'eggs', 'soy', 'sesame', 'shellfish', 'fish'],
      suitable: ['pescatarian'],
      notSuitable: ['gluten-free'],
      spice: 0,
      notes: 'Yachae-jeon (vegetable pancake) and kimchi-jeon variations cover vegetarian / vegan needs.',
    },
  },

  bossam: {
    hero: {
      eyebrow: 'Boiled pork-belly wraps · Communal dinner',
      tagline: "Tender slow-boiled pork belly sliced thin and wrapped at the table in pickled napa cabbage with oyster radish, fermented shrimp, garlic, and ssamjang.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 60 minutes · communal share-plate for 2–6' },
      { label: 'Profile',    value: 'Rich · clean (the boil renders most of the fat) · briny pickled cabbage · garlicky' },
      { label: 'Where',      value: 'Jokbal & Bossam district · Jangchung-dong · Yeontral Park · Manjok Ohyang' },
      { label: 'Contains',   value: 'Pork · Fermented shrimp (saeujeot) · Soy · Sesame · Garlic · Pickled cabbage' },
      { label: 'Dietary',    value: 'Not pork-free · gluten-free with tamari · hindu-friendly (no beef) · contains shellfish' },
    ],
    photos: [
      '/assets/cuisine-hansik/bossam.webp',
      '/assets/cuisine-hansik/bossam-2.webp',
      '/assets/cuisine-hansik/bossam-3.webp',
      '/assets/cuisine-hansik/bossam-4.webp',
      '/assets/cuisine-hansik/bossam-5.webp',
      '/assets/cuisine-hansik/bossam-6.webp',
    ],
    youtubeId: 't0Ta_ckc9O0',
    videoTitle: 'Pork wraps · Bo-ssam (Maangchi)',
    dietary: {
      contains: ['soy', 'sesame', 'shellfish'],
      suitable: ['gluten-free', 'hindu'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'],
      spice: 1,
      notes: 'Pork is the central ingredient — no halal or vegetarian substitution. The fermented-shrimp dip can be swapped for salt.',
    },
  },

  hanjeongsik: {
    hero: {
      eyebrow: 'Full banchan course · The 12-dish way',
      tagline: "The full Korean table — rice and soup at the centre, ringed by twelve to twenty seasonal banchan, jeon, jjim, and an honour-guest grilled course.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 2 hours · 12–20 dishes · paced and ceremonial' },
      { label: 'Profile',    value: 'A panorama of textures, temperatures, and ferments — never a single flavour louder than the next' },
      { label: 'Where',      value: 'Insadong (Hanmiri, Sanchon) · Bukchon hanok dining houses · Jeonju and Yangpyeong' },
      { label: 'Contains',   value: 'Soy · Sesame · Eggs · Fish · Shellfish · Wheat · varies by season and chef' },
      { label: 'Dietary',    value: 'Fully customisable with notice — vegetarian / vegan / halal / kosher / Jain hanjeongsik exist' },
    ],
    photos: [
      '/assets/cuisine-hansik/hanjeongsik.webp',
      '/assets/cuisine-hansik/hanjeongsik-2.webp',
      '/assets/cuisine-hansik/hanjeongsik-3.webp',
      '/assets/cuisine-hansik/hanjeongsik-4.webp',
      '/assets/cuisine-hansik/hanjeongsik-5.webp',
      '/assets/cuisine-hansik/hanjeongsik-6.webp',
    ],
    youtubeId: 'YmFl2F-aXFI',
    videoTitle: 'Korean cuisine hanjeongsik · Full course meal in Busan',
    dietary: {
      contains: ['soy', 'sesame', 'eggs', 'fish', 'shellfish', 'wheat'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: [],
      spice: 1,
      notes: 'The most accommodating Korean dining format — restaurants will pre-curate the entire course around your requirements with 48 hrs notice.',
    },
  },

  'royal-cuisine': {
    hero: {
      eyebrow: 'Joseon royal court · Surasang banquet',
      tagline: "The twelve-dish banquet the kings of Joseon ate twice a day — bronzeware tableware, pine-nut garnishes, gentle flavors, and the country's most refined hansik.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 2 hours · 12 dishes in bronzeware · ceremonial pacing' },
      { label: 'Profile',    value: 'Restrained · refined · never spicy (kings did not eat chili) · pine-nut garnish on everything' },
      { label: 'Where',      value: 'Korea House (Pildong) · Onjium (Bukchon) · Royal Cuisine Institute · Gungjung Eumsik' },
      { label: 'Contains',   value: 'Soy · Sesame · Pine nuts · Eggs · Shellfish · Fish · Beef · varies by season' },
      { label: 'Dietary',    value: 'Customisable with 2-week notice · pine-nut allergen disclosure required · halal & vegetarian versions exist' },
    ],
    photos: [
      '/assets/cuisine-hansik/royal-cuisine.webp',
      '/assets/cuisine-hansik/royal-cuisine-2.webp',
      '/assets/cuisine-hansik/royal-cuisine-3.webp',
      '/assets/cuisine-hansik/royal-cuisine-4.webp',
      '/assets/cuisine-hansik/royal-cuisine-5.webp',
      '/assets/cuisine-hansik/royal-cuisine-6.webp',
    ],
    youtubeId: 'W1DVxa5xmXk',
    videoTitle: 'South Korea · Traditional Royal Cuisine · 12 dishes in bronzeware',
    dietary: {
      contains: ['soy', 'sesame', 'pinenut', 'eggs', 'shellfish', 'fish'],
      suitable: ['pescatarian'],
      notSuitable: ['jain'],
      spice: 0,
      notes: 'Historically non-spicy by court protocol. Pine nuts are a signature garnish — flag pine-nut allergy at booking.',
    },
  },

  'sundubu-temple': {
    hero: {
      eyebrow: 'Temple cuisine · Sachal eumsik',
      tagline: "Korea's centuries-old Buddhist plant cuisine — no animal products, no five pungent vegetables (onion, garlic, leek, green onion, chive), built around fermented seasoning and seasonal mountain greens.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 90 minutes · multi-course seated meal with the temple meal-time chant' },
      { label: 'Profile',    value: 'Subtle · clean · seasoned only with fermented soy / sea salt · the antithesis of street food' },
      { label: 'Where',      value: 'Sanchon (Insadong) · Balwoo Gongyang (Jogyesa) · templestay houses across Korea' },
      { label: 'Contains',   value: 'Soy · Sesame · Mushroom · Seasonal vegetables and grains (no animal products, no alliums)' },
      { label: 'Dietary',    value: 'Naturally vegan · gluten-free with tamari · alliums-free · the most accommodating cuisine in Korea' },
    ],
    photos: [
      '/assets/cuisine-hansik/sundubu-temple.webp',
      '/assets/cuisine-hansik/sundubu-temple-2.webp',
      '/assets/cuisine-hansik/sundubu-temple-3.webp',
      '/assets/cuisine-hansik/sundubu-temple-4.webp',
      '/assets/cuisine-hansik/sundubu-temple-5.webp',
      '/assets/cuisine-hansik/sundubu-temple-6.webp',
    ],
    youtubeId: 'sf6VmS8Q2TY',
    videoTitle: 'Plant-based Buddhist temple cooking · Venerable Jeong Kwan Seunim',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'jain', 'temple', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'The most accommodating cuisine — naturally vegan, naturally alliums-free (Jain), naturally halal & kosher.',
    },
  },

  tteokbokki: {
    hero: {
      eyebrow: 'Spicy rice cakes · The icon of Korean street food',
      tagline: "Chewy cylindrical rice cakes simmered in a sticky-sweet-spicy gochujang sauce with fish cake, scallion, and a boiled egg — the country's most recognised street snack.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 15 minutes · share-plate from a market stall' },
      { label: 'Profile',    value: 'Spicy · sweet · chewy · the gochujang sauce reduces and coats the rice cakes' },
      { label: 'Where',      value: 'Sindang-dong (the home of tteokbokki) · Myeongdong · Mukyodong · every market alley' },
      { label: 'Contains',   value: 'Rice cake · Wheat (fish cake) · Soy · Eggs (often) · Fish cake · Gochujang' },
      { label: 'Dietary',    value: 'Vegan with mushroom broth and no fish cake · contains wheat in fish cake' },
    ],
    photos: [
      '/assets/cuisine-street/tteokbokki.webp',
      '/assets/cuisine-street/tteokbokki-2.webp',
      '/assets/cuisine-street/tteokbokki-3.webp',
      '/assets/cuisine-street/tteokbokki-4.webp',
      '/assets/cuisine-street/tteokbokki-5.webp',
      '/assets/cuisine-street/tteokbokki-6.webp',
    ],
    youtubeId: 'TA3Uo3a9674',
    videoTitle: 'Spicy rice cake (Tteokbokki) · Maangchi',
    dietary: {
      contains: ['wheat', 'soy', 'fish', 'eggs'],
      suitable: ['hindu', 'pescatarian'],
      notSuitable: ['gluten-free'],
      spice: 3,
      notes: 'Vegan version without fish cake / egg is available — request when ordering. Rosé version adds dairy.',
    },
  },

  hotteok: {
    hero: {
      eyebrow: 'Brown-sugar syrup pancakes · Winter staple',
      tagline: "Yeasted dough pockets stuffed with brown sugar, cinnamon, and crushed walnut, pan-fried crisp on both sides until the filling melts into hot caramel — Korea's signature winter snack.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 10 minutes · sold hot from a steel paper cup' },
      { label: 'Profile',    value: 'Crispy outside · molten sugar inside · cinnamon · walnut crunch · winter-only at street carts' },
      { label: 'Where',      value: 'Namdaemun Market · Insadong · winter pop-up carts citywide · Busan (ssiat hotteok with seeds)' },
      { label: 'Contains',   value: 'Wheat · Brown sugar · Cinnamon · Walnut (tree nut) · Sesame seeds (ssiat version)' },
      { label: 'Dietary',    value: 'Vegan-friendly (no eggs, no dairy) · contains wheat and tree nuts · halal & kosher friendly' },
    ],
    photos: [
      '/assets/cuisine-street/hotteok.webp',
      '/assets/cuisine-street/hotteok-2.webp',
      '/assets/cuisine-street/hotteok-3.webp',
      '/assets/cuisine-street/hotteok-4.webp',
      '/assets/cuisine-street/hotteok-5.webp',
      '/assets/cuisine-street/hotteok-6.webp',
    ],
    youtubeId: 'R_MPEq53QFs',
    videoTitle: 'Sweet pancakes (Hotteok) · Maangchi',
    dietary: {
      contains: ['wheat', 'treenut', 'sesame'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: ['gluten-free'],
      spice: 0,
      notes: 'Filling is sugar, cinnamon, and walnut — no animal products. Nut-free version available without the walnut.',
    },
  },

  bungeoppang: {
    hero: {
      eyebrow: 'Fish-shaped red bean cakes · Winter ritual',
      tagline: "Crisp griddled batter cakes shaped like a carp, filled with sweet red bean paste — sold three-for-a-thousand-won from corner carts the moment the first cold wind arrives.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 5 minutes · sold in paper bags of 3' },
      { label: 'Profile',    value: 'Crisp shell · soft warm centre · gentle red-bean sweetness · the smell announces winter' },
      { label: 'Where',      value: 'Every street corner October–March · Tongin Market · winter night-market pop-ups' },
      { label: 'Contains',   value: 'Wheat · Sugar · Eggs (in batter) · Red bean paste · sometimes Milk in the batter' },
      { label: 'Dietary',    value: 'Vegetarian-friendly · contains eggs and wheat · vegan version available at specialty shops' },
    ],
    photos: [
      '/assets/cuisine-street/bungeoppang.webp',
      '/assets/cuisine-street/bungeoppang-2.webp',
      '/assets/cuisine-street/bungeoppang-3.webp',
      '/assets/cuisine-street/bungeoppang-4.webp',
      '/assets/cuisine-street/bungeoppang-5.webp',
      '/assets/cuisine-street/bungeoppang-6.webp',
    ],
    youtubeId: '5J2RLC6D7n0',
    videoTitle: '[4K] Bungeoppang · Korean street food fish-shaped bread (Honeykki)',
    dietary: {
      contains: ['wheat', 'eggs', 'dairy'],
      suitable: ['vegetarian', 'pescatarian', 'hindu', 'kosher'],
      notSuitable: ['vegan', 'gluten-free'],
      spice: 0,
      notes: 'Most carts use a batter with egg and dairy. Allergy-friendly specialty shops in Hannam serve vegan versions.',
    },
  },

  odeng: {
    hero: {
      eyebrow: 'Fish cake skewers in broth · Winter warmth',
      tagline: "Long pleated fish cakes folded onto bamboo skewers, simmered all evening in a clear anchovy-radish broth that you sip free from a paper cup between bites.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 10 minutes · pay-as-you-eat by the skewer' },
      { label: 'Profile',    value: 'Light · savoury · the broth gets deeper as the night goes on · best in cold weather' },
      { label: 'Where',      value: 'Pojangmacha tents · subway exits · school zones · Busan (eomuk capital of Korea)' },
      { label: 'Contains',   value: 'Fish (eomuk) · Wheat (in fish cake binder) · Anchovy broth · Soy · Radish' },
      { label: 'Dietary',    value: 'Pescatarian-friendly · contains wheat in fish cake · not vegetarian (fish-based)' },
    ],
    photos: [
      '/assets/cuisine-street/odeng.webp',
      '/assets/cuisine-street/odeng-2.webp',
      '/assets/cuisine-street/odeng-3.webp',
      '/assets/cuisine-street/odeng-4.webp',
      '/assets/cuisine-street/odeng-5.webp',
      '/assets/cuisine-street/odeng-6.webp',
    ],
    youtubeId: '0zeboswxMeQ',
    videoTitle: 'Fish cake soup (Eomukguk) · Maangchi',
    dietary: {
      contains: ['fish', 'wheat', 'soy'],
      suitable: ['pescatarian', 'halal'],
      notSuitable: ['vegan', 'vegetarian', 'gluten-free'],
      spice: 0,
      notes: 'The broth is free at carts — many locals drink it like soup while eating the skewers.',
    },
  },

  sundae: {
    hero: {
      eyebrow: 'Korean blood sausage · The bold one',
      tagline: "Pig intestine stuffed with glass noodle, perilla seed, scallion, and pig blood — steamed, sliced, and served with liver, lung, and a smoky salt-and-pepper dip. The adventurous eater's badge of honour.",
    },
    facts: [
      { label: 'Course',     value: 'Snack or share-plate · 20 minutes · with liver and lung on the side' },
      { label: 'Profile',    value: 'Earthy · smoky · the perilla seeds and glass noodle make it gentler than it sounds' },
      { label: 'Where',      value: 'Gwangjang Market (grandmother stalls) · Sindang Sundae Town · pojangmacha at midnight' },
      { label: 'Contains',   value: 'Pork (blood, intestine, liver) · Glass noodle · Sesame · Perilla seed' },
      { label: 'Dietary',    value: 'Not pork-free · contains pork blood · hindu-friendly (no beef) but not halal or kosher' },
    ],
    photos: [
      '/assets/cuisine-street/sundae.webp',
      '/assets/cuisine-street/sundae-2.webp',
      '/assets/cuisine-street/sundae-3.webp',
      '/assets/cuisine-street/sundae-4.webp',
      '/assets/cuisine-street/sundae-5.webp',
      '/assets/cuisine-street/sundae-6.webp',
    ],
    youtubeId: 'vEoJtIMPhrY',
    videoTitle: "Gwangjang Market grandmother's blood sausage · Korean street food",
    dietary: {
      contains: ['sesame'],
      suitable: ['hindu', 'gluten-free'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'],
      spice: 1,
      notes: 'Pork is the entire dish — there is no vegetarian substitute. Brace for the heart-and-liver garnish if you want the full experience.',
    },
  },

  twigim: {
    hero: {
      eyebrow: 'Mixed Korean tempura · The deep-fried corner',
      tagline: "A glass case at every market alley with sweet potato, squid, dumpling, kimchi, and gimmari (rice-stuffed seaweed) — pulled out by tongs, drowned in tteokbokki sauce, and eaten standing.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 10 minutes · order one piece at a time' },
      { label: 'Profile',    value: 'Crisp · neutral oil · the tteokbokki sauce dip is the secret to good twigim' },
      { label: 'Where',      value: 'Myeongdong street corners · Gwangjang Market · pojangmacha kits citywide' },
      { label: 'Contains',   value: 'Wheat (batter) · Seafood (often squid, shrimp) · Eggs · Sesame' },
      { label: 'Dietary',    value: 'Vegetable twigim is vegetarian / vegan · contains wheat · pescatarian-friendly' },
    ],
    photos: [
      '/assets/cuisine-street/twigim.webp',
      '/assets/cuisine-street/twigim-2.webp',
      '/assets/cuisine-street/twigim-3.webp',
      '/assets/cuisine-street/twigim-4.webp',
      '/assets/cuisine-street/twigim-5.webp',
      '/assets/cuisine-street/twigim-6.webp',
    ],
    youtubeId: 'D5xh_Ayifas',
    videoTitle: 'Korean deep fried vegetables & gimmari · Twigim',
    dietary: {
      contains: ['wheat', 'shellfish', 'eggs', 'sesame'],
      suitable: ['vegetarian', 'pescatarian', 'hindu'],
      notSuitable: ['vegan', 'gluten-free'],
      spice: 1,
      notes: 'Vegetable-only twigim (yachae) is naturally vegetarian — vegan if the batter excludes egg.',
    },
  },

  'gyeran-bbang': {
    hero: {
      eyebrow: 'Egg bread cups · Hand-warming breakfast',
      tagline: "A whole egg baked into a small loaf of sweet, soft cornbread — sold from rectangular griddles at subway exits, perfect to wrap your fingers around on a cold winter morning.",
    },
    facts: [
      { label: 'Course',     value: 'Breakfast or snack · 5 minutes · individually portioned' },
      { label: 'Profile',    value: 'Mildly sweet bread · soft egg · the bread base gets crispy on the corners' },
      { label: 'Where',      value: 'Hongdae and Konkuk Univ. station exits · Tongin Market · early-morning carts' },
      { label: 'Contains',   value: 'Wheat · Eggs · Milk · Sugar · sometimes Cheese on top' },
      { label: 'Dietary',    value: 'Vegetarian · contains wheat, egg, dairy · not vegan, not gluten-free' },
    ],
    photos: [
      '/assets/cuisine-street/gyeran-bbang.webp',
      '/assets/cuisine-street/gyeran-bbang-2.webp',
      '/assets/cuisine-street/gyeran-bbang-3.webp',
      '/assets/cuisine-street/gyeran-bbang-4.webp',
      '/assets/cuisine-street/gyeran-bbang-5.webp',
      '/assets/cuisine-street/gyeran-bbang-6.webp',
    ],
    youtubeId: 'ejXopUU3UoI',
    videoTitle: 'Egg bread (Gyeran-ppang) · Maangchi',
    dietary: {
      contains: ['wheat', 'eggs', 'dairy'],
      suitable: ['vegetarian', 'pescatarian', 'hindu', 'kosher'],
      notSuitable: ['vegan', 'gluten-free'],
      spice: 0,
      notes: 'The "kid-friendly" cart breakfast — usually safe for picky eaters and senior travellers.',
    },
  },

  kkochi: {
    hero: {
      eyebrow: 'Grilled skewers · Hot off the charcoal',
      tagline: "Bite-sized chunks of marinated chicken, pork belly, or cheese-and-rice cake threaded onto skewers and grilled to order — the smoke alone draws a queue on any Hongdae corner.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 10 minutes · pay per skewer' },
      { label: 'Profile',    value: 'Smoky · sweet-savoury · char-grilled edges · varies by spice level' },
      { label: 'Where',      value: 'Hongdae Walking Street · Myeongdong · Konkuk Univ. station · Han River park stalls' },
      { label: 'Contains',   value: 'Chicken or pork · Soy · Sesame · Garlic · sometimes Cheese · Wheat (sauce)' },
      { label: 'Dietary',    value: 'Halal chicken kkochi available in Itaewon · gluten-free with tamari · pork-skewer versions exist' },
    ],
    photos: [
      '/assets/cuisine-street/kkochi.webp',
      '/assets/cuisine-street/kkochi-2.webp',
      '/assets/cuisine-street/kkochi-3.webp',
      '/assets/cuisine-street/kkochi-4.webp',
      '/assets/cuisine-street/kkochi-5.webp',
      '/assets/cuisine-street/kkochi-6.webp',
    ],
    youtubeId: 'iTfX7vlO3Ro',
    videoTitle: "Grilling 'Dakkochi' spicy chicken skewers · Korea street food in Hongdae",
    dietary: {
      contains: ['soy', 'sesame', 'wheat'],
      suitable: ['hindu', 'halal'],
      notSuitable: ['vegetarian', 'vegan'],
      spice: 2,
      notes: 'Spice level varies — mild and spicy options at every stall. Cheese-and-rice-cake (cheese-tteok) is the vegetarian skewer.',
    },
  },

  'tornado-potato': {
    hero: {
      eyebrow: 'Tornado spiral potato · Camera-bait street food',
      tagline: "A whole potato sliced into a continuous 50 cm spiral, skewered, deep-fried, and dusted in cheese, sweet onion, honey-butter, or chilli powder — designed to be photographed before eaten.",
    },
    facts: [
      { label: 'Course',     value: 'Snack · 10 minutes · eat-while-walking food' },
      { label: 'Profile',    value: 'Crispy potato chip · powdered seasoning · the photo first, then the bite' },
      { label: 'Where',      value: 'Myeongdong main street · Insadong · Hongdae · Han River summer pop-ups' },
      { label: 'Contains',   value: 'Potato · Cheese powder (often) · Soy · Wheat (some seasonings)' },
      { label: 'Dietary',    value: 'Vegetarian-friendly with cheese variant · vegan with plain-salt or onion seasoning' },
    ],
    photos: [
      '/assets/cuisine-street/tornado-potato.webp',
      '/assets/cuisine-street/tornado-potato-2.webp',
      '/assets/cuisine-street/tornado-potato-3.webp',
      '/assets/cuisine-street/tornado-potato-4.webp',
      '/assets/cuisine-street/tornado-potato-5.webp',
      '/assets/cuisine-street/tornado-potato-6.webp',
    ],
    youtubeId: 'nti1oAqWnUY',
    videoTitle: 'Korean street food · 50 cm fried tornado potato',
    dietary: {
      contains: ['dairy', 'soy', 'wheat'],
      suitable: ['vegetarian', 'pescatarian', 'halal', 'hindu', 'kosher'],
      notSuitable: ['vegan'],
      spice: 1,
      notes: 'Vegan with plain salt, onion, or chilli seasoning (skip cheese). Cheese powder is the default flavour.',
    },
  },

  pajeon: {
    hero: {
      eyebrow: 'Seafood scallion pancake · Rainy-day pairing',
      tagline: "A thick pancake of whole spring onions and seafood — squid, shrimp, mussel — pan-fried crisp at the edges, eaten in big triangles dipped in soy-vinegar, traditionally with cold makgeolli on a rainy afternoon.",
    },
    facts: [
      { label: 'Course',     value: 'Snack or side · 30 minutes · share-plate · best paired with makgeolli' },
      { label: 'Profile',    value: 'Crispy edges · soft chewy centre · the dipping soy-vinegar makes it · raindrops on tin roof' },
      { label: 'Where',      value: 'Pojangmacha tents · Bukchon teahouses · Busan (where pajeon is legend) · Gwangjang Market alley' },
      { label: 'Contains',   value: 'Wheat (batter) · Seafood (squid, shrimp, mussel) · Eggs · Soy · Scallion · Sesame' },
      { label: 'Dietary',    value: 'Vegetable-only version (yachae-jeon) for vegetarian · pescatarian-friendly · contains wheat' },
    ],
    photos: [
      '/assets/cuisine-street/pajeon.webp',
      '/assets/cuisine-street/pajeon-2.webp',
      '/assets/cuisine-street/pajeon-3.webp',
      '/assets/cuisine-street/pajeon-4.webp',
      '/assets/cuisine-street/pajeon-5.webp',
      '/assets/cuisine-street/pajeon-6.webp',
    ],
    youtubeId: 'bnYr77vOyM0',
    videoTitle: 'Haemul-pajeon · Green-onion pancake with seafood (Maangchi)',
    dietary: {
      contains: ['wheat', 'shellfish', 'fish', 'eggs', 'soy', 'sesame'],
      suitable: ['pescatarian'],
      notSuitable: ['vegan', 'gluten-free'],
      spice: 0,
      notes: 'Vegetable yachae-jeon or kimchi-jeon variations cover vegetarian / vegan needs at the same restaurants.',
    },
  },

  'gwangjang-tour': {
    hero: {
      eyebrow: 'Gwangjang Market food tour · The mothership of Korean street eats',
      tagline: "A guided walk through Seoul's oldest food market — pulled-by-grandmothers bindaetteok, raw beef yukhoe alley, knife-cut kalguksu lines, and mayak gimbap with mustard.",
    },
    facts: [
      { label: 'Format',     value: 'Walking food tour · 2 hours · with foodie guide · 6–8 tastings' },
      { label: 'Highlights', value: 'Mungbean bindaetteok stalls · Yukhoe (raw beef) alley · Mayak gimbap · Sundae & jeon row · Hotteok and yakgwa' },
      { label: 'Best time',  value: 'Weekday lunch (less crowd) · Evening for the drink-paired version · seasons stable year-round' },
      { label: 'Contains',   value: 'Wheat · Soy · Sesame · Eggs · Shellfish · Beef · Pork · Mung bean' },
      { label: 'Dietary',    value: 'Vegetarian, vegan, halal, kosher routes available — flag at booking and we re-curate the stops' },
    ],
    photos: [
      '/assets/cuisine-street/gwangjang-tour.webp',
      '/assets/cuisine-street/gwangjang-tour-2.webp',
      '/assets/cuisine-street/gwangjang-tour-3.webp',
      '/assets/cuisine-street/gwangjang-tour-4.webp',
      '/assets/cuisine-street/gwangjang-tour-5.webp',
      '/assets/cuisine-street/gwangjang-tour-6.webp',
    ],
    youtubeId: 'HybSjjgFUaY',
    videoTitle: "[4K] Gwangjang Market street food tour · Korea's most famous traditional food market",
    dietary: {
      contains: ['wheat', 'soy', 'sesame', 'eggs', 'shellfish'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: [],
      spice: 2,
      notes: 'Route is re-curated to your dietary requirements with 48 hrs notice — the market is large enough to find every option.',
    },
  },

  'tongin-tour': {
    hero: {
      eyebrow: 'Tongin Market doshirak · Build-your-own brass lunchbox',
      tagline: "Buy ten brass coins for 5,000 won and a school-lunch tray, then walk the market filling your boxes from stalls — kimbap, fried tofu, jeon, japchae, glazed sausage — and eat at the central dining hall.",
    },
    facts: [
      { label: 'Format',     value: 'Self-paced market walk · 90 minutes · build-your-own lunchbox' },
      { label: 'Highlights', value: 'Brass-coin currency system · 60+ participating stalls · communal dining hall · grandmother-run shops' },
      { label: 'Best time',  value: 'Weekday lunch · Closed Tuesdays and the third Sunday' },
      { label: 'Contains',   value: 'Varies by stall — common: Wheat · Soy · Sesame · Eggs · Shellfish · Beef' },
      { label: 'Dietary',    value: 'Easy for vegetarian (skip meat stalls) · halal-friendly fish/jeon stalls · vegan with careful curation' },
    ],
    photos: [
      '/assets/cuisine-street/tongin-tour.webp',
      '/assets/cuisine-street/tongin-tour-2.webp',
      '/assets/cuisine-street/tongin-tour-3.webp',
      '/assets/cuisine-street/tongin-tour-4.webp',
      '/assets/cuisine-street/tongin-tour-5.webp',
      '/assets/cuisine-street/tongin-tour-6.webp',
    ],
    youtubeId: 'EmscCT1u2wU',
    videoTitle: "Tongin Market's Dosirak Café · Budget-friendly dining experience in Seoul",
    dietary: {
      contains: ['wheat', 'soy', 'sesame', 'eggs'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: [],
      spice: 1,
      notes: 'The build-your-own format is uniquely flexible for any dietary requirement — you choose stalls individually.',
    },
  },

  noryangjin: {
    hero: {
      eyebrow: 'Noryangjin Fish Market · The sashimi floor',
      tagline: "Pick your live king crab, abalone, or flatfish on the wholesale market floor, then take it upstairs to be sliced into sashimi or steamed at your table — Seoul's most dramatic seafood dinner.",
    },
    facts: [
      { label: 'Format',     value: 'Market visit + sashimi dinner · 2 hours · evenings best' },
      { label: 'Highlights', value: 'Live king crab tanks · Sashimi alley · Sannakji (live octopus) · Maeuntang spicy fish-head stew' },
      { label: 'Best time',  value: '5–9 pm · Avoid Mondays (low stock day) · Auction at 1 am if you want the wholesale spectacle' },
      { label: 'Contains',   value: 'Shellfish · Crab · Fish · Squid · Octopus (live) · Soy · Sesame · Wasabi' },
      { label: 'Dietary',    value: 'Pescatarian-perfect · contains nearly every shellfish allergen · not for vegetarian or vegan' },
    ],
    photos: [
      '/assets/cuisine-street/noryangjin.webp',
      '/assets/cuisine-street/noryangjin-2.webp',
      '/assets/cuisine-street/noryangjin-3.webp',
      '/assets/cuisine-street/noryangjin-4.webp',
      '/assets/cuisine-street/noryangjin-5.webp',
      '/assets/cuisine-street/noryangjin-6.webp',
    ],
    youtubeId: 'nLGrBUgObYg',
    videoTitle: '[4K] Buying raw fish (sashimi) at Noryangjin Fish Market in Seoul',
    dietary: {
      contains: ['shellfish', 'crustacean', 'fish', 'soy', 'sesame'],
      suitable: ['pescatarian', 'hindu', 'gluten-free'],
      notSuitable: ['vegetarian', 'vegan'],
      spice: 1,
      notes: 'For shellfish allergies, skip Noryangjin entirely — even the air is brined. Live octopus is optional; let us know if not your thing.',
    },
  },

  pojangmacha: {
    hero: {
      eyebrow: 'Midnight tent bar crawl · Soju + late food',
      tagline: "Plastic stools, vinyl tent walls, neon green soju bottles, a portable LPG stove — Korea's classic late-night drinking street. Order anjoo (drinking food) by the round and watch the city pass by.",
    },
    facts: [
      { label: 'Format',     value: 'Guided crawl · 3 hours · 2–3 tents · plus a soju and beer pairing each' },
      { label: 'Highlights', value: 'Eulji-ro pojangmacha row · Jongno 3-ga · Sindang-dong · cheap fresh anjoo · the after-work soju ritual' },
      { label: 'Best time',  value: '9 pm – 2 am · best Tuesday–Thursday (avoiding Friday crowds)' },
      { label: 'Contains',   value: 'Soju (16% alcohol) · Beer · Wheat · Sesame · Shellfish · Soy · varies by tent menu' },
      { label: 'Dietary',    value: 'Halal not possible (alcohol-led) · gluten-free soju and vegan anjoo on request · pork-free tents available' },
    ],
    photos: [
      '/assets/cuisine-street/pojangmacha.webp',
      '/assets/cuisine-street/pojangmacha-2.webp',
      '/assets/cuisine-street/pojangmacha-3.webp',
      '/assets/cuisine-street/pojangmacha-4.webp',
      '/assets/cuisine-street/pojangmacha-5.webp',
      '/assets/cuisine-street/pojangmacha-6.webp',
    ],
    youtubeId: 'M3pvf-zVLa4',
    videoTitle: 'Pojangmacha experience · Korean covered street stall in Myeongdong',
    dietary: {
      contains: ['wheat', 'shellfish', 'soy', 'sesame'],
      suitable: ['pescatarian'],
      notSuitable: ['halal', 'kosher'],
      spice: 2,
      notes: 'Alcohol-led format — not halal or kosher. Vegetarian / vegan anjoo (pajeon, tofu, edamame) available; pork-free tents in Itaewon.',
    },
  },

  samgyeopsal: {
    hero: {
      eyebrow: 'Pork-belly grill · The communal Korean dinner',
      tagline: "Thick-cut unmarinated pork belly grilled at your table on a sloped iron plate — eaten by wrapping a slice in lettuce with garlic, kimchi, and ssamjang. Korea's most-shared meal.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 90 minutes · table grill · share-plate for 2–6' },
      { label: 'Profile',    value: 'Pork fat · garlic · sesame · the lettuce wrap balances the richness' },
      { label: 'Where',      value: 'Mapo District (the home of samgyeopsal) · Yeontral Park · every Korean BBQ house' },
      { label: 'Contains',   value: 'Pork · Soy · Sesame · Garlic · ssamjang (fermented soy + chili)' },
      { label: 'Dietary',    value: 'Pork-led · gluten-free with tamari · hindu-friendly (no beef) · not halal or kosher' },
    ],
    photos: [
      '/assets/cuisine-grill/samgyeopsal.webp',
      '/assets/cuisine-grill/samgyeopsal-2.webp',
      '/assets/cuisine-grill/samgyeopsal-3.webp',
      '/assets/cuisine-grill/samgyeopsal-4.webp',
      '/assets/cuisine-grill/samgyeopsal-5.webp',
      '/assets/cuisine-grill/samgyeopsal-6.webp',
    ],
    youtubeId: '23tRGHUX3qM',
    videoTitle: 'Grilled pork belly (Samgyeopsal-gui) · Maangchi',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'hindu'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'],
      spice: 0,
      notes: 'Pork-only dish. Chicken or beef samgyeopsal-style substitutions available for halal at specialty restaurants in Itaewon.',
    },
  },

  hanwoo: {
    hero: {
      eyebrow: 'Hanwoo · Korea\'s native cattle, marbled to a fault',
      tagline: "1++ grade Korean beef — the only breed indigenous to the peninsula, raised on a hand-blended grain feed for 30 months, marbled to rival wagyu, priced one tier below it.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 2 hours · multi-cut tasting (chuck flap, ribeye, brisket, tenderloin)' },
      { label: 'Profile',    value: 'Buttery · richly umami · the marbling renders cleanly · best lightly seasoned with salt and sesame oil' },
      { label: 'Where',      value: 'Born and Bred · Wooga · Mapo Galbi · Majang-dong meat district · Michelin Bib Gourmand list' },
      { label: 'Contains',   value: 'Beef · Soy · Sesame · Garlic · Salt-and-sesame-oil dip' },
      { label: 'Dietary',    value: 'Beef-led · gluten-free with tamari · halal hanwoo restaurants exist in Itaewon (KMF-certified)' },
    ],
    photos: [
      '/assets/cuisine-grill/hanwoo.webp',
      '/assets/cuisine-grill/hanwoo-2.webp',
      '/assets/cuisine-grill/hanwoo-3.webp',
      '/assets/cuisine-grill/hanwoo-4.webp',
      '/assets/cuisine-grill/hanwoo-5.webp',
      '/assets/cuisine-grill/hanwoo-6.webp',
    ],
    youtubeId: 'VIhhiSAaHNE',
    videoTitle: 'Seoul food tour · Premium hanwoo beef at a traditional hanok restaurant (Nabokjip)',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'pescatarian'],
      notSuitable: ['vegetarian', 'vegan', 'hindu'],
      spice: 0,
      notes: 'Beef-led — not for hindu guests. Premium 1++ grade pricing: expect $80–250 per person depending on cut and restaurant.',
    },
  },

  galbi: {
    hero: {
      eyebrow: 'Galbi · Marinated short rib grill',
      tagline: "Bone-in beef short rib butterflied open and bathed in a soy-pear-sugar marinade for a day, then grilled over open flame — the sweet-savoury, family-friendly cousin of samgyeopsal.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 90 minutes · table grill · share-plate for 2–6' },
      { label: 'Profile',    value: 'Sweet · savoury · the Asian pear in the marinade tenderises and caramelises beautifully' },
      { label: 'Where',      value: 'Suwon (the city of galbi) · Banchan-style at any kalbi-jip · grandmother tables citywide' },
      { label: 'Contains',   value: 'Beef · Soy · Asian pear · Garlic · Sesame · Sugar · Mirin' },
      { label: 'Dietary',    value: 'Beef-led · gluten-free with tamari · halal galbi exists at certified Itaewon shops' },
    ],
    photos: [
      '/assets/cuisine-grill/galbi.webp',
      '/assets/cuisine-grill/galbi-2.webp',
      '/assets/cuisine-grill/galbi-3.webp',
      '/assets/cuisine-grill/galbi-4.webp',
      '/assets/cuisine-grill/galbi-5.webp',
      '/assets/cuisine-grill/galbi-6.webp',
    ],
    youtubeId: 'oK6AzUyd8EE',
    videoTitle: 'Korean Traditional Galbi BBQ · Grilled beef short ribs',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'pescatarian'],
      notSuitable: ['vegetarian', 'vegan', 'hindu'],
      spice: 0,
      notes: 'Sweet-savoury marinade is the most kid-friendly Korean BBQ — popular pick for families. Beef = not for hindu guests.',
    },
  },

  'la-galbi': {
    hero: {
      eyebrow: 'LA Galbi · Cross-cut beef rib (Korean-American invention)',
      tagline: "Beef short rib cross-cut into thin strips (the LA-Korean butcher invention), marinated in soy-pear-sugar, and grilled fast over open flame — the easiest Korean BBQ to cook at home, the most family-friendly to order out.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 90 minutes · table grill · easy share-plate · family-style' },
      { label: 'Profile',    value: 'Same marinade as galbi · thinner cut grills in seconds · sweet sticky edges' },
      { label: 'Where',      value: 'Most Korean BBQ houses · easier at home than traditional galbi · originated in 1970s LA Koreatown' },
      { label: 'Contains',   value: 'Beef · Soy · Asian pear · Garlic · Sesame · Sugar' },
      { label: 'Dietary',    value: 'Beef-led · gluten-free with tamari · halal-friendly at Itaewon shops' },
    ],
    photos: [
      '/assets/cuisine-grill/la-galbi.webp',
      '/assets/cuisine-grill/la-galbi-2.webp',
      '/assets/cuisine-grill/la-galbi-3.webp',
      '/assets/cuisine-grill/la-galbi-4.webp',
      '/assets/cuisine-grill/la-galbi-5.webp',
      '/assets/cuisine-grill/la-galbi-6.webp',
    ],
    youtubeId: 'JAF3Bpy-AsY',
    videoTitle: "Korean beef barbecue · 'LA Galbi' (Maangchi)",
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'pescatarian'],
      notSuitable: ['vegetarian', 'vegan', 'hindu'],
      spice: 0,
      notes: 'The most beginner-friendly Korean BBQ — thinner cut means faster cooking and gentler texture. Kid-approved.',
    },
  },

  'dak-galbi': {
    hero: {
      eyebrow: 'Dak-galbi · Chuncheon spicy chicken stir-fry',
      tagline: "Boneless chicken thigh stir-fried with cabbage, sweet potato, rice cake, and a fierce gochujang marinade — finished tableside with melted mozzarella in the trendy 'cheese dakgalbi' version.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 60 minutes · table-cooked share-plate · cheese-finish optional' },
      { label: 'Profile',    value: 'Spicy · sweet · the cabbage steams in the gochujang sauce · mozzarella cuts the heat' },
      { label: 'Where',      value: 'Chuncheon (the home of dak-galbi) · Sinchon (Seoul student-district stalls) · Hongdae cheese-dakgalbi chains' },
      { label: 'Contains',   value: 'Chicken · Gochujang · Soy · Sesame · Cabbage · Rice cake · Mozzarella (optional)' },
      { label: 'Dietary',    value: 'Hindu-friendly · gluten-free with tamari · halal chicken dak-galbi at Itaewon shops · not for vegetarian' },
    ],
    photos: [
      '/assets/cuisine-grill/dak-galbi.webp',
      '/assets/cuisine-grill/dak-galbi-2.webp',
      '/assets/cuisine-grill/dak-galbi-3.webp',
      '/assets/cuisine-grill/dak-galbi-4.webp',
      '/assets/cuisine-grill/dak-galbi-5.webp',
      '/assets/cuisine-grill/dak-galbi-6.webp',
    ],
    youtubeId: '31QrCCC4gNI',
    videoTitle: 'Famous Chuncheon Dakgalbi · Korean spicy chicken stir-fry',
    dietary: {
      contains: ['soy', 'sesame', 'dairy'],
      suitable: ['hindu', 'halal'],
      notSuitable: ['vegetarian', 'vegan'],
      spice: 3,
      notes: 'Spice level adjustable. Cheese topping (mozzarella) is optional — skip for dairy-free.',
    },
  },

  jeyuk: {
    hero: {
      eyebrow: 'Jeyuk-bokkeum · The lunch every Korean office orders',
      tagline: "Thinly sliced pork shoulder stir-fried in a fiery gochujang-soy-garlic sauce until the edges caramelise — Korea's most-ordered office lunchbox, eaten over a mound of white rice with lettuce on the side.",
    },
    facts: [
      { label: 'Course',     value: 'Lunch · 45 minutes · over rice (deopbap) or with rice and banchan' },
      { label: 'Profile',    value: 'Very spicy · sweet · garlicky · the lettuce wrap is mandatory · iconic office food' },
      { label: 'Where',      value: 'Office-district lunch counters · every kimbap-and-jjigae shop · home kitchens' },
      { label: 'Contains',   value: 'Pork · Gochujang · Soy · Sesame · Garlic · Onion · Sugar' },
      { label: 'Dietary',    value: 'Pork-led · gluten-free with tamari · hindu-friendly · not halal or kosher · chicken substitution exists' },
    ],
    photos: [
      '/assets/cuisine-grill/jeyuk.webp',
      '/assets/cuisine-grill/jeyuk-2.webp',
      '/assets/cuisine-grill/jeyuk-3.webp',
      '/assets/cuisine-grill/jeyuk-4.webp',
      '/assets/cuisine-grill/jeyuk-5.webp',
      '/assets/cuisine-grill/jeyuk-6.webp',
    ],
    youtubeId: '3oFCGKmzQX8',
    videoTitle: 'Spicy Korean stir-fried pork (Dwaejigogi-bokkeum) · Maangchi',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'hindu'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'],
      spice: 4,
      notes: 'Spice level adjustable, but defaults to very hot. Chicken jeyuk (dak-bokkeum) is an easy halal-friendly swap.',
    },
  },

  'sutbul-galbi': {
    hero: {
      eyebrow: 'Sutbul-galbi · Charcoal grill, the old way',
      tagline: "Traditional charcoal-fired galbi houses where the meat is cooked over real Korean lump charcoal — slower, smokier, more aromatic than gas-grill BBQ. The way Korean BBQ was meant to taste.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 2 hours · communal · the smell follows you home' },
      { label: 'Profile',    value: 'Charcoal smoke · slower sear · more crust on the meat · the difference is unmistakable' },
      { label: 'Where',      value: 'Mapo Galbi · Saemaeul Sikdang charcoal branches · old Majang-dong meat district restaurants' },
      { label: 'Contains',   value: 'Beef · Soy · Sesame · Charcoal aroma · sometimes Pork (samgyeopsal sutbul version)' },
      { label: 'Dietary',    value: 'Beef or pork-led · gluten-free with tamari · halal sutbul at Itaewon · ventilated booth available' },
    ],
    photos: [
      '/assets/cuisine-grill/sutbul-galbi.webp',
      '/assets/cuisine-grill/sutbul-galbi-2.webp',
      '/assets/cuisine-grill/sutbul-galbi-3.webp',
      '/assets/cuisine-grill/sutbul-galbi-4.webp',
      '/assets/cuisine-grill/sutbul-galbi-5.webp',
      '/assets/cuisine-grill/sutbul-galbi-6.webp',
    ],
    youtubeId: 'qFuezxiWxSY',
    videoTitle: 'Galbi · Korean Barbecue marinated short ribs in Seoul',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'hindu'],
      spice: 0,
      notes: 'Smoky aroma will linger on clothes — ventilated booth restaurants available for guests sensitive to smoke.',
    },
  },

  chimaek: {
    hero: {
      eyebrow: "Chimaek · Korean fried chicken & beer",
      tagline: "Twice-fried Korean chicken — soy-garlic, spicy gochujang, honey-butter, snow-cheese — paired with ice-cold lager. The combo so beloved it has its own portmanteau: chi(cken) + maek(ju, beer).",
    },
    facts: [
      { label: 'Course',     value: 'Evening · 90 minutes · share-plate · best after 7 pm' },
      { label: 'Profile',    value: 'Crispy double-fried skin · light batter · the soy-garlic and yangnyeom (spicy) are the iconic two flavours' },
      { label: 'Where',      value: 'BBQ Chicken · Kyochon · Bonchon · Pelicana · 24-hr delivery citywide' },
      { label: 'Contains',   value: 'Chicken · Wheat (batter) · Soy · Garlic · Beer · Gochujang (spicy version)' },
      { label: 'Dietary',    value: 'Hindu-friendly · halal options exist (Bonchon, Suprabang) · contains wheat · not for vegan' },
    ],
    photos: [
      '/assets/cuisine-grill/chimaek.webp',
      '/assets/cuisine-grill/chimaek-2.webp',
      '/assets/cuisine-grill/chimaek-3.webp',
      '/assets/cuisine-grill/chimaek-4.webp',
      '/assets/cuisine-grill/chimaek-5.webp',
      '/assets/cuisine-grill/chimaek-6.webp',
    ],
    youtubeId: 'JD5bueB6rG4',
    videoTitle: 'Crispiest ever · Chimaek (Korean fried chicken and beer) · Chef Jia Choi',
    dietary: {
      contains: ['wheat', 'soy'],
      suitable: ['hindu', 'pescatarian'],
      notSuitable: ['vegetarian', 'vegan', 'gluten-free'],
      spice: 2,
      notes: 'Yangnyeom (spicy red sauce) version is hotter. Halal chimaek chains in Itaewon serve no alcohol option as well.',
    },
  },

  jokbal: {
    hero: {
      eyebrow: 'Jokbal · Soy-braised pig trotters',
      tagline: "Pig hocks slow-simmered for hours in a soy-ginger-clove broth until the collagen renders and the skin glistens — sliced thin and eaten with garlic, oyster radish, and napa-cabbage wraps at midnight.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 90 minutes · communal share-plate · late-night delivery favourite' },
      { label: 'Profile',    value: 'Gelatinous · soy-savoury · faint cinnamon-clove warmth · the dipping ssamjang completes it' },
      { label: 'Where',      value: 'Jangchung-dong (Korea\'s jokbal district) · Manjok Ohyang · 24-hr delivery citywide' },
      { label: 'Contains',   value: 'Pork · Soy · Sesame · Garlic · Cloves · Cinnamon · Ginger' },
      { label: 'Dietary',    value: 'Pork-led · gluten-free with tamari · hindu-friendly · not halal or kosher' },
    ],
    photos: [
      '/assets/cuisine-grill/jokbal.webp',
      '/assets/cuisine-grill/jokbal-2.webp',
      '/assets/cuisine-grill/jokbal-3.webp',
      '/assets/cuisine-grill/jokbal-4.webp',
      '/assets/cuisine-grill/jokbal-5.webp',
      '/assets/cuisine-grill/jokbal-6.webp',
    ],
    youtubeId: 'rRQIRcQqb4k',
    videoTitle: "Korean braised pig's trotters (Jokbal: 족발)",
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free', 'hindu'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'],
      spice: 0,
      notes: 'Pork-only. Often ordered together with bossam for a "double pork wrap" feast.',
    },
  },

  gopchang: {
    hero: {
      eyebrow: 'Gopchang · Grilled beef intestines, the connoisseur cut',
      tagline: "Beef small intestine cleaned and grilled chewy on the outside, springy on the inside — the late-night ajeossi soju pairing that connoisseurs put above samgyeopsal. An acquired-taste badge of honour.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 90 minutes · table grill · share-plate of 2–4 · pairs with soju' },
      { label: 'Profile',    value: 'Bouncy · slightly creamy · the inside fat melts on the grill · earthy, never gamey when fresh' },
      { label: 'Where',      value: 'Wangbi Salt-Gopchang · Sajik Gopchang Hongdae · Hapjeong-dong gopchang street · Daegu gopchang houses' },
      { label: 'Contains',   value: 'Beef intestine · Soy · Sesame · Salt · Sesame-oil dip · Sometimes Tripe (daechang)' },
      { label: 'Dietary',    value: 'Beef-led offal · gluten-free with tamari · not for vegetarian / vegan / halal / kosher / hindu' },
    ],
    photos: [
      '/assets/cuisine-grill/gopchang.webp',
      '/assets/cuisine-grill/gopchang-2.webp',
      '/assets/cuisine-grill/gopchang-3.webp',
      '/assets/cuisine-grill/gopchang-4.webp',
      '/assets/cuisine-grill/gopchang-5.webp',
      '/assets/cuisine-grill/gopchang-6.webp',
    ],
    youtubeId: 'EjI5askNjxc',
    videoTitle: 'Korean Gopchang (곱창) · Grilled intestines (GoBilly Korean)',
    dietary: {
      contains: ['soy', 'sesame'],
      suitable: ['gluten-free'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu'],
      spice: 1,
      notes: 'Adventurous-eater food. If gopchang is not for you, the same restaurants usually grill beef and pork cuts too.',
    },
  },

  eel: {
    hero: {
      eyebrow: 'Jangeo-gui · Grilled freshwater eel, stamina food',
      tagline: "Whole freshwater eel butterflied and grilled over charcoal, brushed with a sweet-savoury soy glaze — eaten on sambok summer days alongside samgyetang for stamina and longevity.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 60 minutes · grilled tableside with side dishes · ssam-wrap finish' },
      { label: 'Profile',    value: 'Sweet-soy glaze · soft fatty flesh · the smoky char on the skin · summer stamina food' },
      { label: 'Where',      value: 'Pungcheon (Jeonbuk eel-river specialty) · Han River jangeo streets · sambok-day pop-ups' },
      { label: 'Contains',   value: 'Freshwater eel (fish) · Soy · Sesame · Sugar · Ginger · Garlic' },
      { label: 'Dietary',    value: 'Pescatarian-perfect · gluten-free with tamari · halal & kosher friendly (no shellfish, no pork)' },
    ],
    photos: [
      '/assets/cuisine-grill/eel.webp',
      '/assets/cuisine-grill/eel-2.webp',
      '/assets/cuisine-grill/eel-3.webp',
      '/assets/cuisine-grill/eel-4.webp',
      '/assets/cuisine-grill/eel-5.webp',
      '/assets/cuisine-grill/eel-6.webp',
    ],
    youtubeId: 'KHL5JDi33V0',
    videoTitle: 'Best Restaurant in Korea · Grilled Eel',
    dietary: {
      contains: ['fish', 'soy', 'sesame'],
      suitable: ['pescatarian', 'halal', 'kosher', 'hindu', 'gluten-free'],
      notSuitable: ['vegetarian', 'vegan'],
      spice: 0,
      notes: 'Considered a luxury health food — eaten in summer for stamina, in autumn for richness. Expect $40–80 per person.',
    },
  },

  budae: {
    hero: {
      eyebrow: "Budae-jjigae · Korea's post-war fusion stew",
      tagline: "Born from Korean War US-army surplus — spam, hot-dog sausage, ramen, baked beans, and American cheese simmered in a fiery kimchi-gochujang broth. Korea's defining 'fusion before fusion' dish.",
    },
    facts: [
      { label: 'Course',     value: 'Dinner · 60 minutes · table simmer · ramen noodles added at the end' },
      { label: 'Profile',    value: 'Spicy · salty (from the cured meats) · the broth gets deeper as you eat · ramen is the finale' },
      { label: 'Where',      value: 'Uijeongbu (the home of budae-jjigae — old US Army base) · Budae-jjigae streets in Songtan and Pyeongtaek' },
      { label: 'Contains',   value: 'Spam · Sausage · Wheat (ramen) · Soy · Eggs · Kimchi · Dairy (cheese) · Pork' },
      { label: 'Dietary',    value: 'Pork-led with cured meats · contains wheat · not for vegetarian, halal, kosher · pescatarian unlikely' },
    ],
    photos: [
      '/assets/cuisine-grill/budae.webp',
      '/assets/cuisine-grill/budae-2.webp',
      '/assets/cuisine-grill/budae-3.webp',
      '/assets/cuisine-grill/budae-4.webp',
      '/assets/cuisine-grill/budae-5.webp',
      '/assets/cuisine-grill/budae-6.webp',
    ],
    youtubeId: 'euVyBKNfxkk',
    videoTitle: 'Army base stew (Budae-jjigae) · Maangchi',
    dietary: {
      contains: ['wheat', 'soy', 'eggs', 'dairy', 'fish'],
      suitable: ['hindu'],
      notSuitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'gluten-free'],
      spice: 3,
      notes: 'Cultural-historical dish — born from post-war scarcity. Vegan-style budae-jjigae with mushroom and plant-based "spam" exists at newer cafes.',
    },
  },

  'tea-ceremony': {
    hero: {
      eyebrow: 'Darye · Korean tea ceremony, the day-tea rite',
      tagline: "A private session of darye — Korea's thousand-year tea practice — with a tea master who pours green, semi-fermented, and aged teas in measured stages while explaining the etiquette of each cup.",
    },
    facts: [
      { label: 'Course',     value: 'Cultural tasting · 90 minutes · private session for 2–6' },
      { label: 'Profile',    value: 'Meditative · understated · the etiquette is the experience · gentle bitterness of Hadong sejak' },
      { label: 'Where',      value: 'O\'sulloc tea house · Insadong tea rooms · Hanok-dining tea suites · temple stays' },
      { label: 'Contains',   value: 'Tea (camellia sinensis) · Spring water · sometimes Honey · Pine-nut garnish (some sweets)' },
      { label: 'Dietary',    value: 'Naturally vegan and gluten-free · caffeine present · halal & kosher friendly · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/tea-ceremony.webp',
      '/assets/cuisine-drinks/tea-ceremony-2.webp',
      '/assets/cuisine-drinks/tea-ceremony-3.webp',
      '/assets/cuisine-drinks/tea-ceremony-4.webp',
      '/assets/cuisine-drinks/tea-ceremony-5.webp',
      '/assets/cuisine-drinks/tea-ceremony-6.webp',
    ],
    youtubeId: '0ro7FRqyq00',
    videoTitle: 'Korean Tea Ceremony · Tea Master Youngmi Yi & Prof. Jaesup Pak',
    dietary: {
      contains: [],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'jain', 'temple', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'The most universally accommodating cultural tasting on the trip. Caffeine-free options (boricha, omija) available on request.',
    },
  },

  omija: {
    hero: {
      eyebrow: 'Omija-cha · The five-flavour berry',
      tagline: "A vivid crimson tea steeped cold from Schisandra berries — sweet, sour, bitter, salty, and pungent all at once. Korean tradition holds the five flavours represent the five elements of life.",
    },
    facts: [
      { label: 'Course',     value: 'Cold or warm tea tasting · 45 minutes · seasonal (autumn harvest)' },
      { label: 'Profile',    value: 'Five flavours in one sip · vivid red colour · refreshing chilled · gently herbal warm' },
      { label: 'Where',      value: 'Mungyeong (Korea\'s omija belt) · Hanok tea rooms · Bukchon traditional teahouses' },
      { label: 'Contains',   value: 'Schisandra berries · Honey or sugar (optional) · Spring water · sometimes Asian pear slices' },
      { label: 'Dietary',    value: 'Naturally vegan and gluten-free · caffeine-free · halal & kosher friendly · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/omija.webp',
      '/assets/cuisine-drinks/omija-2.webp',
      '/assets/cuisine-drinks/omija-3.webp',
      '/assets/cuisine-drinks/omija-4.webp',
      '/assets/cuisine-drinks/omija-5.webp',
      '/assets/cuisine-drinks/omija-6.webp',
    ],
    youtubeId: 'Xsn7TUZv7bE',
    videoTitle: 'How to make Omija tea · A traditional Korean drink',
    dietary: {
      contains: [],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'jain', 'temple', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'Caffeine-free — safe for any time of day. Honey-sweetened versions are vegetarian (not vegan); request sugar or unsweetened for vegan.',
    },
  },

  yujacha: {
    hero: {
      eyebrow: 'Yujacha · Honey-citron tea, the winter cure',
      tagline: "Sliced yuja (Korean citron) preserved in honey for months, spooned into hot water — the warming aromatic winter tea your Korean grandmother makes you when you have a cold.",
    },
    facts: [
      { label: 'Course',     value: 'Warm tea · 30 minutes · winter staple · served from a glass mug' },
      { label: 'Profile',    value: 'Aromatic citrus rind · honey-sweet · mildly tart · the rind chewed at the end' },
      { label: 'Where',      value: 'Goheung (yuja growing region) · every Korean café in winter · convenience stores nationwide' },
      { label: 'Contains',   value: 'Yuja citrus · Honey · sometimes Ginger · sometimes Pine nuts as garnish' },
      { label: 'Dietary',    value: 'Vegetarian (honey-based) · vegan with sugar-preserved version · gluten-free · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/yujacha.webp',
      '/assets/cuisine-drinks/yujacha-2.webp',
      '/assets/cuisine-drinks/yujacha-3.webp',
      '/assets/cuisine-drinks/yujacha-4.webp',
      '/assets/cuisine-drinks/yujacha-5.webp',
      '/assets/cuisine-drinks/yujacha-6.webp',
    ],
    youtubeId: 'DOV-gx8Wjmc',
    videoTitle: 'Easy yuja-cha recipe · Korean honey citron tea',
    dietary: {
      contains: ['pinenut'],
      suitable: ['vegetarian', 'pescatarian', 'halal', 'kosher', 'hindu', 'temple', 'gluten-free'],
      notSuitable: ['vegan'],
      spice: 0,
      notes: 'Honey makes the traditional version non-vegan. Sugar-preserved yuja jam (yuja-cheong) is the vegan substitute and equally common.',
    },
  },

  daechu: {
    hero: {
      eyebrow: 'Daechu-cha · Jujube date tea, the restorative',
      tagline: "Dried Korean jujubes (daechu) simmered slowly with ginger into a deep amber broth — Korea's most-trusted tonic tea, drunk hot in winter and cool in summer for stamina and skin.",
    },
    facts: [
      { label: 'Course',     value: 'Warm tea · 30 minutes · restorative · alternative to coffee' },
      { label: 'Profile',    value: 'Naturally sweet · gently woody · the ginger adds warmth · soothing on the throat' },
      { label: 'Where',      value: 'Boeun (jujube belt of Korea) · Hanok teahouses · seasonal market stalls' },
      { label: 'Contains',   value: 'Jujube dates · Ginger · Honey (optional) · sometimes Pine nuts · sometimes Ginseng' },
      { label: 'Dietary',    value: 'Naturally vegan / vegetarian · caffeine-free · gluten-free · halal & kosher friendly · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/daechu.webp',
      '/assets/cuisine-drinks/daechu-2.webp',
      '/assets/cuisine-drinks/daechu-3.webp',
      '/assets/cuisine-drinks/daechu-4.webp',
      '/assets/cuisine-drinks/daechu-5.webp',
      '/assets/cuisine-drinks/daechu-6.webp',
    ],
    youtubeId: 'MM69wZ5dtdU',
    videoTitle: 'Korean Jujube Tea (Daechucha)',
    dietary: {
      contains: ['pinenut'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'temple', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'Pine-nut garnish optional — flag the allergy. Caffeine-free; perfect alternative for senior travellers and pregnant guests.',
    },
  },

  'temple-tea': {
    hero: {
      eyebrow: 'Buddhist temple tea · Two hours with a monk',
      tagline: "A sit-down tea session at a working Buddhist temple — the monk pours green tea, lotus tea, and persimmon-leaf tea over an unhurried two hours of conversation about Korean Buddhism and daily monastic life.",
    },
    facts: [
      { label: 'Course',     value: 'Cultural tea sit-down · 2 hours · with monk · small group of 2–8' },
      { label: 'Profile',    value: 'Meditative · unhurried · the conversation is half the experience · subtly different teas in sequence' },
      { label: 'Where',      value: 'Jogyesa Temple (central Seoul) · Bongeunsa (Gangnam) · select templestay houses' },
      { label: 'Contains',   value: 'Green tea (sejak / jungjak) · Lotus-leaf tea · Persimmon-leaf tea · Temple-baked rice-flour sweets (no eggs or dairy)' },
      { label: 'Dietary',    value: 'Naturally vegan · alliums-free (Buddhist precept) · gluten-free with brown-rice options · halal & kosher friendly' },
    ],
    photos: [
      '/assets/cuisine-drinks/temple-tea.webp',
      '/assets/cuisine-drinks/temple-tea-2.webp',
      '/assets/cuisine-drinks/temple-tea-3.webp',
      '/assets/cuisine-drinks/temple-tea-4.webp',
      '/assets/cuisine-drinks/temple-tea-5.webp',
      '/assets/cuisine-drinks/temple-tea-6.webp',
    ],
    youtubeId: 'uLR-5GsElxs',
    videoTitle: '[K-UNESCO Adventures] Tea Talk with a Buddhist Monk · Live highlight',
    dietary: {
      contains: [],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'jain', 'temple', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'The most accommodating cultural experience — temple cuisine is naturally Jain-compatible (no alliums).',
    },
  },

  'makgeolli-flight': {
    hero: {
      eyebrow: 'Makgeolli flight · Five brewers, five rice wines',
      tagline: "A guided tasting flight of Korean rice wine from five small-batch brewers — chalky-white to bottle-fermented, dry to sweet — with seasonal jeon pancakes that traditionally pair with the brew.",
    },
    facts: [
      { label: 'Course',     value: 'Tasting flight · 90 minutes · 5 makgeolli pours + jeon pairings · with a sool host' },
      { label: 'Profile',    value: 'Cloudy white · 6–8% ABV · slightly fizzy · ranges from yogurt-tart to honey-sweet · rice-forward' },
      { label: 'Where',      value: 'Boksoondoga · The Sool Company · Sool Gallery (Bukchon) · Yangpyeong brewery cafés' },
      { label: 'Contains',   value: 'Rice · Wheat (nuruk starter) · Alcohol (6–8%) · sometimes Sweet rice · sometimes Fruit infusion' },
      { label: 'Dietary',    value: 'Vegan · contains wheat in nuruk · gluten-free makgeolli exists but rare · alcohol — not halal' },
    ],
    photos: [
      '/assets/cuisine-drinks/makgeolli-flight.webp',
      '/assets/cuisine-drinks/makgeolli-flight-2.webp',
      '/assets/cuisine-drinks/makgeolli-flight-3.webp',
      '/assets/cuisine-drinks/makgeolli-flight-4.webp',
      '/assets/cuisine-drinks/makgeolli-flight-5.webp',
      '/assets/cuisine-drinks/makgeolli-flight-6.webp',
    ],
    youtubeId: 'MRbhiFQl9bY',
    videoTitle: 'Understanding Korean rice wine · Alice Jun of Hana Makgeolli · Sool School',
    dietary: {
      contains: ['wheat'],
      suitable: ['vegetarian', 'vegan', 'pescatarian'],
      notSuitable: ['halal', 'gluten-free'],
      spice: 0,
      notes: 'Contains alcohol (~6–8% ABV) — not halal. Wheat-free makgeolli exists from select small brewers; flag at booking.',
    },
  },

  'makgeolli-brew': {
    hero: {
      eyebrow: 'Makgeolli brewery visit · Half a day with the brewer',
      tagline: "A half-day field trip to a working makgeolli brewery — meet the brewer, walk the fermentation room, smell the nuruk, and taste the wine straight from the vat. Yangpyeong or Seongsu, depending on season.",
    },
    facts: [
      { label: 'Format',     value: 'Half-day visit · brewery walkthrough + tasting · with the head brewer · small group' },
      { label: 'Highlights', value: 'Nuruk fermentation room · vat-to-glass tastings · seasonal seasonal limited releases · brewer Q&A · take-home bottle' },
      { label: 'Best time',  value: 'Year-round · spring & autumn for newly-released seasonal makgeolli' },
      { label: 'Contains',   value: 'Rice · Wheat (nuruk) · Alcohol · sometimes Fruit infusions' },
      { label: 'Dietary',    value: 'Vegan · contains wheat · alcohol — not halal · designated driver provided' },
    ],
    photos: [
      '/assets/cuisine-drinks/makgeolli-brew.webp',
      '/assets/cuisine-drinks/makgeolli-brew-2.webp',
      '/assets/cuisine-drinks/makgeolli-brew-3.webp',
      '/assets/cuisine-drinks/makgeolli-brew-4.webp',
      '/assets/cuisine-drinks/makgeolli-brew-5.webp',
      '/assets/cuisine-drinks/makgeolli-brew-6.webp',
    ],
    youtubeId: 'fv4kYx_CXeg',
    videoTitle: 'Private tour of Hangang Brewery (makgeolli brewery) in Seoul',
    dietary: {
      contains: ['wheat'],
      suitable: ['vegetarian', 'vegan', 'pescatarian'],
      notSuitable: ['halal', 'gluten-free'],
      spice: 0,
      notes: 'Tastings are the centrepiece — non-drinking guests welcome with brewer-led explanations and house tea pairings.',
    },
  },

  'soju-distillery': {
    hero: {
      eyebrow: 'Soju distillery day trip · The hard stuff, done right',
      tagline: "A guided day trip to Hwayo (Icheon) or Andong's traditional distillery — Korea's premium small-batch soju, distilled from rice the slow way (not the mass-market dilute kind). Tasting and master's-cut bottles included.",
    },
    facts: [
      { label: 'Format',     value: 'Half-day with driver · distillery walk + tasting room + lunch · with master-distiller introduction' },
      { label: 'Highlights', value: 'Hwayo X / 25 / 41 · Andong Soju (Joseon-era recipe) · barrel-aged single-distillery soju · the slow pot still' },
      { label: 'Best time',  value: 'Tuesday–Saturday · 2-week advance booking · weekday for distiller availability' },
      { label: 'Contains',   value: 'Rice · Alcohol (16–53% ABV depending on bottle) · sometimes Oak (aged versions) · no sweeteners (premium)' },
      { label: 'Dietary',    value: 'Gluten-free · vegan · the cleanest distilled spirit category · alcohol — not halal' },
    ],
    photos: [
      '/assets/cuisine-drinks/soju-distillery.webp',
      '/assets/cuisine-drinks/soju-distillery-2.webp',
      '/assets/cuisine-drinks/soju-distillery-3.webp',
      '/assets/cuisine-drinks/soju-distillery-4.webp',
      '/assets/cuisine-drinks/soju-distillery-5.webp',
      '/assets/cuisine-drinks/soju-distillery-6.webp',
    ],
    youtubeId: 'DC8LrZOxNSc',
    videoTitle: 'Hwayo · Dreaming of soju that joins ranks of world-class liquor',
    dietary: {
      contains: [],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'gluten-free'],
      notSuitable: ['halal'],
      spice: 0,
      notes: 'Premium distilled soju is gluten-free (unlike many mass-market sojus). Designated driver provided — guests do not drive after.',
    },
  },

  'andong-soju': {
    hero: {
      eyebrow: 'Andong soju · The Joseon-court spirit',
      tagline: "The single-distillery premium soju the Joseon kings drank — 45% ABV, double-distilled in a copper pot, served at room temperature in small ceramic cups. Korea's answer to single-malt whisky.",
    },
    facts: [
      { label: 'Course',     value: 'Tasting · 60 minutes · 4–5 small pours · with cultural context narrator' },
      { label: 'Profile',    value: 'Clean · neutral on the nose · soft burn · long warm finish · the rice character at the end' },
      { label: 'Where',      value: 'Andong Soju Museum · Myeongin Andong Soju · Jinmaek Soju · UNESCO Hahoe Village pop-ups' },
      { label: 'Contains',   value: 'Rice · Alcohol (45% ABV) · no additives, no sweeteners' },
      { label: 'Dietary',    value: 'Gluten-free · vegan · the cleanest soju on the market · alcohol — not halal' },
    ],
    photos: [
      '/assets/cuisine-drinks/andong-soju.webp',
      '/assets/cuisine-drinks/andong-soju-2.webp',
      '/assets/cuisine-drinks/andong-soju-3.webp',
      '/assets/cuisine-drinks/andong-soju-4.webp',
      '/assets/cuisine-drinks/andong-soju-5.webp',
      '/assets/cuisine-drinks/andong-soju-6.webp',
    ],
    youtubeId: 'BNldKY05jOU',
    videoTitle: 'Myeongin Andong Soju · Established by a Grand Master of Korean Food',
    dietary: {
      contains: [],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'gluten-free'],
      notSuitable: ['halal'],
      spice: 0,
      notes: 'High ABV (45%) — small pours, slow tasting. Served at room temperature like aged spirits.',
    },
  },

  'craft-beer': {
    hero: {
      eyebrow: 'Seoul craft beer crawl · Itaewon to Mapo',
      tagline: "Three hours through Seoul's craft brew quarter — the IPAs of The Booth, the seasonal sours of Magpie, the Czech-style lagers at Gypsy Taproom — finishing in a Mapo brewpub with house-fermented snacks.",
    },
    facts: [
      { label: 'Format',     value: 'Guided pub crawl · 3 hours · 3–4 breweries · with craft-beer host' },
      { label: 'Highlights', value: 'Itaewon brewpub row · Mapo / Mangwon scene · seasonal Korean-rice IPAs · brewery-direct tap pours' },
      { label: 'Best time',  value: 'Tuesday–Thursday evenings · weekends busy · spring & autumn for outdoor seating' },
      { label: 'Contains',   value: 'Wheat / Barley · Hops · Alcohol (4–7% ABV) · sometimes Fruit/citrus infusions' },
      { label: 'Dietary',    value: 'Vegetarian / vegan friendly (most craft beers) · contains gluten · alcohol — not halal' },
    ],
    photos: [
      '/assets/cuisine-drinks/craft-beer.webp',
      '/assets/cuisine-drinks/craft-beer-2.webp',
      '/assets/cuisine-drinks/craft-beer-3.webp',
      '/assets/cuisine-drinks/craft-beer-4.webp',
      '/assets/cuisine-drinks/craft-beer-5.webp',
      '/assets/cuisine-drinks/craft-beer-6.webp',
    ],
    youtubeId: 'o8z3lATt-88',
    videoTitle: 'Best breweries in Seoul · Top 8 craft beer spots',
    dietary: {
      contains: ['wheat'],
      suitable: ['vegetarian', 'vegan', 'pescatarian'],
      notSuitable: ['halal', 'gluten-free'],
      spice: 0,
      notes: 'Gluten-free craft beers are rare in Seoul. Halal-friendly route impossible — alcohol-led.',
    },
  },

  cocktail: {
    hero: {
      eyebrow: 'Korean mixology speakeasy · Charles H · Le Chamber',
      tagline: "Two of Asia's 50 Best Bars in one night — Charles H (the Asia's-best-bar list regular at the Four Seasons) and Le Chamber (a bookshelf-hidden Gangnam speakeasy). Korean-distillate cocktails, no menu, ask the bartender.",
    },
    facts: [
      { label: 'Format',     value: 'Bar crawl · 2 hours · 2 venues · 2–3 cocktails per stop · advance bookings required' },
      { label: 'Highlights', value: 'Charles H Bar (50 Best Bars · Four Seasons) · Le Chamber Gangnam (hidden behind a bookshelf) · Korean-spirit-led drinks' },
      { label: 'Best time',  value: '9 pm – midnight · book 2 weeks ahead for Le Chamber · smart casual dress required' },
      { label: 'Contains',   value: 'Spirits (gin, whisky, soju, makgeolli) · Citrus · sometimes Egg white · sometimes Cream' },
      { label: 'Dietary',    value: 'Gluten-free cocktails available · contains alcohol · not halal · dairy- or egg-free options on request' },
    ],
    photos: [
      '/assets/cuisine-drinks/cocktail.webp',
      '/assets/cuisine-drinks/cocktail-2.webp',
      '/assets/cuisine-drinks/cocktail-3.webp',
      '/assets/cuisine-drinks/cocktail-4.webp',
      '/assets/cuisine-drinks/cocktail-5.webp',
      '/assets/cuisine-drinks/cocktail-6.webp',
    ],
    youtubeId: 'fc1xV0-iNHs',
    videoTitle: 'The only cocktail bar in Korea on 50 Best Bars · Charles H',
    dietary: {
      contains: ['eggs', 'dairy'],
      suitable: ['vegetarian', 'pescatarian', 'gluten-free'],
      notSuitable: ['vegan', 'halal'],
      spice: 0,
      notes: 'Bartenders can build cocktails around any allergen — flag at booking. Dry-night non-alcoholic mocktail flight available.',
    },
  },

  'coffee-seongsu': {
    hero: {
      eyebrow: 'Seongsu specialty coffee · Brooklyn-of-Seoul walk',
      tagline: "A guided three-hour walk through Korea's most-photographed coffee neighbourhood — four roasters, three pour-overs, one drip cold-brew. Seongsu's converted shoe-factory cafés are where Seoul's third-wave coffee scene lives.",
    },
    facts: [
      { label: 'Format',     value: 'Walking coffee tour · 3 hours · 4 roasters · seated tasting at the last one' },
      { label: 'Highlights', value: 'Center Coffee · Felt Coffee · Tailor Coffee · Anthracite · indie roasters in warehouse conversions' },
      { label: 'Best time',  value: 'Tuesday–Friday morning · weekend afternoons crowded · spring & autumn outdoor seating' },
      { label: 'Contains',   value: 'Coffee (caffeine) · sometimes Milk · sometimes Vegan oat / oat milk available everywhere' },
      { label: 'Dietary',    value: 'Vegan with oat / soy milk · gluten-free (espresso · pour-over) · halal & kosher friendly · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/coffee-seongsu.webp',
      '/assets/cuisine-drinks/coffee-seongsu-2.webp',
      '/assets/cuisine-drinks/coffee-seongsu-3.webp',
      '/assets/cuisine-drinks/coffee-seongsu-4.webp',
      '/assets/cuisine-drinks/coffee-seongsu-5.webp',
      '/assets/cuisine-drinks/coffee-seongsu-6.webp',
    ],
    youtubeId: 'rD4GonDXOw4',
    videoTitle: 'Seongsu-dong Cafe Street Walking Tour · Seoul City Korea 4K',
    dietary: {
      contains: ['dairy'],
      suitable: ['vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'hindu', 'gluten-free'],
      notSuitable: [],
      spice: 0,
      notes: 'Every Seongsu specialty café offers oat / soy / almond milk by default. Decaf available — flag at booking for caffeine-free.',
    },
  },

  'coffee-anguk': {
    hero: {
      eyebrow: 'Anguk hanok-café crawl · Old-town coffee',
      tagline: "A two-hour wander through Bukchon's hanok-converted cafés — drip coffee in a 100-year-old wooden house, lattes under tile-roof eaves, espresso served with red-bean tarts in the courtyard.",
    },
    facts: [
      { label: 'Format',     value: 'Walking café crawl · 2 hours · 3 hanok cafés · seated tasting at each' },
      { label: 'Highlights', value: 'Cafe Onion Anguk (the iconic flagship) · Layered (hanok ceiling) · Coffee Bronze · old-town aesthetic peak' },
      { label: 'Best time',  value: 'Weekday morning to avoid hanbok-rental tour crowds · golden-hour afternoon best for photos' },
      { label: 'Contains',   value: 'Coffee · Pastry (wheat) · sometimes Milk · sometimes Red bean (vegan)' },
      { label: 'Dietary',    value: 'Vegan / vegetarian friendly · pastry contains wheat · halal & kosher coffee · alcohol-free' },
    ],
    photos: [
      '/assets/cuisine-drinks/coffee-anguk.webp',
      '/assets/cuisine-drinks/coffee-anguk-2.webp',
      '/assets/cuisine-drinks/coffee-anguk-3.webp',
      '/assets/cuisine-drinks/coffee-anguk-4.webp',
      '/assets/cuisine-drinks/coffee-anguk-5.webp',
      '/assets/cuisine-drinks/coffee-anguk-6.webp',
    ],
    youtubeId: 'Wwz2bCADGdE',
    videoTitle: 'Seoul Bukchon Hanok Village · Insider tips for Anguk',
    dietary: {
      contains: ['wheat', 'dairy'],
      suitable: ['vegetarian', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: ['gluten-free'],
      spice: 0,
      notes: 'Vegan with plant-milk substitution; flag at booking. Gluten-free pastry rare at hanok cafés but rice-cake (tteok) alternative always available.',
    },
  },

  dalgona: {
    hero: {
      eyebrow: 'Bingsu & Dalgona · The sweet finale',
      tagline: "A two-house dessert tasting: mountain-shaved patbingsu with red bean and rice cake at a Sulbing flagship, then the honeycomb-toffee dalgona made famous by Squid Game — punched out into shapes at a Hongdae stall.",
    },
    facts: [
      { label: 'Course',     value: 'Dessert tasting · 60 minutes · two stops · shared portions for 2–4' },
      { label: 'Profile',    value: 'Bingsu: snow-fine ice · cold milky-sweet · red bean · injeolmi-rice-cake · Dalgona: brittle honeycomb · burnt-sugar smoke' },
      { label: 'Where',      value: 'Sulbing flagship (Insadong) · Hongdae dalgona pop-ups · Ikseondong dessert alley · Samcheong-dong bingsu cafés' },
      { label: 'Contains',   value: 'Milk · Red bean · Rice cake (gluten-free) · Sugar · sometimes Eggs (mango bingsu cream)' },
      { label: 'Dietary',    value: 'Vegetarian friendly · vegan with sorbet-bingsu (no dairy) · gluten-free options · dalgona itself is vegan' },
    ],
    photos: [
      '/assets/cuisine-drinks/dalgona.webp',
      '/assets/cuisine-drinks/dalgona-2.webp',
      '/assets/cuisine-drinks/dalgona-3.webp',
      '/assets/cuisine-drinks/dalgona-4.webp',
      '/assets/cuisine-drinks/dalgona-5.webp',
      '/assets/cuisine-drinks/dalgona-6.webp',
    ],
    youtubeId: 'Nav5EfBisUM',
    videoTitle: 'Top bingsu shaved ice dessert in Seoul, Korea',
    dietary: {
      contains: ['dairy', 'eggs'],
      suitable: ['vegetarian', 'pescatarian', 'halal', 'kosher', 'hindu'],
      notSuitable: ['vegan'],
      spice: 0,
      notes: 'Classic patbingsu has condensed milk. Sorbet-bingsu (fruit-only) is the vegan version, available at most modern shops on request.',
    },
  },

};

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
  const [selected, setSelected] = useState(() => new Set());
  const [allergens, setAllergens] = useState(() => new Set());
  const [diets, setDiets] = useState(() => new Set());
  const [spice, setSpice] = useState(null);
  const [detailCode, setDetailCode] = useState(null);

  const openDetail = (item) => {
    if (CUISINE_DETAILS[item.code]) { setDetailCode(item.code); return; }
    alert('Detail page for "' + item.name + '" — coming soon.');
  };
  const detailItem = detailCode
    ? FB_PAGES.flatMap((p) => p.items).find((it) => it.code === detailCode)
    : null;

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
            Four pages — Hansik, Street, Grill, Drinks.
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
                      <span className="kw-pagetab-count">
                        {`${p.items.length}${pageSelCount > 0 ? ` · ${pageSelCount} picked` : ''}`}
                      </span>
                    </span>
                  </button>);
              })}
            </div>

            {/* Page content */}
            <div className="kw-cul-grid">
                {currentPage.items.map((it) => {
                const sel = selected.has(it.code);
                return (
                  <div
                    key={it.code}
                    className={`kw-cul kw-photo-${it.theme} ${sel ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetail(it)}>

                      <div
                        className={`kw-cul-photo ${it.image ? 'has-image' : ''}`}
                        style={it.image ? { backgroundImage: `url('${thumbUrl(it.image)}')` } : undefined}>
                        {!it.image && <span className="kw-cul-monogram">{it.mono}</span>}
                      </div>
                      <span className="kw-cul-view">View details →</span>
                      <div className="kw-cul-body">
                        <span className="kw-cul-eyebrow">{it.eyebrow}</span>
                        <div className="kw-cul-name">{it.name}</div>
                        <div className="kw-cul-foot">
                          <span className="kw-cul-meta">{it.meta}</span>
                          <button
                          className="kw-cul-add"
                          onClick={(e) => { e.stopPropagation(); toggle(it.code); }}>
                            {sel ? <>✓ Added</> : <><span className="kw-cul-add-plus">+</span> Add</>}
                          </button>
                        </div>
                      </div>
                    </div>);
              })}
              </div>

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

        {detailItem &&
          <CuisineDetailDrawer
            item={detailItem}
            detail={CUISINE_DETAILS[detailItem.code]}
            isSelected={selected.has(detailItem.code)}
            onToggle={() => toggle(detailItem.code)}
            onClose={() => setDetailCode(null)} />
        }

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

// ─── CuisineDetailDrawer — right-side panel for a dish ────────────────
// Mirrors the Culture drawer shape (hero photo · 6 thumbs · facts · video)
// and inserts a structured Dietary panel between the facts and the video
// so allergens, diet compatibility, spice level, and adaptation notes are
// front-and-centre — the most important thing about food.
function CuisineDetailDrawer({ item, detail, isSelected, onToggle, onClose }) {
  const [activePhoto, setActivePhoto] = React.useState(0);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  React.useEffect(() => { setActivePhoto(0); }, [item.code]);

  const photos = detail.photos || (detail.photo ? [detail.photo] : []);
  const d = detail.dietary;
  const allergenName = (code) => (ALLERGENS.find((a) => a.code === code) || {}).name || code;
  const dietName     = (code) => (DIETS.find((x) => x.code === code) || {}).name || code;
  const spiceLevel   = SPICE_LEVELS[d ? d.spice : 0];

  return (
    <>
      <div className="kw-drawer-scrim" onClick={onClose} />
      <aside
        className={`kw-drawer kw-photo-${item.theme}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} details`}>

        <header className="kw-drawer-top">
          <nav className="kw-drawer-crumb" aria-label="Breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
              ← Step 4 · Cuisine
            </a>
            <span className="kw-drawer-crumb-sep" aria-hidden="true">/</span>
            <span className="kw-drawer-crumb-now">{item.name}</span>
          </nav>
          <button className="kw-drawer-close" onClick={onClose} aria-label="Close details">×</button>
        </header>

        <div className="kw-drawer-body">
          <section className="kw-detail-hero">
            <div className="kw-detail-hero-l">
              <span className="kw-detail-eyebrow">{detail.hero.eyebrow}</span>
              <h2 className="kw-detail-title">{item.name}</h2>
              <p className="kw-detail-tagline">{detail.hero.tagline}</p>
              <dl className="kw-detail-facts">
                {detail.facts.map((f) => (
                  <div key={f.label} className="kw-detail-fact-row">
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="kw-detail-gallery">
              <div
                className="kw-detail-hero-photo"
                style={{ backgroundImage: `url('${photos[activePhoto]}')` }}
                role="img"
                aria-label={item.name} />
              {photos.length > 1 &&
                <div className="kw-detail-thumbs">
                  {photos.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={`kw-detail-thumb ${i === activePhoto ? 'is-active' : ''}`}
                      style={{ backgroundImage: `url('${thumbUrl(src)}')` }}
                      aria-label={`View photo ${i + 1} of ${photos.length}`}
                      aria-pressed={i === activePhoto}
                      onClick={() => setActivePhoto(i)} />
                  ))}
                </div>
              }
            </div>
          </section>

          {d &&
            <section className="kw-detail-section">
              <h3 className="kw-detail-h3">Dietary</h3>
              <div className="kw-diet-panel">

                {d.contains.length > 0 &&
                  <div className="kw-diet-row">
                    <span className="kw-diet-row-label">Contains</span>
                    <div className="kw-diet-chips">
                      {d.contains.map((c) => (
                        <span key={c} className="kw-diet-chip kw-diet-contains">{allergenName(c)}</span>
                      ))}
                    </div>
                  </div>
                }

                {d.suitable.length > 0 &&
                  <div className="kw-diet-row">
                    <span className="kw-diet-row-label">Suitable for</span>
                    <div className="kw-diet-chips">
                      {d.suitable.map((c) => (
                        <span key={c} className="kw-diet-chip kw-diet-ok">✓ {dietName(c)}</span>
                      ))}
                    </div>
                  </div>
                }

                {d.notSuitable.length > 0 &&
                  <div className="kw-diet-row">
                    <span className="kw-diet-row-label">Not for</span>
                    <div className="kw-diet-chips">
                      {d.notSuitable.map((c) => (
                        <span key={c} className="kw-diet-chip kw-diet-no">✕ {dietName(c)}</span>
                      ))}
                    </div>
                  </div>
                }

                <div className="kw-diet-row">
                  <span className="kw-diet-row-label">Spice</span>
                  <div className="kw-diet-spice">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`kw-diet-pip ${i < d.spice ? 'is-on' : ''}`} />
                    ))}
                    <span className="kw-diet-spice-label">{spiceLevel.label}</span>
                  </div>
                </div>

                {d.notes &&
                  <p className="kw-diet-note">{d.notes}</p>
                }
              </div>
            </section>
          }

          {detail.youtubeId &&
            <section className="kw-detail-section">
              <h3 className="kw-detail-h3">See it on video</h3>
              <div className="kw-detail-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${detail.youtubeId}?rel=0`}
                  title={detail.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy" />
              </div>
              <p className="kw-detail-video-caption">
                {detail.videoTitle} · external content from YouTube
              </p>
            </section>
          }
        </div>

        <footer className="kw-drawer-foot">
          <div className="kw-drawer-foot-l">
            <span className="kw-drawer-foot-label">Your basket</span>
            <span className="kw-drawer-foot-meta">
              {isSelected
                ? '✓ This dish is in your basket'
                : 'Not added yet — add it to weave it into your week'}
            </span>
          </div>
          <div className="kw-drawer-foot-r">
            <button
              className="kw-cta kw-cta-ghost"
              style={{ height: 50, fontSize: 15, padding: '0 22px' }}
              onClick={onClose}>
              Close
            </button>
            <button className="kw-cta kw-cta-lg" onClick={onToggle}>
              {isSelected ? '✓ Remove from basket' : 'Add to basket'} &nbsp;›
            </button>
          </div>
        </footer>
      </aside>
    </>);
}

window.Step4Cuisine = Step4Cuisine;