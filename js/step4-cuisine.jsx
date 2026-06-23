// Step 4 — Cuisine / Food & Beverage. Pick what you'd like to eat and
// drink in Korea, then tell us about allergies, religion, and spice.
// Reuses Step 3's page-tab + grid pattern, but adds a thorough Dietary
// sub-step the kitchen and concierge can plan around.

const { useState } = React;

// Reuse the same /thumbs/ pattern as step3 so a single source can serve
// both list thumbnails and drawer photos.
const thumbUrl = (path) => path && path.replace(/\/([^/]+\.webp)$/, '/thumbs/$1');

// Read the persisted cuisine slice so a re-visit restores every prior pick.
// Mirrors Step3Culture's kwState hydration — selections never reset mid-funnel.
function loadCuisineState() {
  try {
    if (window.kwState) {
      const c = window.kwState.loadStep('cuisine');
      if (c && typeof c === 'object') return c;
    }
  } catch (e) {}
  return null;
}

// ─── Food & beverage catalog, paginated ────────────────────────────────
const FB_PAGES = [
{
  id: 'hansik',
  eyebrow: 'Page Ⅰ',
  label: 'Hansik',
  items: [
  { code: 'bibimbap',         mono: 'I',    theme: 'rice',    eyebrow: 'Rice bowl',   name: 'Bibimbap — Mixed Rice with Vegetables',       meta: 'Lunch · 45 min',                  image: '/assets/cuisine-hansik/bibimbap.webp' },
  { code: 'samgyetang',       mono: 'III',  theme: 'soup',    eyebrow: 'Soup',        name: 'Samgyetang — Ginseng Chicken Soup',           meta: 'Lunch · 60 min · restorative',    image: '/assets/cuisine-hansik/samgyetang.webp' },
  { code: 'sundubu',          mono: 'IV',   theme: 'stew',    eyebrow: 'Stew',        name: 'Sundubu-jjigae — Soft Tofu Stew',             meta: 'Lunch · 45 min · spicy',          image: '/assets/cuisine-hansik/sundubu.webp' },
  { code: 'kimchi-jjigae',    mono: 'V',    theme: 'stew',    eyebrow: 'Stew',        name: 'Kimchi-jjigae — Aged Kimchi Stew',            meta: 'Lunch · 45 min · spicy',          image: '/assets/cuisine-hansik/kimchi-jjigae.webp' },
  { code: 'doenjang-jjigae',  mono: 'VI',   theme: 'banchan', eyebrow: 'Stew',        name: 'Doenjang-jjigae — Soybean Paste Stew',        meta: 'Lunch · 45 min · earthy',         image: '/assets/cuisine-hansik/doenjang-jjigae.webp' },
  { code: 'japchae',          mono: 'VII',  theme: 'noodle',  eyebrow: 'Noodle',      name: 'Japchae — Sweet Potato Glass Noodles',        meta: 'Side or main · 30 min',           image: '/assets/cuisine-hansik/japchae.webp' },
  { code: 'naengmyeon',       mono: 'VIII', theme: 'noodle',  eyebrow: 'Cold noodle', name: 'Naengmyeon — Icy Buckwheat Noodles',          meta: 'Lunch · 30 min · summer',         image: '/assets/cuisine-hansik/naengmyeon.webp' },
  { code: 'kimbap',           mono: 'X',    theme: 'rice',    eyebrow: 'Roll',        name: 'Kimbap — Seaweed Rice Rolls',                 meta: 'Snack · 15 min',                  image: '/assets/cuisine-hansik/kimbap.webp' },
  { code: 'mandu',            mono: 'XI',   theme: 'rice',    eyebrow: 'Dumpling',    name: 'Mandu — Hand-folded Dumplings',               meta: 'Side · 30 min',                   image: '/assets/cuisine-hansik/mandu.webp' },
  { code: 'jeon',             mono: 'XII',  theme: 'veg',     eyebrow: 'Pancake',     name: 'Jeon — Savory Vegetable & Seafood Pancakes',  meta: 'Side · 30 min · pairs w/ makgeolli', image: '/assets/cuisine-hansik/jeon.webp' },
  { code: 'bossam',           mono: 'XIII', theme: 'bbq',     eyebrow: 'Wrap',        name: 'Bossam — Boiled Pork Belly Wraps',            meta: 'Dinner · 60 min · communal',      image: '/assets/cuisine-hansik/bossam.webp' },
  ]

},
{
  id: 'street',
  eyebrow: 'Page Ⅱ',
  label: 'Street',
  items: [
  { code: 'tteokbokki',     mono: 'XVII',   theme: 'stew',     eyebrow: 'Street',  name: 'Tteokbokki — Spicy Rice Cakes',           meta: 'Snack · spicy · iconic',         image: '/assets/cuisine-street/tteokbokki.webp' },
  { code: 'hotteok',         mono: 'XVIII',  theme: 'sweet',    eyebrow: 'Sweet',   name: 'Hotteok — Brown Sugar Syrup Pancakes',    meta: 'Snack · winter staple',          image: '/assets/cuisine-street/hotteok.webp' },
  { code: 'bungeoppang',     mono: 'XIX',    theme: 'sweet',    eyebrow: 'Sweet',   name: 'Bungeoppang — Fish-shaped Red Bean Cakes', meta: 'Snack · winter staple',         image: '/assets/cuisine-street/bungeoppang.webp' },
  { code: 'sundae',          mono: 'XXI',    theme: 'bbq',      eyebrow: 'Sausage', name: 'Sundae — Korean Blood Sausage Plate',     meta: 'Snack · adventurous',            image: '/assets/cuisine-street/sundae.webp' },
  { code: 'pajeon',          mono: 'XXVI',   theme: 'veg',      eyebrow: 'Pancake', name: 'Haemul-pajeon — Seafood Scallion Pancake',meta: 'Snack · pairs w/ makgeolli',     image: '/assets/cuisine-street/pajeon.webp' },
  { code: 'gwangjang-tour',  mono: 'XXVII',  theme: 'market-c', eyebrow: 'Market',  name: 'Gwangjang Market Food Tour',              meta: '2 hrs · with foodie guide',      image: '/assets/cuisine-street/gwangjang-tour.webp' },
  ]

},
{
  id: 'grill',
  eyebrow: 'Page Ⅲ',
  label: 'Grill',
  items: [
  { code: 'samgyeopsal',  mono: 'XXXI',    theme: 'bbq',   eyebrow: 'BBQ',      name: 'Samgyeopsal — Pork Belly Grill',          meta: 'Dinner · 90 min · communal',     image: '/assets/cuisine-grill/samgyeopsal.webp' },
  { code: 'hanwoo',       mono: 'XXXII',   theme: 'bbq',   eyebrow: 'BBQ',      name: 'Hanwoo — Premium Korean Beef Tasting',    meta: 'Dinner · 2 hrs · grade 1++',     image: '/assets/cuisine-grill/hanwoo.webp' },
  { code: 'galbi',        mono: 'XXXIII',  theme: 'bbq',   eyebrow: 'BBQ',      name: 'Galbi — Marinated Short Rib Grill',       meta: 'Dinner · 90 min · sweet-savory', image: '/assets/cuisine-grill/galbi.webp' },
  { code: 'dak-galbi',    mono: 'XXXV',    theme: 'stew',  eyebrow: 'Stir-fry', name: 'Dak-galbi — Spicy Chicken Stir-fry',      meta: 'Dinner · 60 min · spicy',        image: '/assets/cuisine-grill/dak-galbi.webp' },
  { code: 'jeyuk',        mono: 'XXXVI',   theme: 'stew',  eyebrow: 'Stir-fry', name: 'Jeyuk-bokkeum — Fiery Pork Stir-fry',     meta: 'Lunch · 45 min · very spicy',    image: '/assets/cuisine-grill/jeyuk.webp' },
  { code: 'sutbul-galbi', mono: 'XXXVII',  theme: 'bbq',   eyebrow: 'Charcoal', name: 'Sutbul-Galbi — Charcoal Grill House',     meta: 'Dinner · 2 hrs · smoky',         image: '/assets/cuisine-grill/sutbul-galbi.webp' },
  { code: 'chimaek',      mono: 'XXXVIII', theme: 'fried', eyebrow: 'Chimaek',  name: 'Chimaek — Korean Fried Chicken & Beer',   meta: 'Evening · 90 min · iconic',      image: '/assets/cuisine-grill/chimaek.webp' },
  { code: 'jokbal',       mono: 'XXXIX',   theme: 'bbq',   eyebrow: 'Braise',   name: 'Jokbal — Soy-braised Pig Trotters',       meta: 'Dinner · 90 min · late-night',   image: '/assets/cuisine-grill/jokbal.webp' },
  { code: 'gopchang',     mono: 'XL',      theme: 'bbq',   eyebrow: 'Offal',    name: 'Gopchang — Grilled Beef Intestines',      meta: 'Dinner · 90 min · adventurous',  image: '/assets/cuisine-grill/gopchang.webp' },
  { code: 'budae',        mono: 'XLII',    theme: 'stew',  eyebrow: 'Hot pot',  name: 'Budae-jjigae — Army Base Hot Pot',        meta: 'Dinner · 60 min · communal',     image: '/assets/cuisine-grill/budae.webp' },
  ]

},
{
  id: 'drinks',
  eyebrow: 'Page Ⅳ',
  label: 'Drinks',
  items: [
  { code: 'makgeolli-flight', mono: 'XLVIII',  theme: 'makgeolli', eyebrow: 'Makgeolli', name: 'Makgeolli Flight — Five Brewers',       meta: '90 min · with jeon pairing',     image: '/assets/cuisine-drinks/makgeolli-flight.webp' },
  { code: 'andong-soju',      mono: 'LI',      theme: 'soju',      eyebrow: 'Soju',      name: 'Andong Premium Soju Tasting',           meta: '60 min · single-distillery',     image: '/assets/cuisine-drinks/andong-soju.webp' },
  { code: 'dalgona',          mono: 'LVI',     theme: 'sweet',     eyebrow: 'Treat',     name: 'Bingsu & Dalgona Dessert Tasting',      meta: '60 min · sweet finale',          image: '/assets/cuisine-drinks/dalgona.webp' },
  ]

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
      "/assets/cuisine-hansik/bibimbap.webp",
      "/assets/cuisine-hansik/bibimbap-2.webp",
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
      "/assets/cuisine-hansik/samgyetang.webp",
      "/assets/cuisine-hansik/samgyetang-2.webp",
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
      "/assets/cuisine-hansik/sundubu.webp",
      "/assets/cuisine-hansik/sundubu-2.webp",
      "/assets/cuisine-hansik/sundubu-3.webp",
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
      "/assets/cuisine-hansik/kimchi-jjigae.webp",
      "/assets/cuisine-hansik/kimchi-jjigae-2.webp",
      "/assets/cuisine-hansik/kimchi-jjigae-3.webp",
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
      "/assets/cuisine-hansik/doenjang-jjigae.webp",
      "/assets/cuisine-hansik/doenjang-jjigae-2.webp",
      "/assets/cuisine-hansik/doenjang-jjigae-3.webp",
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
      "/assets/cuisine-hansik/japchae.webp",
      "/assets/cuisine-hansik/japchae-2.webp",
      "/assets/cuisine-hansik/japchae-3.webp",
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
      "/assets/cuisine-hansik/naengmyeon.webp",
      "/assets/cuisine-hansik/naengmyeon-2.webp",
      "/assets/cuisine-hansik/naengmyeon-3.webp",
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
      "/assets/cuisine-hansik/kimbap.webp",
      "/assets/cuisine-hansik/kimbap-2.webp",
      "/assets/cuisine-hansik/kimbap-3.webp",
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
      "/assets/cuisine-hansik/mandu.webp",
      "/assets/cuisine-hansik/mandu-2.webp",
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
      "/assets/cuisine-hansik/jeon.webp",
      "/assets/cuisine-hansik/jeon-2.webp",
      "/assets/cuisine-hansik/jeon-3.webp",
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
      "/assets/cuisine-hansik/bossam.webp",
      "/assets/cuisine-hansik/bossam-2.webp",
      "/assets/cuisine-hansik/bossam-3.webp",
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
      "/assets/cuisine-street/tteokbokki.webp",
      "/assets/cuisine-street/tteokbokki-2.webp",
      "/assets/cuisine-street/tteokbokki-3.webp",
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
      "/assets/cuisine-street/hotteok.webp",
      "/assets/cuisine-street/hotteok-2.webp",
      "/assets/cuisine-street/hotteok-3.webp",
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
      "/assets/cuisine-street/bungeoppang.webp",
      "/assets/cuisine-street/bungeoppang-2.webp",
      "/assets/cuisine-street/bungeoppang-3.webp",
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
      "/assets/cuisine-street/sundae.webp",
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
      "/assets/cuisine-street/pajeon.webp",
      "/assets/cuisine-street/pajeon-2.webp",
      "/assets/cuisine-street/pajeon-3.webp",
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
      "/assets/cuisine-street/gwangjang-tour.webp",
      "/assets/cuisine-street/gwangjang-tour-2.webp",
      "/assets/cuisine-street/gwangjang-tour-3.webp",
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
      "/assets/cuisine-grill/samgyeopsal.webp",
      "/assets/cuisine-grill/samgyeopsal-2.webp",
      "/assets/cuisine-grill/samgyeopsal-3.webp",
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
      "/assets/cuisine-grill/hanwoo.webp",
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
      "/assets/cuisine-grill/galbi.webp",
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
      "/assets/cuisine-grill/dak-galbi.webp",
      "/assets/cuisine-grill/dak-galbi-2.webp",
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
      "/assets/cuisine-grill/jeyuk.webp",
      "/assets/cuisine-grill/jeyuk-2.webp",
      "/assets/cuisine-grill/jeyuk-3.webp",
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
      "/assets/cuisine-grill/sutbul-galbi.webp",
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
      "/assets/cuisine-grill/chimaek.webp",
      "/assets/cuisine-grill/chimaek-2.webp",
      "/assets/cuisine-grill/chimaek-3.webp",
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
      "/assets/cuisine-grill/jokbal.webp",
      "/assets/cuisine-grill/jokbal-2.webp",
      "/assets/cuisine-grill/jokbal-3.webp",
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
      "/assets/cuisine-grill/gopchang.webp",
      "/assets/cuisine-grill/gopchang-2.webp",
      "/assets/cuisine-grill/gopchang-3.webp",
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
      "/assets/cuisine-grill/budae.webp",
      "/assets/cuisine-grill/budae-2.webp",
      "/assets/cuisine-grill/budae-3.webp",
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
      "/assets/cuisine-drinks/makgeolli-flight.webp",
      "/assets/cuisine-drinks/makgeolli-flight-2.webp",
      "/assets/cuisine-drinks/makgeolli-flight-3.webp",
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
      "/assets/cuisine-drinks/andong-soju.webp",
      "/assets/cuisine-drinks/andong-soju-2.webp",
      "/assets/cuisine-drinks/andong-soju-3.webp",
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
      "/assets/cuisine-drinks/dalgona.webp",
      "/assets/cuisine-drinks/dalgona-2.webp",
      "/assets/cuisine-drinks/dalgona-3.webp",
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


// Local eyebrow label (the shared one lives in step1-trip-shared.jsx, which this
// page does not load — step5.html mounts only this component, like step3).
function SectionEyebrow({ num, label }) {
  return (
    <div className="kw-eyebrow">
      <span className="kw-eyebrow-num">{num}</span>
      <span className="kw-eyebrow-text">{label}</span>
    </div>
  );
}

function Step4Cuisine() {
  // Hydrate every field from the persisted cuisine slice (restore on re-visit).
  const prior = loadCuisineState() || {};
  const [pageIdx, setPageIdx] = useState(0);
  const [selected, setSelected] = useState(() => new Set(Array.isArray(prior.items) ? prior.items : []));
  const [allergens, setAllergens] = useState(() => new Set(Array.isArray(prior.allergens) ? prior.allergens : []));
  const [diets, setDiets] = useState(() => new Set(Array.isArray(prior.diets) ? prior.diets : []));
  const [spice, setSpice] = useState(prior.spice != null ? prior.spice : null);
  const [notes, setNotes] = useState(typeof prior.notes === 'string' ? prior.notes : '');
  const [detailCode, setDetailCode] = useState(null);

  // Persist the full cuisine slice on every change so the fixed-footer Continue
  // (in step5.html) and the result page always read the current picks. Same
  // pattern as Step3Culture — selections are saved as you go, never on submit only.
  React.useEffect(() => {
    if (window.kwState) {
      window.kwState.saveStep('cuisine', {
        items: Array.from(selected),
        allergens: Array.from(allergens),
        diets: Array.from(diets),
        spice: spice,
        notes: notes,
      });
    }
  }, [selected, allergens, diets, spice, notes]);

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
    <>
      <div className="kw-q-input">

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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Severe peanut allergy — anaphylactic. I've always wanted to try makgeolli at a brewery. My partner is FODMAP-sensitive so no garlic-heavy dishes. Hoping for one fine-dining night and otherwise casual." />
            </div>
          </div>
        </section>

      </div>

      {detailItem &&
        <CuisineDetailDrawer
          item={detailItem}
          detail={CUISINE_DETAILS[detailItem.code]}
          isSelected={selected.has(detailItem.code)}
          onToggle={() => toggle(detailItem.code)}
          onClose={() => setDetailCode(null)} />
      }
    </>);
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
              ← Step 5 · Cuisine
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