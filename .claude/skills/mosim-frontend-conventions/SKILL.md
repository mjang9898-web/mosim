---
name: mosim-frontend-conventions
description: The hard rules for building UI on mosim-site (static HTML/CSS + esbuild-compiled JSX, no framework). Use whenever writing or editing index.html, step1-4.html, result.html, me.html, or any js/*.jsx component, or touching the build. Covers JSX/esbuild constraints, the IIFE-scoping rule, design tokens, the content-hash build step, and state handling.
---

# mosim-site Frontend Conventions

정적 사이트. 프레임워크 없음. HTML/CSS + 브라우저에서 도는 vanilla JS + esbuild로 사전 컴파일되는 JSX.

## JSX / esbuild 제약 (어기면 런타임에 깨짐)
- JSX 안에서 **`import`/`require` 금지**. 모든 컴포넌트는 전역 스코프에 정의. React는 CDN UMD 전역(`React`, `ReactDOM`)으로 들어옴. esbuild는 `--jsx=transform`(= `React.createElement`).
- **여러 컴파일된 JSX를 한 페이지에 `<script>`로 로드하면 각 파일을 IIFE로 감싸라**:
  ```jsx
  (function () {
    const { useEffect, useState } = React;
    /* ... component ... */
    ReactDOM.render(<Comp/>, document.getElementById('root-id'));
  })();
  ```
  Why: 안 감싸면 `const {useEffect}=React` 같은 top-level 선언이 파일 간 충돌 → 2번째 스크립트부터 "Identifier already declared"로 통째로 죽는다. me.html에서 실제로 3개 탭이 안 뜬 버그였다. step 페이지는 JSX 1개만 로드해서 안 터졌던 것뿐.

## 새 JSX 엔트리 추가 시 — 세 곳 동시 갱신
1. `package.json`의 `build`/`dev` esbuild 엔트리 목록에 추가
2. `scripts/post-build.mjs`의 `HASHED_BASENAMES`에 출력 `.js` 이름 추가
3. `.gitignore`에 빌드 산출물(`/js/<name>.js`) 추가 (소스 `.jsx`만 커밋)

빌드: `npm run build`(JSX→JS + 콘텐츠 해시 스탬프, ~15ms). watch: `npm run dev`.

**비-JSX plain JS**(`state.js`, `nav.js`, `js/pay.js` 등)는 빌드 대상이 아니라 **그대로 배포**된다. 새 plain JS는 esbuild/post-build/gitignore 목록에 넣지 말 것(JSX 엔트리만 거기 등록). `pay.html`처럼 funnel 밖 자체완결 페이지는 인라인 토큰 사용(≥19px·Warm Trust 팔레트·`--ink-2` 동일 적용).

## 콘텐츠 해시 캐시버스팅
`scripts/post-build.mjs`가 HTML의 `js/x.js?v=<hash>`를 자동 갱신. `/js/*.js`는 `max-age=immutable`로 캐시되고 해시가 바뀌면 새로 받음. HTML은 `max-age=300`. 빌드 산출물 해시는 결정적이라 Vercel이 배포 시 재빌드해도 동일.

## 디자인 토큰 (design.md v2 — Warm Trust)
- 본문 **≥19px**(시니어). 회색은 **`--ink-2`(#8A8479)보다 옅게 금지**.
- **마젠타/핑크 폐기.** 골드(`--gold` #C39A3F)는 액센트로만(밑줄·라벨·구분점). 헤드라인 **Fraunces serif**, 본문 **Inter**.
- `index.html` `:root`: `--ivory`#F7F2EA, `--ivory-soft`#FBF8F2, `--navy`#1B2A4A(헤드라인·텍스트·1차 버튼), `--navy-soft`#2A3C5E, `--gold`#C39A3F, `--ink`#54514B, `--ink-2`#8A8479, `--line`#E5DBC8.
- 자체완결 페이지(signup/signin/me 등)는 인라인 토큰 자체 정의 — 단 Warm Trust 팔레트 따를 것. 옛 마젠타 K-Wellness는 `legacy-2026-06-01` 태그에 보존.

## 페이지/상태 규칙
- **새 페이지 추가 금지**(PRD funnel 외). 필요하면 PRD 먼저.
- 상태는 **`window.kwState`로만**: `kwState.saveStep(step, data)`, `kwState.loadAll()`. sessionStorage 직접 호출 금지(테스트 제외). 키: `kw.state.v1`. 상태 추가 시 `js/state.js`의 `DEFAULT_STATE` 갱신.
- funnel 단계별 저장 shape은 각 step JSX의 `onContinue`에서 정의(예: medical/culture는 `{selected:[names], selectedCodes, ...}`). result에서 쓰려면 실제 저장 shape을 먼저 확인.
- 앵커 점프는 sticky nav(68px) 때문에 `html { scroll-padding-top: 88px }`로 보정돼 있음.

## 끝내기 전
UI를 바꿨으면 **visual-qa로 검증**하기 전엔 "됐다"고 하지 않는다(빌드 성공 ≠ 동작). `mosim-visual-verify` 참조.
