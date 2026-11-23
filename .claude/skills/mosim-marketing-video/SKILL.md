---
name: mosim-marketing-video
description: The standard pipeline for producing Mosim marketing/guide/promo videos with the Higgsfield MCP (claude.ai account-linked), then optionally publishing them onto mosim-site via the build team. Use whenever the request is to make, revise, or publish a Mosim video — explainer/guide video, promo, social short, ad — or asks "make a Mosim video / 홍보영상 / 가이드영상 / 마케팅영상". Covers concept → script → model/workflow selection → generation → review gate → local save → site-embed co-op. NOT for building funnel UI (use mosim-orchestrator) — this is the marketing (Plane C back-office) media pipeline: tool + founder-AI, never an agent team.
---

# Mosim Marketing Video Pipeline

모심의 홍보/가이드/마케팅 영상을 **Higgsfield MCP(도구)** 로 만들고, 필요하면 개발팀과 co-op해 mosim-site에 게재하는 표준 파이프라인. 이건 **평면 C(백오피스) 마케팅** 작업이다 — 전담 에이전트팀을 빌드하지 않는다(도구 + 창업자 AI 보조). 사이트 통합 단계에서만 빌드팀(`mosim-orchestrator`)을 부른다.

## 불변 원칙 (먼저 읽는다)

1. **funnel은 신성하다.** 영상 게재는 고객 funnel(step1~4·result·me·api/schedule.js)의 흐름·로직을 **절대 바꾸지 않는다.** 게재는 비-funnel 콘텐츠 페이지(our-story·medical·experience·faq·landing의 독립 섹션) 한정. [[mosim-funnel-is-sacred]] 준수.
2. **크레딧 = 실제 돈. 사전보고 원칙.** 생성 도구(generate_image/video/audio·explainer_video 조립)는 크레딧을 소모한다. **컨셉·스크립트·모델선정까지는 크레딧 0**(텍스트 + 카탈로그 조회는 무료). 실제 생성 착수 **전에 예상 크레딧 규모를 장대표님께 플래그하고 승인**받는다. [[zero-cost-build-phase]] 정신.
3. **결제/구독 도구 금지.** `confirm_billing_purchase`·`cancel_trial_auto_renewal`·`show_plans_and_credits`(구매유도)는 요청 없이 호출하지 않는다. 잔액 확인은 `balance`만.
4. **브랜드 톤.** 모심 = 미국 은퇴 시니어 대상 **의료-우선 풀서비스 프라이빗 컨시어지**. 톤 = 따뜻함·신뢰·프리미엄·차분함. 시각 = 네이비(#1b2a4a 계열)+골드 액센트, serif 헤드라인의 에디토리얼 감성. 과장·의료광고 규제 위반 문구(치료효과 보장 등) 금지.

## 파이프라인 (7단계)

| 단계 | 산출물 | 도구 | 크레딧 |
|---|---|---|---|
| 0 컨셉 | 타깃·목적·길이·언어·게재처 정리 | 문서 | 0 |
| 1 스크립트 | 씬(블록)별 내레이션 초안 | 문서 | 0 |
| 2 모델/워크플로우 선정 | Higgsfield 워크플로우·프리셋·모델 확정 | `get_workflow_instructions`, `get_youtube_explainer_presets`, `models_explore` | 0 |
| 3 승인 게이트 | 예상 크레딧 규모 플래그 → **장대표님 승인** | `balance` | 0 |
| 4 생성 | 스타일키·클립·보이스 | `generate_image`·`generate_video`·`generate_audio` → `job_status` | **소모** |
| 5 조립·검수 | 최종 MP4 + 품질 게이트 | `explainer_video` → `job_status` | 조립 무료(자막 0.05/블록) |
| 6 저장·게재 | 로컬 저장 + 사이트 co-op | 다운로드 → `mosim-orchestrator` | 0 |

### 단계 0 — 컨셉
타깃(누구), 목적(홍보/가이드/전환), 길이(분; explainer는 분×6블록×10초), 언어(기본 English — 타깃이 미국 시니어), 게재처(마케팅 채널 / 사이트 어느 페이지)를 확정한다. 실존 사실(병원·수치)은 지어내지 않는다.

### 단계 1 — 스크립트
explainer는 **블록당 1클립(10초)**, 블록당 내레이션 **~20~24단어(≈8~9초)**. 숫자는 풀어 쓴다("twenty percent"). 감정·지문 없는 순수 대사만. 클립 안에는 말·자막을 넣지 않는다(조립 시 얹음).

### 단계 2 — 모델/워크플로우 선정 (근거 있게)
- **내레이션 애니메이션 explainer** → `get_workflow_instructions('video-explainer')` (카탈로그 확인 후). 하드룰: **비-포토리얼**(플랫 2D·벡터·페이퍼크래프트 등), 클립 내 음성 없음, 스타일키 1장을 전 클립에 부착.
- 스타일: `get_youtube_explainer_presets`(전부 9:16 세로·무료 스타일키). **웹사이트 가로 게재가 목표면 프리셋 대신 `generate_image`(nano_banana_pro)로 16:9 브랜드 스타일키를 자체 생성**(브랜드 색·톤 통제 + 가로). 세로 소셜 컷은 프리셋으로 저비용 별도 제작.
- 영상 모델 = `gemini_omni`(720p·10초, 스타일키가 프레이밍 결정). 보이스 = `list_voices`에서 **장대표님이 선택**(따뜻·중후·신뢰). 불확실하면 `models_explore(action:'recommend')`.

### 단계 3 — 승인 게이트 (필수)
`balance`로 잔액 확인. 예상 소모 = 스타일키(이미지 1) + 클립 N개(gemini_omni) + 보이스 N개 + 자막(0.05×N). **규모를 장대표님께 보고하고 승인 후에만 단계 4 진입.**

### 단계 4~5 — 생성·조립·검수
스타일키 → N클립 → N보이스 → `explainer_video`로 서버조립(블록당 고정 10초, 음성 자동 fit). **검수 게이트(visual-qa 준용):** 최종 MP4를 재생 검토 — 스타일 일관성·오디오/영상 싱크·브랜드 톤·오탈자(자막)·funnel 무관성. 미달이면 해당 블록만 재생성. 게이트 통과 없이 "완료" 선언 금지.

### 단계 6 — 저장·게재
- 최종 MP4 URL을 **로컬 저장**(mosim-site 내 미디어 폴더, 예: `media/` 또는 `assets/video/`). 자체 호스팅이면 새 외부 출처 없음 → CSP 무변경(권장).
- **사이트 게재는 `mosim-orchestrator`에 위임**(frontend-builder → visual-qa 게이트). 지시엔 "어느 페이지·어떤 형태(muted autoplay+controls+poster+자막트랙)·funnel 불변"을 명시. DB/auth/api/결제/새 외부출처를 건드리면 security-reviewer 게이트도 준용.

## 기록
컨셉·모델선정·크레딧 소모·게재 결정을 [[Mosim-MOC]] 결정 로그와 그날 일일 활동 로그에 남긴다. 산출물(컨셉안·스크립트)은 `docs/`에 날짜 프리픽스로 저장.
