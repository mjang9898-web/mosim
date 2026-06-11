# 여행일정표 Deliverable — 설계 (v1)

**날짜:** 2026-06-11
**상태:** 확정 (구현 계획 대기)
**관련:** [planner-funnel](./2026-06-01-planner-funnel-design.md) · [result-calendar](./2026-06-10-result-calendar-design.md) · [reserve/bookings](./2026-06-08-reserve-purchase-bookings-design.md)

## 1. 무엇인가 / 왜

펀널·AI 초안·결제·항공/숙박 확정까지 끝난 뒤, 모심이 **확정된 최종 여행일정을 고객용 문서로 전달**하는 단계. 지금 흐름의 마지막 빈 칸이다.

- **AI 초안(`result.html`)** = 결제 전 무료 미리보기
- **이 일정표** = 결제·확정 후의 유료 산출물 (실제 항공편·호텔·연락처가 박힌 완결 문서)

**실사용 가정:** 인쇄가 아니라 **고객 핸드폰(웹)에서 보는 것**이 1순위. 인쇄(PDF)는 보조.

## 2. 범위

| | v1 (이번) | v2 (이후) |
|---|---|---|
| 고객용 일정표 페이지 (웹·폰) | ✅ | |
| 브라우저 인쇄 → PDF | ✅ | |
| cockpit 최종본 편집기 | ✅ | |
| 이메일 토큰 링크 발송 | ✅ | |
| 노션 자동 생성 | | ✅ (동일 `final` 데이터를 Notion API로) |
| 서버 PDF 생성·첨부 | | (함수 캡·비용 이슈로 보류) |

**비용: $0** — 새 serverless 함수 0개(전부 기존 파일 `?action=` 멀티플렉싱), 서버 PDF 0, 이메일은 기존 Resend 인프라.

## 3. 데이터 모델 — `itineraries` 행 확장 (DB = source of truth)

기존 `schedule`(AI 초안 jsonb)은 **보존**. 최종본은 새 컬럼에 분리 저장:

```sql
alter table public.itineraries
  add column final        jsonb,          -- 최종본: { flights, hotel, contacts, days }
  add column depart_date  date,           -- 실제 출국일 (Day N 날짜 자동 매핑 기준)
  add column share_token  text unique,     -- 공개 링크 토큰 (발행 시 생성)
  add column published_at timestamptz;     -- null = 미발행, 값 = 고객 접근 가능
```

`final` 구조:
```jsonc
{
  "flights": {
    "outbound": { "airline","number","date","dep_time","dep_airport","dep_terminal","arr_time","arr_airport","arr_terminal","arr_offset" },
    "inbound":  { ...동일 }
  },
  "hotel":    { "name","address","phone","checkin","checkout","confirmation" },
  "contacts": [ { "role","who","tel","primary":bool } ],   // concierge(primary) + 119/병원/대사관/호텔
  "days":     [ { "day":1, "date":"2026-09-14", "title", "items":[ { "time","label" } ] } ]
}
```
- `days`는 `schedule.days`를 복사해 cockpit에서 편집. `depart_date` 기준으로 각 day 날짜·요일 자동 표기 (result-calendar의 date-aware 로직 재사용).
- **RLS:** 공개 토큰 읽기는 클라이언트 RLS가 아니라 **서버(service role)**가 `share_token` + `published_at not null` 검증 후 반환. 소유자 본인은 My Page에서 기존 RLS로 읽음.

## 4. Cockpit 편집기 (Trips 탭 내, admin)

일정 1건 열기 → "일정표 빌더" 패널:
- **폼:** 출국편/입국편(항공사·편명·날짜·시각·공항·터미널·도착일 오프셋), 호텔(이름·주소·전화·체크인/아웃·예약번호), 연락처 리스트(모심 24h primary + 119/병원/대사관/호텔 프리필·편집)
- **출국일** 입력 → 날짜별 일정 요일·날짜 자동
- **날짜별 편집:** day 항목(시각+활동) 텍스트 수정·추가·삭제, day 추가/삭제. `schedule.days`에서 프리시드
- 버튼: **임시저장**(`final` 기록) / **발행**(아래 5번)
- **API:** `api/admin/trips.js`에 액션 추가 (새 파일 X) — `?action=itinerary-get` / `itinerary-save` / `itinerary-publish`

