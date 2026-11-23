# Mosim 가이드영상 (Explainer) 컨셉안 — v1

- **작성:** 2026-07-06 · Friday (Mosim 리더) · 장대표님 검토용
- **상태:** 컨셉 제출 — 실제 생성은 크레딧 소모 → 승인 후 착수 (현 단계 크레딧 0)
- **툴:** Higgsfield MCP (Plus 플랜, 잔액 1,210 크레딧) · 워크플로우 `video-explainer`

---

## (a) 타깃 · 목적 · 길이 · 언어

| 항목 | 내용 | 근거 |
|---|---|---|
| **타깃** | 미국 은퇴 시니어(55+, 건강 중심 여행 검토) + 그들을 대신 리서치하는 성인 자녀 | North Star = 미국 은퇴 시니어 의료-우선 컨시어지 |
| **목적** | "모심이 무엇인가"를 60초에 신뢰감 있게 설명 → 문제 인지→해법→작동방식→CTA. 마케팅(1차)·사이트 게재(2차) 겸용 | 장대표님 지시: 가이드영상 우선 |
| **길이** | **60초 (6블록 × 10초)** | explainer 스윗스폿·저비용·사이트 임베드 적합. 워크플로우 규칙 N=분×6 |
| **언어** | **English 우선** (타깃=미국 시니어). 한국어 버전은 v2 옵션 | 타깃 언어 일치. 워크플로우 기본값도 English |
| **화면비** | **16:9 (가로)** 메인 — 웹사이트/YouTube. 9:16 세로 컷은 소셜(Shorts/Reels)용 저비용 별도 | 2차 목표=사이트 게재는 가로가 자연스러움 |

## (b) 스크립트 초안 (블록별 · 각 ~8~9초 · English)

> 순수 내레이션만. 클립 안엔 음성·자막 없음(조립 시 얹음). 숫자는 풀어 씀. 의료효과 보장 문구 배제.

**Block 1 — 문제(훅):**
"Korea offers some of the world's finest medical care. But arranging it from abroad — the language, the logistics, the trust — can feel overwhelming."

**Block 2 — 약속:**
"Mosim is your private concierge. Medical-first, fully managed — from your very first question to a safe return home."

**Block 3 — 작동방식:**
"Share your health goals and your preferences. We build a personalized journey around your care, never the other way around."

**Block 4 — 무엇을 챙기나:**
"Trusted hospitals and doctors, professional translation, private transport, and premium stays — every detail handled by one dedicated team."

**Block 5 — 안심:**
"Travel with confidence. Cultural comfort, updates for your family, and someone by your side at every step in Korea."

**Block 6 — CTA:**
"Your health-first journey to Korea begins here. Plan your trip with Mosim today."

## (c) Higgsfield 워크플로우 / 모델 선정 (실조회 근거)

카탈로그를 실제 조회(`get_workflow_instructions`)함 — 크레딧 0.

- **워크플로우 = `video-explainer`** (카탈로그의 유일 explainer 워크플로우이자 정확히 "내레이션 애니메이션 explainer" 매칭). 하드룰: **비-포토리얼**(플랫 2D·벡터 등), 클립 내 음성 금지, **스타일키 1장을 전 6클립에 부착**해 룩 고정.
- **스타일키 = 자체 생성(16:9) 권고.** 프리셋 10종(`get_youtube_explainer_presets`) 확인함 — 전부 **9:16 세로**(2D Illustrator·Isometric Flat Vector·Claymotion·Whiteboard 등). 웹사이트 가로 게재 + 브랜드 색(네이비/골드·따뜻한 에디토리얼) 통제를 위해, **프리셋 대신 `generate_image`(nano_banana_pro)로 16:9 브랜드 스타일키 1장 자체 생성**을 권고. (세로 소셜 컷이 필요해지면 그때 "2D Illustrator" 프리셋으로 저비용 별도 제작.)
- **영상 = `gemini_omni`** (720p·10초, 스타일키가 프레이밍 결정 → 16:9키면 가로 클립 6개).
- **보이스 = `list_voices`에서 장대표님이 선택** (따뜻·중후·신뢰감 있는 영어 내레이터). 워크플로우상 보이스는 반드시 사용자 선택.
- **자막 = ON 권고** (+0.05크레딧/블록 = 0.3). 이유: 사이트 muted-autoplay 재생 + 시니어 접근성. 폰트는 클린 계열(`patrick`/`anton` 중 브랜드 톤에 맞춰 선택).

## (c-2) 스타일키 시안 3장 (2026-07-06 생성 · 16:9 · 각 2크레딧)

로컬 저장: `mosim-site/marketing/2026-07-guide-video/stylekeys/` — **장대표님이 직접 파일을 열어 확인** 후 1장 낙점(그 시안이 전 6클립에 부착되는 스타일키가 됨).

| 시안 | 파일 | 방향 | Friday 소견 |
|---|---|---|---|
| **A** | `stylekey-A-couple-arrival.png` | 따뜻한 플랫 2D — 노부부를 컨시어지가 안내, 배경에 경복궁+서울 스카이라인 | **1순위 권고.** 서사·브랜드·좌측 여백(자막/카피 공간) 3박자 최적. 의료관광 스토리가 즉시 읽힘 |
| **B** | `stylekey-B-lineart-abstract.png` | 골드 라인아트 추상 — 병원 십자·다리·궁 처마·보살피는 손, 럭셔리 매거진 스프레드 | 가장 프리미엄·추상적. 순수 스타일 스와치로는 훌륭하나 서사성은 낮음 |
| **C** | `stylekey-C-lounge-goldenhour.png` | 소프트 페인털리 — 아치창 너머 골든아워 서울, 담요·차와 함께 편안히 앉은 시니어 | 가장 따뜻·인간적. 감정 톤 최상, 단 플랫보다 페인털리하여 룩 일관성은 A보다 약간 자유로움 |

