# K-Wellness Concierge — Web Funnel

K-Wellness Concierge의 5단계 funnel(랜딩 → Trip → Medical → Culture → Cuisine → AI 일정 결과)을 하나의 정적 멀티페이지 사이트로 묶은 결과물입니다. Claude Design에서 만든 디자인 프로토타입을 그대로 활용하면서, 페이지 간 네비게이션과 사용자 선택 데이터 전달을 얇은 vanilla JS 레이어로 추가했습니다.

## 폴더 구조

```
mosim-site/
├── index.html              랜딩 페이지
├── step1.html              Trip — 여행 기본 정보 (V2 Rich Editorial)
├── step2.html              Medical — 의료 & 웰니스 선택
├── step3.html              Culture — 문화 체험 선택
├── step4.html              Cuisine — 미식 + 식이 정보
├── result.html             AI 일정 결과 (sessionStorage → 7일 일정 템플릿)
├── netlify.toml            Netlify 배포 설정 (캐시, 깨끗한 URL)
├── README.md               이 문서
│
├── js/
│   ├── state.js            sessionStorage 기반 단계별 데이터 저장/로드
│   ├── interactive.js      JSX 프로토타입에 클릭 토글 + DOM 스크랩 기능 추가
│   ├── nav.js              Continue / Back 버튼을 다음 단계 페이지로 연결
│   ├── schedule.js         결과 페이지의 7일 일정 generator (Claude API 연동 지점)
│   ├── step1-trip-shared.jsx   공통 컴포넌트 (BrandNav, StepBar 등)
│   ├── step1-trip-v2.jsx       Step 1 화면
│   ├── step2-medical.jsx       Step 2 화면
│   ├── step3-culture.jsx       Step 3 화면
│   ├── step4-cuisine.jsx       Step 4 화면
│   └── image-slot.js           랜딩의 이미지 placeholder 컴포넌트
│
└── assets/
    ├── airlines/southwest.jpeg
    └── hotels/{four-seasons, hilton, hyatt, marriott}.*
```

## 데이터 흐름

```
[Landing 컨택트 폼] ──submit──> contact 정보 sessionStorage 저장
        │
        ▼
[Step 1 Trip] ──Continue──> trip 선택 저장 ──> step2.html
        │
        ▼
[Step 2 Medical] ──Continue──> medical 선택 저장 ──> step3.html
        │
        ▼
[Step 3 Culture] ──Continue──> culture 선택 저장 ──> step4.html
        │
        ▼
[Step 4 Cuisine] ──Continue──> cuisine 선택 저장 ──> result.html
        │
        ▼
[result.html] ──> kwSchedule.generate(전체 상태) ──> 7일 일정 렌더
```

저장 키: `sessionStorage["kw.state.v1"]` — 페이지 새로고침 시 유지, 탭 닫으면 사라집니다.

## 로컬에서 보기

순수 정적 사이트이므로 어떤 정적 서버든 OK.

```bash
# Python
cd mosim-site
python3 -m http.server 8000

# Node
npx http-server mosim-site -p 8000

# 또는 그냥 index.html 더블클릭
```

브라우저에서 http://localhost:8000 으로 접속.

## Netlify 배포

### A. 드래그-앤-드롭 (가장 빠름)
1. https://app.netlify.com/drop 에 접속
2. `mosim-site/` 폴더를 그대로 드롭

### B. CLI
```bash
npm install -g netlify-cli
cd mosim-site
netlify deploy --prod
```

### C. Git 연동
- Netlify 대시보드에서 GitHub 리포 연결 → "Publish directory"를 `mosim-site/` 로 설정
- `netlify.toml` 이 빌드 명령 / 헤더 / 리다이렉트를 자동 처리

## Vercel로 이전

Vercel도 같은 정적 구조를 그대로 받습니다.

```bash
npm install -g vercel
cd mosim-site
vercel --prod
```

`netlify.toml`의 리다이렉트는 Vercel에서 동작하지 않으므로, 깨끗한 URL이 필요하면 `vercel.json`을 추가하세요:

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/js/(.*).jsx",
      "headers": [
        { "key": "Content-Type", "value": "text/babel; charset=utf-8" }
      ]
    }
  ]
}
```

## AWS (S3 + CloudFront)로 이전

1. S3 버킷 생성 (Static website hosting 활성화)
2. `mosim-site/` 내용 업로드: `aws s3 sync mosim-site/ s3://your-bucket/ --delete`
3. CloudFront 배포 생성 → 오리진을 S3 웹사이트 엔드포인트로
4. `.jsx` 파일의 `Content-Type` 헤더를 `text/babel`로 주려면 S3에 업로드할 때 `--content-type` 지정하거나 CloudFront Functions로 헤더 재작성

## 향후 개선 — 백엔드 연동 지점

### 1. 컨택트 폼 → 진짜 이메일/CRM
`index.html`의 `kwSubmitContact()` 함수에 `fetch('/api/lead', ...)` 추가.
Netlify Forms를 쓰려면 form에 `data-netlify="true"`만 붙이면 자동 캡처됩니다.

### 2. AI 일정을 진짜 Claude API로
`js/schedule.js`의 `generateSchedule(state)`를 비동기로 바꾸고, Netlify Functions에 Claude API 호출 추가:

```js
// netlify/functions/schedule.js
exports.handler = async (event) => {
  const state = JSON.parse(event.body);
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildPrompt(state) }]
    })
  });
  return { statusCode: 200, body: await r.text() };
};
```

그리고 `result.html`의 스크립트를:
```js
var s = await fetch('/.netlify/functions/schedule', { method: 'POST', body: JSON.stringify(state) }).then(r => r.json());
```

### 3. 상태 영속화
현재는 sessionStorage (탭 닫으면 휘발). DB로 옮기려면 `js/state.js`의 `saveStep/loadAll`을 `fetch('/api/session/...')`로 교체.

## 알려진 제한

- **JSX 프로토타입은 정적**: 원본 디자인 컴포넌트들은 useState 훅이 거의 없는 디자인 시연용입니다. `js/interactive.js`가 후크 없이도 클래스 토글이 동작하게 만들고, Continue 시점에 DOM을 스크랩해 선택값을 캡처합니다. 더 견고하게 만들려면 README의 권고대로 Next.js 등에서 재구현하는 게 정석이고, 그때 `js/state.js`와 `js/schedule.js`는 거의 그대로 재사용 가능합니다.
- **JSX는 브라우저에서 Babel Standalone으로 변환**: 첫 로드가 다소 느립니다 (각 step 페이지에서 ~1초). 프로덕션 트래픽이 늘면 빌드 단계를 추가해서 사전 트랜스파일하시는 걸 권장합니다.
- **이미지 라이선스**: `assets/` 안의 항공사·호텔 로고는 라이선스 미확보 placeholder입니다. 정식 런칭 전 교체 필요.
- **Korean i18n**: 결과 페이지(result.html)는 한국어, 나머지는 영어 카피입니다. 다국어가 필요하면 카피 분리 필요.

## Local development with Vercel CLI

The `api/*` serverless functions only work under the Vercel dev server, not under plain `python3 -m http.server`.

```bash
npm i -g vercel
vercel link              # one-time, pick the existing project
vercel env pull          # pulls SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY into .env.local
npm run build            # one-time, also rerun after JSX edits unless you use `npm run dev`
vercel dev               # http://localhost:3000
```

## Supabase setup

See `supabase/SETUP.md` for the one-time configuration of Google OAuth and redirect URLs. The DDL lives in `supabase/schema.sql` and is applied via Supabase Studio's SQL Editor.
