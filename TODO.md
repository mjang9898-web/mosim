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
