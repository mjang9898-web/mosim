# Accounts & My Page — Design

**Date:** 2026-05-27
**Status:** Approved for implementation planning
**Author:** Brainstormed with founder via Claude

## 1. 목적

K-Wellness Concierge에 사용자 계정 시스템과 My Page를 추가한다. 네 가지 목적을 동시에 충족한다.

1. **여정 저장 + 재방문** — funnel을 한 번 진행하면 결과 일정이 영구 저장되고, 재방문 시 다시 열람할 수 있다. (sessionStorage → DB 영구화)
2. **상담/예약 진행 상태 추적** — 운영자가 부여하는 `new → reviewing → quoted → booked` 상태를 손님이 My Page에서 직접 확인한다.
3. **리드 품질 강화** — 가입한 사용자에 한해 추가 정보(언어, 출신국, 전화) 확보 및 재마케팅 채널 확보.
4. **개인화** — 다음 funnel 진행 시 프로필 기반 사전 입력 가능 (1차에는 표시만, 자동 입력은 v2).

## 2. 아키텍처 개요

- **인증**: Supabase Auth — **Google OAuth + Email/Password** (Apple은 v2)
- **세션 관리**: Supabase JS 클라이언트(`@supabase/supabase-js`)가 브라우저 `localStorage`에 JWT 보관 + 자동 갱신
- **데이터 접근**: 클라이언트가 RLS(Row-Level Security)로 보호된 Supabase REST를 직접 호출. 보안이 필요한 변형 작업(저장, 계정 삭제)만 serverless function 경유
- **신규 페이지**: `/signin.html`, `/signup.html`, `/reset-password.html`, `/me.html` 네 장
- **신규 serverless**: `/api/save-itinerary`, `/api/delete-account`, `/api/config` 세 개

대안 비교:
- *서버 BFF 전부* — 보안↑ 코드량↑↑. 정적 사이트 성격과 안 맞음. **기각**
- *클라이언트 + RLS* (채택) — 표준 Supabase 패턴, 가장 가벼움
- *하이브리드* — Apple 도입 시 재검토

## 3. 데이터 모델

### 3.1 스키마 (Postgres / Supabase)

```sql
-- Supabase가 자동 관리: auth.users (id uuid, email text, ...)

-- 1) 프로필 (auth.users와 1:1)
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  phone           text,
  language        text default 'en',         -- 'en' | 'ko'
  origin_country  text,                       -- 'US', 'KR', ...
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2) 저장된 7일 일정
create table public.itineraries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  title       text,                            -- "Seoul wellness trip — May 2026"
  state       jsonb not null,                  -- funnel 전체 응답 (재현용)
  schedule    jsonb not null,                  -- 렌더된 7일 일정 스냅샷
  status      text default 'new'               -- new|reviewing|quoted|booked|archived
);

create index itineraries_user_id_created_idx
  on itineraries(user_id, created_at desc);

-- 3) 기존 leads에 user 연결
alter table public.leads add column user_id uuid references auth.users(id);
```

### 3.2 RLS

```sql
alter table profiles enable row level security;
create policy "own profile r" on profiles for select using (auth.uid() = id);
create policy "own profile w" on profiles for update using (auth.uid() = id);

alter table itineraries enable row level security;
create policy "own itin r" on itineraries for select using (auth.uid() = user_id);
create policy "own itin i" on itineraries for insert with check (auth.uid() = user_id);
create policy "own itin u" on itineraries for update using (auth.uid() = user_id);
create policy "own itin d" on itineraries for delete using (auth.uid() = user_id);

alter table leads enable row level security;
create policy "leads insert anon" on leads for insert to anon with check (true);
create policy "leads own read"    on leads for select using (auth.uid() = user_id);
```

`status` 컬럼은 사용자가 직접 변경하지 못해야 한다. update 정책에서 status 변경 차단 또는 운영자만 service-role로 update. **1차에는 itineraries update 정책에서 status 변경을 막는 컬럼-level 제약은 생략**하고, 운영자가 Supabase Studio에서 직접 status를 바꾸는 것으로 시작. (v2에서 `is_admin` 컬럼 + 정책 추가)

### 3.3 가입 시 자동 profile 생성 트리거

