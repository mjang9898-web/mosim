---
name: mosim-security-conventions
description: The security checklist and hard invariants for mosim-site — Supabase RLS, server-only secrets, serverless api/* authz, the health-data "care.note is never stored" rule, security headers/CSP allow-list, payment/share-token safety, and dependency CVE checks. Use whenever reviewing or building changes that touch DB schema/RLS, auth/login, payments, api/*, env/secrets, or security headers; and for periodic security audits. Read this before issuing any security PASS/FAIL. Also applies to follow-ups ("보안 다시 점검/감사/업데이트").
---

# mosim-site 보안 컨벤션 & 불변식

mosim-site는 **개인정보(PII) + 건강 민감정보**를 받는다. 이 문서는 security-reviewer가 PASS/FAIL을 낼 때 쓰는 **체크리스트 + 절대 깨면 안 되는 불변식**이다. backend-engineer도 구현 시 이 규범을 따른다.

핵심 철학: **"왜 위험한가"를 이해하고 판정하라.** 규칙을 기계적으로 적용하지 말고, 각 항목의 위협 모델을 보고 새로운 변경이 그 위협을 여는지 판단한다.

---

## A. 절대 불변식 (위반 = 즉시 FAIL, P0)

1. **건강 민감정보 비저장 — `care.note`는 DB에 저장하지 않는다.**
   - `care.note`(자유서술: "3월 무릎수술, 재활 필요" 같은 진짜 병력)는 AI 일정 생성에만 쓰고 **디스크에 남기지 않는다.** 클라이언트에서 떼고, 서버(`lead.js`·`save-itinerary.js`·`claim-itinerary.js` 등)에서 **방어적으로 또 뗀다.**
   - *위협:* 병력은 가장 민감한 데이터. DB 유출 시 피해 최대, 규제(민감정보) 직격.
   - *검수:* 새 경로(새 api·새 컬럼·새 저장 로직)가 `state.care.note`(또는 동등 자유서술 건강 텍스트)를 **DB insert/update에 포함시키면 FAIL.** 서버측 strip이 새 경로에도 있는지 확인.

2. **`service_role`(마스터 키)는 서버 전용.** `api/*`에서만 사용, 클라이언트 번들·`/api/config` 응답·로그에 절대 노출 금지. 클라이언트엔 `anon` 키만(RLS가 보호).
   - *위협:* service_role은 RLS를 우회하는 전권 키. 유출 = 전 고객 데이터 탈취.

3. **레포에 평문 시크릿 0.** `*_SECRET`·`SERVICE_ROLE_KEY`·`ANTHROPIC_API_KEY`·PAT 등이 코드·커밋·`.env`(gitignore 확인)에 하드코딩되면 FAIL. (`git grep`로 키 패턴 스캔.)

---

## B. Supabase RLS (행 단위 잠금)

- **모든 신규 테이블에 RLS enable.** 끄면 anon 키로 전 행 접근 가능 → 사실상 공개 DB.
- **본인 행만:** `using (auth.uid() = user_id)` (+ insert는 `with check`). 로그인 사용자는 자기 데이터만.
- **익명 입력 테이블(leads류):** insert 정책만 명시적으로 열고 **select/update/delete는 닫는다.** (누구나 자기 리드를 넣되, 남의 리드는 못 읽게.)
- **서버 전용 테이블(`pending_itineraries` 등):** 정책 0개 = 클라이언트 완전 차단, service_role(서버)로만 접근. 모범 패턴.
- *검수 포인트:* **새 테이블·새 컬럼이 추가됐는데 RLS/정책이 그대로면 그 틈이 구멍이다.** 컬럼 단위 민감도(건강·연락처)도 본다. 마이그레이션은 idempotent(`drop policy if exists`).

## C. 서버리스 `api/*` 함수

- **메서드 체크**(405), **env 미설정 방어**(500, 단 내부정보 누출 금지).
- **변형/민감 엔드포인트는 인증·인가:** `Authorization: Bearer <JWT>` → `admin.auth.getUser(token)`로 사용자 확인 → **소유권/관리자 여부 확인** 후 동작. 관리자 게이트는 `api/_lib/admin.js` allowlist 한 곳에서.
- **입력 검증:** 필수 필드·타입·길이 확인. 미검증 입력을 DB/AI/외부 API로 그대로 흘리지 않는다.
- **rate limiting:** 비용·스팸 직격 엔드포인트(특히 `/api/schedule`=Claude 실비, `/api/lead`, 결제·계정삭제)에 호출 제한(`api/_lib/rate-limit.js`). 초과 시 429. *위협:* 무제한 호출 = 비용 폭탄/스팸/brute-force.
- **에러 누출 금지:** 스택트레이스·키·내부 경로를 응답에 담지 않는다. "존재를 숨기는" 404(미발행 항목)는 의도된 패턴.

## D. 전송 / 프론트엔드

- **보안 헤더 유지(`vercel.json`):** CSP·HSTS·X-Content-Type-Options(nosniff)·Referrer-Policy·Permissions-Policy·X-Frame-Options. **약화·삭제되면 FAIL.**
- **CSP 허용 출처(allow-list) — 변경 시 정확히 관리:** 폰트(fonts.googleapis.com / fonts.gstatic.com), Supabase(`*.supabase.co` REST + `wss://` Realtime + Storage), PayPal(SDK·주문 API·버튼 iframe), React UMD(unpkg), Supabase JS ESM(cdn.jsdelivr.net), PostHog(분석), YouTube embed, images.kiwi.com(항공사 로고), `data:`/`blob:`(image-slot). **새 외부 출처를 쓰면 CSP에 추가해야 하고, 정당성을 확인한다**(불필요한 출처 추가는 공격면 확대). 전 페이지가 인라인 script/style을 써서 `'unsafe-inline'`은 현재 불가피 — 이를 핑계로 더 느슨해지지 않게.
- **XSS:** 사용자 입력을 화면에 그릴 때 `esc()`로 감싼다. 새 렌더 경로가 raw innerHTML로 사용자 텍스트를 넣으면 FAIL.
- **공유 토큰:** `/pay?g=`·일정 공유 링크는 추측 불가능한 UUID, 미발행 항목은 404. 순번/짧은 토큰 도입 금지.
- *참고:* 로그인 토큰은 Supabase 기본 localStorage 보관(표준). 그래서 CSP/XSS 방어가 더 중요하다.

## E. 의존성 / 공급망

- 변경에 새 의존성이 추가되면 `npm audit`로 신규 취약점(high/critical 우선) 확인. 기존 알려진 항목(예: `@anthropic-ai/sdk` 중간 등급)은 추적·업데이트 권장으로 분류.
- 빌드 스크립트(esbuild 등)에 신뢰 못 할 입력이 끼어들지 않는지.

---

## F. 위험도 분류 (판정 시 부여)

- **P0 (즉시):** 노출·비용·데이터 유출 직결 — 불변식 위반, RLS 누락, 시크릿 노출, 인증 없는 변형 api, rate limit 없는 비용 엔드포인트.
- **P1 (이번 주기):** 보안 헤더 약화, 입력 검증 미흡, 알려진 취약 의존성.
- **P2 (지속):** 강화 권장 — 감사 로그, 시크릿 로테이션 주기, 방어심화.

## G. 컴플라이언스 — 코드로 못 푸는 영역 (플래그만)

건강 민감정보 + 외국인(미국) 고객 = 법적 무거운 영역. security-reviewer는 **판정하지 말고 플래그**:
- 한국 **개인정보보호법(PIPA)**: 건강=민감정보 → 별도 명시 동의·암호화 의무 가능성.
- **국외이전**(미국 고객 데이터→한국 서버) 동의·고지.
- **의료법**(의료광고·환자 알선 규제) 경계.
→ chief-of-staff 경유 + `us-cross-border-entity` 참고로 변호사/컴플라이언스 검토 라우팅 제안.

---

## H. 보안 게이트 적용 범위 (언제 이 검수가 필요한가)

**필요(security-review PASS 게이트):** DB 스키마/RLS 변경 · auth/로그인 · 결제(payment/api) · `api/*` 신규·수정 · env/시크릿 취급 · 보안 헤더/CSP 변경 · 새 외부 출처/의존성 도입.
**면제(속도 유지):** 순수 카피·이미지·랜딩 레이아웃·CSS 등 데이터/인증/서버와 무관한 변경. (단 사용자 입력을 새로 렌더하면 XSS 항목만 빠르게 확인.)

## 정기 운영

- **분기 1회 전체 보안 감사**(이 체크리스트로 1회 훑기).
- **월 1회 `npm audit`.**
- **시크릿 교체:** 노출 의심 시 즉시, 평시 연 1~2회.
- **사고 대응 기본:** 유출 의심 → ① 키 즉시 교체 ② 영향 범위 확인(어느 테이블·기간) ③ 필요 시 통지. 이 절차를 1쪽으로 유지.
