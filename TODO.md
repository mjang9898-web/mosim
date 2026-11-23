# Mosim — TODO / Backlog

작업 체크리스트 (공유). 끝나면 `[ ]` → `[x]`. 새 항목은 알맞은 섹션에 추가.

## 지금 / 다음
- [ ] **모바일 버전 일괄 점검·수정** (founder가 한 번에 보기로 함, 2026-06-14) — 데스크톱은 OK, 모바일만 따로 훑기. 지금까지 발견된 것:
  - result.html "한눈에 보기" 주간 캘린더 칸(`.ctitle2`, result.html ~175줄) 제목이 모바일에서 `-webkit-line-clamp:2`로 2줄 클램프 — 가로 7칸이라 의도된 요약이나 founder는 더 보이길 원할 수 있음. 전체 일정 설명은 아코디언에 다 나옴(데이터 캡은 2642d21에서 해결)
  - pricing.html 모바일(390px) 가로 5px 오버플로 — sticky nav의 "Sign in"+"Plan my trip" 버튼(`.nav-actions`/`.nav-cta`). visual-qa가 2026-06-13 발견, 패키지 변경과 무관한 기존 이슈
  - (점검 시) 5단계 퍼널·result 아코디언·랜딩 전 섹션 모바일 reflow 전반 한 번에 확인
- [ ] **Expedia 제휴 가입** — Travel Creator Program (affiliates.expediagroup.com), `care@mosimkorea.com`, **개인 자격**(법인 불필요). 승인 후 cockpit Expedia 링크에 추적코드(affiliateParam) 추가 → ~4% 호텔 커미션
- [ ] **Experience 페이지 — 사진 업데이트** — 큐레이션 카드 이미지 교체/개선
- [ ] **Medical 페이지 — 세부사항 업데이트** — 진료 항목별 상세 내용 보강
- [ ] **예약요청 이메일 — 내용·디자인 폴리시** — 발송은 동작하나 카피·디자인 개선 필요 (`api/reserve.js` → `api/_lib/email.js`; 발행 이메일 `api/admin/trips.js`, 결제 이메일 `api/_lib/pay-emails.js`)
- [x] **로딩 화면 페이싱 (~28초 대기)** — `loading.html` 진행바는 5.2초에 끝나는데 실제 AI 생성은 ~28초 → 시니어가 멈춘 듯 느낌. ✅ b360a12: "~30초" 안내선 + 바가 85%에서 대기 + "Writing your plan…" 무한 스텝
- [ ] **/pay 결제 페이지 — 문구 폴리시** — "Mosim concierge fee" 카드 카피 손보기 (설명문·"directly by those providers"·prorate 안내·"Sharing the cost"·"Fully paid" 등). founder가 특정 변경 예정. 위치: `pay.html` + `js/pay.js`

## Post-intent funnel (전환 의사 형성 이후 여정) — 설계 후 반영
> founder 지시 2026-07-12: "고객이 우리 서비스를 이용하겠다고 **마음을 먹은 뒤**의 funnel이 부족하다. 지금 당장은 아니어도 체크리스트에 추가."
> ⚠️ [[mosim-funnel-is-sacred]] 적용 — 고객 입력 보존·에러0·흐름끊김0. **설계 문서 → visual-qa PASS 없이 손대지 말 것.**
> 코드 실측(2026-07-12, Friday) 결과: 퍼널은 **게스트-우선이 설계 의도**(index.html:230/239/419 "Plan my trip" → step1.html **직결, auth 게이트 없음**). 문제는 게이트가 아니라 **로그인 상태를 result.html이 UI에 반영하지 않는 것**.

- [ ] **P0 · [BUG] result.html — 로그인 회원에게 "Create account" CTA가 그대로 노출** (founder가 지적하신 바로 그 현상)
  - **재현:** ① 마케팅 페이지("Start a free account", medical/experience/cuisine.html:~173~197) 또는 nav "Sign in"으로 **먼저 가입** → /me.html 착지 ② me.html의 "Plan my trip"(me.html:54) → step1~4 진행 ③ loading → **result.html** ④ "How this works" 2단계 칸에 **"Create account" 버튼 + "Already a member? Sign in" 링크가 그대로 보임**
  - **근본 원인 (코드 확정):** result.html은 로그인 여부를 **이미 알고 있다** — `authToken()`(result.html:680-689) → `var member = !!authToken()`(:690). 그런데 `boot()`의 `if (member)` 분기(:921-936)는 ⓐ nav 텍스트를 'My Page'로 ⓑ `ensureSaved()` ⓒ `reserve-cta` 핸들러 부착 — **이 셋만 한다.** `#step-create`(:248)·`#step-signin`(:249)은 **정적 마크업 그대로이고 어떤 코드도 숨기지 않는다.** → 설계 의도가 아니라 **누락 버그**.
  - **동반 결함:** member가 그 "Create account"를 누르면 `wireGuestStash()`는 게스트 전용(:897 `if (member || !plan) return`)이라 인터셉트 없이 **`/signup.html`로 그냥 이동**. signup.html에는 **already-logged-in 가드가 없어** 로그인 상태에서도 가입 폼이 그대로 뜬다 → 시니어 고객 혼란·이탈 지점.
  - **수정 방향:** `boot()`의 member 분기에서 `#step-create`/`#step-signin`을 숨기고 2단계 칸을 "Reserve" 액션으로 교체 + signup.html/signin.html에 세션 있으면 `nextUrl()`로 즉시 리다이렉트하는 가드 추가.
  - 규모: **S** (result.html + signup/signin 가드). 위험: 낮음. 단, 게스트 경로(stash/claim) 회귀 없는지 visual-qa 필수.