```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 4. 사용자 플로우

### 4.1 Sign up — `/signup.html`

```
[Sign up to save your trip]
─────────────────────────
[ Continue with Google ]
─────────── or ─────────────
Email     [____________]
Password  [____________]
Name      [____________]
[      Create account      ]

Already have an account?  Sign in →
```

- Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <return_url> } })`
- Email/PW: `supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: <return_url> } })` → 확인 메일 발송
- 메일 미확인 상태에서도 로그인은 가능. 일정 저장 시점에 미확인이면 토스트 + Resend 버튼

### 4.2 Sign in — `/signin.html`

같은 레이아웃 + "Forgot password?" 링크. `signInWithPassword` 또는 `signInWithOAuth`.

### 4.3 Password reset — `/reset-password.html`

Supabase 기본 흐름: signin의 "Forgot?" → 이메일 입력 → `resetPasswordForEmail` → 메일 링크 → `/reset-password.html`에서 새 비밀번호 입력 → `updateUser({ password })`.

### 4.4 Save itinerary — `result.html` 변경

큰 CTA 한 개 추가:

```
─────────────────────────────────
 Save this itinerary
 Get updates as we hand-craft it
 [    Save to my account    ]
─────────────────────────────────
```

- **로그인 상태** → `POST /api/save-itinerary` (body: `{ state, schedule, title }`) → 저장 후 "Saved ✓" + "View in My Page" 링크
- **비로그인** → `/signup.html?next=result&save=1`. 가입/로그인 완료 후 result로 복귀, `?save=1` 감지 시 sessionStorage의 funnel 상태로 자동 저장 1회 실행

중복 저장은 허용한다(같은 funnel을 두 번 Save 하면 두 행 생성). 사용자가 My Page에서 삭제 가능.

**Title 자동 생성**: `state.trip.when`(언제) + `state.medical[0]`(주 관심사) 기반으로 클라이언트가 자동 생성. 예: "Wellness trip — May 2026" / "Skin treatment retreat — March 2026". 사용자가 수동 편집은 v2.

### 4.5 My Page — `/me.html`

```
Hi, {name}                                          [Sign out]

[ Itineraries ]  [ Status ]  [ Profile ]  [ Settings ]

▼ Itineraries
  카드 그리드. status 배지 + saved date + "View →"
  + Plan a new trip → step1.html

  "View →" 동작: /result.html?itin=<id>로 이동. result.html이 로드 시
  ?itin 파라미터 감지 → Supabase에서 해당 itinerary fetch →
  itineraries.schedule (저장된 스냅샷)을 그대로 렌더. funnel 응답으로
  새로 생성하지 않음(원본 일정 그대로 보여줌).

▼ Status
  가장 최근 itinerary의 status 타임라인:
  [new] → [reviewing] → [quoted] → [booked]
  운영자 메모 영역(추후 itineraries.status_note 컬럼; v2)

▼ Profile
  Name / phone / origin_country / language 폼. Save 버튼.
  Email은 표시만(변경은 v2).

▼ Settings
  □ Email me when status changes  (1차: UI만, 실제 발송은 v2)
  [ Delete my account ]   ← 확인 모달
```

탭은 한 페이지에서 query param(`?tab=itineraries`)으로 전환. SPA 라우터 없이 vanilla.

### 4.6 Nav 변경

모든 페이지(`index.html`, `step1~4.html`, `result.html`, `me.html`)의 nav 우측:
- 비로그인: `Sign in`
- 로그인: `My Page` (+ 아바타 이니셜)

vanilla JS(`js/nav-auth.js`)가 페이지 로드 시 `supabase.auth.getUser()` 호출 → DOM 조작으로 토글. `onAuthStateChange` 구독해서 다른 탭에서 로그아웃 시 자동 갱신.

### 4.7 컬택트 폼

`index.html` 하단의 기존 폼은 그대로. `kwSubmitContact()` 안에서 현재 user가 있으면 `user_id`를 `/api/lead` 페이로드에 포함. `api/lead.js`가 body에서 `user_id`를 받아 `leads.user_id`에 저장. 비로그인이어도 기존과 동일하게 작동.

## 5. 파일 변경 목록

### 새 파일

