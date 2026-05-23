# K-Wellness Concierge — Design System

전제: **시니어 친화 + Apple/시세이도 톤**. Claude Design 프로토타입(`../Claude Design/`)을 정적 멀티페이지로 묶은 결과물.

## 1. 디자인 원칙

1. **시니어 친화 ≠ 노인용 UI.** 큰 글씨·고대비·넓은 탭 타깃을 쓰되, 톤은 Apple 수준의 미니멀로 유지.
2. **한 화면 한 결정.** Funnel 단계마다 하나의 질문만. 결정 피로 최소화.
3. **AI는 보조, 사람이 책임.** 모든 AI 출력은 "concierge confirms" 카피로 신뢰 회수.
4. **한국 헤리티지는 절제된 액센트로.** 한자(韓), 한글 명조, 마젠타. 키치한 BB크림 핑크 금지.

## 2. 컬러

```css
--bg:           #ffffff;     /* 기본 배경 */
--bg-soft:      #f5f5f7;     /* 카드, 입력 필드 */
--bg-warm:      #f0eee9;     /* 한지 톤, 한자 마크 배경 */
--ink:          #1d1d1f;     /* 본문 메인 */
--ink-2:        #2a2a2c;     /* 약간 약한 본문 */
--ink-3:        #4a4a4d;     /* WCAG AA 최저 회색 (이보다 옅으면 금지) */
--line:         #d2d2d7;     /* 강한 구분선 */
--rule:         #e8e8ed;     /* 약한 구분선 */
--accent:       #B21464;     /* 마젠타 — 액션, 강조 */
--accent-deep:  #8a0e4d;     /* hover */
--link:         #0071e3;     /* Apple-blue 텍스트 링크 전용 */
--gold:         #b48a3a;     /* 헤리티지 골드, 'rest' 일정 블록 */
--black-lacquer:#16110b;     /* 다크 섹션 */
```

**Funnel 컬러 코드 (일정 블록)**

| 카테고리 | 색 |
|---|---|
| Medical | `#B21464` |
| Hanbang | `#8B1E1E` |
| Culture | `#1B2D5C` |
| Cuisine | `#0E4035` |
| Stay    | `#1d1d1f` |
| Rest    | `#b48a3a` |

이 6색은 결과 페이지 일정 그리드의 시각 언어. 다른 카테고리 추가 시 이 팔레트와 충돌 없도록 검수.

## 3. 타이포그래피

**스택**
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             Inter, "Helvetica Neue", Arial, sans-serif;
```
- 본문 기본 **19px / weight 500** (시니어 기준 최소)
- 한글 강조: `'Nanum Myeongjo', serif` weight 700~800

**스케일**

| 클래스 | 크기 | 용도 |
|---|---|---|
| `.display` | clamp(48px, 6.4vw, 96px) / 700 | Hero h1 |
| `.h2`      | clamp(40px, 4.6vw, 64px) / 700 | 섹션 헤더 |
| `.h3`      | clamp(28px, 2.6vw, 36px) / 700 | 카드 제목 |
| `.lede`    | clamp(20px, 1.6vw, 24px) / 500 | 부제 |
| `.body-lg` | 21px / 500 | 강조 본문 |
| `.body`    | 19px / 500 | 기본 본문 |
| `.eyebrow` | 15px / 700, 마젠타 | 섹션 라벨 |
| `.hangul`  | Nanum Myeongjo 700, letter-spacing .04em | 한글 헤리티지 강조 |

## 4. 컴포넌트

### 4.1 CTA (Apple pill 버튼)
```html
<a class="cta">기본 마젠타</a>
<a class="cta dark">검정</a>
<a class="cta ghost">고스트</a>
<a class="cta lg">큰 사이즈 (60px)</a>
<a class="cta sm">작은 사이즈 (42px)</a>
```
- 기본 높이 **50px**, 패딩 28px, radius 999px
- 시니어 탭 타깃 보장: 최소 44×44 (lg는 60×60)
- hover: `--accent-deep`, active: `scale(.98)`

### 4.2 텍스트 링크 (Apple chevron)
```html
<a class="link">Learn more</a>   <!-- ›가 자동으로 붙음 -->
```
- 색은 `--link` (Apple blue) — **본문 인라인 링크 전용**, CTA 대용 금지

### 4.3 Step Card (랜딩 5단계 카드)
- `.step-card` — 흰 배경, border 1.5px, radius 18px, min-height 360px
- `.step-card.step-ai` — Step 5 전용. 다크 그라데이션 + 핫핑크 pulse
- 내부 옵션 미니 카드는 `.option` (emoji + name + sub + price)

### 4.4 폼 필드
- 높이 56px, radius 12px, 배경 `--bg-soft`, focus 시 마젠타 보더
- 라벨은 16px/700, 위쪽 8px 마진
- textarea는 height auto, min-height 120px

### 4.5 한자 워터마크 (`<symbol id="han-mark">`)
SVG 심볼로 정의 — 색은 `--mark-bg` (배경) / `--mark-fg` (전경) CSS 변수로 컨텍스트별 재색.
작은 사이즈는 `#han-mark-sm` (gutter 더 두꺼움).

## 5. 레이아웃

- 컨테이너: `.wrap` (1080px), `.wrap-wide` (1320px), padding 24px
- 섹션 vertical rhythm: 80~120px 상하 패딩
- nav 높이 68px, sticky, `backdrop-filter: blur(20px)`

## 6. 반응형 브레이크포인트

| BP | 변화 |
|---|---|
| 1100px | flow-steps 5→3열, schedule 7→4열 |
| 1000px | journeys 3→1열, process 4→2열 |
| 900px  | ai-panel 2→1열, tiles 2→1열 |
| 800px  | footer 4→2열 |
| 700px  | flow-steps 3→2열, schedule 4→2열, contact-grid 2→1열 |
| 600px  | process 2→1열 |
| 500px  | trust 3→2열, footer 2→1열 |

## 7. 페이지별 톤

| 페이지 | 톤 |
|---|---|
| index | 영업 + 안내. 한자 워터마크 크게. 마젠타 액센트 |
| step1~4 | 작업 모드. 카드 위주, 컬러 액센트 최소 |
| result | 신뢰 모드. 색 풍부한 일정 그리드 + 한국어 카피 |

## 8. 디자인 부채

- **카피 톤이 일관되지 않음**: index/step은 영어, result는 한국어
- **이미지 placeholder**: `assets/airlines/`, `assets/hotels/` — 라이선스 미확보
- **JSX 컴포넌트 인터랙션**: 디자인 시연용으로 만들어져 useState가 거의 없음. `interactive.js`가 DOM 스크랩으로 메꿈 — 디자인 일관성은 OK지만 견고성은 부족
- **다크 모드 미정의**: 색 변수 `--bg`, `--ink` 등은 라이트 전제

## 9. 디자인 변경 시 체크

- [ ] 본문이 19px 이하인가? → NO 가야 함
- [ ] 회색이 `--ink-3`보다 옅은가? → NO (WCAG AA 위반)
- [ ] 탭 타깃이 44×44 미만인가? → NO
- [ ] 핑크가 마젠타가 아닌가? → 마젠타로 통일
- [ ] 한자/한글 강조에 Nanum Myeongjo 안 썼는가? → 적용
- [ ] 일정 블록 색이 6색 팔레트 밖인가? → 팔레트 안에서 해결