- [ ] **P1 · result.html에 "로그인했지만 아직 예약 안 한" 상태가 아예 없다** (위 버그의 구조적 뿌리)
  - **현상:** result.html은 CTA를 **2상태로만** 다룬다 — `#cta-guest`(기본 노출, :324-329) / `#cta-member`(`display:none`, :330-337). guest→member 전환은 **`showReservedState()`(:782-788) 하나뿐이고, 이건 예약 성공 후에만 호출**된다. `#cta-member` 카피도 "Your trip is reserved." **예약완료 전용**.
  - **결과:** 로그인·미예약 회원은 게스트 카피를 본다 — "Takes a moment to set up your **private page**" + "**Already a member? Sign in**"(:328). 버튼(`#reserve-cta`)은 member 핸들러(:936)로 정상 동작하나 **href는 여전히 `/signup.html?...`**(:327) → JS 실패 시 로그인 유저가 가입 페이지로 튄다.
  - **있어야 할 것:** **3상태** — guest / member-unreserved / member-reserved.
  - ★ **정답 패턴이 이미 사내에 있다:** `js/me-overview.jsx`(빌드본 me-overview.js)는 `status==='new'` → "Reserve this trip" 버튼, `status==='reserved'` → "✓ Reserved — 확인 중" 로 **정확히 3상태를 구현**해 두었다. result.html에 **동일 상태 모델을 미러링**하면 됨(새 발명 불필요).
  - 규모: **M**. 선행: P0와 함께 한 번에 설계하는 게 효율적.

- [ ] **P2 · post-intent 여정 재설계 (설계 문서 먼저)** — founder 지적의 본론
  - **현 구조 요약(실측):** 게스트-우선 → result에서 가입 유도 → 가입 시 `api/stash-itinerary.js`(claim_token) → 이메일 확인(새 탭·sessionStorage 비어있음) → `api/claim-itinerary.js`가 일정을 계정에 귀속. **게스트→회원 방향은 잘 설계돼 있다.** 반대로 **"이미 회원인 채로 퍼널을 도는" 방향은 아무 처리가 없다** — step1~4·loading은 로그인 여부를 전혀 읽지 않고, result에서만 `ensureSaved()`로 조용히 저장(:926).
  - **설계 논점(결정 필요):** ⓐ 회원이 퍼널 진행 중일 때 "○○님, 이 일정은 My Page에 자동 저장됩니다" 같은 **연속성 신호**를 줄 것인가 ⓑ 가입 유도 시점을 "결과 확인 후 저장/예약" 한 곳으로 **단일화**할 것인가 ⓒ 마케팅 페이지의 "Start a free account"(계정-우선 진입)를 유지할지, "Plan my trip"으로 통일할지 — 현재 **두 진입점이 서로 다른 여정으로 갈라진다**
  - 산출물: `docs/2026-07-XX-post-intent-funnel-design.md` (설계 승인 → mosim-orchestrator 빌드)
  - 규모: **L** (설계 S + 빌드 M). ※ founder 결정 선행 항목.

- 참고: `/itinerary.html`은 **토큰 기반 최종 딜리버러블**(`?t=<share_token>`, 로그인 불필요, cockpit 발행)로 **create-account CTA가 없다**(grep 확인). founder가 말씀하신 "itinerary 화면"은 문맥·코드상 **result.html의 일정 화면**으로 판단. ※ 다른 화면을 보신 것이라면 정정 필요.

## 결정 대기 (founder 생각 중)
- [ ] **가격 정책 재검토** — 딥리서치 완료 (2026-06-13): `docs/2026-06-13-pricing-research.md` — 권고 A(주단위 베이스+바닥+동반자 50% 할인/캡) vs B(3단계 tier). founder 결정 → payment-group.js 요금계산 + pricing/pay/landing 카피 연쇄 수정

## 마케팅 시작할 때
- [ ] IG / YouTube / Facebook 링크에 **UTM 태그** 붙이기 (예: `?utm_source=instagram&utm_medium=social`) → cockpit Marketing "채널" 카드에 채널별 유입·전환 집계

## 법인 설립 후 (incorporation 블록)
- [ ] **PayPal LIVE 키** — 실제 컨시어지 수수료 결제 활성화 (한국 사업자등록 + 사업자 은행계좌 필요)
- [ ] `/terms` 환불·취소 약관 — 변호사/세무사 검토

## 자잘한 정리
- [ ] PostHog 고아 키 `cockpit-analytics` 삭제 (Settings → Personal API keys; 실제 작동하는 건 `cockpit-analytics-v2`)

---
*이 파일(`/TODO.md`)이 **유일한 to-do 리스트**입니다. 모든 세션·에이전트는 여기에 추가/체크하세요. (메모리에 따로 todo를 만들지 말 것 — `project_todos.md` 메모리는 이 파일을 가리키는 포인터일 뿐.)*
*itinerary deliverable / 결제 활성화 / pay-emails / 일정 페이싱은 2026-06-11 빌드·배포 완료.*