```
/signin.html                    — 로그인 페이지
/signup.html                    — 가입 페이지
/reset-password.html            — 비밀번호 재설정 처리
/me.html                        — My Page (탭 4개)
/js/auth.js                     — Supabase 클라이언트 + 헬퍼
                                  initSupabase, getUser, getProfile,
                                  signInWithGoogle, signInWithEmail,
                                  signUpWithEmail, signOut, requireAuth
/js/nav-auth.js                 — nav 우측 Sign in/My Page 토글
/js/me-itineraries.jsx          — Itineraries 카드 리스트
/js/me-status.jsx               — Status 타임라인
/js/me-profile.jsx              — Profile 폼
/js/me-settings.jsx             — Settings 토글 + 계정 삭제
/api/save-itinerary.js          — POST: itineraries insert
/api/delete-account.js          — POST: auth.admin.deleteUser
/api/config.js                  — GET: { url, anonKey } JSON
/supabase/schema.sql            — §3의 DDL을 한 파일로 (수동 실행용)
```

### 변경되는 파일

```
index.html        nav 추가, kwSubmitContact()에 user_id 전달
step1~4.html      nav 추가
result.html       "Save this itinerary" CTA + 저장 로직 + ?itin=<id> 로드 분기
api/lead.js       body.user_id 받아서 leads.user_id 저장
package.json      "@supabase/supabase-js" 디펜던시 추가
vercel.json       clean URL: /signin → /signin.html 등
README.md         로컬 개발 시 Supabase env 설명 추가
CLAUDE.md         배포 체크리스트에 Supabase Auth providers 설정 추가
```

`js/state.js`, `js/schedule.js`는 변경 없음.

## 6. 환경 변수 / 외부 설정

```
SUPABASE_URL                    이미 있음 — /api/config로 클라이언트 노출
SUPABASE_ANON_KEY               이미 있음 — /api/config로 클라이언트 노출
SUPABASE_SERVICE_ROLE_KEY       서버 only (api/save-itinerary, delete-account)
ANTHROPIC_API_KEY               별개 (일정 생성용, 본 spec과 무관)
```

`ANON_KEY`는 클라이언트에 노출되어도 안전(RLS가 보호). `/api/config` 엔드포인트가 `{ url, anonKey }`를 리턴해서 env 바꿔도 재배포 없이 반영.

**Supabase 대시보드 설정** (env 아님):
- Auth > Providers > Google enable + Google Cloud Console에서 발급한 Client ID/Secret 입력
- Auth > URL Configuration > Site URL = `https://<도메인>`, Additional redirect URLs에 `/signup.html`, `/signin.html`, `/me.html`, `/reset-password.html` 추가
- Auth > Email Templates > 확인/리셋 메일 영문 문구 가볍게 K-Wellness 톤으로 수정

## 7. 엣지 케이스 처리

| 상황 | 처리 |
|---|---|
| funnel 진행 중 nav에서 Sign in 클릭 | sessionStorage 유지, 로그인 후 `?next=stepN`로 복귀 |
| 비로그인 result에서 Save 클릭 | `/signup.html?next=result&save=1` → 가입 후 result로 복귀, sessionStorage 상태로 자동 저장 1회 |
| 같은 itinerary 중복 Save | 허용. 사용자가 My Page에서 삭제 가능 |
| OAuth 콜백 실패 | Supabase가 `?error=...`로 리다이렉트, signin/signup 페이지에서 토스트로 표시 |
| 이메일 미확인 상태에서 Save | 토스트 "Please confirm your email first" + Resend confirmation 버튼 |
| 계정 삭제 | `/api/delete-account` → `auth.admin.deleteUser(id)`. profiles/itineraries는 CASCADE로 자동 삭제. leads는 `user_id`를 NULL로 익명화하여 유지 |
| 토큰 만료 | Supabase JS 자동 갱신. 실패 시 `onAuthStateChange`가 nav를 Sign in 상태로 자동 전환 |
| 다른 사람 기기에 funnel sessionStorage가 남은 채 가입 | 1차에는 그대로 둠(보통 자기 기기 사용). v2에서 가입 시 sessionStorage clear 옵션 검토 |
| funnel 미완료 상태에서 가입 | sessionStorage의 부분 state는 그대로. result 도달 전까지는 저장 안 됨. (부분 저장은 v2 — "draft" 개념) |

