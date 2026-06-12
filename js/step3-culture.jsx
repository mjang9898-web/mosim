// Step 3 — Culture. 50 cultural experiences split across 3 paginated
// pages: Heritage & Royal · Crafts & Wellness · Modern & Performing.
// Same card pattern as Step 2 Medical but denser (4 cols), tighter
// footers, and a tab-based pager.

const { useState } = React;

// Resolve the 400px-wide thumbnail variant for a full-size webp path.
// Cards on the main grid and the drawer's thumbnail strip use this;
// the drawer's hero photo keeps the full-size original.
const thumbUrl = (path) => path && path.replace(/\/([^/]+\.webp)$/, '/thumbs/$1');


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
      { code: 'gyeongbokgung',  mono: 'I',      theme: 'palace',   eyebrow: 'Palace',     name: 'Korean Royal Palace Tour',         meta: 'Half day · with historian',  image: '/assets/culture-heritage/gyeongbokgung.webp' },
      { code: 'changdeokgung',  mono: 'II',     theme: 'palace',   eyebrow: 'Palace',     name: 'Royal Garden Palace Visit',        meta: '3 hours · UNESCO',           image: '/assets/culture-heritage/changdeokgung.webp' },
      { code: 'deoksugung',     mono: 'III',    theme: 'palace',   eyebrow: 'Palace',     name: 'Evening Lantern Palace Walk',      meta: '2 hours · evening',          image: '/assets/culture-heritage/deoksugung.webp' },
      { code: 'changgyeonggung',mono: 'IV',     theme: 'palace',   eyebrow: 'Palace',     name: 'Moonlit Palace Night Opening',     meta: '2 hours · seasonal',         image: '/assets/culture-heritage/changgyeonggung.webp' },
      { code: 'jongmyo',        mono: 'V',      theme: 'palace',   eyebrow: 'Shrine',     name: 'Royal Ancestral Shrine',           meta: '2 hours · UNESCO',           image: '/assets/culture-heritage/jongmyo.webp' },
      { code: 'huwon',          mono: 'VI',     theme: 'garden',   eyebrow: 'Garden',     name: "The King's Secret Garden Walk",    meta: '90 min · guided',            image: '/assets/culture-heritage/huwon.webp' },
      { code: 'bukchon',        mono: 'VII',    theme: 'hanok',    eyebrow: 'Hanok',      name: 'Traditional Hanok Village Stroll', meta: '2 hours · walking',          image: '/assets/culture-heritage/bukchon.webp' },
      { code: 'bongeunsa',      mono: 'VIII',   theme: 'temple',   eyebrow: 'Temple',     name: 'City Mountain Temple Visit',       meta: '90 min · meditation',        image: '/assets/culture-heritage/bongeunsa.webp' },
      { code: 'jogyesa',        mono: 'IX',     theme: 'temple',   eyebrow: 'Temple',     name: 'Flower Lantern Temple Visit',      meta: '60 min · seasonal',          image: '/assets/culture-heritage/jogyesa.webp' },
      { code: 'haeinsa',        mono: 'X',      theme: 'temple',   eyebrow: 'Templestay', name: 'Tripitaka Templestay Overnight',   meta: '24 hours · with monk',       image: '/assets/culture-heritage/haeinsa.webp' },
      { code: 'meditation',     mono: 'XI',     theme: 'temple',   eyebrow: 'Meditation', name: 'Buddhist Meditation Session',      meta: '2 hours · with monk',        image: '/assets/culture-heritage/meditation.webp' },
      { code: 'tea',            mono: 'XII',    theme: 'tea',      eyebrow: 'Tea',        name: 'Private Tea Ceremony',             meta: '90 min · private room',      image: '/assets/culture-heritage/tea.webp' },
      { code: 'calligraphy',    mono: 'XIII',   theme: 'crafts',   eyebrow: 'Brush',      name: 'Brush Calligraphy with Master',    meta: '2 hours · private',          image: '/assets/culture-heritage/calligraphy.webp' },
      { code: 'hanbok',         mono: 'XIV',    theme: 'heritage', eyebrow: 'Hanbok',     name: 'Royal Dress Fitting & Photoshoot', meta: 'Half day · private',         image: '/assets/culture-heritage/hanbok.webp' },
      { code: 'royalcuisine',   mono: 'XV',     theme: 'heritage', eyebrow: 'Cuisine',    name: 'Royal Court Cuisine Tasting',      meta: '2 hours · with sommelier',   image: '/assets/culture-heritage/royalcuisine.webp' },
      { code: 'nationalmuseum', mono: 'XVI',    theme: 'museum',   eyebrow: 'Museum',     name: 'National History Museum',          meta: '3 hours · curator-led',      image: '/assets/culture-heritage/nationalmuseum.webp' },
      { code: 'warmemorial',    mono: 'XVII',   theme: 'museum',   eyebrow: 'Museum',     name: 'War Memorial & Monument',          meta: '2 hours · guided',           image: '/assets/culture-heritage/warmemorial.webp' },
      { code: 'cheonggye',      mono: 'XVIII',  theme: 'garden',   eyebrow: 'Stream',     name: 'Cheonggyecheon Stream Walk',       meta: '90 min · evening best',      image: '/assets/culture-heritage/cheonggye.webp' },
    ],
  },
  {
    id: 'shop',
    eyebrow: 'Page Ⅱ',
    label: 'Shop',
    items: [
      { code: 'seongsu',       mono: 'XIX',    theme: 'shop',    eyebrow: 'District', name: 'Brooklyn-of-Seoul Café & Boutique Walk', meta: '3 hours · self-paced',     image: '/assets/culture-shop/seongsu.webp' },
      { code: 'myeongdong',    mono: 'XX',     theme: 'market',  eyebrow: 'District', name: 'Main Shopping Street & K-Beauty',        meta: '3 hours · with stylist',   image: '/assets/culture-shop/myeongdong.webp' },
      { code: 'apgujeong',     mono: 'XXI',    theme: 'shop',    eyebrow: 'Luxury',   name: 'Designer Luxury Boutique Row',           meta: 'Half day · concierge',     image: '/assets/culture-shop/apgujeong.webp' },
      { code: 'coex',          mono: 'XXII',   theme: 'modern',  eyebrow: 'Mall',     name: 'Starfield Library & Mega Mall',          meta: '3 hours · indoors',        image: '/assets/culture-shop/coex.webp' },
      { code: 'garosugil',     mono: 'XXIII',  theme: 'shop',    eyebrow: 'District', name: 'Tree-lined Boutique Avenue',             meta: '2 hours · walking',        image: '/assets/culture-shop/garosugil.webp' },
      { code: 'hongdae',       mono: 'XXIV',   theme: 'shop',    eyebrow: 'District', name: 'Youth Street Fashion Quarter',           meta: '3 hours · evening best',   image: '/assets/culture-shop/hongdae.webp' },
      { code: 'ikseondong',    mono: 'XXV',    theme: 'hanok',   eyebrow: 'Hanok',    name: 'Hanok Alleys, Cafés & Boutiques',        meta: '2 hours · self-paced',     image: '/assets/culture-shop/ikseondong.webp' },
      { code: 'gwangjang',     mono: 'XXVI',   theme: 'market',  eyebrow: 'Market',   name: 'Traditional Street Food Market',         meta: '90 min · with foodie',     image: '/assets/culture-shop/gwangjang.webp' },
      { code: 'namdaemun',     mono: 'XXVII',  theme: 'market',  eyebrow: 'Market',   name: 'Largest Night Market',                   meta: '2 hours · evening',        image: '/assets/culture-shop/namdaemun.webp' },
      { code: 'ddp',           mono: 'XXVIII', theme: 'modern',  eyebrow: 'District', name: 'Modern Design Plaza & Shopping',         meta: '2 hours · Zaha Hadid',     image: '/assets/culture-shop/ddp.webp' },
      { code: 'ddm',           mono: 'XXIX',   theme: 'modern',  eyebrow: 'Market',   name: 'Midnight Fashion Wholesale',             meta: '3 hours · 11pm–5am',       image: '/assets/culture-shop/ddm.webp' },
      { code: 'kbeauty',       mono: 'XXX',    theme: 'shop',    eyebrow: 'K-Beauty', name: 'K-Beauty Flagship Tour',                 meta: 'Half day · with samples',  image: '/assets/culture-shop/kbeauty.webp' },
      { code: 'insadong',      mono: 'XXXI',   theme: 'crafts',  eyebrow: 'Crafts',   name: 'Traditional Craft & Antique Lanes',      meta: '3 hours · with curator',   image: '/assets/culture-shop/insadong.webp' },
      { code: 'hannam',        mono: 'XXXII',  theme: 'shop',    eyebrow: 'Gallery',  name: 'Boutique Gallery & Concept Row',         meta: '3 hours · walking',        image: '/assets/culture-shop/hannam.webp' },
      { code: 'commonground',  mono: 'XXXIII', theme: 'modern',  eyebrow: 'Market',   name: 'Container Market & Pop-ups',             meta: '2 hours · self-paced',     image: '/assets/culture-shop/commonground.webp' },
      { code: 'taxfree',       mono: 'XXXIV',  theme: 'shop',    eyebrow: 'Outlet',   name: 'Tax-Free Designer Outlet Day',           meta: 'Full day · with driver',   image: '/assets/culture-shop/taxfree.webp' },
    ],
  },
  {
    id: 'famous',
    eyebrow: 'Page Ⅲ',
    label: 'Famous',
    items: [
      { code: 'baseball',     mono: 'XXXV',    theme: 'sport',   eyebrow: 'Sports',    name: 'KBO Baseball with Private Box',      meta: '3 hours · with snacks',          image: '/assets/culture-famous/baseball.webp' },
      { code: 'golf',         mono: 'XXXVI',   theme: 'sport',   eyebrow: 'Sports',    name: 'Signature Golf Course Round',        meta: 'Full day · 18 holes',            image: '/assets/culture-famous/golf.webp' },
      { code: 'kpop-concert', mono: 'XXXVII',  theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Concert with VIP Access',      meta: '3 hours · soundcheck pass',      image: '/assets/culture-famous/kpop-concert.webp' },
      { code: 'hybe',         mono: 'XXXVIII', theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Label Studio Tour',            meta: '90 min · BTS HQ',                image: '/assets/culture-famous/hybe.webp' },
      { code: 'smtown',       mono: 'XXXIX',   theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Artists Museum',               meta: '2 hours · self-paced',           image: '/assets/culture-famous/smtown.webp' },
      { code: 'kpop-class',   mono: 'XL',      theme: 'kpop',    eyebrow: 'K-pop',     name: 'K-Pop Dance Class',                  meta: '2 hours · private',              image: '/assets/culture-famous/kpop-class.webp' },
      { code: 'namsan-tower', mono: 'XLI',     theme: 'modern',  eyebrow: 'View',      name: 'N Seoul Tower at Sunset',            meta: '2 hours · cable car',            image: '/assets/culture-famous/namsan-tower.webp' },
      { code: 'lotte',        mono: 'XLII',    theme: 'modern',  eyebrow: 'View',      name: 'Skyscraper SkyDeck at Sunset',       meta: '60 min · 555m',                  image: '/assets/culture-famous/lotte.webp' },
      { code: 'hanriver-yacht', mono: 'XLIII', theme: 'nature',  eyebrow: 'River',     name: 'Han River Sunset Yacht Cruise',      meta: '2 hours · with champagne',       image: '/assets/culture-famous/hanriver-yacht.webp' },
      { code: 'hanriver',     mono: 'XLIV',    theme: 'nature',  eyebrow: 'River',     name: 'Han River Sunrise Kayak',            meta: '90 min · sunrise',               image: '/assets/culture-famous/hanriver.webp' },
      { code: 'forestbath',   mono: 'XLV',     theme: 'nature',  eyebrow: 'Forest',    name: 'Mountain Forest Bathing',            meta: 'Half day · with guide',          image: '/assets/culture-famous/forestbath.webp' },
      { code: 'dmz',          mono: 'XLVI',    theme: 'dmz',     eyebrow: 'History',   name: 'Border Zone Private Tour',           meta: 'Full day · pre-cleared',         image: '/assets/culture-famous/dmz.webp' },
      { code: 'royalmusic',   mono: 'XLVII',   theme: 'music',   eyebrow: 'Music',     name: 'Royal Court Music Recital',          meta: '90 min · private',               image: '/assets/culture-famous/royalmusic.webp' },
      { code: 'bboy',         mono: 'XLVIII',  theme: 'perform', eyebrow: 'Dance',     name: 'B-Boy Showcase in Hongdae',          meta: '90 min · world champions',       image: '/assets/culture-famous/bboy.webp' },
      { code: 'nanta',        mono: 'XLIX',    theme: 'perform', eyebrow: 'Show',      name: 'Non-Verbal Drum Show',               meta: '90 min · family-friendly',       image: '/assets/culture-famous/nanta.webp' },
      { code: 'pansori',      mono: 'L',       theme: 'perform', eyebrow: 'Vocal',     name: 'Korean Epic Vocal Performance',      meta: '90 min · with translator',       image: '/assets/culture-famous/pansori.webp' },
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
        image: '/assets/culture-beyond/jeju.webp',
      },
      {
        code: 'busan', mono: 'B', theme: 'ocean',
        name: 'Busan',
        region: 'Southern coast · 2.5h KTX',
        desc: 'Korea\'s second city — beachside sashimi mornings, hillside film-set villages, and a mountain temple above the sea.',
        activities: ['Haeundae beach day', 'Gamcheon culture village', 'Jagalchi fish market', 'Beomeosa mountain temple', 'Gukje street market'],
        image: '/assets/culture-beyond/busan.webp',
      },
      {
        code: 'gyeongju', mono: 'G', theme: 'heritage',
        name: 'Gyeongju',
        region: 'Ancient capital · 2h KTX',
        desc: 'The thousand-year Silla capital — UNESCO temple, royal grotto, tumulus mounds, and observatory of the stars.',
        activities: ['Bulguksa Temple', 'Seokguram Grotto', 'Royal tomb park', 'Cheomseongdae observatory', 'Gyochon hanok village'],
        image: '/assets/culture-beyond/gyeongju.webp',
      },
      {
        code: 'jeonju', mono: 'J', theme: 'hanok',
        name: 'Jeonju',
        region: 'Hanok town · 2h KTX',
        desc: 'Korea\'s preserved hanok village — birthplace of bibimbap and a slow afternoon of tile-roof alleys.',
        activities: ['Hanok village stroll', 'Bibimbap tasting', 'Hanji paper workshop', 'Soju cellars', 'Pungnammun gate walk'],
        image: '/assets/culture-beyond/jeonju.webp',
      },
      {
        code: 'gangwon', mono: 'G', theme: 'nature',
        name: 'Gangwon-do',
        region: 'East mountains & coast · 2–3h',
        desc: 'Korea\'s alpine east — national parks, ski slopes, beach coffee streets, and the Olympic mountain town.',
        activities: ['Seoraksan National Park', 'Gangneung coffee street', 'Sokcho beach & sashimi', 'Pyeongchang Olympic site', 'Naksansa seaside temple'],
        image: '/assets/culture-beyond/gangwon.webp',
      },
      {
        code: 'incheon', mono: 'I', theme: 'modern',
        name: 'Incheon',
        region: 'Gateway city · 1h from Seoul',
        desc: 'Where Korea meets the world — Korea\'s oldest Chinatown, the futurist Songdo skyline, and a heritage island.',
        activities: ['Songdo Central Park', 'Chinatown & Wolmido', 'Ganghwa heritage island', 'Korean Open-Air Museum', 'Sunset airport vista'],
        image: '/assets/culture-beyond/incheon.webp',
      },
    ],
  },
];

// ─── Per-experience detail content (drawer body) ──────────────────────
// Populated for the first three heritage cards. Cards without a detail
// entry still toggle Add/Remove from their card-level button, but
// clicking the card body falls through to the placeholder alert until
// content for that experience is written.
const CULTURE_DETAILS = {
  gyeongbokgung: {
    hero: {
      eyebrow: 'Royal palace · Joseon dynasty seat',
      tagline: "The grandest of Seoul's five royal palaces — where the kings of Korea held court for five hundred years.",
    },
    facts: [
      { label: 'Built',        value: '1395 — the founding palace of the Joseon dynasty' },
      { label: 'Highlights',   value: 'Geunjeongjeon throne hall · Gyeonghoeru lotus pavilion · changing of the royal guard' },
      { label: 'Best time',    value: 'Mid-morning · cherry blossoms in April · maple foliage in late November' },
      { label: 'Tour length',  value: 'Half day · accompanied by a private Korean-history scholar' },
      { label: 'Good to know', value: 'Closed Tuesdays. Hanbok wearers enter free of charge.' },
    ],
    photos: [
      '/assets/culture-heritage/gyeongbokgung.webp',
      '/assets/culture-heritage/gyeongbokgung-2.webp',
      '/assets/culture-heritage/gyeongbokgung-3.webp',
      '/assets/culture-heritage/gyeongbokgung-4.webp',
      '/assets/culture-heritage/gyeongbokgung-5.webp',
      '/assets/culture-heritage/gyeongbokgung-6.webp',
    ],
    youtubeId: '7tNzW7GEHZo',
    videoTitle: 'A walking tour of Gyeongbokgung Palace · 4K',
  },

  changdeokgung: {
    hero: {
      eyebrow: 'UNESCO World Heritage · Joseon royal villa',
      tagline: "The palace built to flow with the mountain behind it — and home of Huwon, the only secret garden of Korean kings open to the public.",
    },
    facts: [
      { label: 'Built',        value: '1405 — the second royal palace of Joseon' },
      { label: 'Highlights',   value: 'Injeongjeon throne hall · Nakseonjae quarters · Huwon back garden' },
      { label: 'Best time',    value: 'Autumn foliage in October–November · cherry-blossom season in April' },
      { label: 'Tour length',  value: '3 hours · with a timed English Secret-Garden ticket' },
      { label: 'Good to know', value: 'Only 50 advance Huwon tickets are sold per slot. UNESCO since 1997.' },
    ],
    photos: [
      '/assets/culture-heritage/changdeokgung.webp',
      '/assets/culture-heritage/changdeokgung-2.webp',
      '/assets/culture-heritage/changdeokgung-3.webp',
      '/assets/culture-heritage/changdeokgung-4.webp',
      '/assets/culture-heritage/changdeokgung-5.webp',
      '/assets/culture-heritage/changdeokgung-6.webp',
    ],
    youtubeId: 'bliX8MrQdRE',
    videoTitle: 'Walking through the history of Changdeokgung Palace',
  },

  deoksugung: {
    hero: {
      eyebrow: 'Royal palace · East-West hybrid',
      tagline: "The only Joseon palace with Western neoclassical halls — and Seoul's most atmospheric evening stroll, by lantern-light.",
    },
    facts: [
      { label: 'Built',        value: '1593 (refuge palace) · Seokjojeon Western hall completed 1910' },
      { label: 'Highlights',   value: 'Seokjojeon stone hall · the Stone Wall Road · evening lantern lighting' },
      { label: 'Best time',    value: 'After sunset · cherry-blossom evenings in April' },
      { label: 'Tour length',  value: '2 hours · accompanied by a cultural-tour guide' },
      { label: 'Good to know', value: 'Closed Mondays. Royal Guard changes at the front gate at 11am, 2pm, and 3:30pm.' },
    ],
    photos: [
      '/assets/culture-heritage/deoksugung.webp',
      '/assets/culture-heritage/deoksugung-2.webp',
      '/assets/culture-heritage/deoksugung-3.webp',
      '/assets/culture-heritage/deoksugung-4.webp',
      '/assets/culture-heritage/deoksugung-5.webp',
      '/assets/culture-heritage/deoksugung-6.webp',
    ],
    youtubeId: 'GRVj6wbFlv4',
    videoTitle: 'Deoksugung Palace Night Tour · 4K',
  },

  changgyeonggung: {
    hero: {
      eyebrow: 'Royal villa palace · Joseon dynasty',
      tagline: "The quietest of Seoul's five palaces — and the only one where the wooden gates open at night, twice a year, for the Moonlight Lotus opening.",
    },
    facts: [
      { label: 'Built',        value: '1483 — palace for retired kings and queen dowagers' },
      { label: 'Highlights',   value: 'Myeongjeongjeon throne hall (oldest surviving Joseon throne hall) · Tongmyeongjeon queen\'s quarters · Chundangji pond' },
      { label: 'Best time',    value: 'Spring and autumn Moonlight openings · cherry blossom in April · maple in November' },
      { label: 'Tour length',  value: '2 hours · evening · seasonal Moonlight ticket required for night entry' },
      { label: 'Good to know', value: 'Moonlight opening runs spring + autumn only — limited tickets. Closed Mondays.' },
    ],
    photos: [
      '/assets/culture-heritage/changgyeonggung.webp',
      '/assets/culture-heritage/changgyeonggung-2.webp',
      '/assets/culture-heritage/changgyeonggung-3.webp',
      '/assets/culture-heritage/changgyeonggung-4.webp',
      '/assets/culture-heritage/changgyeonggung-5.webp',
      '/assets/culture-heritage/changgyeonggung-6.webp',
    ],
    youtubeId: 'mouLpOiPAYk',
    videoTitle: 'Changgyeonggung Palace walking tour · 4K',
  },

  jongmyo: {
    hero: {
      eyebrow: 'UNESCO World Heritage · Royal ancestral shrine',
      tagline: "The oldest royal Confucian shrine still standing in the world — where five hundred years of Joseon kings and queens are remembered.",
    },
    facts: [
      { label: 'Built',        value: '1394 · destroyed 1592 · rebuilt 1608' },
      { label: 'Highlights',   value: 'Jeongjeon main hall (longest single wooden building in East Asia) · Yeongnyeongjeon hall · annual Jongmyo Jerye royal rite' },
      { label: 'Best time',    value: 'First Sunday in May for the Jongmyo Jerye royal rite — Korea\'s most solemn living ceremony' },
      { label: 'Tour length',  value: '2 hours · weekday entry is guided-only · weekends self-guided with audio' },
      { label: 'Good to know', value: 'UNESCO inscribed 1995. The rite music is separately UNESCO Intangible Heritage. Closed Tuesdays.' },
    ],
    photos: [
      '/assets/culture-heritage/jongmyo.webp',
      '/assets/culture-heritage/jongmyo-2.webp',
      '/assets/culture-heritage/jongmyo-3.webp',
      '/assets/culture-heritage/jongmyo-4.webp',
      '/assets/culture-heritage/jongmyo-5.webp',
      '/assets/culture-heritage/jongmyo-6.webp',
    ],
    youtubeId: 'mst8ImGep04',
    videoTitle: 'Jongmyo Daeje royal ancestral rite · Seoul',
  },

  huwon: {
    hero: {
      eyebrow: 'Secret Garden · Joseon royal grounds',
      tagline: "Three centuries of kings walked here in private — the 78-acre back garden of Changdeokgung, accessible only by timed reservation and English-guided tour.",
    },
    facts: [
      { label: 'Era',          value: 'Joseon dynasty · publicly accessible only since 2004' },
      { label: 'Highlights',   value: 'Buyongji pond and Juhamnu library pavilion · Aeryeonji pond · Ongnyucheon stream and Soyojeong' },
      { label: 'Best time',    value: 'Late October to mid-November for the maples · early April for cherry blossom' },
      { label: 'Tour length',  value: '90 min · English-guided · 50 advance + 50 walk-up tickets per slot' },
      { label: 'Good to know', value: 'Inside Changdeokgung — combine in one half-day. Closed Mondays. Slight inclines along the route.' },
    ],
    photos: [
      '/assets/culture-heritage/huwon.webp',
      '/assets/culture-heritage/huwon-2.webp',
      '/assets/culture-heritage/huwon-3.webp',
      '/assets/culture-heritage/huwon-4.webp',
      '/assets/culture-heritage/huwon-5.webp',
      '/assets/culture-heritage/huwon-6.webp',
    ],
    youtubeId: 'Hp92HKSR8cE',
    videoTitle: "I Found Seoul's Hidden Royal Garden at Changdeokgung",
  },

  bukchon: {
    hero: {
      eyebrow: 'Hanok village · Living heritage',
      tagline: "Nine hundred tile-roof hanok houses still lived in — a five-hundred-year residential village between Gyeongbokgung and Changdeokgung.",
    },
    facts: [
      { label: 'Era',          value: 'Joseon-era residential quarter for nobility · most extant hanok rebuilt 1920s' },
      { label: 'Highlights',   value: 'Bukchon-ro 11-gil tile-roof view · Gahoe-dong artisan workshops · Bukchon Cultural Center · skyline framings' },
      { label: 'Best time',    value: 'Early morning (8–10am) or weekday — the village is still residential, quiet hours apply' },
      { label: 'Tour length',  value: '2 hours · self-paced walking · local-guide option available' },
      { label: 'Good to know', value: 'Photography permitted on streets only. Hanbok-wear grants free entry to nearby palaces.' },
    ],
    photos: [
      '/assets/culture-heritage/bukchon.webp',
      '/assets/culture-heritage/bukchon-2.webp',
      '/assets/culture-heritage/bukchon-3.webp',
      '/assets/culture-heritage/bukchon-4.webp',
      '/assets/culture-heritage/bukchon-5.webp',
      '/assets/culture-heritage/bukchon-6.webp',
    ],
    youtubeId: 'osiAdxNVZUs',
    videoTitle: "Bukchon — Seoul's most beautiful hanok village walking tour",
  },

  bongeunsa: {
    hero: {
      eyebrow: 'City mountain temple · 1,200 years',
      tagline: "A working mountain temple in the heart of Gangnam — and a 23-metre standing Buddha that looks down across the skyscrapers below.",
    },
    facts: [
      { label: 'Founded',      value: '794 · patron temple of the Joseon royal family' },
      { label: 'Highlights',   value: 'Mireukdaebul standing Buddha (23 m) · Panjeon scripture hall · 3,479-volume woodblock Tripitaka collection' },
      { label: 'Best time',    value: 'Weekday mornings · the Lotus Lantern Festival around Buddha\'s Birthday in May' },
      { label: 'Tour length',  value: '90 min · optional templestay program for foreign visitors on Thursdays' },
      { label: 'Good to know', value: 'Free entry. Halls require quiet — bow at the threshold. English templestay ₩10,000.' },
    ],
    photos: [
      '/assets/culture-heritage/bongeunsa.webp',
      '/assets/culture-heritage/bongeunsa-2.webp',
      '/assets/culture-heritage/bongeunsa-3.webp',
      '/assets/culture-heritage/bongeunsa-4.webp',
      '/assets/culture-heritage/bongeunsa-5.webp',
      '/assets/culture-heritage/bongeunsa-6.webp',
    ],
    youtubeId: '374gCD1LcJM',
    videoTitle: "Is Gangnam's Bongeunsa Temple Worth the Visit?",
  },

  jogyesa: {
    hero: {
      eyebrow: 'Buddhist headquarters · Downtown Seoul',
      tagline: "The headquarters of Korean Jogye Buddhism, in the heart of downtown — where ten thousand lotus lanterns hang each spring for Buddha's Birthday.",
    },
    facts: [
      { label: 'Founded',      value: '1395 · rebuilt at this site in 1936' },
      { label: 'Highlights',   value: 'Daeungjeon main hall and the three Buddha statues · the 500-year locust and pine trees · seasonal lantern displays' },
      { label: 'Best time',    value: 'Yeon Deung Hoe Lotus Lantern Festival in late April–May (UNESCO Intangible Heritage)' },
      { label: 'Tour length',  value: '60 min · drop-in · meditation program available by request' },
      { label: 'Good to know', value: 'Free entry. Photography allowed in halls without flash. Open 4am–9pm.' },
    ],
    photos: [
      '/assets/culture-heritage/jogyesa.webp',
      '/assets/culture-heritage/jogyesa-2.webp',
      '/assets/culture-heritage/jogyesa-3.webp',
      '/assets/culture-heritage/jogyesa-4.webp',
      '/assets/culture-heritage/jogyesa-5.webp',
      '/assets/culture-heritage/jogyesa-6.webp',
    ],
    youtubeId: 'DoZYsEjEBeQ',
    videoTitle: '[4K] Jogyesa Buddhist Temple · Seoul',
  },

  haeinsa: {
    hero: {
      eyebrow: 'UNESCO templestay · Gayasan mountain temple',
      tagline: "A thousand-year mountain temple in the south — where you sleep beside the world's most complete printed Buddhist canon, carved into 81,000 wooden blocks.",
    },
    facts: [
      { label: 'Founded',      value: '802 · UNESCO inscribed for the Tripitaka Koreana woodblocks (1995)' },
      { label: 'Highlights',   value: 'Janggyeong Panjeon depository · the 81,258 woodblocks · pre-dawn temple bells · monk-led tea ceremony' },
      { label: 'Best time',    value: 'Late October–November for the maple-covered mountain ascent' },
      { label: 'Tour length',  value: '24 hours overnight templestay · 2.5h KTX from Seoul + 1h transfer' },
      { label: 'Good to know', value: 'Vegetarian temple meals. Modest dress. Lights out at 9pm; bell at 3am.' },
    ],
    photos: [
      '/assets/culture-heritage/haeinsa.webp',
      '/assets/culture-heritage/haeinsa-2.webp',
      '/assets/culture-heritage/haeinsa-3.webp',
      '/assets/culture-heritage/haeinsa-4.webp',
      '/assets/culture-heritage/haeinsa-5.webp',
      '/assets/culture-heritage/haeinsa-6.webp',
    ],
    youtubeId: 'iyj8VY6hBD8',
    videoTitle: 'Exploring Haeinsa Temple · The Home of Tripitaka Koreana',
  },

  meditation: {
    hero: {
      eyebrow: 'Sitting practice · Guided by a monk',
      tagline: "Two hours inside a Seoul temple's meditation hall, led by a monk who speaks English — the gentlest introduction to Seon, Korean Zen Buddhism.",
    },
    facts: [
      { label: 'Format',       value: 'Sitting meditation (chamseon) · walking meditation · tea conversation with the monk' },
      { label: 'Setting',      value: 'A working Seoul temple — Jogyesa, Bongeunsa, or the International Seon Center by request' },
      { label: 'Best for',     value: 'First-time meditators · couples seeking a quiet hour · curious skeptics' },
      { label: 'Length',       value: '2 hours · English instruction · floor cushions and tea provided' },
      { label: 'Good to know', value: 'No prior practice required. Loose clothing recommended; shoes off at the hall threshold.' },
    ],
    photos: [
      '/assets/culture-heritage/meditation.webp',
      '/assets/culture-heritage/meditation-2.webp',
      '/assets/culture-heritage/meditation-3.webp',
      '/assets/culture-heritage/meditation-4.webp',
      '/assets/culture-heritage/meditation-5.webp',
      '/assets/culture-heritage/meditation-6.webp',
    ],
    youtubeId: 'UH44Hx3wyQI',
    videoTitle: 'Templestay at Bulguksa · Buddhist meditation experience',
  },

  tea: {
    hero: {
      eyebrow: 'Korean tea ceremony · Private session',
      tagline: "Ninety minutes with a tea master in a hanok tearoom — Korean green and fermented teas, slow and ceremonial in the Joseon-scholar manner.",
    },
    facts: [
      { label: 'Format',       value: 'Three to five teas · seasonal Korean sweets · the master\'s commentary on each pot' },
      { label: 'Setting',      value: 'A private hanok tearoom in Bukchon or Insadong' },
      { label: 'Best for',     value: 'Slow afternoons · couples · anyone curious about Korean over Japanese tea culture' },
      { label: 'Length',       value: '90 min · 2–4 guests · English interpretation included' },
      { label: 'Good to know', value: 'Hosted in stocking feet — wear socks. No outside drinks or strong perfume.' },
    ],
    photos: [
      '/assets/culture-heritage/tea.webp',
      '/assets/culture-heritage/tea-2.webp',
      '/assets/culture-heritage/tea-3.webp',
      '/assets/culture-heritage/tea-4.webp',
      '/assets/culture-heritage/tea-5.webp',
      '/assets/culture-heritage/tea-6.webp',
    ],
    youtubeId: 'PHsHir3eKxs',
    videoTitle: 'Darye — the Korean tea ceremony',
  },

  calligraphy: {
    hero: {
      eyebrow: 'Brush, ink, and paper · With a master',
      tagline: "Two hours grinding ink and pulling a horsehair brush across mulberry paper — guided by a master who'll write your Korean name as a parting gift.",
    },
    facts: [
      { label: 'Format',       value: 'Posture · brush hold · stroke order · one finished piece you take home' },
      { label: 'Setting',      value: 'A private calligraphy studio in Insadong or Bukchon' },
      { label: 'Best for',     value: 'Patient hands · anyone moved by East Asian brushwork' },
      { label: 'Length',       value: '2 hours · 1–4 guests · English interpretation included' },
      { label: 'Good to know', value: 'Ink stains permanent. Sleeves up or apron provided. Children 10+ welcome.' },
    ],
    photos: [
      '/assets/culture-heritage/calligraphy.webp',
      '/assets/culture-heritage/calligraphy-2.webp',
      '/assets/culture-heritage/calligraphy-3.webp',
      '/assets/culture-heritage/calligraphy-4.webp',
      '/assets/culture-heritage/calligraphy-5.webp',
      '/assets/culture-heritage/calligraphy-6.webp',
    ],
    youtubeId: 'EVrAXoQnZOs',
    videoTitle: 'Seoye · Korean Calligraphy Tutorial',
  },

  hanbok: {
    hero: {
      eyebrow: 'Royal court dress · Private fitting + palace photoshoot',
      tagline: "A half day to be dressed in a Joseon court hanbok — the heavier, embroidered kind royalty actually wore — and photographed in a palace courtyard.",
    },
    facts: [
      { label: 'Format',       value: 'Private dressing room · two outfits · professional palace photoshoot · 50 retouched photos' },
      { label: 'Setting',      value: 'Gyeongbokgung or Changdeokgung courtyards — hanbok wearers enter all palaces free' },
      { label: 'Best for',     value: 'Couples · families · multi-generational guests · returning visitors' },
      { label: 'Length',       value: 'Half day · 1–4 guests · hair and accessories included' },
      { label: 'Good to know', value: 'Bring soft socks. Heavy court hanbok is warm — request the summer-weight set if visiting Jun–Sep.' },
    ],
    photos: [
      '/assets/culture-heritage/hanbok.webp',
      '/assets/culture-heritage/hanbok-2.webp',
      '/assets/culture-heritage/hanbok-3.webp',
      '/assets/culture-heritage/hanbok-4.webp',
      '/assets/culture-heritage/hanbok-5.webp',
      '/assets/culture-heritage/hanbok-6.webp',
    ],
    youtubeId: '6GDffbzuJBU',
    videoTitle: 'HANBOK Experience at Gyeongbokgung Palace · Premium Photoshoot',
  },

  royalcuisine: {
    hero: {
      eyebrow: 'Joseon royal court cuisine · Tasting',
      tagline: "Twelve courses of the cuisine once cooked only for the king — by a chef whose lineage traces to the last Joseon royal household.",
    },
    facts: [
      { label: 'Format',       value: 'Multi-course Hanjeongsik tasting menu · seasonal · with optional sommelier pairing' },
      { label: 'Setting',      value: 'A Michelin-noted royal-cuisine restaurant in Bukchon or central Seoul' },
      { label: 'Best for',     value: 'Slow dinners · culinary travelers · special-occasion meals' },
      { label: 'Length',       value: '2–2.5 hours · 2–6 guests · dinner only · 7 days advance booking' },
      { label: 'Good to know', value: 'No spice in the classic menu. Vegetarian and shellfish-free options with 48h notice.' },
    ],
    photos: [
      '/assets/culture-heritage/royalcuisine.webp',
      '/assets/culture-heritage/royalcuisine-2.webp',
      '/assets/culture-heritage/royalcuisine-3.webp',
      '/assets/culture-heritage/royalcuisine-4.webp',
      '/assets/culture-heritage/royalcuisine-5.webp',
      '/assets/culture-heritage/royalcuisine-6.webp',
    ],
    youtubeId: 'nPdlof5VpEA',
    videoTitle: 'Korean Royal Court Cuisine · Jia Choi',
  },

  nationalmuseum: {
    hero: {
      eyebrow: 'National Museum of Korea · Curator-led',
      tagline: "Five thousand years of Korean civilization in a single afternoon — walked by a curator who can read what the bronze and porcelain are actually saying.",
    },
    facts: [
      { label: 'Founded',      value: 'Current Yongsan campus opened 2005 · sixth-largest museum in the world' },
      { label: 'Highlights',   value: 'Gold crown of Silla · Bangasayusang pensive bodhisattva · the celadon and Goryeo galleries' },
      { label: 'Best time',    value: 'Weekday mornings · Wednesday evening late hours (open until 9pm)' },
      { label: 'Tour length',  value: '3 hours · with a private English-speaking curator from the museum panel' },
      { label: 'Good to know', value: 'Free entry to permanent galleries. Closed January 1 and Lunar New Year.' },
    ],
    photos: [
      '/assets/culture-heritage/nationalmuseum.webp',
      '/assets/culture-heritage/nationalmuseum-2.webp',
      '/assets/culture-heritage/nationalmuseum-3.webp',
      '/assets/culture-heritage/nationalmuseum-4.webp',
      '/assets/culture-heritage/nationalmuseum-5.webp',
      '/assets/culture-heritage/nationalmuseum-6.webp',
    ],
    youtubeId: 'k__4SUSF_nQ',
    videoTitle: 'Walking tour of the National Museum of Korea · Full 4K',
  },

  warmemorial: {
    hero: {
      eyebrow: 'War Memorial of Korea · Guided',
      tagline: "The Korean War, the country that built itself out of its rubble, and the quiet courtyard of names — walked with a guide who understands what to dwell on and what to pass by.",
    },
    facts: [
      { label: 'Founded',      value: '1994 · built on the former Korean Army headquarters' },
      { label: 'Highlights',   value: 'Outdoor military hardware park (F-86 vs MiG-15) · wall of fallen soldiers · the "Statue of Brothers"' },
      { label: 'Best time',    value: 'Weekday afternoon · combine with a Yongsan dinner afterwards' },
      { label: 'Tour length',  value: '2 hours · with an English-speaking guide' },
      { label: 'Good to know', value: 'Free entry. Emotionally heavy in places — children under 10 not recommended. Closed Mondays.' },
    ],
    photos: [
      '/assets/culture-heritage/warmemorial.webp',
      '/assets/culture-heritage/warmemorial-2.webp',
      '/assets/culture-heritage/warmemorial-3.webp',
      '/assets/culture-heritage/warmemorial-4.webp',
      '/assets/culture-heritage/warmemorial-5.webp',
      '/assets/culture-heritage/warmemorial-6.webp',
    ],
    youtubeId: 'J87GizY08dw',
    videoTitle: 'War Memorial of Korea Tour · Seoul',
  },

  cheonggye: {
    hero: {
      eyebrow: 'Restored stream · Downtown Seoul',
      tagline: "A four-mile downtown stream the city paved over for fifty years and then unearthed again — Seoul's most surprising evening walk.",
    },
    facts: [
      { label: 'Era',          value: 'Joseon-era waterway · paved over 1958 · restored and reopened 2005' },
      { label: 'Highlights',   value: 'Cheonggye Plaza waterfall · 22 historic and modern bridges · seasonal lantern displays' },
      { label: 'Best time',    value: 'After sunset · Seoul Lantern Festival in November' },
      { label: 'Tour length',  value: '90 min · self-guided downstream walk · with optional local guide' },
      { label: 'Good to know', value: 'Free. Stream-level paths get slippery after rain — use the upper promenade in wet weather.' },
    ],
    photos: [
      '/assets/culture-heritage/cheonggye.webp',
      '/assets/culture-heritage/cheonggye-2.webp',
      '/assets/culture-heritage/cheonggye-3.webp',
      '/assets/culture-heritage/cheonggye-4.webp',
      '/assets/culture-heritage/cheonggye-5.webp',
      '/assets/culture-heritage/cheonggye-6.webp',
    ],
    youtubeId: 'CDnucr78Uqs',
    videoTitle: '[4K] Cheonggyecheon Stream walking tour · Seoul',
  },

  // ─── Shop (Page Ⅱ) ─────────────────────────────────────────────────
  seongsu: {
    hero: {
      eyebrow: 'Concept café district · Industrial chic',
      tagline: "Korea's Brooklyn — old shoe-factory brick converted into the country's most photographed cafés, indie fashion brands, and weekend brunches.",
    },
    facts: [
      { label: 'Vibe',         value: 'Warehouse-conversion cafés · emerging Korean designers · hipster energy' },
      { label: 'Highlights',   value: 'Café streets in old factories · Daelim Changgo gallery · K-pop SM Town HQ · Seoul Forest at the edge' },
      { label: 'Best time',    value: 'Weekday afternoon for cafés · Saturday morning for brunch crowd' },
      { label: 'Tour length',  value: '3 hours · self-paced with a local map' },
      { label: 'Good to know', value: 'Most boutiques closed Mondays. Cards and mobile payment everywhere.' },
    ],
    photos: [
      '/assets/culture-shop/seongsu.webp',
      '/assets/culture-shop/seongsu-2.webp',
      '/assets/culture-shop/seongsu-3.webp',
      '/assets/culture-shop/seongsu-4.webp',
      '/assets/culture-shop/seongsu-5.webp',
      '/assets/culture-shop/seongsu-6.webp',
    ],
    youtubeId: 'AWzn-Jfie9A',
    videoTitle: 'Seongsu — The Brooklyn of Seoul · 4K Walking Tour',
  },

  myeongdong: {
    hero: {
      eyebrow: 'K-Beauty epicenter · Main shopping street',
      tagline: "The K-beauty mecca every visitor walks at least once — neon-lit cosmetics flagships, tax-free shopping, and the city's most famous street-food alley.",
    },
    facts: [
      { label: 'Vibe',         value: 'K-Beauty mecca · tourist epicenter · late-night neon' },
      { label: 'Highlights',   value: 'Olive Young Myeongdong Town flagship · Innisfree / Etude / Laneige flagships · the Myeongdong Cathedral · the street-food alley' },
      { label: 'Best time',    value: 'Weekday late afternoon · evening for the lit signage' },
      { label: 'Tour length',  value: '3 hours · with a personal K-beauty stylist' },
      { label: 'Good to know', value: 'Tax-free at every cosmetics shop with passport. Heavy crowds Friday–Sunday.' },
    ],
    photos: [
      '/assets/culture-shop/myeongdong.webp',
      '/assets/culture-shop/myeongdong-2.webp',
      '/assets/culture-shop/myeongdong-3.webp',
      '/assets/culture-shop/myeongdong-4.webp',
      '/assets/culture-shop/myeongdong-5.webp',
      '/assets/culture-shop/myeongdong-6.webp',
    ],
    youtubeId: '4HzRgqQkygc',
    videoTitle: '[4K] Myeongdong Shopping Area · 1 hour walking tour',
  },

  apgujeong: {
    hero: {
      eyebrow: 'Luxury boutique row · Gangnam',
      tagline: "Korea's Beverly Hills — the avenue where every European maison and Korean entertainment label has its flagship, and where K-pop idols actually shop.",
    },
    facts: [
      { label: 'Vibe',         value: 'Korea\'s Beverly Hills · entertainment-company HQ row · old-money Gangnam' },
      { label: 'Highlights',   value: 'Galleria Department Store · Cheongdam Fashion Street · Apgujeong Rodeo · the K-pop entertainment buildings (SM · JYP · YG · HYBE)' },
      { label: 'Best time',    value: 'Tuesday–Thursday for in-store stylist availability' },
      { label: 'Tour length',  value: 'Half day · with a private shopping concierge' },
      { label: 'Good to know', value: 'VIP shopping suites available by reservation. Most boutiques close by 8pm.' },
    ],
    photos: [
      '/assets/culture-shop/apgujeong.webp',
      '/assets/culture-shop/apgujeong-2.webp',
      '/assets/culture-shop/apgujeong-3.webp',
      '/assets/culture-shop/apgujeong-4.webp',
      '/assets/culture-shop/apgujeong-5.webp',
      '/assets/culture-shop/apgujeong-6.webp',
    ],
    youtubeId: 'kOnI30A8Fz0',
    videoTitle: '[4K] Apgujeong Rodeo — Walking Tour',
  },

  coex: {
    hero: {
      eyebrow: 'Mega mall · Starfield Library',
      tagline: "Korea's largest underground mall, the country's most photographed library, an aquarium, and a Bongeunsa temple two minutes' walk away — all under one all-weather roof.",
    },
    facts: [
      { label: 'Vibe',         value: 'Indoor mega-mall · all-weather · Instagram-famous library wall' },
      { label: 'Highlights',   value: 'Starfield Library photo wall (13 m bookshelves) · COEX Aquarium · Megabox cinema · SM Town K-pop museum · 200+ shops' },
      { label: 'Best time',    value: 'Rainy days · weekday afternoons · evening 8pm for library lighting' },
      { label: 'Tour length',  value: '3 hours · indoors all day, easy for seniors and families' },
      { label: 'Good to know', value: 'Direct subway connection (Samseong Line 2 / Bongeunsa Line 9). Free Wi-Fi. Library open until 10pm.' },
    ],
    photos: [
      '/assets/culture-shop/coex.webp',
      '/assets/culture-shop/coex-2.webp',
      '/assets/culture-shop/coex-3.webp',
      '/assets/culture-shop/coex-4.webp',
      '/assets/culture-shop/coex-5.webp',
      '/assets/culture-shop/coex-6.webp',
    ],
    youtubeId: 'K7qYRsU5kRE',
    videoTitle: 'Starfield Library Seoul · 4K Walking Tour Inside COEX Mall',
  },

  garosugil: {
    hero: {
      eyebrow: 'Tree-lined boutique avenue · Sinsa',
      tagline: "Korea's Champs-Élysées — a ginkgo-lined street of Korean designer boutiques, third-wave coffee, and the city's gentlest fashion-walking tempo.",
    },
    facts: [
      { label: 'Vibe',         value: 'Tree-lined leisurely Parisian-style boutique avenue · Apple Garosugil flagship anchor' },
      { label: 'Highlights',   value: '160 ginkgo trees along the avenue · Apple Garosugil flagship · independent Korean designer shops · the Sero-gil side alleys' },
      { label: 'Best time',    value: 'Mid-October for the golden ginkgo canopy · weekend afternoons' },
      { label: 'Tour length',  value: '2 hours · self-paced walking' },
      { label: 'Good to know', value: 'Less crowded than Hongdae or Myeongdong. Side alleys (Sero-gil) hide the best boutiques.' },
    ],
    photos: [
      '/assets/culture-shop/garosugil.webp',
      '/assets/culture-shop/garosugil-2.webp',
      '/assets/culture-shop/garosugil-3.webp',
      '/assets/culture-shop/garosugil-4.webp',
      '/assets/culture-shop/garosugil-5.webp',
      '/assets/culture-shop/garosugil-6.webp',
    ],
    youtubeId: 'SbRXkkTsNMo',
    videoTitle: '[4K] Sinsadong Garosu-gil — Walking Tour',
  },

  hongdae: {
    hero: {
      eyebrow: 'Youth fashion quarter · Hongik University',
      tagline: "The university district that became Korea's street-fashion capital — vintage racks, indie designers, street performers, and the energy you can't get anywhere else after 8pm.",
    },
    facts: [
      { label: 'Vibe',         value: 'University street fashion · indie music · evening energy · creative buskers' },
      { label: 'Highlights',   value: 'Eoulmadang-ro main fashion street · vintage shops · Hongdae Free Market on weekends · live-music venues · street art alleys' },
      { label: 'Best time',    value: 'After 5pm any day · Saturday afternoon for the Free Market' },
      { label: 'Tour length',  value: '3 hours · evening best · with a fashion-savvy guide' },
      { label: 'Good to know', value: 'Best after dark. Cards accepted everywhere. Crowds peak 9–11pm.' },
    ],
    photos: [
      '/assets/culture-shop/hongdae.webp',
      '/assets/culture-shop/hongdae-2.webp',
      '/assets/culture-shop/hongdae-3.webp',
      '/assets/culture-shop/hongdae-4.webp',
      '/assets/culture-shop/hongdae-5.webp',
      '/assets/culture-shop/hongdae-6.webp',
    ],
    youtubeId: '4cT8czPr3zc',
    videoTitle: 'Nightlife in Hongdae · 4K Walking Tour',
  },

  ikseondong: {
    hero: {
      eyebrow: 'Hanok alleys · Café + design district',
      tagline: "A century-old hanok village turned café and indie-design quarter — narrow lanes of tile-roof houses now serving pour-over coffee, hand-thrown ceramics, and stationery you'll want to pack home.",
    },
    facts: [
      { label: 'Vibe',         value: 'Restored hanok village turned café + indie-boutique district' },
      { label: 'Highlights',   value: 'Hanok cafés (Rain Report Rainbow · Seoul Coffee Ikseon) · hanji paper shops · ceramic and stationery designers · 1920s alley network' },
      { label: 'Best time',    value: 'Weekday afternoon (3–5pm) for golden hour in the alleys' },
      { label: 'Tour length',  value: '2 hours · self-paced' },
      { label: 'Good to know', value: 'Cards + mobile payment widely accepted. Quiet hours observed after 11pm.' },
    ],
    photos: [
      '/assets/culture-shop/ikseondong.webp',
      '/assets/culture-shop/ikseondong-2.webp',
      '/assets/culture-shop/ikseondong-3.webp',
      '/assets/culture-shop/ikseondong-4.webp',
      '/assets/culture-shop/ikseondong-5.webp',
      '/assets/culture-shop/ikseondong-6.webp',
    ],
    youtubeId: 'n3vCPACya3M',
    videoTitle: 'Ikseondong Hanok Village · Seoul Walking Tour',
  },

  gwangjang: {
    hero: {
      eyebrow: 'Traditional street food market · 1905',
      tagline: "Korea's most beloved street-food institution — 110 years of bindaetteok and mayak gimbap, served on communal benches that haven't moved in three generations.",
    },
    facts: [
      { label: 'Vibe',         value: 'Korea\'s 110-year street-food temple · standing-room communal benches' },
      { label: 'Highlights',   value: 'Bindaetteok mungbean pancake row · mayak gimbap stalls · live octopus · second-floor textiles and hanbok' },
      { label: 'Best time',    value: 'Mid-afternoon (after lunch rush, before dinner) · weekday for shorter waits' },
      { label: 'Tour length',  value: '90 min · with a foodie guide to navigate the stalls' },
      { label: 'Good to know', value: 'Cash recommended at stalls (most also take cards now). Communal seating only.' },
    ],
    photos: [
      '/assets/culture-shop/gwangjang.webp',
      '/assets/culture-shop/gwangjang-2.webp',
      '/assets/culture-shop/gwangjang-3.webp',
      '/assets/culture-shop/gwangjang-4.webp',
      '/assets/culture-shop/gwangjang-5.webp',
      '/assets/culture-shop/gwangjang-6.webp',
    ],
    youtubeId: 'oPMcMU6Gros',
    videoTitle: 'Best Korean Street Food Tour at Seoul\'s Gwangjang Market',
  },

  namdaemun: {
    hero: {
      eyebrow: 'Largest traditional market · 600 years',
      tagline: "Korea's largest and oldest traditional market — 10,000 stalls under the National Treasure gate, with sections that haven't closed since the 1950s.",
    },
    facts: [
      { label: 'Vibe',         value: 'Korea\'s largest traditional market · 600 years old · 10,000 stalls · 24-hour wholesale sections' },
      { label: 'Highlights',   value: 'Sungnyemun Gate (National Treasure #1) · the galchi-jorim cutlassfish alley · Korean ginseng row · the night fashion market' },
      { label: 'Best time',    value: 'Evening for the night market · pre-dawn for fish wholesale' },
      { label: 'Tour length',  value: '2 hours · evening recommended · with a local guide' },
      { label: 'Good to know', value: 'Some sections 24h. Bargaining accepted at non-food stalls. Cash useful for older vendors.' },
    ],
    photos: [
      '/assets/culture-shop/namdaemun.webp',
      '/assets/culture-shop/namdaemun-2.webp',
      '/assets/culture-shop/namdaemun-3.webp',
      '/assets/culture-shop/namdaemun-4.webp',
      '/assets/culture-shop/namdaemun-5.webp',
      '/assets/culture-shop/namdaemun-6.webp',
    ],
    youtubeId: '-bXP6gtHfwk',
    videoTitle: '[4K] Namdaemun Market — Walking Tour',
  },

  ddp: {
    hero: {
      eyebrow: 'Dongdaemun Design Plaza · Zaha Hadid',
      tagline: "Zaha Hadid's silver curving silhouette — Korea's most photographed modern building, an LED rose garden, designer pop-ups, and 24-hour shopping on every side.",
    },
    facts: [
      { label: 'Built',        value: '2014 · Zaha Hadid Architects · "Metonymic Landscape" parametric design' },
      { label: 'Highlights',   value: 'The curving Zaha Hadid exterior · LED Rose Garden (25,000 LED roses) · designer pop-up halls · DDP Design Museum' },
      { label: 'Best time',    value: 'Evening for the LED illumination and rose-garden lighting' },
      { label: 'Tour length',  value: '2 hours · architecture tour available free at 11am, 2pm, 4pm' },
      { label: 'Good to know', value: 'Always free to enter the building. Some exhibits ticketed. Architecture tour in English.' },
    ],
    photos: [
      '/assets/culture-shop/ddp.webp',
      '/assets/culture-shop/ddp-2.webp',
      '/assets/culture-shop/ddp-3.webp',
      '/assets/culture-shop/ddp-4.webp',
      '/assets/culture-shop/ddp-5.webp',
      '/assets/culture-shop/ddp-6.webp',
    ],
    youtubeId: '6SIqfN8abT8',
    videoTitle: '[4K] Walking inside Dongdaemun Design Plaza',
  },

  ddm: {
    hero: {
      eyebrow: 'Midnight fashion wholesale · Dongdaemun',
      tagline: "The world's only fashion district that hits peak energy at 2am — where Korea's fast-fashion brands source, and buyers from Tokyo and Bangkok arrive on overnight flights to shop the racks.",
    },
    facts: [
      { label: 'Vibe',         value: 'After-midnight fashion wholesale capital · industry buyer scene · 26 malls in 9 blocks' },
      { label: 'Highlights',   value: 'Doota Mall · Migliore · APM Place · Hello apM · the wholesale alleys behind the towers' },
      { label: 'Best time',    value: '11pm – 5am for the wholesale energy · or daytime at Doota/Migliore for tourist shopping' },
      { label: 'Tour length',  value: '3 hours late-night · with an industry-savvy guide' },
      { label: 'Good to know', value: 'Wholesale alleys require bulk orders. Doota and Migliore open to retail 24h.' },
    ],
    photos: [
      '/assets/culture-shop/ddm.webp',
      '/assets/culture-shop/ddm-2.webp',
      '/assets/culture-shop/ddm-3.webp',
      '/assets/culture-shop/ddm-4.webp',
      '/assets/culture-shop/ddm-5.webp',
      '/assets/culture-shop/ddm-6.webp',
    ],
    youtubeId: 'Pq0pFR7YZ4Y',
    videoTitle: 'Seoul Korea · Dongdaemun Shopping Complex 4K Walking Tour',
  },

  kbeauty: {
    hero: {
      eyebrow: 'K-Beauty flagship tour · With samples',
      tagline: "A half day inside Korea's cosmetics industry — Olive Young, Amorepacific, Laneige, Innisfree, and the indie K-brands you can't yet buy back home.",
    },
    facts: [
      { label: 'Format',       value: 'Curated flagship circuit · with brand-rep concierges · samples included at each stop' },
      { label: 'Highlights',   value: 'Olive Young Myeongdong Global Town · Amorepacific HQ flagship in Yongsan · Laneige + Innisfree + Etude flagships · indie K-brand stockists' },
      { label: 'Best time',    value: 'Weekday afternoon for personalized consultations' },
      { label: 'Tour length',  value: 'Half day · 1–4 guests · with a private K-beauty stylist' },
      { label: 'Good to know', value: 'Tax-free at all stops with passport. Free trial samples included. Skin-type consultation recommended in advance.' },
    ],
    photos: [
      '/assets/culture-shop/kbeauty.webp',
      '/assets/culture-shop/kbeauty-2.webp',
      '/assets/culture-shop/kbeauty-3.webp',
      '/assets/culture-shop/kbeauty-4.webp',
      '/assets/culture-shop/kbeauty-5.webp',
      '/assets/culture-shop/kbeauty-6.webp',
    ],
    youtubeId: '3MXEbyAxtHc',
    videoTitle: "Olive Young Myeongdong · Korea's Sephora",
  },

  insadong: {
    hero: {
      eyebrow: 'Traditional crafts + antiques · Cultural quarter',
      tagline: "Seoul's most important traditional-culture street — antique galleries, calligraphy brushes, hand-thrown celadon, and tea houses tucked into hanok courtyards.",
    },
    facts: [
      { label: 'Vibe',         value: 'Traditional craft + antique + brush + Korean tea district · most important cultural street in Seoul' },
      { label: 'Highlights',   value: 'Ssamziegil spiraling mall · antique stores · brush calligraphy shops · Korean tea houses in hanok · porcelain galleries' },
      { label: 'Best time',    value: 'Weekday afternoon · weekend pedestrian-only street fairs' },
      { label: 'Tour length',  value: '3 hours · with a cultural-craft curator' },
      { label: 'Good to know', value: 'Many shops closed Mondays. Cards accepted. Combine with Jogyesa Temple 5 min walk.' },
    ],
    photos: [
      '/assets/culture-shop/insadong.webp',
      '/assets/culture-shop/insadong-2.webp',
      '/assets/culture-shop/insadong-3.webp',
      '/assets/culture-shop/insadong-4.webp',
      '/assets/culture-shop/insadong-5.webp',
      '/assets/culture-shop/insadong-6.webp',
    ],
    youtubeId: 'Rf7PcLSGEIU',
    videoTitle: 'Seoul Walking Tour, Insa-dong Ssamziegil · 4K',
  },

  hannam: {
    hero: {
      eyebrow: 'Cultural quarter · Embassy district',
      tagline: "Seoul's most refined cultural quarter — Leeum Samsung Museum on one corner, embassy gardens on another, and the city's quietest concept boutiques in between.",
    },
    facts: [
      { label: 'Vibe',         value: 'Korea\'s most refined cultural quarter · embassy district · Hannam-dong art scene' },
      { label: 'Highlights',   value: 'Leeum Samsung Museum of Art (Botta + Nouvel + Koolhaas buildings) · D Museum · concept boutiques · Michelin-starred dining' },
      { label: 'Best time',    value: 'Weekday afternoon · Leeum is closed Mondays' },
      { label: 'Tour length',  value: '3 hours · walking · with a private art curator' },
      { label: 'Good to know', value: 'Reservations needed at top restaurants. Cards everywhere. Leeum has free 1.5h English tour weekend 3pm.' },
    ],
    photos: [
      '/assets/culture-shop/hannam.webp',
      '/assets/culture-shop/hannam-2.webp',
      '/assets/culture-shop/hannam-3.webp',
      '/assets/culture-shop/hannam-4.webp',
      '/assets/culture-shop/hannam-5.webp',
      '/assets/culture-shop/hannam-6.webp',
    ],
    youtubeId: 'yMbjf8CjLOk',
    videoTitle: '[4K] Hannam — Walking Tour',
  },

  commonground: {
    hero: {
      eyebrow: 'Container market + pop-ups · Konkuk',
      tagline: "Korea's first shipping-container marketplace — 200 blue boxes stacked into a three-story pop-up city for indie Korean brands and rotating concept dining.",
    },
    facts: [
      { label: 'Built',        value: '2015 · 200 shipping containers · Korea\'s first container-built marketplace' },
      { label: 'Highlights',   value: 'The iconic blue-container exterior · rotating pop-up shops · indie Korean designer storefronts · 3rd-floor terrace dining' },
      { label: 'Best time',    value: 'Weekend afternoon · evening for the lit-up exterior' },
      { label: 'Tour length',  value: '2 hours · self-paced' },
      { label: 'Good to know', value: 'Heated in winter. Cards everywhere. Outside Exit 6 of Konkuk University Station (Line 2/7).' },
    ],
    photos: [
      '/assets/culture-shop/commonground.webp',
      '/assets/culture-shop/commonground-2.webp',
      '/assets/culture-shop/commonground-3.webp',
      '/assets/culture-shop/commonground-4.webp',
      '/assets/culture-shop/commonground-5.webp',
      '/assets/culture-shop/commonground-6.webp',
    ],
    youtubeId: 'Cn3ugdSHLCc',
    videoTitle: '[4K] Common Ground, Seoul · Largest Container Shopping Mall',
  },

  taxfree: {
    hero: {
      eyebrow: 'Tax-free premium outlet day · With driver',
      tagline: "A full day at Korea's premium outlet villages — 350 luxury brands at 40–90% off, plus the tax refund counter on site, with a driver who knows the shortcuts.",
    },
    facts: [
      { label: 'Format',       value: 'Full-day chauffeured outlet circuit + duty-free flagship at Lotte/Shinsegae · with personal shopper' },
      { label: 'Highlights',   value: 'Hyundai Premium Outlets · Lotte Premium Outlets · Shinsegae Premium Outlets · Italian-village outdoor mall layouts' },
      { label: 'Best time',    value: 'Weekday for fewer crowds · seasonal sales (Jan, Jul) for deeper discounts' },
      { label: 'Tour length',  value: 'Full day · with a driver · 1–4 guests' },
      { label: 'Good to know', value: 'Tax-refund desk on-site (8% back). Outlets 1–1.5h from Seoul by car. Bring passport.' },
    ],
    photos: [
      '/assets/culture-shop/taxfree.webp',
      '/assets/culture-shop/taxfree-2.webp',
      '/assets/culture-shop/taxfree-3.webp',
      '/assets/culture-shop/taxfree-4.webp',
      '/assets/culture-shop/taxfree-5.webp',
      '/assets/culture-shop/taxfree-6.webp',
    ],
    youtubeId: 'QcE7HoZJG98',
    videoTitle: 'Lotte Premium Outlet store · Korea shopping vlog',
  },

  baseball: {
    hero: {
      eyebrow: 'KBO league night · Private box',
      tagline: "Korea's loudest, friendliest night out — synchronized cheer squads, fried chicken from your seat, and a private skybox between the dugouts.",
    },
    facts: [
      { label: 'Format',       value: 'KBO regular-season home game · private skybox for 6–12 guests · catering and beer on tap' },
      { label: 'Highlights',   value: 'Choreographed cheer leaders · the seventh-inning chicken-and-beer ritual · home-run fireworks · LG Twins / Doosan Bears / Kiwoom rivalries' },
      { label: 'Best time',    value: 'April–October season · Friday or Saturday for the loudest crowd' },
      { label: 'Tour length',  value: '3 hours · with snacks · bilingual host explains the cheer chants' },
      { label: 'Good to know', value: 'Jamsil Stadium (LG/Doosan) is the most accessible. Roof closes for rain — game continues.' },
    ],
    photos: [
      '/assets/culture-famous/baseball.webp',
      '/assets/culture-famous/baseball-2.webp',
      '/assets/culture-famous/baseball-3.webp',
      '/assets/culture-famous/baseball-4.webp',
      '/assets/culture-famous/baseball-5.webp',
      '/assets/culture-famous/baseball-6.webp',
    ],
    youtubeId: 'g5TFhKWwSHY',
    videoTitle: 'Korean baseball with cheerleaders · Kia vs Doosan at Jamsil Stadium · 4K',
  },

  golf: {
    hero: {
      eyebrow: 'Signature course · Full 18-hole round',
      tagline: "A round at one of Korea's signature mountain or seaside courses — a caddy who reads every break, a clubhouse lunch, and your private driver from hotel to first tee.",
    },
    facts: [
      { label: 'Format',       value: '18 holes · with caddy · clubhouse lunch · clubs and shoes on request' },
      { label: 'Highlights',   value: 'Sky 72 (Incheon) · Nine Bridges (Jeju, top 100 world) · Pinx (Jeju) · South Cape (Namhae) · seasonal foliage tee boxes' },
      { label: 'Best time',    value: 'April–June and September–November · early morning tee-off for cooler play' },
      { label: 'Tour length',  value: 'Full day · door-to-door with private driver' },
      { label: 'Good to know', value: 'Most premier courses require advance booking. Korean caddies expected — gratuity in cash. Bring passport for ID at check-in.' },
    ],
    photos: [
      '/assets/culture-famous/golf.webp',
      '/assets/culture-famous/golf-2.webp',
      '/assets/culture-famous/golf-3.webp',
      '/assets/culture-famous/golf-4.webp',
      '/assets/culture-famous/golf-5.webp',
      '/assets/culture-famous/golf-6.webp',
    ],
    youtubeId: '_0JsFz7LOwk',
    videoTitle: 'South Korea golf · Go Around at Nine Bridges, Jeju · Golf Channel',
  },

  'kpop-concert': {
    hero: {
      eyebrow: 'Live K-pop concert · VIP access',
      tagline: "A reserved seat in the front sections of a live K-pop concert — with a soundcheck pass, official lightstick, and a curator who briefs you on every member and song.",
    },
    facts: [
      { label: 'Format',       value: 'Reserved seating · soundcheck attendance where offered · concert merchandise pre-purchased' },
      { label: 'Highlights',   value: 'Gocheok Sky Dome · KSPO Dome · Inspire Arena · seasonal stadium tours · official lightstick included' },
      { label: 'Best time',    value: 'Year-round, subject to tour schedules · weekend dates released ~3 months in advance' },
      { label: 'Tour length',  value: '3 hours · private car to the venue · meet-up before doors' },
      { label: 'Good to know', value: 'Lineup confirmed at booking. No mobile photography from soundcheck sections. Most venues subway-accessible.' },
    ],
    photos: [
      '/assets/culture-famous/kpop-concert.webp',
      '/assets/culture-famous/kpop-concert-2.webp',
      '/assets/culture-famous/kpop-concert-3.webp',
      '/assets/culture-famous/kpop-concert-4.webp',
      '/assets/culture-famous/kpop-concert-5.webp',
      '/assets/culture-famous/kpop-concert-6.webp',
    ],
    youtubeId: 'LBWmBK2TIQs',
    videoTitle: "[4K] IVE world tour 'Show What I Am' · KSPO Dome Seoul",
  },

  hybe: {
    hero: {
      eyebrow: 'HYBE Insight · The home of BTS',
      tagline: "The Yongsan headquarters of HYBE — the label that built BTS — with its public museum, photo zones, and the artists' creative floors visible from below.",
    },
    facts: [
      { label: 'Format',       value: 'HYBE Insight museum visit · artist photo zone · gift-shop merchandise · with a K-pop-knowledgeable host' },
      { label: 'Highlights',   value: 'HYBE Insight permanent exhibit · BTS / TXT / SEVENTEEN / NewJeans displays · the iconic HYBE lobby photo wall · Yongsan i-Park merchandise floor' },
      { label: 'Best time',    value: 'Weekday morning · advance ticket required · book 2 weeks ahead during album cycles' },
      { label: 'Tour length',  value: '90 minutes · paired with the Yongsan i-Park mall and SM/JYP buildings nearby' },
      { label: 'Good to know', value: 'No artist sightings guaranteed — the creative floors are private. Photography allowed in designated zones only.' },
    ],
    photos: [
      '/assets/culture-famous/hybe.webp',
      '/assets/culture-famous/hybe-2.webp',
      '/assets/culture-famous/hybe-3.webp',
      '/assets/culture-famous/hybe-4.webp',
      '/assets/culture-famous/hybe-5.webp',
      '/assets/culture-famous/hybe-6.webp',
    ],
    youtubeId: 'l5OPLVT6LxA',
    videoTitle: 'HYBE INSIGHT · BTS Museum walk tour, Seoul Yongsan · 4K',
  },

  smtown: {
    hero: {
      eyebrow: 'SMTOWN coexartium · K-pop artists museum',
      tagline: "Three floors of SM Entertainment immersive — holographic stages, costume archives, and a café where idols' own playlists run on loop.",
    },
    facts: [
      { label: 'Format',       value: 'Self-paced museum walk · with audio guide · café and merchandise floors' },
      { label: 'Highlights',   value: 'SMTOWN museum at COEX · costume archive (TVXQ · Girls\' Generation · EXO · NCT · aespa) · hologram theater · idol café · merchandise flagship' },
      { label: 'Best time',    value: 'Weekday afternoon · evenings often quieter than the mall itself' },
      { label: 'Tour length',  value: '2 hours · self-paced · easy to combine with the COEX Mall in the same building' },
      { label: 'Good to know', value: 'Inside COEX Mall, Gangnam. Subway: Samseong (Line 2). Tax-free at the merchandise flagship with passport.' },
    ],
    photos: [
      '/assets/culture-famous/smtown.webp',
      '/assets/culture-famous/smtown-2.webp',
      '/assets/culture-famous/smtown-3.webp',
      '/assets/culture-famous/smtown-4.webp',
      '/assets/culture-famous/smtown-5.webp',
      '/assets/culture-famous/smtown-6.webp',
    ],
    youtubeId: 'MI8sp-lmoDQ',
    videoTitle: 'SMTOWN @ COEX artium · 4K walking tour, Seoul',
  },

  'kpop-class': {
    hero: {
      eyebrow: 'Private K-pop dance class · With choreographer',
      tagline: "A one-song private class with the choreographers who actually train the idols — your group, your tempo, your video to take home at the end.",
    },
    facts: [
      { label: 'Format',       value: 'Private class · 1 song of your choice · with a working K-pop choreographer · video recording included' },
      { label: 'Highlights',   value: 'Studios in Hongdae and Apgujeong used by major labels · pick any current hit · take-home choreography video' },
      { label: 'Best time',    value: 'Year-round · 2 weeks advance booking · weekday afternoons easiest to schedule' },
      { label: 'Tour length',  value: '2 hours · 30-min warm-up · 60-min choreography · 30-min filming' },
      { label: 'Good to know', value: 'Athletic clothing recommended. Suitable from age 10+. Older guests can request slower-tempo songs.' },
    ],
    photos: [
      '/assets/culture-famous/kpop-class.webp',
      '/assets/culture-famous/kpop-class-2.webp',
      '/assets/culture-famous/kpop-class-3.webp',
      '/assets/culture-famous/kpop-class-4.webp',
      '/assets/culture-famous/kpop-class-5.webp',
      '/assets/culture-famous/kpop-class-6.webp',
    ],
    youtubeId: '2AUKo88mft8',
    videoTitle: 'Inside 1MILLION · Where K-pop idols learn to dance',
  },

  'namsan-tower': {
    hero: {
      eyebrow: 'N Seoul Tower · Sunset over the city',
      tagline: "Seoul's signature skyline view — a cable car up Namsan mountain, the locked-love-padlock terraces, and the slow rotation of the city as the sun crosses the river.",
    },
    facts: [
      { label: 'Format',       value: 'Cable car ascent · observatory deck · padlock terrace · rotating restaurant available for dinner' },
      { label: 'Highlights',   value: 'Namsan Cable Car · 360° observatory · the love-padlock fences · N Grill rotating restaurant · night skyline back-down' },
      { label: 'Best time',    value: 'Arrive 90 minutes before sunset · winter for the clearest air · cherry blossoms on the slope in April' },
      { label: 'Tour length',  value: '2 hours · with cable car · pickup from Myeongdong base' },
      { label: 'Good to know', value: 'Cable car runs to midnight. Observatory deck heated in winter. Padlocks available for purchase at the gift shop.' },
    ],
    photos: [
      '/assets/culture-famous/namsan-tower.webp',
      '/assets/culture-famous/namsan-tower-2.webp',
      '/assets/culture-famous/namsan-tower-3.webp',
      '/assets/culture-famous/namsan-tower-4.webp',
      '/assets/culture-famous/namsan-tower-5.webp',
      '/assets/culture-famous/namsan-tower-6.webp',
    ],
    youtubeId: '4fDA5Q5Chyk',
    videoTitle: '[4K] Namsan Cable Car & N Seoul Tower, Korea',
  },

  lotte: {
    hero: {
      eyebrow: 'Lotte World Tower · SkyDeck at 555 m',
      tagline: "The 123rd-floor glass-floor observation deck of Korea's tallest building — the highest point in the country, with the entire Han River basin laid out below.",
    },
    facts: [
      { label: 'Format',       value: 'Express elevator to the 117th–123rd floors · SkyDeck glass floor · Sky Lounge bar on 123F' },
      { label: 'Highlights',   value: 'World\'s fastest double-decker elevator · 555 m glass floor · 360° panoramic deck · sunset golden hour over Han River · Lotte World Mall directly below' },
      { label: 'Best time',    value: 'Clear winter days for max visibility · 30 min before sunset for golden-hour transition' },
      { label: 'Tour length',  value: '60 minutes on deck · pair with the Lotte Mall, aquarium, or Lotte World amusement park' },
      { label: 'Good to know', value: 'Jamsil station (Line 2/8). Buy timed tickets in advance — sunset slots sell out. Glass floor is on the 118F.' },
    ],
    photos: [
      '/assets/culture-famous/lotte.webp',
      '/assets/culture-famous/lotte-2.webp',
      '/assets/culture-famous/lotte-3.webp',
      '/assets/culture-famous/lotte-4.webp',
      '/assets/culture-famous/lotte-5.webp',
      '/assets/culture-famous/lotte-6.webp',
    ],
    youtubeId: 'ASIpsDAlKz0',
    videoTitle: '[4K] Seoul Sky · Lotte World Tower 123F · 555 m day & night view',
  },

  'hanriver-yacht': {
    hero: {
      eyebrow: 'Han River yacht cruise · Sunset with champagne',
      tagline: "A private sunset cruise on the Han — the city's skyline lit up on both banks, Banpo Bridge's rainbow fountain off the stern, and chilled champagne for the toast.",
    },
    facts: [
      { label: 'Format',       value: 'Private yacht charter · 6–12 guests · captain and crew · champagne and canapés included' },
      { label: 'Highlights',   value: 'Sunset window over the Han · Banpo Moonlight Rainbow Fountain show · 63 Building / Lotte Tower skyline · evening city-light bridges' },
      { label: 'Best time',    value: 'April–October · sunset slot · the rainbow fountain runs Apr–Oct, 5 shows per evening' },
      { label: 'Tour length',  value: '2 hours · departure from Yeouido Han River Park marina · private host on board' },
      { label: 'Good to know', value: 'Light jacket for breeze after sunset. Flat-soled shoes for deck. Indoor cabin available for rain.' },
    ],
    photos: [
      '/assets/culture-famous/hanriver-yacht.webp',
      '/assets/culture-famous/hanriver-yacht-2.webp',
      '/assets/culture-famous/hanriver-yacht-3.webp',
      '/assets/culture-famous/hanriver-yacht-4.webp',
      '/assets/culture-famous/hanriver-yacht-5.webp',
      '/assets/culture-famous/hanriver-yacht-6.webp',
    ],
    youtubeId: 'jtg1xh1BFqE',
    videoTitle: 'Han River yacht tour · Hangang River Festival, Seoul · 4K night view',
  },

  hanriver: {
    hero: {
      eyebrow: 'Han River sunrise · Private kayak',
      tagline: "Seoul before the city wakes — flat-water kayaking past riverside parks, the bridges lit in the early dawn, and a coffee from the bank when you step out.",
    },
    facts: [
      { label: 'Format',       value: 'Single or double kayaks · with a safety boat · life vests, dry-bag for phones · light breakfast at the boathouse' },
      { label: 'Highlights',   value: 'Sunrise on the Han · Banpo / Hangang / Dongjak bridge corridor · riverside park reflections · waterbird wildlife at dawn' },
      { label: 'Best time',    value: 'April–October · sunrise launch · summer mornings the calmest water' },
      { label: 'Tour length',  value: '90 minutes on water · meet at boathouse 45 min before sunrise' },
      { label: 'Good to know', value: 'No kayaking experience required. Quick-dry clothing recommended. Hot showers at the boathouse afterward.' },
    ],
    photos: [
      '/assets/culture-famous/hanriver.webp',
      '/assets/culture-famous/hanriver-2.webp',
      '/assets/culture-famous/hanriver-3.webp',
      '/assets/culture-famous/hanriver-4.webp',
      '/assets/culture-famous/hanriver-5.webp',
      '/assets/culture-famous/hanriver-6.webp',
    ],
    youtubeId: '0GNYaigDqQc',
    videoTitle: 'Han River kayaking · the best paddling spot in Seoul',
  },

  forestbath: {
    hero: {
      eyebrow: 'Shinrin-yoku · Korean mountain forest bathing',
      tagline: "A guided slow walk in one of Korea's certified healing forests — phytoncide air therapy, a tea stop under the pines, and the country's medical research behind every minute.",
    },
    facts: [
      { label: 'Format',       value: 'Guided slow-walk · breathwork stations · tea stop · with a certified forest-healing instructor' },
      { label: 'Highlights',   value: 'Saneum National Healing Forest (Yangpyeong) · Chukryeongsan Recreation Forest · Jangtaesan Cedar Forest (Daejeon) · seasonal phytoncide peaks in summer' },
      { label: 'Best time',    value: 'May–September for peak phytoncide release · autumn foliage walks October–November' },
      { label: 'Tour length',  value: 'Half day · private transfer from Seoul · with guide and tea' },
      { label: 'Good to know', value: 'Korea has 41 government-certified healing forests, with documented respiratory and cardiovascular benefits. Hiking shoes recommended.' },
    ],
    photos: [
      '/assets/culture-famous/forestbath.webp',
      '/assets/culture-famous/forestbath-2.webp',
      '/assets/culture-famous/forestbath-3.webp',
      '/assets/culture-famous/forestbath-4.webp',
      '/assets/culture-famous/forestbath-5.webp',
      '/assets/culture-famous/forestbath-6.webp',
    ],
    youtubeId: '7lRwN-SUqGk',
    videoTitle: 'Healing forest in South Korea · A walking introduction',
  },

  dmz: {
    hero: {
      eyebrow: 'Demilitarized Zone · Private border tour',
      tagline: "A pre-cleared private day to the world's most fortified border — the JSA truce village, the infiltration tunnels, and a vantage looking straight into the North.",
    },
    facts: [
      { label: 'Format',       value: 'Pre-cleared private tour · with a security-cleared guide · passport identity check at the security checkpoint' },
      { label: 'Highlights',   value: 'Imjingak Peace Park · Third Infiltration Tunnel · Dora Observatory (binoculars into the North) · Dorasan Station · DMZ Theater & Museum · JSA truce village (when permitted)' },
      { label: 'Best time',    value: 'Year-round · tours run Tue–Sun · JSA access subject to political conditions' },
      { label: 'Tour length',  value: 'Full day · pickup 07:30 · return 17:00 · private vehicle' },
      { label: 'Good to know', value: 'Passport mandatory. Dress code: no sleeveless, no shorts, no military-style clothing. JSA access not always available — confirm at booking.' },
    ],
    photos: [
      '/assets/culture-famous/dmz.webp',
      '/assets/culture-famous/dmz-2.webp',
      '/assets/culture-famous/dmz-3.webp',
      '/assets/culture-famous/dmz-4.webp',
      '/assets/culture-famous/dmz-5.webp',
      '/assets/culture-famous/dmz-6.webp',
    ],
    youtubeId: '0Zuyg1CI78c',
    videoTitle: 'DMZ tour · Imjingak, Third Infiltration Tunnel, Dora Observatory',
  },

  royalmusic: {
    hero: {
      eyebrow: 'Jongmyo Jeryeak · Royal court music',
      tagline: "A private recital of the music played for the Joseon kings — UNESCO-recognized ritual ensemble of zithers, flutes, and percussion, performed for you in a heritage hall.",
    },
    facts: [
      { label: 'Format',       value: 'Private recital · 15-piece ritual ensemble · with a Korean-music scholar narrating' },
      { label: 'Highlights',   value: 'Jongmyo Jeryeak ritual suite · gayageum zither · daegeum bamboo flute · piri reed · seasonal court-music repertoire from the Joseon archive' },
      { label: 'Best time',    value: 'Year-round · with advance booking · paired beautifully with a Jongmyo Shrine visit' },
      { label: 'Tour length',  value: '90 minutes · private hall · tea service before and after' },
      { label: 'Good to know', value: 'UNESCO Intangible Heritage. National Gugak Center programming on weekends is also publicly bookable. Photography subject to performer consent.' },
    ],
    photos: [
      '/assets/culture-famous/royalmusic.webp',
      '/assets/culture-famous/royalmusic-2.webp',
      '/assets/culture-famous/royalmusic-3.webp',
      '/assets/culture-famous/royalmusic-4.webp',
      '/assets/culture-famous/royalmusic-5.webp',
      '/assets/culture-famous/royalmusic-6.webp',
    ],
    youtubeId: '4jsk8B23l3s',
    videoTitle: 'UNESCO · Royal Ancestral Ritual in Jongmyo Shrine and its Music',
  },

  bboy: {
    hero: {
      eyebrow: 'Hongdae b-boy showcase · World champions',
      tagline: "A private showcase from the crews that put Korea on the world b-boy map — Gamblerz, Jinjo, Drifterz alumni — in the underground studio where they actually train.",
    },
    facts: [
      { label: 'Format',       value: 'Private showcase · with introduction by the dancers · optional try-it-yourself segment at the end' },
      { label: 'Highlights',   value: 'Gamblerz / Jinjo / Drifterz crew alumni · Battle of the Year-winning routines · the underground Hongdae studio scene · backstage Q&A' },
      { label: 'Best time',    value: 'Year-round · evening slots · 2 weeks advance booking' },
      { label: 'Tour length',  value: '90 minutes · with crew Q&A · paired with dinner in Hongdae' },
      { label: 'Good to know', value: 'Korea has won the Battle of the Year world championship more times than any other country. The studio is up two flights — no elevator.' },
    ],
    photos: [
      '/assets/culture-famous/bboy.webp',
      '/assets/culture-famous/bboy-2.webp',
      '/assets/culture-famous/bboy-3.webp',
      '/assets/culture-famous/bboy-4.webp',
      '/assets/culture-famous/bboy-5.webp',
      '/assets/culture-famous/bboy-6.webp',
    ],
    youtubeId: 'tyinATSEKMY',
    videoTitle: 'Jinjo Crew vs Found Nation · Finals, Battle Of The Year 2018',
  },

  nanta: {
    hero: {
      eyebrow: 'NANTA · Non-verbal Korean drum show',
      tagline: "The world's longest-running non-verbal show — a kitchen-set drum performance built on samul nori rhythms, slapstick comedy, and audience participation.",
    },
    facts: [
      { label: 'Format',       value: 'Live theater show · non-verbal (no language barrier) · seated · 90 minutes · suitable all ages' },
      { label: 'Highlights',   value: 'NANTA Myeongdong Theater · samul nori-based percussion · cooking-knife rhythm sequences · audience-participation finale · Edinburgh Fringe and Broadway alumni' },
      { label: 'Best time',    value: 'Daily · multiple show times · family-friendly · ideal first-night activity for new visitors' },
      { label: 'Tour length',  value: '90 minutes · with reserved VIP seating · option to add a backstage meet' },
      { label: 'Good to know', value: 'Two venues: Myeongdong and Hongdae. Front-row guests participate. Suitable from age 5 — fully wheelchair accessible.' },
    ],
    photos: [
      '/assets/culture-famous/nanta.webp',
      '/assets/culture-famous/nanta-2.webp',
      '/assets/culture-famous/nanta-3.webp',
      '/assets/culture-famous/nanta-4.webp',
      '/assets/culture-famous/nanta-5.webp',
      '/assets/culture-famous/nanta-6.webp',
    ],
    youtubeId: 'GJlv4BNNKEg',
    videoTitle: 'NANTA · Live at Millennium Stage',
  },

  pansori: {
    hero: {
      eyebrow: 'Pansori · UNESCO epic vocal performance',
      tagline: "A private recital of the centuries-old solo opera of Korea — one singer, one drummer, one epic story, performed with simultaneous English translation projected beside the stage.",
    },
    facts: [
      { label: 'Format',       value: 'Private recital · one master singer (sorikkun) · one drummer (gosu) · with live English translation projected · tea service' },
      { label: 'Highlights',   value: 'Choon-hyang-ga (love story) · Shim-cheong-ga (filial daughter) · Heung-bo-ga (the brothers) · the dramatic vocal range of a trained sorikkun · UNESCO Intangible Heritage since 2003' },
      { label: 'Best time',    value: 'Year-round · with advance booking · classical Korean tea ceremony pairs well before' },
      { label: 'Tour length',  value: '90 minutes · with translator · curated excerpts from a full 8-hour epic' },
      { label: 'Good to know', value: 'UNESCO recognized in 2003. Vocally demanding — masters train 10+ years. Performance can be paired with a meal in the same hanok.' },
    ],
    photos: [
      '/assets/culture-famous/pansori.webp',
      '/assets/culture-famous/pansori-2.webp',
      '/assets/culture-famous/pansori-3.webp',
      '/assets/culture-famous/pansori-4.webp',
      '/assets/culture-famous/pansori-5.webp',
      '/assets/culture-famous/pansori-6.webp',
    ],
    youtubeId: 'CxFD3fHTdPU',
    videoTitle: "Kim So-Hee · Pansori — Korea's epic vocal art",
  },

  jeju: {
    hero: {
      eyebrow: 'Jeju Island · UNESCO Natural Heritage',
      tagline: "Korea's sub-tropical south — a single volcano rising from the sea, lava-tube caves carved underground, and the sea-women who still dive the coast at eighty.",
    },
    facts: [
      { label: 'Distance',     value: '1-hour flight from Seoul · or overnight ferry from Mokpo' },
      { label: 'Highlights',   value: 'Hallasan summit · Seongsan Ilchulbong sunrise peak · Manjanggul lava tubes · Haenyeo sea-women villages · the coastal Olleh trail · citrus farms' },
      { label: 'Best season',  value: 'April–June for canola fields · October–November for citrus harvest · year-round mild climate' },
      { label: 'Stay length',  value: '3–5 nights · paired with a Seoul stay' },
      { label: 'Good to know', value: 'UNESCO Natural Heritage since 2007. A rental car is needed inland; the coastal road is the iconic drive.' },
    ],
    photos: [
      '/assets/culture-beyond/jeju.webp',
      '/assets/culture-beyond/jeju-2.webp',
      '/assets/culture-beyond/jeju-3.webp',
      '/assets/culture-beyond/jeju-4.webp',
      '/assets/culture-beyond/jeju-5.webp',
      '/assets/culture-beyond/jeju-6.webp',
    ],
    youtubeId: 'ZzoeselfLN4',
    videoTitle: 'Jeju · South Korea in 4K Ultra HD · Drone tour',
  },

  busan: {
    hero: {
      eyebrow: 'Busan · Southern coast, beach + film-set city',
      tagline: "Korea's second city — hillside film-set villages painted every colour of the rainbow, sashimi mornings at the fish market, and a mountain temple looking out over the sea.",
    },
    facts: [
      { label: 'Distance',     value: '2.5 hours by KTX from Seoul · or a 1-hour flight' },
      { label: 'Highlights',   value: 'Haeundae beach · Gamcheon culture village · Jagalchi fish market · Beomeosa mountain temple · BIFF cinema district · Songdo Skywalk' },
      { label: 'Best season',  value: 'May–June · September–October for mild weather · summer for the beach' },
      { label: 'Stay length',  value: '2–3 nights · an easy weekend pairing with Seoul' },
      { label: 'Good to know', value: 'KTX leaves Seoul Station hourly. The Blue Line Park beach train opens up the coast for slow scenic rides.' },
    ],
    photos: [
      '/assets/culture-beyond/busan.webp',
      '/assets/culture-beyond/busan-2.webp',
      '/assets/culture-beyond/busan-3.webp',
      '/assets/culture-beyond/busan-4.webp',
      '/assets/culture-beyond/busan-5.webp',
      '/assets/culture-beyond/busan-6.webp',
    ],
    youtubeId: 'oumc0gniisk',
    videoTitle: 'Busan, South Korea · [4K] Haeundae · 1-hour walking tour',
  },

  gyeongju: {
    hero: {
      eyebrow: 'Gyeongju · Ancient Silla capital, open-air UNESCO',
      tagline: "The thousand-year capital of the Silla kingdom — UNESCO temples, royal burial mounds in the city centre, and a stone Buddha grotto carved into the mountain in the 8th century.",
    },
    facts: [
      { label: 'Distance',     value: '2 hours by KTX from Seoul' },
      { label: 'Highlights',   value: 'Bulguksa Temple · Seokguram Grotto · Daereungwon tumulus park · Cheomseongdae stargazing tower · Gyochon hanok village · Donggung Palace night reflection' },
      { label: 'Best season',  value: 'April for cherry blossoms · October–November for autumn foliage' },
      { label: 'Stay length',  value: '1–2 nights · a single-night day trip is also possible' },
      { label: 'Good to know', value: 'Three UNESCO sites in one city: Bulguksa, Seokguram, Yangdong. The old town is small enough to bicycle.' },
    ],
    photos: [
      '/assets/culture-beyond/gyeongju.webp',
      '/assets/culture-beyond/gyeongju-2.webp',
      '/assets/culture-beyond/gyeongju-3.webp',
      '/assets/culture-beyond/gyeongju-4.webp',
      '/assets/culture-beyond/gyeongju-5.webp',
      '/assets/culture-beyond/gyeongju-6.webp',
    ],
    youtubeId: 'xMo1Dr7QPOY',
    videoTitle: 'Bulguksa Temple, Gyeongju · The most beautiful temple in Korea · 4K HDR',
  },

  jeonju: {
    hero: {
      eyebrow: "Jeonju · Korea's preserved hanok town",
      tagline: "The country's largest preserved hanok village — seven hundred tile-roof houses, the birthplace of bibimbap, and slow afternoons of paper-craft workshops and rice-wine alleys.",
    },
    facts: [
      { label: 'Distance',     value: '2 hours by KTX from Seoul' },
      { label: 'Highlights',   value: 'Jeonju Hanok Village · Gyeonggijeon shrine · Hanji paper workshops · Pungnammun gate · Jaman mural village · the original Jeonju bibimbap' },
      { label: 'Best season',  value: 'October Hanji Culture Festival · April cherry blossoms · year-round for hanbok walks' },
      { label: 'Stay length',  value: '1 night · stay in a hanok guesthouse' },
      { label: 'Good to know', value: 'Hanbok rental shops are everywhere. Korean rice-wine (makgeolli) alleys come alive after 7 pm.' },
    ],
    photos: [
      '/assets/culture-beyond/jeonju.webp',
      '/assets/culture-beyond/jeonju-2.webp',
      '/assets/culture-beyond/jeonju-3.webp',
      '/assets/culture-beyond/jeonju-4.webp',
      '/assets/culture-beyond/jeonju-5.webp',
      '/assets/culture-beyond/jeonju-6.webp',
    ],
    youtubeId: 'QOO3vn6WELE',
    videoTitle: 'Jeonju Hanok Village · The best Korean tourism spot · 4K walk',
  },

  gangwon: {
    hero: {
      eyebrow: 'Gangwon-do · Alpine east, national park and coast',
      tagline: "Korea's mountain east — Seoraksan's craggy peaks, the Olympic ski town, a coffee-shop beach city, and a seaside temple where the rocks meet the sunrise.",
    },
    facts: [
      { label: 'Distance',     value: '2–3 hours by KTX from Seoul' },
      { label: 'Highlights',   value: 'Seoraksan National Park · Gangneung coffee street · Sokcho fish market · Pyeongchang Olympic site · Naksansa seaside temple · Daegwallyeong sheep farm' },
      { label: 'Best season',  value: 'October foliage in Seoraksan · January–February for ski slopes · summer for the East Sea beaches' },
      { label: 'Stay length',  value: '2–3 nights · enough for both mountains and coast' },
      { label: 'Good to know', value: 'KTX to Gangneung 2 h from Seoul. Combine with a Pyeongchang ski day in winter, or a Gangneung coffee-street afternoon in summer.' },
    ],
    photos: [
      '/assets/culture-beyond/gangwon.webp',
      '/assets/culture-beyond/gangwon-2.webp',
      '/assets/culture-beyond/gangwon-3.webp',
      '/assets/culture-beyond/gangwon-4.webp',
      '/assets/culture-beyond/gangwon-5.webp',
      '/assets/culture-beyond/gangwon-6.webp',
    ],
    youtubeId: 'UCa-yA5lLMM',
    videoTitle: 'Gangneung, South Korea · KTX to a beach town in Gangwon-do',
  },

  incheon: {
    hero: {
      eyebrow: 'Incheon · Gateway city where Korea meets the world',
      tagline: "The port city where Korea meets the world — the country's oldest Chinatown, the futurist Songdo skyline, and a chain of heritage islands a bridge away.",
    },
    facts: [
      { label: 'Distance',     value: '1 hour from central Seoul · the international airport gateway' },
      { label: 'Highlights',   value: 'Songdo Central Park · Chinatown & Fairy-Tale Village · Wolmido seaside park · Ganghwa heritage island · Tri-bowl pavilion · Korean Open-Air Museum' },
      { label: 'Best season',  value: 'April–June · September–November · summer for the beach islands' },
      { label: 'Stay length',  value: 'Day trip or 1 night · easy add-on to airport departure day' },
      { label: 'Good to know', value: 'Subway from central Seoul to Songdo in ~70 min. Incheon Airport is here — perfect final-day plan before the flight out.' },
    ],
    photos: [
      '/assets/culture-beyond/incheon.webp',
      '/assets/culture-beyond/incheon-2.webp',
      '/assets/culture-beyond/incheon-3.webp',
      '/assets/culture-beyond/incheon-4.webp',
      '/assets/culture-beyond/incheon-5.webp',
      '/assets/culture-beyond/incheon-6.webp',
    ],
    youtubeId: '_vdhk5CwsSI',
    videoTitle: 'Incheon City Tour · Chinatown walk · 4K Korea travel',
  },
};

function Step3Culture() {
  const [pageIdx, setPageIdx] = useState(0);
  // Hydrate the basket from the experiences array persisted by an earlier visit.
  const [selected, setSelected] = useState(() => {
    let prior = [];
    try {
      if (window.kwState) {
        const s = window.kwState.loadStep('experiences');
        if (Array.isArray(s)) prior = s;
      }
    } catch (e) {}
    return new Set(prior);
  });
  const [detailCode, setDetailCode] = useState(null);
  // Per-tab "& more" expansion — show the first 8 cards until expanded
  const [expandedPages, setExpandedPages] = useState({});

  const currentPage = CULTURE_PAGES[pageIdx];
  const allSelectedItems = CULTURE_PAGES.flatMap(p => p.items.filter(it => selected.has(it.code)));

  const INITIAL_CARDS = 8;
  const isPageExpanded = !!expandedPages[currentPage.id];
  const visibleItems = (currentPage.kind === 'cities' || isPageExpanded)
    ? currentPage.items
    : currentPage.items.slice(0, INITIAL_CARDS);
  const hiddenCount = currentPage.items.length - visibleItems.length;

  // Persist the selected experience codes (array) on every change, so the
  // page's Continue button (and the result page) always read current picks.
  React.useEffect(() => {
    if (window.kwState) window.kwState.saveStep('experiences', Array.from(selected));
  }, [selected]);

  const toggle = code => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const clearAll = () => setSelected(new Set());

  // Click a card body to open the right-side detail drawer — but ONLY when a
  // CULTURE_DETAILS entry exists. Cards without detail content are
  // selection-only: clicking the body toggles the basket, no drawer, no alert.
  const openDetail = (item) => {
    if (CULTURE_DETAILS[item.code]) {
      setDetailCode(item.code);
      return;
    }
    toggle(item.code);
  };
  const detailItem = detailCode
    ? CULTURE_PAGES.flatMap(p => p.items).find(it => it.code === detailCode)
    : null;

  return (
    <>
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
                      <span className="kw-pagetab-count">
                        {p.kind === 'cities'
                          ? `${p.items.length} cities`
                          : `${p.items.length}${pageSelCount > 0 ? ` · ${pageSelCount} picked` : ''}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Page content — items grid or city cards */}
            {currentPage.kind === 'cities' ? (
              <div className="kw-city-grid">
                {currentPage.items.map(c => {
                  const sel = selected.has(c.code);
                  return (
                  <div
                    key={c.code}
                    className={`kw-city kw-photo-${c.theme} ${sel ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetail(c)}
                  >
                    <div
                      className={`kw-city-photo ${c.image ? 'has-image' : ''}`}
                      style={c.image ? { backgroundImage: `url('${thumbUrl(c.image)}')` } : undefined}
                    >
                      {!c.image && <span className="kw-city-monogram">{c.mono}</span>}
                      <span className="kw-city-photo-region">{c.region}</span>
                      {sel && <span className="kw-city-check" aria-hidden="true">✓</span>}
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
                        <button
                          className="kw-city-add"
                          onClick={(e) => { e.stopPropagation(); toggle(c.code); }}
                        >
                          {sel ? <>✓ Added</> : <><span className="kw-city-add-plus">+</span> Add this trip</>}
                        </button>
                        <span className="kw-city-cta">View details →</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="kw-cul-grid">
              {visibleItems.map(it => {
                const sel = selected.has(it.code);
                return (
                  <div
                    key={it.code}
                    className={`kw-cul kw-photo-${it.theme} ${sel ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetail(it)}
                  >
                    <div
                      className={`kw-cul-photo ${it.image ? 'has-image' : ''}`}
                      style={it.image ? { backgroundImage: `url('${thumbUrl(it.image)}')` } : undefined}
                    >
                      {!it.image && <span className="kw-cul-monogram">{it.mono}</span>}
                      {sel && <span className="kw-cul-check" aria-hidden="true">✓</span>}
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

            {/* "& more" reveal — keeps the first impression light */}
            {currentPage.kind !== 'cities' && currentPage.items.length > INITIAL_CARDS && (
              <div className="kw-more-row">
                <button
                  className="kw-more-btn"
                  type="button"
                  aria-expanded={isPageExpanded}
                  onClick={() => setExpandedPages(prev => ({ ...prev, [currentPage.id]: !isPageExpanded }))}
                >
                  {isPageExpanded
                    ? <>Show fewer <span className="kw-more-chev" aria-hidden="true">↑</span></>
                    : <>&amp; more — see all {currentPage.items.length} <span className="kw-more-chev" aria-hidden="true">↓</span></>}
                </button>
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

      {detailItem && (
        <CultureDetailDrawer
          item={detailItem}
          detail={CULTURE_DETAILS[detailItem.code]}
          isSelected={selected.has(detailItem.code)}
          onToggle={() => toggle(detailItem.code)}
          onClose={() => setDetailCode(null)}
        />
      )}
    </>
  );
}

// ─── CultureDetailDrawer — right-side panel that opens on card click ──
function CultureDetailDrawer({ item, detail, isSelected, onToggle, onClose }) {
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

  // Reset the active photo whenever the drawer is shown for a new item.
  React.useEffect(() => { setActivePhoto(0); }, [item.code]);

  const photos = detail.photos || [detail.photo];

  return (
    <>
      <div className="kw-drawer-scrim" onClick={onClose} />
      <aside
        className={`kw-drawer kw-photo-${item.theme}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} details`}
      >
        <header className="kw-drawer-top">
          <nav className="kw-drawer-crumb" aria-label="Breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
              ← Step 3 · Culture
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
                aria-label={item.name}
              />
              {photos.length > 1 && (
                <div className="kw-detail-thumbs">
                  {photos.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className={`kw-detail-thumb ${i === activePhoto ? 'is-active' : ''}`}
                      style={{ backgroundImage: `url('${thumbUrl(src)}')` }}
                      aria-label={`View photo ${i + 1} of ${photos.length}`}
                      aria-pressed={i === activePhoto}
                      onClick={() => setActivePhoto(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {detail.youtubeId && (
            <section className="kw-detail-section">
              <h3 className="kw-detail-h3">See it on video</h3>
              <div className="kw-detail-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${detail.youtubeId}?rel=0`}
                  title={detail.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="kw-detail-video-caption">
                {detail.videoTitle} · external content from YouTube
              </p>
            </section>
          )}
        </div>

        <footer className="kw-drawer-foot">
          <div className="kw-drawer-foot-l">
            <span className="kw-drawer-foot-label">Your basket</span>
            <span className="kw-drawer-foot-meta">
              {isSelected
                ? '✓ This experience is in your basket'
                : 'Not added yet — add it to weave it into your week'}
            </span>
          </div>
          <div className="kw-drawer-foot-r">
            <button
              className="kw-cta kw-cta-ghost"
              style={{ height: 50, fontSize: 15, padding: '0 22px' }}
              onClick={onClose}
            >
              Close
            </button>
            <button className="kw-cta kw-cta-lg" onClick={onToggle}>
              {isSelected ? '✓ Remove from basket' : 'Add to basket'} &nbsp;›
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

window.Step3Culture = Step3Culture;
