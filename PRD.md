# K-Wellness Concierge — Product Requirements

## 1. 제품 한 줄
시니어 인바운드 여행객(50-70대, 영미권)이 한국에서 받을 의료·여행·체험·미식/컴포트 정보를 **4단계 funnel**로 입력하면, AI가 7일 일정을 작성하고 컨시어지가 검수해 전달하는 정적 웹 funnel.

## 2. 타깃 사용자

| 페르소나 | 핵심 니즈 | 결정 트리거 |
|---|---|---|
| **시니어 의료관광객** (60대, 미국·캐나다·호주) | 한국에서 정형외과·치과·임플란트·건강검진 받고 회복기에 문화/미식 즐기기 | 본국 대비 비용 1/3, 검증된 클리닉, 영어 응대 |
| **시니어 웰니스 리트리트** (50대 부부) | 한방·스파·템플스테이 중심 리커버리 | "여행 같지 않은 회복", 사적인 동선 |
| **케어 매니저/자녀** (40대, 부모 동행 예약) | 부모 대신 일정 조율 | 명확한 가격 미리보기, 영어 한 채널 |

타깃이 아닌 사용자: 백패커, MZ K-pop 팬투어, 단체 패키지 손님.

## 3. 핵심 사용자 흐름

```
랜딩 (index.html)
  ↓ 랜딩에서 Medical · Experience · Cuisine 세 영역을 funnel/browse와 동일 카드로 미리보기 + "Plan my trip" 진입
Step 1 — Care            (step1.html)  의료/웰니스 케어 니즈 멀티 선택 (state.care)
  ↓
Step 2 — Trip            (step2.html)  여행 기본: dates/flexible, party, origin, stay (state.trip)
  ↓
Step 3 — Experiences     (step3.html)  문화 체험 멀티 선택 (Heritage/Shop/Famous/Beyond, state.experiences)
  ↓
Step 4 — Taste & comfort (step4.html)  pace · mobility(칩) + 먹고 싶은 음식 카드(탭별 progressive disclosure) + 매운맛(5단계, 한 번만) · allergens · diets · notes (state.cuisine)
  ↓
Result — 7일 일정        (result.html) /api/schedule(Claude) 생성 일정 + 컨시어지 후속 안내
```

> **절충안 C 통합(2026-06-23):** 기존 Step 4(Comfort)와 Step 5(Cuisine)을 단일 **Step 4 "Taste & comfort"**로 통합해 5단계 → 4단계로 축소. 매운맛·식이제약 **중복 제거** — 더 정밀한 cuisine 기준(spice 5단계 / allergens / diets)으로 일원화하고, comfort의 거친 spice(4단계)·food 제약 슬라이스는 폐지. pace·mobility는 통합 step 상단에 칩으로 가볍게 유지. **Experience(Step 3)에는 절대 합치지 않는다.**

상태 키: `sessionStorage["mosim.state.v1"]` — 새로고침 OK, 탭 닫으면 휘발. 스키마 정본은 `js/state.js`의 `DEFAULT_STATE`(care/trip/experiences/cuisine — comfort 슬라이스는 통합으로 pace·mobility만 cuisine으로 흡수, 기존 저장 일정은 하위호환 마이그레이션 처리). ⚠️ 기존 cuisine spice 5단계·allergens·diets가 매운맛·식이제약의 단일 소스.

> **통일성 원칙(2026-06-23):** 랜딩(index.html)의 Medical·Experience·Cuisine 카드, funnel의 해당 단계 카드, browse 페이지(experience.html·medical.html)는 **단일 정본**에서 파생한다 — Experience·Cuisine은 `window.EXPERIENCE_DATA`(`scripts/build-experience-data.mjs`가 step3-culture.jsx + step4-cuisine.jsx에서 생성), Medical은 `js/medical-cards.js`. 같은 카드는 어디서나 같은 이미지·카피로 보인다.

## 3-a. Concierge fee payment (split payment)

After the funnel produces an itinerary on `result.html`, a logged-in user can pay the
Mosim **concierge fee** (`$1,200 per traveler · one-week (7-day) trip · prorated to the
actual number of days`, ≈ $1,200 × group size for a standard week, adjustable per trip).
Payment uses a
shareable, **login-free** page `/pay?g=<token>` backed by a per-itinerary *payment group*
that tracks total / paid / balance. Anyone with the link can pay part or all of the
remaining balance via **PayPal** until the balance is $0 (e.g. an organizer pays for one
couple and forwards the link to the other). Trip actuals (flights, hotels, procedures)
are paid by the customer **directly to vendors** and are out of Mosim's payment scope.

Design spec: `docs/superpowers/specs/2026-05-29-split-payment-design.md`

## 4. 기능 요구사항

