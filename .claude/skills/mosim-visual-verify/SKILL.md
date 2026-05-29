---
name: mosim-visual-verify
description: The reusable recipe for verifying mosim-site changes by actually running the site under Playwright — serve, screenshot (desktop + mobile), DOM/console assertions, and API↔frontend shape checks. Use after any UI or full-stack change before claiming it works, and whenever you need to confirm a fix or feature behaves in a real browser. Includes a ready script template and the known gotchas.
---

# mosim-site Visual Verification

빌드 성공·타입체크는 동작 증명이 아니다. **실제로 띄우고 보고 단언한다.** `node_modules/playwright-core` + Chromium 설치돼 있음.

## 절차
1. **서버 띄우기**
   - 정적만(랜딩/funnel/About 등): `python3 -m http.server 8123` (백그라운드).
   - `/api/*`가 필요(가입/저장/결제): `vercel dev`(env 필요). 정적 서버에선 `/api/config` 404가 나는데 그건 무관 노이즈로 분류.
   - JSX 변경을 봤으면 먼저 `npm run build`.
2. **스크립트 실행**: `scripts/verify-template.mjs`를 복사해 대상에 맞게 수정 후 `node /tmp/verify-x.mjs`. (레포가 아니라 `/tmp`에 둔다.)
3. **스크린샷을 직접 Read로 본다** — 데스크탑(1280×900)+모바일(390×844). 빈 화면/깨짐/오버플로 = 실패.
4. PASS/FAIL 목록 + 근거 + 스크린샷 경로 보고. FAIL이면 어느 파일·동작인지.

## 반드시 확인
- **콘솔 에러 0** (무관해 보여도 보고). `pageerror`도.
- **경계면 교차 비교**: API 응답 shape ↔ 프론트가 읽는 필드/타입을 동시에 대조. 통합 버그는 여기서 난다("존재 확인"만으론 못 잡음).
- 데스크탑 + 모바일 레이아웃 둘 다.

## 알려진 함정 (실제로 물린 것들)
- **lazy 이미지**: `loading="lazy"` 이미지의 `naturalWidth`는 스크롤 인뷰 후에 확인(로드 전엔 0이라 거짓 FAIL).
- **sticky nav(68px) 앵커**: 앵커 점프 시 섹션 top이 nav 밑에 가리지 않는지(`scroll-padding-top:88px` 적용됨). nav 클릭 후 `getBoundingClientRect().top >= navH` 확인.
- **요소 스크린샷 + sticky nav**: `element.screenshot()`은 sticky nav가 겹쳐 보일 수 있음(캡처 위치 탓) — 실제 동작과 구분.
- **콘텐츠 해시**: JSX 바꿨는데 화면이 안 바뀌면 `npm run build` 누락 의심.

## 끝나면
- 임시 스크립트/스크린샷은 `/tmp`에 두고 커밋 금지. 백그라운드 서버는 종료(`pkill -f "http.server 8123"`).
- 디자인 규범(접근성·대비·터치타깃) 정식 점검이 필요하면 `web-design-guidelines` 플러그인 스킬을 추가로 돌린다.
