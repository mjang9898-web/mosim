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

## 키/노출 규칙
- **`SUPABASE_SERVICE_ROLE_KEY`는 `api/*`에서만**. 클라이언트 노출 절대 금지.
- 클라이언트엔 **anon 키만** — `/api/config`가 `{supabaseUrl, supabaseAnonKey}`를 돌려주고 브라우저가 받음(RLS가 보호하므로 anon 노출 OK).
- env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`(Vercel Project Settings).

## RLS 규칙
- **모든 신규 테이블에 `enable row level security`** + 본인 행만:
  - read/update/insert/delete: `using (auth.uid() = user_id)` / insert는 `with check (auth.uid() = user_id)`.
  - anon insert가 필요한 leads류: `for insert to anon with check (true)` + 본인 read만.
- 마이그레이션은 idempotent: `create table if not exists`, `drop policy if exists` 후 `create policy`, `create or replace function`.
- 가입 시 profile 자동 생성은 `auth.users` after-insert 트리거(`security definer`, `set search_path=public`, `on conflict do nothing`).
- DDL source of truth: `supabase/schema.sql`.

## Supabase Management API (DDL·Auth 설정 자동화)
PAT 필요(사용자 발급→작업 후 즉시 revoke). 프로젝트 ref·prod 도메인은 auto-memory `reference-supabase` 참조.
- SQL/DDL 실행: `POST https://api.supabase.com/v1/projects/<ref>/database/query` (Bearer PAT), body `{"query":"..."}` → DDL은 `[]`(201).
- Auth 설정: `PATCH .../config/auth` — `site_url`, `uri_allow_list`(콤마), `external_google_enabled/_client_id/_secret`.
- 확인된 유저 생성(서비스롤): `POST https://<ref>.supabase.co/auth/v1/admin/users` `{email,password,email_confirm:true}`. 삭제는 `DELETE .../admin/users/<id>`(profiles·itineraries CASCADE).
- 함정: Supabase는 가짜 도메인 이메일(`@example.com`·존재 안 하는 도메인)을 가입 검증에서 거부 → 테스트 유저는 admin API로 만든다.

## 결제 (PayPal)
- 한국 법인이라 **Stripe 불가 → PayPal**. concierge-fee-only 모델(실비는 vendor로 직접). 셋업/테스트모드는 무료.
- 기존 `payment_groups` 스키마(itinerary_id, total_amount, amount_paid, status)와 일관 유지. split-payment 작업은 진행 중.

## ⚠️ 비용 — zero-cost 빌드 단계 (반드시 먼저 플래그)
구현 전에 비용 발생 여부를 사용자에게 **먼저** 알린다:
- 무료: Vercel Hobby, Supabase free, serverless, PayPal 셋업/테스트.
- **유료(지금 유일)**: Claude/Anthropic API(AI 일정생성) — 사용량 과금, 무료티어 없음(~$0.01-0.05/건). 전략: `/api/schedule`는 만들되 프론트에서 호출 OFF로 둠. 켤 때 프롬프트 캐싱 적용(`claude-api` 스킬).
- 미래 트리거: 상업 운영 시 Vercel Pro($20/mo), 한도 초과 시 Supabase Pro($25/mo), 커스텀 SMTP는 도메인 산 뒤 Resend(이메일 확인 메일 딜리버리 이슈 때문).

## 배포
`main` 푸시 → Vercel 자동 배포(~15s). `cleanUrls:true`라 `/signin`→`signin.html`. 배포 검증은 prod URL에 curl + `mosim-visual-verify`. 상세 배포는 `deploy-to-vercel` 플러그인 스킬 활용.
