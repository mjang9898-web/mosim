# 모심 플래너(고르기 Funnel) — 설계 (확정)

> 작성일: 2026-06-01 · 상태: **확정 (founder 승인)**
> 북극성: `2026-06-01-mosim-product-definition.md` · 디자인: `design.md` v2 (Warm Trust)
> 이 문서는 플래너의 **단계·항목·데이터 구조·AI 연결**의 단일 기준. 코딩(state.js + 플래너 UI + AI 프롬프트)은 이 문서를 따른다.

## 1. 큰 그림

전체 흐름: **① 랜딩(신뢰) → ② 플래너(원하는 것 고르기) → ③ AI 일정 + 컨시어지 확정**

- 플래너는 **별도 화면들**(랜딩과 분리) — 그래서 랜딩은 신뢰만 담아 깨끗하게 유지된다.
- **한 화면 = 한 단계.** 시니어 결정 피로 최소화. 의료가 **첫 단계**(북극성: 의료가 문).
- 끝에서 **AI가 일정 초안 → 컨시어지가 확정**("AI 초안 · 사람이 책임").
- 총 **4단계** → 결과(일정).

## 2. 단계별 세부 (확정)

### Step 1 · Your care (의료) — 첫 단계
- **needs** — 복수 선택(타일): `screening`(건강검진) · `knees`(무릎/관절·정형) · `dental`(치과) · `eyes`(안과) · `unsure`("아직 모르겠어요 — 도와주세요")
- **note** — 선택 입력 한 줄: *"저희가 알아두면 좋을 게 있나요?"*
  - 입력란 밑 안심 문구(필수 노출): EN *"We don't store this — it's used only to help our AI build your best plan."* / KR *"이 메모는 저장되지 않습니다 — AI가 최적의 일정을 짜는 데에만 쓰여요."*
  - **🔒 개인정보 규칙(하드):** `note`는 **DB에 절대 저장 금지.** `/api/schedule` AI 호출에 **잠깐만** 실어 보내고 즉시 폐기. leads/itineraries 어디에도 영속화하지 않는다. (말과 실제 일치 — 신뢰의 핵심.)
- 의료 종류별 세부 임상 질문은 **받지 않음** → 임상 디테일은 컨시어지 상담에서.

### Step 2 · Your trip (여행)
- **when** — 토글: `dates`(정해짐 → 달력 start/end) 또는 `flexible`(유연함 → 계절·월 선택)
- **length** — 단일 선택: `under1w`(1주 미만) · `1to2w`(1–2주) · `2plus`(2주 이상) · `unsure`(미정)
- **party** — 단일 선택: `solo`(혼자) · `couple`(부부) · `family`(가족·친구) + **partySize**(인원 수)
- **stay** — 단일 선택: `cozy`(아늑·실속) · `comfort`(편안·중심가) · `premium`(프리미엄)
- **도착 도시는 묻지 않음** — 무조건 인천(상수). 상태에 `arrival:'ICN'` 고정 가능.
- **미국 출발 도시·항공편은 묻지 않음** — 컨시어지 상담에서.

### Step 3 · Experiences (경험) — 복수 선택
- 타일: `heritage`(궁궐·헤리티지) · `cuisine`(한식) · `markets`(시장·쇼핑) · `nature`(자연·사찰) · `spa`(스파·휴식) · `beyond`(서울 밖)
  - `beyond` 설명: 해안·시골·근교 — **당일치기도, 며칠 일정도 가능**(당일로 한정하지 않음).
- 빼기 옵션: `minimal`("관광은 최소로 — 저는 치료가 목적이에요") — 선택 시 AI는 관광을 최소화.

### Step 4 · Comfort & food (편의·음식) — 시니어 배려
- **pace** — 단일: `relaxed`(여유롭게) · `balanced`(균형) · `full`(꽉 차게)
- **mobility** — 단일: `walks_fine`(잘 걸음) · `tires_easily`(쉽게 지침) · `cane_walker`(지팡이·보행기) · `wheelchair`(휠체어). *일정 동선·휴식·접근성에 반영.*
- **spice** — 단일: `mild`(순하게) · `some`(보통) · `love`(매운 것 좋아함)
- **food** — 복수 + 직접 추가: `no_shellfish`(해산물 X) · `no_pork`(돼지고기 X) · `vegetarian`(채식) · `diabetic`(당뇨식) · 사용자 자유 입력
- **복용 약·거동 등 의료 디테일은 받지 않음** → 컨시어지 상담에서.

### → 결과 · AI 일정
- 위 입력으로 AI가 가변 길이 day-by-day 일정 초안 생성(검진→시술→회복 순서, 시니어 휴식, 동선 고려).
- 화면에 "AI 초안 · 컨시어지 확정" 명시. (결과 화면 상세 설계는 **별도 — 다음 디테일**.)

## 3. 데이터 구조 (state — `js/state.js` DEFAULT_STATE 교체)

```js
{
  care: {
    needs: [],        // ['screening','knees','dental','eyes','unsure']
    note:  ''         // ⚠️ 저장 금지 — AI 호출에만 transient
  },
  trip: {
    when:   { mode: 'flexible', dates: { start:null, end:null }, season: '' }, // mode:'dates'|'flexible'
    length: '',       // 'under1w'|'1to2w'|'2plus'|'unsure'
    party:  '',       // 'solo'|'couple'|'family'
    partySize: 1,
    stay:   '',       // 'cozy'|'comfort'|'premium'
    arrival:'ICN'     // 상수 (안 물음)
  },
  experiences: [],    // ['heritage','cuisine','markets','nature','spa','beyond'] | ['minimal']
  comfort: {
    pace:'', mobility:'', spice:'',  // 단일값
    food: []          // ['no_shellfish','no_pork','vegetarian','diabetic', ...custom]
  }
}
```

- **저장 정책:** funnel 완료 시 lead/itinerary로 영속화하되, **`care.note`는 제외**(전송 직전 분리, AI에만 전달).
- 연락처(name/email 등)는 **별도 단계/시점** — 아직 미설계(다음 디테일).

## 4. 컨시어지 상담으로 미루는 것 (funnel에 안 넣음)
임상 세부(증상·진단), 복용 약, 거동 의료 정보, 미국 출발 도시·항공편. → 사람이 직접 다룬다(풀서비스).

## 5. 아직 안 정한 것 (다음 디테일)
- **결과(AI 일정) 화면** 상세 — funnel의 climax.
- **연락처 수집 시점·방식**(리드 생성) + 컨시어지 상담 예약 연결.
- 독립 페이지(How it works / Our story / Care / FAQ) 상세.