### 4.1 반드시 (MVP — 현재 구현됨)
- [x] 4단계 funnel 페이지 분리 (Care/Trip/Experiences/Taste & comfort, HTML 정적) — Comfort+Cuisine은 절충안 C로 단일 step 통합(2026-06-23)
- [x] 단계 간 데이터 sessionStorage 전달 (`js/state.js` kwState)
- [x] 랜딩 ↔ funnel ↔ browse 카드 단일 정본 통일 (Medical·Experience·Cuisine)
- [x] AI(Claude) 7일 일정 생성 (`api/schedule.js` + `api/_lib/traveler-brief.js`) — care/trip/experiences/comfort/**cuisine** 입력 전부 반영. ⚠️ `js/schedule.js`(템플릿)는 죽은 레거시
- [x] Continue/Back 네비게이션
- [x] 시니어 친화 타이포 (19px 본문, 56pt+ 탭 타깃)

### 4.2 다음 (백엔드 연동 — 이번 작업 범위)
- [ ] **Supabase**: 리드(컨택트 폼 제출) + 완료된 funnel 상태를 DB 영속화
- [ ] **Vercel Serverless**: `/api/lead`, `/api/schedule` 엔드포인트
- [ ] **Claude API**: `schedule.js`의 템플릿 → 실제 LLM 생성 일정으로 교체
- [ ] **GitHub Actions**: main 푸시 → Vercel 자동 배포
- [ ] 결과 페이지에서 컨시어지에게 이메일 발송 트리거

### 4.3 향후 (아직 아님)
- 한국어/중국어 i18n (현재 영어 + 결과만 한국어)
- 결제/예약 confirm 단계
- 컨시어지 어드민 대시보드
- 항공/호텔 라이선스된 이미지 교체

## 5. 비기능 요구사항

- **접근성**: WCAG AA. 본문 19px 이상, 색 대비 시니어 친화 (light gray 본문 금지)
- **성능**: 첫 로드 < 3s on 3G. JSX는 브라우저 babel-standalone으로 변환 중 — 트래픽 늘면 빌드 단계 추가 필요
- **개인정보**: 컨택트 폼은 의료 의향 포함 — 한국 의료법/개인정보보호법 검토 필요. DB 저장 시 PII 분리 컬럼
- **브랜드**: 마젠타(#B21464) + 한자 워터마크. Apple/시세이도 톤. 카지노 핑크 NO

## 6. 성공 지표

| 지표 | 목표 |
|---|---|
| 랜딩 → Step 1 진입률 | > 25% |
| Step 1 → Result 완주율 | > 40% |
| Result 도달 시 컨시어지 회신 SLA | 24h 이내 |
| 리드당 평균 견적 발송 시간 | < 48h |

## 7. 알려진 제약 / 결정사항

- **JSX 프로토타입은 정적**: 원본 Claude Design 컴포넌트들이 useState 거의 없음. `interactive.js`가 클래스 토글 + DOM 스크랩으로 선택값 캡처. 견고성 필요 시 Next.js 재구현
- **이미지 라이선스 미확보**: `assets/airlines/`, `assets/hotels/` 는 placeholder. 정식 런칭 전 교체
- **언어 일관성 미정**: 결과 페이지만 한국어, 나머지 영어. 타깃이 영미권이라면 결과도 영어로 통일 검토
- **결제 범위**: 컨시어지 수수료(`인당 $1,200 · 1주(7일) 기준 · 실제 일수에 비례 prorate`, 표준 1주 기준 ≈ `$1,200 × 인원`)는 `/pay?g=<token>` 페이지에서 PayPal로 분담 결제. 항공·호텔·의료 실비는 고객이 벤더에게 직접 결제 — Mosim 범위 밖. 자세한 설계는 §3-a 참고

## 7-b. 예약 → 결제 → 여행 부킹 (2026-06-08 확장, 승인됨)

AI 일정 이후의 인게이지먼트/부킹 단계. 컨시어지 수수료-only 모델 유지(호텔·항공·의료 실비는 고객이 벤더에 직접 결제). 전체 설계: [docs/superpowers/specs/2026-06-08-reserve-purchase-bookings-design.md](./docs/superpowers/specs/2026-06-08-reserve-purchase-bookings-design.md)

- **여정**: Plan→Save → ① **Reserve**(무료·의향, `status: reserved`, Mosim 알림) → ② Mosim이 일정·병원 가능 확인(`reviewing→quoted`) → ③ **Purchase**(기존 `/pay` 분할·링크) → `booked` → ④ **Travel bookings**(호텔·항공).
- **상태 모델**: `STAGES = ['new','reserved','reviewing','quoted','booked']` (기존에 `reserved` 1개 삽입).
- **인건비**: 사람은 ②(예약한 진짜 의향 고객)부터만 투입 — 모든 방문자 아님.
- **Travel bookings(Phase 2)**: ⓐ Mosim이 호텔·항공 링크 게시→고객 직접 결제, ⓑ 고객 직접 부킹 후 확인서 업로드(Supabase Storage). `bookings` 테이블 신설.
- **Phase 1(지금)**: Reserve 액션 + 상태 흐름 + My Page 표시 + 기존 결제 연결(새 인프라 0). **Phase 2**: Travel bookings + 업로드 + cockpit 링크 게시.

## 7-c. 정보성 페이지 (funnel 외)

Funnel 단계 밖의 정적 정보 페이지. 같은 콘텐츠-페이지 chrome(Warm Trust, 공유 nav/footer) 사용.

- `faq.html` — 자주 묻는 질문, `medical.html` — 진료 분야/시술별 가격, `experience.html`,
  `our-story.html`, `terms.html`.
- **`pricing.html` (2026-06-10 추가)** — 컨시어지 수수료를 funnel 진입 전에 공개하는 가격
  안내 페이지. 캐노니컬 수치: `인당 $1,200 · 1주(7일) 기준 · 실제 일수 prorate(≈ $170/일)`,
  포함 항목 6종, 한국 vs 미국 의료비 예시(~$12,800 vs ~$37,500). 환불/취소 정책은
  중복하지 않고 `terms.html`이 소유. nav/footer에 "Pricing" 링크(FAQ 옆)로 전 콘텐츠 페이지에 노출.

## 8. 참고

- 디자인 시스템: [design.md](./design.md)
- 코드 구조 / 배포: [CLAUDE.md](./CLAUDE.md)
- 원본 사업계획서: `../모심_제18회 예비관광벤처부문 사업계획서_051426.pdf`