## 5. 발행 (가시성 트리거) — 모심 수동

흐름:
```
펀널 완료 → AI 초안(무료)
  ↓ 예약 · 컨시어지 결제
모심 리뷰 + 항공/호텔 확정 → cockpit에서 final 입력
  ↓ 모심이 [발행] 클릭   ← 여기서 페이지가 살아남
완성 일정표 (토큰 링크 + 이메일) — 결제·확정 고객만
```
- **수동 [발행] 버튼.** 자동 아님 — 거래량 적을 때 불완전 일정이 실수로 나가는 걸 방지.
- 발행 동작: `published_at` = now, `share_token` 없으면 생성, 고객에게 이메일 발송.
- 재발행(수정 후): `published_at` 갱신, 토큰 유지(링크 안 깨짐). 이메일 재발송 여부는 옵션.
- `published_at` 가시성과 `status`(new/reserved/reviewing/quoted/booked/archived)는 **독립**. 별도 status 추가 안 함.

## 6. 고객용 페이지 — `/itinerary.html?t=<token>`

- 토큰으로 발행본 조회(무인증). 미발행·잘못된 토큰 → 안내 메시지.
- **레이아웃 (확정, 목업 `itinerary-preview.html` 기준):**
  순서 = **표지 → Flights & Hotel → Day by Day → Who to Call(맨 아래)**
  (실사용=폰 우선. 화면에서 일정 먼저 보고 연락처는 끝에. 인쇄는 동일 순서로 3페이지.)
  - 표지: 이름·기간·인원·케어 요약 (컴팩트)
  - Flights & Hotel: 항공 2줄 + 숙박 1줄, 한 카드로 압축
  - Day by Day: Day 1~N, 실제 요일·날짜, 시각별 활동
  - Who to Call: 24h 모심 컨시어지(강조) + 119·병원·대사관·호텔
- 시니어 가독성: 본문 16px, 24h 번호 최대 강조. 브랜드 토큰(아이보리·남색·골드 + Lora).
- 상단 **"Download PDF / Print"** 버튼 → `window.print()`. `@media print` 전용(A4, 버튼·내비 숨김, day 페이지 중간 안 잘림).
- (옵션, 미적용) 인쇄 시에만 Who to Call을 상단으로 올리는 print-reorder — 화면=아래/인쇄=위 둘 다 만족. 추후 결정.

## 7. 접근 경로 (어디서)

1. **이메일 토큰 링크** (주 진입로) — 로그인 불필요. 폰에서 버튼 한 번. 북마크·홈화면 저장. 여행 내내 유효.
2. **My Page** (`/me.html`) — 로그인 고객은 저장 일정 옆 "일정표 보기"로 진입(발행된 경우).
3. 토큰 링크는 만료 없음(여행 후까지). 추후 archive 시 비활성 가능.

## 8. 공개 읽기 엔드포인트 (함수 캡 회피)

Vercel Hobby 12-함수 캡에 **이미 꽉 참** → 새 api 파일 불가.
- 공개 읽기: `api/save-itinerary.js`에 GET `?t=<token>` 브랜치 추가 → 발행본만 무인증 반환(POST 저장 로직 유지).
- admin 편집/발행: `api/admin/trips.js` `?action=` 추가.

## 9. 이메일

발행 시 기존 `api/_lib/email.js`(Resend, care@mosimkorea.com)로 토큰 링크 발송. 시니어 친화 카피("Your Korea itinerary is ready — open it anytime").

## 10. 범위 밖 (명시)

- 노션 자동 생성 (v2) — 동일 `final` 데이터 재사용.
- 서버 PDF 생성/이메일 첨부 — 함수 캡·비용으로 보류. v1은 브라우저 인쇄로 충분.
- 고객 셀프 편집 — 불가. 편집은 모심만.

## 부록 · 목업

`itinerary-preview.html` = 하드코딩 샘플 목업(LA→서울 시니어 부부). 레이아웃 확정 기준. 실제 빌드 시 `/itinerary.html`(토큰·DB 구동)로 대체. `itinerary-preview-sample.pdf`는 인쇄 출력 샘플(커밋 제외).
