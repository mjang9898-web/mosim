// Single source of truth for the FOUR primary medical card faces
// (code · badge · eyebrow · name · desc · price · duration · photo).
// Consumed by BOTH medical.html (browse grid) and index.html (landing
// "What we arrange" section) so the landing and the Medical browse page
// always show the same card, image and copy. Drawer-only detail
// (positioning · intro · hospitals · tiers · addons) stays in medical.html,
// merged by `code`. Plain JS — NOT a build entry; shipped as-is.
window.MEDICAL_CARDS = [
  { code:'checkup', badge:'Korea-renowned', eyebrow:'Health checkup', name:'Health checkup',
    desc:'A thorough full-body checkup — cancer markers, MRI/CT, cardiac, endoscopy, reported in English.',
    price:'850', duration:'4–8 hours', photo:'/assets/medical/card-checkup.webp' },
  { code:'ortho', eyebrow:'Knees & joints', name:'Knees & joints',
    desc:'Orthopedics for the aches that make life smaller — knees, hips, spine. Back to moving freely.',
    price:'500', duration:'1–2 hours', photo:'/assets/medical/card-ortho.webp' },
  { code:'dental', eyebrow:'Dental', name:'Dental',
    desc:'The dental work that’s unthinkable back home — implants, crowns, restorative — by trusted hands.',
    price:'220', duration:'1–3 visits', photo:'/assets/medical/card-dental.webp' },
  { code:'eye', badge:'Korea-pioneered', eyebrow:'Vision', name:'Vision',
    desc:'Cataracts, vision, and eye health — so the world comes back into focus.',
    price:'1,600', duration:'1–2 hours', photo:'/assets/medical/card-eye.webp' }
];