## 8. 보안 고려사항

- **RLS는 모든 새 테이블에 enable** 필수. 빠뜨리면 anon이 전부 읽어감
- **service_role key는 절대 클라이언트에 노출 금지**. `/api/*` 안에서만 사용
- **OAuth redirect URLs는 화이트리스트**. Supabase 대시보드에 도메인 명시 등록
- **CSRF**: Supabase Auth는 PKCE 사용해서 OAuth CSRF 안전. Email/PW는 fetch라 자동 보호
- **이메일 검증 우회 차단**: itineraries insert 시 서버에서 `auth.users.email_confirmed_at`을 확인하지 않으면 미확인 사용자도 저장 가능. 1차에는 클라이언트에서만 막고(UX), 서버 검증은 v2. (큰 위험 없음 — 본인 계정에만 저장됨)
- **계정 삭제 API**는 본인 인증된 호출만 수락 (Authorization 헤더의 JWT를 검증)

## 9. 테스트 체크리스트 (구현 후 수동)

- [ ] Google로 가입 → `profiles` 행 자동 생성 확인
- [ ] Email/PW 가입 → 확인 메일 → 클릭 → 로그인 진행
- [ ] 비밀번호 재설정 풀 플로우
- [ ] funnel → result → Save (로그인 상태) → My Page에 등장
- [ ] 비로그인 result → Save → signup → 자동 복귀 + 저장
- [ ] 같은 itinerary 두 번 Save → 두 행 모두 생성 확인
- [ ] My Page 4개 탭 모두 정상 렌더
- [ ] 다른 사용자의 itinerary id로 URL 직접 접근 시 RLS로 차단되는지 확인
- [ ] 컬택트 폼 — 로그인/비로그인 모두 leads 저장, 로그인 시 `user_id` 채워짐
- [ ] 계정 삭제 → 같은 이메일로 재가입 가능
- [ ] 운영자가 Supabase Studio에서 status 변경 → My Page Status 탭에 반영
- [ ] Lighthouse Performance/Accessibility 90+

## 10. 롤아웃 순서

다음 단계인 implementation plan에서 세분화될 예정.

1. Supabase 스키마 + RLS + 트리거 적용 (Supabase SQL Editor)
2. Supabase 대시보드: Google provider + redirect URLs 설정
3. `/api/config` + `js/auth.js`
4. `/signup.html` + `/signin.html` + `/reset-password.html`
5. 전 페이지 nav 갱신 (`js/nav-auth.js`)
6. `result.html` Save CTA + `/api/save-itinerary`
7. `/me.html` + 4개 `me-*.jsx` 섹션
8. `/api/delete-account`
9. `api/lead.js` user_id 처리 + `index.html`의 컬택트 폼 갱신
10. README + CLAUDE.md 업데이트

## 11. 알려진 리스크

- **Google OAuth 설정**: Google Cloud Console에서 OAuth 클라이언트 생성 + Authorized redirect URI에 Supabase 콜백 URL(`https://<project>.supabase.co/auth/v1/callback`) 등록 필요. 처음 한 번이라 막힐 수 있음 — 구현 시 단계 안내
- **이메일 발송 제한**: Supabase 무료 플랜은 시간당 메일 수 제한 + 발신자 `noreply@mail.app.supabase.io`. 운영 본격화 시 SMTP 커스텀(Resend, Postmark 등) 설정 권장. 1차 출시에는 기본값
- **status 사용자 위변조**: 1차에는 itineraries update RLS에서 status를 분리하지 않음. 사용자가 본인 itinerary의 status를 임의 변경할 수 있음(자기 자신에게만 보임). 운영 영향 없으나 v2에서 컬럼-level 정책 필요

## 12. 명시적 v2 (이번 spec에 포함하지 않음)

- Apple OAuth
- "Draft" 개념 (funnel 미완료 상태 저장)
- 일정 자동 status 변경 알림 메일 발송
- Profile 기반 funnel 사전 입력 (자동)
- 다른 사용자의 itinerary 공유 링크 (read-only)
- 운영자 전용 admin UI (지금은 Supabase Studio 사용)
- 이메일 변경 흐름
- itineraries.status_note 컬럼 + 운영자 메모 표시
