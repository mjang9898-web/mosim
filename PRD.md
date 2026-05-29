# K-Wellness Concierge — Product Requirements

## 1. 제품 한 줄
시니어 인바운드 여행객(50-70대, 영미권)이 한국에서 받을 의료·웰니스·문화·미식 일정을 **5단계 funnel**로 입력하면, AI가 7일 일정을 작성하고 컨시어지가 검수해 전달하는 정적 웹 funnel.

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
  ↓ 컨택트 폼 제출 (name/email/from/when/interest/note)
Step 1 — Trip      (step1.html)  여행 기본: dates, party, airline, origin, hotel, transit
  ↓
Step 2 — Medical   (step2.html)  의료/웰니스 카테고리 멀티 선택
  ↓
Step 3 — Culture   (step3.html)  문화 체험 멀티 선택
  ↓
Step 4 — Cuisine   (step4.html)  미식 + allergens/diets/spice 입력
  ↓
Result — 7일 일정  (result.html) AI 생성된 일정 + 컨시어지 후속 안내
```

상태 키: `sessionStorage["kw.state.v1"]` — 새로고침 OK, 탭 닫으면 휘발.

## 3-a. Concierge fee payment (split payment)

After the funnel produces an itinerary on `result.html`, a logged-in user can pay the
Mosim **concierge fee** (`$1,200 × group size`, adjustable per trip). Payment uses a
shareable, **login-free** page `/pay?g=<token>` backed by a per-itinerary *payment group*
that tracks total / paid / balance. Anyone with the link can pay part or all of the
remaining balance via **PayPal** until the balance is $0 (e.g. an organizer pays for one
couple and forwards the link to the other). Trip actuals (flights, hotels, procedures)
are paid by the customer **directly to vendors** and are out of Mosim's payment scope.

Design spec: `docs/superpowers/specs/2026-05-29-split-payment-design.md`

## 4. 기능 요구사항

### 4.1 반드시 (MVP — 현재 구현됨)
- [x] 5단계 funnel 페이지 분리 (HTML 정적)
- [x] 단계 간 데이터 sessionStorage 전달
- [x] 컨택트 폼 입력 캡처
- [x] 템플릿 기반 7일 일정 생성 (`js/schedule.js`)
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
- **결제 범위**: 컨시어지 수수료(`$1,200 × 인원`)는 `/pay?g=<token>` 페이지에서 PayPal로 분담 결제. 항공·호텔·의료 실비는 고객이 벤더에게 직접 결제 — Mosim 범위 밖. 자세한 설계는 §3-a 참고

## 8. 참고

- 디자인 시스템: [design.md](./design.md)
- 코드 구조 / 배포: [CLAUDE.md](./CLAUDE.md)
- 원본 사업계획서: `../모심_제18회 예비관광벤처부문 사업계획서_051426.pdf`