셋 다 남색+골드+아이보리(design.md "Warm Trust")·비-포토리얼 확인. **낙점 시 세부 보정(색·구도) 1~2회 반영 가능**(이미지 재생성 2크레딧/장).

## (c-3) 보이스 후보 (미국 시니어 타깃 explainer · seed_audio)

⚠️ Friday는 오디오를 청취할 수 없어 **프로필 기반 추천**임 — **최종은 장대표님이 preview로 청취해 확정**(Claude Desktop의 `list_voices` 위젯에서도 오디션 가능). 톤 기준 = 따뜻·중후·명료·신뢰(시니어 대상).

| 순위 | 이름 | 성별 | voice_id | preview |
|---|---|---|---|---|
| **1순위** | Sterling | male | `dc382508-c8bd-443c-8cb2-46e57b8d2e6f` | https://d1xarpci4ikg0w.cloudfront.net/audio_voice_preset/preview/ed37f856-236b-413e-9f4d-9c746648ea72.mp3 |
| 2순위 | Arthur | male | `30fc8796-ceb6-4a66-b3a7-4a145ef7f346` | https://d1xarpci4ikg0w.cloudfront.net/audio_voice_preset/preview/080fcbab-8be3-4d60-8156-3c3040421e0f.mp3 |
| 3순위(여성) | Isabella | female | `80924413-1ea8-4e64-9719-e00b86796f05` | https://d1xarpci4ikg0w.cloudfront.net/audio_voice_preset/preview/120c0cd2-250c-40c8-937e-f31bfe87150d.mp3 |

## (d) 정밀 크레딧 견적 (2026-07-06 preflight 실측 · get_cost)

> Higgsfield `get_cost` preflight로 **실측 단가 확정**(크레딧 미소모 조회). ⚠️ **이전 개략 추정(~40~80)은 폐기** — 영상 클립 단가가 30/편으로 실제는 더 큼. 아래가 정본.

**실측 단가:** 이미지(nano_banana_pro 16:9 1k) = **2크레딧** · 영상 클립(gemini_omni 10초 720p) = **30크레딧** · 보이스(seed_audio 1take) = **0.4크레딧** · 자막 0.05/블록 · 조립 무료.

| 항목 | 수량 | 단가 | 소계 |
|---|---|---|---|
| 스타일키 (선택된 시안 재사용) | 0 | — | **0** (시안 이미 생성됨) |
| 영상 클립 (gemini_omni 10초) | 6 | 30 | **180** |
| 보이스 (seed_audio) | 6 | 0.4 | **2.4** |
| 자막 (Whisper) | 6블록 | 0.05 | **0.3** |
| 조립 (explainer_video) | 1 | 무료 | **0** |
| **본편 합계** | | | **≈ 183 크레딧** (잔액 1,210의 **~15%**) |

- **QA 재롤 여유:** 검수에서 일부 클립 재생성 시 클립당 +30. 재롤 2~3개 가정 시 실질 **~210~270**. 그래도 잔액 내 여유.
- **이번 턴 실소모(시안):** 스타일키 시안 3장 × 2 = **6크레딧** 소모(승인분). preflight·보이스조회·조립은 0.

## (e) 홈페이지 게재 위치 제안 (funnel 불변 전제)

**전제:** 고객 funnel(step1~4·result·me·api/schedule.js)은 신성 — 흐름·로직 **무변경**. 영상은 **비-funnel 콘텐츠 페이지**에만 게재.

**★ 2026-07-06 장대표님 낙점 = `index.html` 랜딩 "How it works" 하단 독립 섹션.** (our-story 아님.)

| 확정 | 위치 | 형태 | 제약 |
|---|---|---|---|
| **낙점** | `index.html` 랜딩 — 기존 "How it works" **바로 하단**에 신규 독립 "Watch how Mosim works" 섹션 | 16:9 muted autoplay + controls + poster + 자막트랙 | ⚠️ 랜딩은 **funnel 진입 페이지** → **독립 섹션 추가만**. funnel 흐름·CTA·기존 섹션·슬라이드·"How it works" 스텝 **일절 무변경**. |

- **게이트:** 게재는 `mosim-orchestrator` 위임(frontend-builder → **visual-qa PASS 필수**). 자체 호스팅 MP4면 새 외부출처 없음 → CSP·security-reviewer 불요(YouTube 임베드 택하면 게이트 준용).
- **주의(과거 사례):** 2026-06-24 랜딩에 무단 추가된 "What we arrange" 카드섹션을 되돌린 이력 있음 → 이번 섹션은 **명시 승인된 독립 블록**으로만, 외과적으로 추가.

- **기술 형태:** 최종 MP4를 **mosim-site에 자체 호스팅**(`media/` 또는 `assets/video/`) → `<video muted autoplay loop playsinline controls poster>` + 자막 트랙. **자체 호스팅이면 새 외부 출처 없음 → CSP 무변경**(권장). YouTube 임베드도 가능(해당 출처 CSP 이미 허용)하나 자체 호스팅이 깔끔.
- **게재 실행:** `mosim-orchestrator` 위임(frontend-builder → **visual-qa 게이트**). 새 외부출처를 안 만들면 security-reviewer 불요, 만들면 게이트 준용.

---

## 다음 단계 (승인 대기)
1. 장대표님 컨셉 확정 (길이 60초·English·16:9·자체 스타일키·게재 our-story 1순위 — 수정사항 반영).
2. 스타일키 컨셉 이미지 1장 방향(네이비/골드 에디토리얼 vs 다른 톤) 낙점.
3. 단계 4 착수 직전 **정밀 크레딧 견적 재보고 → 승인 → 생성**.
