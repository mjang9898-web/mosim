# 가입/비번 메일 Mosim 브랜드화 — 대시보드 적용 체크리스트

> 목표: Supabase Auth 메일(Confirm signup·Reset password)을 **`Mosim <no-reply@mosimkorea.com>`** 발신 + K-Wellness 템플릿으로.
> 환경 확정값 — Supabase 프로젝트 `ktcwpowkyovyrlwajajm` · DNS 관리처 **Cloudflare** · 템플릿 `docs/email-templates/{confirm-signup,reset-password}.html` · 비용 $0(Resend 무료티어).
> ⚠️ 토큰 `{{ .ConfirmationURL }}`은 절대 건드리지 말 것(가입·일정복원 flow 생명줄).

---

## Phase 0 — Resend API 키 (1분)
1. https://resend.com 로그인 → **API Keys** → 기존 키 재사용 또는 **Create API Key**(권한 Sending). 키 `re_...` 복사해 둠. (Phase 2에서 SMTP 비번으로 씀.)

## Phase 1 — Resend 도메인 인증 (DNS, 핵심)
2. Resend → **Domains** → **Add Domain** → `mosimkorea.com` 입력 → Region 선택(미국 고객이면 us-east-1 무방).
3. Resend가 보여주는 **DNS 레코드 3종**(대략 MX + SPF TXT + DKIM TXT, DMARC는 권장)을 그대로 둠.
4. **Cloudflare 대시보드** → `mosimkorea.com` → **DNS → Records** → Resend가 준 레코드를 하나씩 **Add record**:
   - TXT(SPF)·TXT(DKIM)·MX를 Resend가 준 값 그대로. **Proxy status는 자동(TXT/MX는 프록시 안 됨) — 회색구름(DNS only) 확인.**
   - ⚠️ 기존 SPF(TXT `v=spf1...`)가 이미 있으면 **새로 만들지 말고 한 레코드에 병합**(중복 SPF는 메일 깨짐).
5. Resend → Domains에서 **Verified**(초록) 뜰 때까지 대기(보통 수 분~1시간). 발신주소는 `no-reply@mosimkorea.com`로 정함.

## Phase 2 — Supabase 커스텀 SMTP 연결
6. Supabase Dashboard → 프로젝트 `ktcwpowkyovyrlwajajm` → **Project Settings → Authentication → SMTP Settings** → **Enable Custom SMTP** 켬.
7. 입력:
   - **Sender email:** `no-reply@mosimkorea.com`
   - **Sender name:** `Mosim`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** Phase 0의 Resend API 키(`re_...`)
8. **Save.** (커스텀 SMTP 연결 시 Supabase 기본 발송 레이트리밋도 풀려 런칭 트래픽에 안전.)

## Phase 3 — 이메일 템플릿 교체
9. Supabase → **Authentication → Email Templates**:
   - **Confirm signup** → 본문을 `docs/email-templates/confirm-signup.html` 내용으로 **전체 교체** → Save.
   - **Reset Password** → `docs/email-templates/reset-password.html`로 교체 → Save.
10. 저장 후 각 템플릿에 **`{{ .ConfirmationURL }}` 가 그대로** 들어있는지 눈으로 확인.

## Phase 4 — 검증 (이게 미뤄둔 가입 e2e도 겸함)
11. mosimkorea.com에서 **실제 이메일로 가입** → 받은 메일이:
    - 발신자 **`Mosim <no-reply@mosimkorea.com>`** 로 표시되는지
    - K-Wellness 브랜드 템플릿으로 보이는지(이미지 꺼도 정상)
12. 메일의 확인 링크 클릭(새 탭에서 열려도) → **로그인 후 result에 일정이 그대로 복원**되는지. ← 통과 시 가입 버그 완전 종결.

---
막히는 화면 있으면 스크린샷 주세요. Resend가 준 실제 DNS 값을 알려주시면 Cloudflare 입력값까지 정확히 짚어드립니다.
