---
name: mosim-backend-conventions
description: The patterns and recipes for mosim-site backend work — Supabase (schema, RLS, Auth, triggers), Vercel serverless functions in api/, PayPal payments, env vars, and the Supabase Management API. Use whenever creating/editing api/*.js, changing the DB schema or RLS, wiring auth/payments, or running admin DB tasks. Also enforces the zero-cost build-phase cost flagging.
---

# mosim-site Backend Conventions

Supabase(Postgres+Auth) + Vercel serverless(`api/*.js`) + PayPal. 정적 프론트가 `/api/*`와 Supabase REST를 호출.

## Serverless 함수 패턴 (`api/*.js`, ESM)
```js
import { createClient } from '@supabase/supabase-js';
const admin = (URL && SERVICE_ROLE)
  ? createClient(URL, SERVICE_ROLE, { auth:{ persistSession:false, autoRefreshToken:false }}) : null;
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  if (!admin) return res.status(500).json({error:'Server not configured'});
  const token = (req.headers.authorization||'').startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({error:'Missing bearer token'});
  const { data:{ user } } = await admin.auth.getUser(token);
  if (!user) return res.status(401).json({error:'Invalid token'});
  /* ... use user.id ... */
}
```
- 변형/민감 작업은 **Bearer JWT 검증 후 `admin.auth.getUser(token)`로 user 확인**.
- 검증: `node --check api/x.js`.
- 공용 서버 헬퍼는 **`api/_lib/`** (언더스코어 → Vercel이 라우트로 취급 안 함). 순수 로직은 **`node:test`로 테스트**(`npm test`) — 외부 테스트 프레임워크 추가 금지.

## 키/노출 규칙
- **`SUPABASE_SERVICE_ROLE_KEY`는 `api/*`에서만**. 클라이언트 노출 절대 금지.
- 클라이언트엔 **anon 키만** — `/api/config`가 `{supabaseUrl, supabaseAnonKey}`를 돌려주고 브라우저가 받음(RLS가 보호하므로 anon 노출 OK).
- env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`(Vercel Project Settings).
- ⚠️ Supabase 변수는 현재 **Production 스코프 전용** → Preview 배포에선 함수가 `Server not configured`로 죽음. Preview에서 풀스택 테스트하려면 변수 스코프를 Preview로 확장하거나, 프로덕션(샌드박스 모드)에서 테스트.

## RLS 규칙
- **모든 신규 테이블에 `enable row level security`** + 본인 행만:
  - read/update/insert/delete: `using (auth.uid() = user_id)` / insert는 `with check (auth.uid() = user_id)`.
  - anon insert가 필요한 leads류: `for insert to anon with check (true)` + 본인 read만.
- 마이그레이션은 idempotent: `create table if not exists`, `drop policy if exists` 후 `create policy`, `create or replace function`.
- 가입 시 profile 자동 생성은 `auth.users` after-insert 트리거(`security definer`, `set search_path=public`, `on conflict do nothing`).
- **서비스롤 전용 원자적 작업은 `security definer` 함수 + `revoke execute on function ... from public, anon, authenticated`** — Supabase는 public 스키마 함수 EXECUTE를 `public`에 기본 부여하므로, REVOKE 안 하면 anon이 REST RPC(`/rest/v1/rpc/<fn>`)로 직접 호출 가능. `set search_path=public` + 행 잠금 `select ... for update`. 예: `record_payment`.
- **로그인 없는 토큰 페이지**(예: `/pay?g=<token>`): 테이블은 anon 접근 차단(RLS) + 추측불가 랜덤 토큰(`crypto.randomBytes`). anon은 서버리스 함수(서비스롤, RLS 우회)를 통해서만 토큰으로 읽기/쓰기. 소유자에겐 본인 행 직접 read 정책만 부여.
- DDL source of truth: `supabase/schema.sql`.

## Supabase Management API (DDL·Auth 설정 자동화)
PAT 필요(사용자 발급→작업 후 즉시 revoke). 프로젝트 ref·prod 도메인은 auto-memory `reference-supabase` 참조.
- SQL/DDL 실행: `POST https://api.supabase.com/v1/projects/<ref>/database/query` (Bearer PAT), body `{"query":"..."}` → DDL은 `[]`(201).
- Auth 설정: `PATCH .../config/auth` — `site_url`, `uri_allow_list`(콤마), `external_google_enabled/_client_id/_secret`.
- 확인된 유저 생성(서비스롤): `POST https://<ref>.supabase.co/auth/v1/admin/users` `{email,password,email_confirm:true}`. 삭제는 `DELETE .../admin/users/<id>`(profiles·itineraries CASCADE).
- 함정: Supabase는 가짜 도메인 이메일(`@example.com`·존재 안 하는 도메인)을 가입 검증에서 거부 → 테스트 유저는 admin API로 만든다.

## 결제 (PayPal) — split-payment 배포됨 (2026-05-29)
- 한국 법인이라 **Stripe 불가 → PayPal**. concierge-fee-only 모델(실비는 vendor로 직접 결제 — Mosim 미관여). 셋업/테스트 무료. `PAYPAL_ENV=sandbox`(운영 전환 시 `live` + 실 법인 키).
- 테이블: `payment_groups`(itinerary_id, share_token, total_amount=$1200×인원, amount_paid, status `open|paid`) + `payments`(거래 기록). 캡처는 `record_payment()` RPC로 원자적 기록(위 service-definer + REVOKE 패턴).
- 엔드포인트: `/api/payment-group`(소유자 create-or-get + 토큰 public 요약), `/api/paypal-order`(action `create`|`capture`). PayPal는 **SDK 없이 fetch로 REST 호출**(`api/_lib/paypal.js`: OAuth→createOrder→captureOrder). 기록 금액은 **캡처 응답값** 사용(클라 입력 신뢰 X). 페이지: 로그인 없는 `pay.html`+`js/pay.js`(분할 결제 링크). 금액 검증 `api/_lib/amount.js`.
- 스펙/플랜: `docs/superpowers/specs|plans/2026-05-29-split-payment*`.

## ⚠️ 비용 — zero-cost 빌드 단계 (반드시 먼저 플래그)
구현 전에 비용 발생 여부를 사용자에게 **먼저** 알린다:
- 무료: Vercel Hobby, Supabase free, serverless, PayPal 셋업/테스트.
- **유료(지금 유일)**: Claude/Anthropic API(AI 일정생성) — 사용량 과금, 무료티어 없음(~$0.01-0.05/건). 전략: `/api/schedule`는 만들되 프론트에서 호출 OFF로 둠. 켤 때 프롬프트 캐싱 적용(`claude-api` 스킬).
- 미래 트리거: 상업 운영 시 Vercel Pro($20/mo), 한도 초과 시 Supabase Pro($25/mo), 커스텀 SMTP는 도메인 산 뒤 Resend(이메일 확인 메일 딜리버리 이슈 때문).

## 배포
`main` 푸시 → Vercel 자동 배포(~15s). `cleanUrls:true`라 `/signin`→`signin.html`. 배포 검증은 prod URL에 curl + `mosim-visual-verify`. 상세 배포는 `deploy-to-vercel` 플러그인 스킬 활용.
