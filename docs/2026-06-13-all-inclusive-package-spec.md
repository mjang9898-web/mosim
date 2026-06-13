# 올인클루시브 패키지 전환 — 카피·구조 스펙 (2026-06-13)

> founder 결정: 가격 모델 **(C) 단일 올인클루시브 패키지 + 맞춤 일정**. "수수료(fee)"라는 항목 → "패키지(product)"라는 상품으로 프레이밍 전환.
> **이 문서는 카피·구조 스펙이며 숫자는 비워둠**(`{{...}}` 토큰). 실제 가격은 founder가 "초기 저가 → 마진 실측 후 인상" 방침으로 추후 확정 → [[project_payment_gate]] 13(b) 참조.
> 경제학·원가 근거: `docs/2026-06-13-pricing-cost-research.md` / 경쟁사 모델: `docs/2026-06-13-pricing-research.md`.

## 0. 핵심 전환 (한 줄)

지상 서비스를 **하나의 올인클루시브 패키지**로 묶어 단일 가격으로 판다. 항공·숙박·진료비는 **고객이 vendor에 직접 결제**(노마크업). 페이지의 중심은 **"What we do for you"(패키지에 포함) vs "What you pay directly"(직접 결제)"의 2칼럼 분리**. founder 요청대로 차가운 "포함/불포함 표"가 아니라 따뜻한 "당신을 위해 우리가 하는 일" 언어.

**책임 경계** — 우리는 계획·코디·동행, 병원은 진료 제공·청구, 고객은 병원에 직접 결제. 패키지로 묶더라도 Mosim이 의료 결과·비용을 책임지는 것처럼 보이면 안 됨.

## 1. 패키지 이름 (founder 택1) — `{{PACKAGE_NAME}}`

| 후보 | 성격 | 비고 |
|------|------|------|
| **The Mosim Care Week** ⭐ | 가장 평이·따뜻 | "your week, fully cared for", 주 단위 프로레이션과 자연스럽게 맞음 |
| The Mosim Full-Care Package | 가장 직설·프리미엄 | "package" 단어를 노출하고 싶을 때 |
| Mosim Beside You | 가장 감성·기존 보이스("never alone") | 단독으론 "올인클루시브" 신호 약함 → 위 둘 중 하나의 태그라인으로 |

content-designer 추천: **The Mosim Care Week** + 상시 설명 한 줄 *"Everything we do for you on the ground in Korea."*

## 2. 가격에 들어가는 것 / 직접 결제 (확정)

**What we do for you (패키지 포함):** 전속 차량·기사(매일 도어투도어) · Mosim 컨시어지/통역가이드 전 일정 동행 · 모든 병원 진료 의료통역 · 매일 식사 · 일정상 문화시설 입장 · 출발 전 맞춤 일정 계획 · 24/7 지원.

**What you pay directly (직접 결제):** 항공 · 숙박 · 병원·진료비(우리가 주선, 노마크업) · 개인 쇼핑.

---

## 3. 터치포인트별 스펙

### 3.1 `pricing.html` — 메인 가격 페이지

**Hero (현 201–203)** — 단어만 교체, 구조 유지:
```
label:  What it costs
h1:     What it costs — clearly, before you decide.
p:      One all-inclusive package for everything we do in Korea. You pay flights,
        hotels and hospitals directly — never marked up by us.
```

**🔧 fee block → package block (현 206–226) — 구조 변경 (1칼럼 → 2칼럼):** 페이지의 중심.
```
label:  {{PACKAGE_NAME}}
h2:     One package. Everything we do for you.

[가격]  {{PACKAGE_PRICE}}
small:  per traveler · 7-day trip · prorated to your dates (~{{PER_DAY}}/day)

── COLUMN 1 ──  What we do for you
intro: From the day you land to your flight home — all in your package.
  • Private car & driver         Door to door, every day
  • A Mosim concierge beside you With you the whole trip
  • Medical interpreting         At every hospital appointment
  • Every day's meals            Taken care of
  • Cultural visits              Entrance to the places on your itinerary
  • Your plan, before you leave  A personal day-by-day itinerary
  • 24/7 support                 One call away, day or night

── COLUMN 2 ──  What you pay directly
intro: The big costs stay in your hands. We arrange each one and guide every
       payment — but you pay the provider, and we never add a markup.
  • Flights
  • Hotel
  • Hospital & medical bills     We arrange it, never mark it up
  • Personal shopping

[2칼럼 아래 책임 경계 micro, --ink-2]
We plan, coordinate and stay beside you. Your hospital provides and bills your
care directly — so you always see the real cost, paid straight to them.
```

**8-step flow** — 흐름 유지, Step 4 라벨만:
- Step 4 (269–271): `Pay the fee` → **`Reserve your package`**, `Concierge Fee to Mosim` → **`Your {{PACKAGE_NAME}}`**
- Step 6 (292–294): 유지(이미 pay-direct 올바름)

**KR-vs-US 예시 / 메타** — 예시 블록 유지. 메타 description(10,16):
```
One all-inclusive Mosim package — and not a dollar of markup on your care, your
hotel, or your flights. Clear pricing, before you decide.
```

