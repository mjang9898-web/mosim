# CLAUDE.md — K-Wellness Concierge

이 파일은 Claude Code가 이 레포에서 작업할 때 컨텍스트로 자동 로드됩니다. 코드 구조, 작업 규칙, 배포 절차를 한 곳에 모았습니다.

## 무엇인가

K-Wellness Concierge의 **5단계 funnel + AI 일정 결과 페이지** 정적 사이트. 시니어 인바운드 의료/웰니스 관광객을 대상으로 컨택트 → Trip → Medical → Culture → Cuisine → 7일 일정 결과까지 인도하는 lead-gen funnel.

상세 제품 정의: [PRD.md](./PRD.md) · 디자인 시스템: [design.md](./design.md)

## 폴더 구조

```
mosim-site/
├── index.html          랜딩 (컨택트 폼 포함)
├── step1.html ~ step4.html
├── result.html         7일 일정 결과
├── loading.html        단계 전환 로딩 (옵션)
├── js/
│   ├── state.js        sessionStorage 래퍼 (window.kwState)
│   ├── nav.js          Continue / Back 라우팅
│   ├── interactive.js  JSX 프로토타입에 클릭 토글 + DOM 스크랩 추가
│   ├── schedule.js     7일 일정 생성 (window.kwSchedule.generate)
│   ├── image-slot.js   <image-slot> 커스텀 엘리먼트 (placeholder)
│   └── stepN-*.jsx     디자인 컴포넌트 (브라우저 babel-standalone으로 변환됨)
├── assets/             이미지 (airlines, hotels, slides)
├── netlify.toml        Netlify 헤더/리다이렉트 (Vercel로 가도 호환)
├── PRD.md              제품 정의
├── design.md           디자인 시스템
└── CLAUDE.md           이 파일
```

## 데이터 흐름

```
[랜딩 컨택트 폼] → kwState.saveStep('contact', {...})
        ↓
[Step 1] → kwState.saveStep('trip', {...})       → step2.html
[Step 2] → kwState.saveStep('medical', {...})    → step3.html
[Step 3] → kwState.saveStep('culture', {...})    → step4.html
[Step 4] → kwState.saveStep('cuisine', {...})    → result.html
        ↓
[result.html] → kwSchedule.generate(kwState.loadAll()) → 7일 일정 렌더
```

저장 키: `sessionStorage["kw.state.v1"]`. 스키마는 `js/state.js`의 `DEFAULT_STATE` 참고.

로그인한 사용자는 result 페이지에서 "Save this itinerary" CTA로 일정을 `public.itineraries`에 영구 저장한다. My Page (`/me.html`)는 Supabase JS로 RLS-보호된 `profiles` + `itineraries`를 직접 읽고, 4개 탭(Itineraries / Status / Profile / Settings)을 렌더한다. 인증은 Supabase Auth — Google OAuth 또는 Email/Password.

로그인 사용자는 저장된 일정에 대해 컨시어지 수수료를 결제할 수 있다. `/api/payment-group`이
일정당 `payment_groups` 행(총액 = $1,200 × 인원수, 조정 가능)을 만들고, `/pay?g=<token>`는
로그인 없이 누구나 잔액을 분할 결제할 수 있는 공유 페이지다. 결제는 PayPal(한국 법인 계정),
캡처는 `record_payment()`로 기록된다. 실비는 고객이 vendor에 직접 결제 — Mosim 미관여.

## 작업 규칙

### 코드
- **새 페이지 추가 금지** (PRD에 정의된 funnel 외). 추가가 필요하면 먼저 PRD 업데이트
- JSX 파일은 esbuild로 사전 컴파일됨 (`npm run build`) → JSX 안에서 `import`/`require` 사용 불가, 모든 컴포넌트는 전역 스코프에서 정의 (React production CDN 사용 중, JSX는 `React.createElement`로 변환됨)
- 상태 추가/변경 시 반드시 `js/state.js`의 `DEFAULT_STATE` 키 업데이트
- 빌드 후 산출물 (`js/step*.js`)는 gitignore됨 — 소스는 `.jsx`, 배포 시 Vercel이 `npm run build`로 자동 컴파일

