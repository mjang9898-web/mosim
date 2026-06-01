# 모심 콘텐츠 페이지 — Medical & Experience (확정)

> 작성일: 2026-06-01 · 상태: **확정 (founder 승인)** · *living doc*
> 북극성: `2026-06-01-mosim-product-definition.md` · 디자인: design.md v2

## 1. 목적

옛 K-Wellness에서 사장님이 큐레이션한 풍성한 콘텐츠(~350장 사진 + 사실·영상·식이 데이터)를 **버리지 않고 손님 눈앞에 살린다.** 영감·신뢰를 주고 → "Plan my trip"으로 이어주는 두 콘텐츠 페이지.

랜딩 nav: **How it works · Medical · Experience · Our story · FAQ · [Plan my trip]** (Medical→medical.html, Experience→experience.html). 같은 콘텐츠가 **세 군데**서 일함: ① 이 페이지(구경/신뢰) ② 플래너 step3 선택 ③ AI 지식창고(런타임 Slice 2).

## 2. Medical 페이지 (`medical.html`) — ✅ 완성·검증

- **북극성 4개만:** Health screening(검진) · Knees & joints(정형) · Dental(치과) · Eyes(안과). 카드 + 클릭하면 **정보형 드로어**(포지셔닝 · 제휴병원 · 사진4 · 패키지 3-tier · 애드온 · "Plan my trip" CTA).
- **"And much more is possible"** 메시지로 **확장 가능성은 열어둠**(심장·암검진·2차소견 등 "물어보세요"). 단, 첫 화면 wedge는 4개.
- ⚠️ 옛 `js/step2-medical.jsx`의 나머지 7개(성형·피부·한방·모발·IV·에스테틱·줄기세포)는 **의도적으로 미노출** — 북극성에서 잘라낸 wedge. 다시 넣으려면 북극성부터 변경.
- 데이터 출처: `js/step2-medical.jsx`(MEDICAL_DETAILS의 checkup/eye/dental/ortho). 사진: `/assets/medical-drawer/<code>{,-2..-4}.webp`.
- 옛 1.4MB `medical.html` 프로토타입은 legacy 태그/git에 보존, 이 새 페이지로 대체.

## 3. Experience 페이지 (`experience.html`) — ⬜ 다음

- **대표 카테고리:** Heritage · Famous · Shop · Cuisine. 각 **대표 ~4개**만 공개로 + **드로어 포함**(hero tagline · 사실5 · 사진6 · 유튜브; cuisine은 식이/맵기).
- **"More experiences available — log in to see the full list"** → 전체 ~112개 목록은 **계정 생성/로그인 게이트**(구경은 가볍게, 가입 동기까지). 기존 Supabase Auth 활용.
- 대표 항목은 **드로어 데이터가 있는 것**으로 선정(culture는 ~40%만 디테일 보유; cuisine은 100%).
  - 예: Heritage=gyeongbokgung/changdeokgung/bukchon/bongeunsa · Shop=myeongdong/gwangjang/insadong/seongsu · Famous=kpop-concert/namsan-tower/hanriver/dmz · Cuisine=bibimbap/samgyeopsal/tteokbokki/tea-ceremony.
- 데이터: `js/step3-culture.jsx`(CULTURE_DETAILS) + `js/step4-cuisine.jsx`(CUISINE_DETAILS, +dietary). 사진: `/assets/culture-<cat>/`, `/assets/cuisine-<cat>/`.

## 4. 나중 (연결)
- 같은 추출 데이터로 플래너 step3(경험 선택)을 단순 타일 → 큐레이션 카드로 업그레이드.
- AI 지식창고(런타임 Slice 2) 씨앗으로 적재 → 일정이 "우리 것" 큐레이션에서 나옴. [[runtime-specialist-team]]
- 사진 라이선스 확인(일부 placeholder/대체본 — 옛 credits.json 참고).