### 3.2 `result.html` — 일정 결과의 가격 블록 (현 245–282)

included 리스트를 같은 2칼럼 논리로. 기존 compare 바(264–276) + "Also handled" 블록(278–281)이 이미 "직접 결제" 절반을 수행 → included 리스트를 "What we do for you"로 개명하고 "Also handled"를 "What you pay directly"로 통일.
```
label:  Clear from the start
h2:     One package. No hidden costs, no "sign up to see the price."

[가격]  {{PACKAGE_PRICE}}
small:  per traveler · one-week trip · prorated to your dates
who:    {{PACKAGE_NAME}} — everything we do for you.
fee-reassure(유지): A real person books every detail and stays beside you the
        whole trip — you're never alone.
list(문화시설 추가):
  • Private car & driver, daily
  • A concierge beside you, start to finish
  • Medical interpreting at every appointment
  • Every day's meals
  • Cultural visits on your itinerary
  • Your day-by-day plan, before you leave
  • 24/7 support
```
"Also handled, paid directly"(278–281) → 제목 유지, 본문 통일:
```
h3:  What you pay directly
p:   Your hotel and flights stay in your hands — we book and arrange every
     option, you pay the provider, and we guide each payment safely. Never a
     markup from us.
```

### 3.3 `index.html` — 랜딩 3곳

**Hero 아래 한 줄(265):**
```
<strong>One all-inclusive package — everything we do in Korea.</strong>
You pay flights, hotels and hospitals directly, with no markup.
```
**FAQ "How much will it really cost?"(384):**
```
Clearly, upfront, with no surprises. Mosim is one all-inclusive package for
everything we do on the ground. You pay hospitals, hotels and flights directly —
never marked up by us.
```
**랜딩 8-step Step 4(307–308):** pricing과 동일(`Reserve your package` / `Your {{PACKAGE_NAME}}`)
**푸터 fine-print(420):**
```
Mosim arranges and accompanies your medical journey in Korea, in one all-inclusive
package for our ground service. Your hospitals, hotels and flights are paid directly
by you and never marked up by us. © 2026 Mosim.
```

### 3.4 `pay.html` — 결제 페이지 (현 63–64)
```
title(63):  Your {{PACKAGE_NAME}}
para(64):   This is your all-inclusive Mosim package — everything we do for you on
            the ground in Korea: your private car and driver, a Mosim concierge and
            interpreter beside you, your meals, your cultural visits, and 24/7
            support, from the moment you land to your flight home. Your hospitals,
            hotels and flights are billed to you directly by those providers;
            Mosim never marks up your care.
```
`<title>` 태그(15) → `Pay for your {{PACKAGE_NAME}} — Mosim`

---

## 4. 변경 분류

**🔧 구조 변경 (frontend-builder 필요):**
- `pricing.html` fee block(206–226), `result.html` price block(248–262) — 1칼럼 included 리스트 → **2칼럼 "What we do for you / What you pay directly"** + 하단 책임 경계 micro 추가. CSS 2칼럼 + ≥19px·모바일 1칼럼 reflow.

**✏️ 단어 교체만 (text-only):**
- 두 페이지의 8-step flow(Step 4 라벨), 모든 hero/메타/FAQ/푸터/pay.html 카피.

**시니어 가독성 가드:** 각 칼럼 intro는 ≥19px에서 2줄 넘기지 말 것(스캔 가능 유지, 문단화 금지).

## 5. 범위 밖 (이번 스펙 제외) — 일관성 후속 필요

- `terms.html`(123–172)·`faq.html`(130–131)은 "concierge fee" 용어로 작성되어 있고, **법적 환불 티어가 그 용어 기준**. 패키지 이름 확정 후 **terms.html 병행 패스 필요**(법적 페이지와 마케팅 페이지가 "package" vs "concierge fee"로 모순되지 않도록).
- `api/_lib/payment-group.js`·`pay.js`의 내부 변수/주석은 "fee"여도 무방(고객 비노출). 고객 노출 텍스트만 패키지로.

## 6. founder 결정 대기

1. **패키지 이름** 택1 (3.1 표) — 확정 시 모든 `{{PACKAGE_NAME}}` 치환
2. **가격 숫자** `{{PACKAGE_PRICE}}`·`{{PER_DAY}}` — "초기 저가 → 실측 후 인상" 방침상 보류 중. "런칭 특가" 라벨 권고(앵커링 리스크)
3. **프로레이션 유지 여부** — 현 "per traveler · prorated"를 패키지에도 유지할지(원가 리서치는 파티 단위 권고, 단 이번 스펙은 현 per-traveler 표현 유지 — 가격구조 결정과 분리)

## 7. 빌드 순서 (승인 후)

1. 이름·숫자 확정 → 2. frontend-builder: pricing/result 2칼럼 구조 + 전 페이지 카피 치환 → 3. content-designer: terms.html 일관성 패스 → 4. visual-qa: 데스크톱+모바일 스크린샷, ≥19px·2칼럼 reflow·오버플로 검증 → 5. 커밋·푸시.