### 디자인
- 본문 19px 이하 금지. 회색은 `--ink-3` 이하로 옅게 가지 않기 (design.md 참고)
- 마젠타(`#B21464`) 외 핑크 사용 금지
- 새 컬러 도입 전 design.md §2 팔레트와 충돌 확인

### 커밋
- PRD/design.md/CLAUDE.md 변경 시 커밋 메시지 prefix `docs:`
- 페이지 추가/큰 흐름 변경 시 `feat:`, 버그 `fix:`, 디자인 토큰 변경 `style:`

## 로컬에서 실행

**최초 1회 (또는 git pull 후)**:
```bash
npm install
npm run build       # JSX → JS 컴파일 (10ms)
```

**개발 서버**:
```bash
python3 -m http.server 8000
# 또는
npx http-server -p 8000
```

**JSX 수정 중일 때** — watch 모드 권장:
```bash
npm run dev         # JSX 저장 시 자동 재빌드 + sourcemap
```

브라우저: http://localhost:8000

## 빌드 파이프라인

- 소스: `js/step*.jsx` (커밋됨, source of truth)
- 산출물: `js/step*.js` (gitignore, Vercel이 배포 시 자동 생성)
- 도구: esbuild — JSX 트랜스폼 + 미니파이 + es2020 타겟
- 비-JSX JS 파일 (`state.js`, `nav.js`, `schedule.js` 등)은 그대로 사용

## 배포 — GitHub + Vercel + Supabase

### 1. GitHub 레포 초기화

```bash
cd mosim-site
git init
git add .
git commit -m "feat: initial commit — K-Wellness Concierge funnel"

# GitHub에서 새 레포 만든 뒤
git remote add origin git@github.com:<org>/mosim-site.git
git branch -M main
git push -u origin main
```

**중요**: 레포 루트는 `mosim-site/`. 상위 `Mosim/` 폴더의 PDF/PPTX/엑셀(사업계획서, 폐업증명서 등)이 같이 올라가지 않도록 주의.

### 2. Vercel 연동

1. https://vercel.com/new 에서 GitHub 레포 import
2. **Root Directory**: `./` (mosim-site가 레포 루트이므로)
3. **Framework Preset**: Other (정적 사이트)
4. **Build Command**: 비움
5. **Output Directory**: `./`
6. Deploy

`netlify.toml`의 리다이렉트는 Vercel에서 동작하지 않음. 깨끗한 URL(`/step1` → `/step1.html`)이 필요하면 `vercel.json` 추가:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/js/(.*).jsx",
      "headers": [{ "key": "Content-Type", "value": "text/babel; charset=utf-8" }]
    }
  ]
}
```

main 브랜치 푸시 → Vercel 자동 배포 (preview는 다른 브랜치).

### 3. Supabase 연동

목적: 컨택트 폼 리드 + 완료된 funnel 상태를 DB에 영속화.

**3.1 테이블 (Supabase SQL Editor에서)**

```sql
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  email       text not null,
  origin_from text,                  -- '어디서 오는지'
  travel_when text,                  -- '언제 갈지'
  interest    text,                  -- 관심 분야
  note        text,
  state       jsonb,                 -- 완료된 funnel 전체 (state.js의 DEFAULT_STATE)
  status      text default 'new'     -- new | contacted | quoted | booked | lost
);

-- 익명 클라이언트가 insert만 할 수 있게
alter table public.leads enable row level security;
create policy "leads_insert_anon" on public.leads
  for insert to anon with check (true);
```

**3.2 환경변수 (Vercel Project Settings → Environment Variables)**

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # 서버 함수 전용, 클라이언트에 노출 금지
ANTHROPIC_API_KEY=sk-ant-...           # 일정 생성용
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...              # 서버 함수 전용, 클라이언트 노출 금지
PAYPAL_ENV=sandbox                    # 운영 시 live
```

**3.3 클라이언트에서 호출 (`/api/lead` 경유 권장)**

직접 Supabase 호출보다는 Vercel Serverless Function을 거쳐 PII를 검증/저장하는 게 안전:

```js
// /api/lead.js (Vercel serverless)
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { contact, state } = req.body || {};
  if (!contact?.email) return res.status(400).json({ error: 'email required' });

  const { data, error } = await supa.from('leads').insert({
    name: contact.name,
    email: contact.email,
    origin_from: contact.from,
    travel_when: contact.when,
    interest: contact.interest,
    note: contact.note,
    state
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ id: data.id });
}
```

`index.html`의 `kwSubmitContact()`에서 `fetch('/api/lead', {...})` 호출 추가.

### 4. Claude API로 진짜 일정 생성

`js/schedule.js`의 `generateSchedule(state)` 는 현재 템플릿 기반. 백엔드로 옮기는 절차:

```js
// /api/schedule.js (Vercel serverless)
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  const state = req.body || {};
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',       // 최신 가성비 모델
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: buildPrompt(state)      // state → "이 사람을 위한 7일 일정 JSON 만들어줘"
    }]
  });
  res.status(200).json({ schedule: parseSchedule(msg.content[0].text) });
}
```

그리고 `result.html`은:
```js
const state = kwState.loadAll();
const { schedule } = await fetch('/api/schedule', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(state)
}).then(r => r.json());
renderSchedule(schedule);
```

프롬프트 캐싱 활용 권장 (시스템 프롬프트 + 카테고리 라벨 매핑은 캐시).

### 5. 도메인 / 커스텀 URL
- Vercel Project → Settings → Domains 에서 커스텀 도메인 연결
- SSL 자동 발급

### 6. 배포 체크리스트

배포 전:
- [ ] `.gitignore` 확인 — `.DS_Store`, `node_modules`, `.env*` 제외
- [ ] PRD/design.md/CLAUDE.md 최신 상태
- [ ] Vercel 환경변수 설정 — Supabase 4개(SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, ANTHROPIC_API_KEY) + PayPal 3개(CLIENT_ID, CLIENT_SECRET, ENV)
- [ ] PayPal 환경변수 3개(CLIENT_ID, CLIENT_SECRET, ENV) 설정 + 운영 전 PAYPAL_ENV=live 전환
- [ ] Supabase RLS 정책 적용 (anon insert만 + profiles/itineraries own row)
- [ ] Supabase Auth Providers — Google 활성 + Client ID/Secret 입력
- [ ] Supabase URL Configuration — Site URL + redirect URLs (signup/signin/me/reset-password/result) 등록
- [ ] 이미지 라이선스 placeholder 교체 (또는 임시 공지)

배포 후:
- [ ] 컨택트 폼 제출 → Supabase `leads` 테이블 행 생성 확인
- [ ] `/step1` ~ `/step4` 진행하고 result에서 일정 렌더 확인
- [ ] Lighthouse > 90 (Performance/Accessibility)

## 도와줄 때 기억할 것

- 이 사이트는 **lead-gen funnel**이다. 결제/예약 단계를 추가하라는 요청은 PRD 확장이 먼저
- 사용자 선택 데이터는 `kwState`로만 다룬다. 직접 `sessionStorage` 호출 금지 (테스트성 코드 제외)
- JSX 안에서 새 의존성을 import하지 말 것 — babel-standalone 환경
- 새 카테고리 옵션 추가 시 `js/schedule.js`의 `MED_LABELS`/`CULTURE_LABELS`/`CUISINE_LABELS` 매핑 동시 업데이트

## 하네스: mosim-site 빌드 팀

**목표:** 프론트(JSX/정적)·백엔드(Supabase/serverless/PayPal)·QA(Playwright)·콘텐츠를 전문 에이전트 팀으로 일관되게 빌드/검증한다.

**트리거:** mosim-site의 비자명한 빌드/수정/풀스택 작업 요청 시 `mosim-orchestrator` 스킬을 사용하라(에이전트 팀 기본). 단순 질문/조회는 직접 응답 가능. 에이전트는 `.claude/agents/`, 컨벤션 스킬은 `.claude/skills/mosim-*`에 있다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-29 | 초기 구성 (에이전트4 + 스킬3 + 오케스트레이터) | 전체 | 하네스 신규 구축 |
