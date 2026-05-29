---
name: mosim-orchestrator
description: Coordinates the mosim-site agent team (frontend-builder, backend-engineer, visual-qa, content-designer) to deliver features and fixes on this K-wellness lead-gen funnel. Use for ANY non-trivial build/change/fix on mosim-site — UI sections, funnel steps, result page, Supabase/serverless/auth/payment, copy, or full-stack features. Also triggers on follow-ups: "다시 실행/재실행/업데이트/수정/보완", "이전 결과 기반으로", and partial reruns of a prior task. Simple one-off questions can be answered directly without the team.
---

# mosim-site Orchestrator

mosim-site의 에이전트 팀을 엮어 기능/수정을 전달한다. 에이전트: frontend-builder, backend-engineer, visual-qa, content-designer (모두 opus). 컨벤션 스킬: mosim-frontend-conventions, mosim-backend-conventions, mosim-visual-verify.

## Phase 0: 컨텍스트 확인 (시작 시 항상)
1. `_workspace/` 존재 + 사용자가 부분 수정 요청 → **부분 재실행**(해당 에이전트만 재호출).
2. `_workspace/` 존재 + 새 입력 → **새 실행**(기존 `_workspace/`를 `_workspace_prev/`로 이동).
3. `_workspace/` 미존재 → **초기 실행**.
4. 단순 질문/조회면 팀 없이 직접 답한다(오버헤드 회피).

## Phase 1: 분류 & 사전 설계
요청 유형 분류 → 필요한 에이전트 선택:

| 요청 유형 | 에이전트 | 비고 |
|---|---|---|
| UI 섹션/컴포넌트 | frontend-builder → visual-qa | 카피/디자인 얽히면 content-designer 선행 |
| 카피/브랜드/디자인 리뷰 | content-designer (→ frontend-builder 배치) | |
| Supabase/serverless/auth/payment | backend-engineer → visual-qa(e2e) | 비용 트리거 먼저 플래그 |
| 풀스택 기능 | content-designer/spec → (frontend + backend 팀) → visual-qa | 아래 팀 패턴 |
| 단순 버그픽스 | 영향 에이전트 1명 → visual-qa | |

**비자명한 창작/기능은 먼저 spec을 잡는다**: `superpowers:brainstorming` → `superpowers:writing-plans`로 spec/plan을 만든 뒤 팀이 구현한다(이 프로젝트의 기존 워크플로). 단순/명확하면 생략.

## Phase 2: 실행 — 에이전트 팀 (기본)
2명 이상 협업이면 `TeamCreate`로 팀 구성 + `TaskCreate`로 작업 할당. 팀원은 `SendMessage`로 자체 조율. 모든 Agent 호출에 `model: "opus"`.

```
[orchestrator/leader]
  ├── TeamCreate(team, [frontend-builder, backend-engineer, visual-qa(, content-designer)])
  ├── TaskCreate(작업 + 의존성)
  ├── backend-engineer: 데이터 shape 확정 → SendMessage → frontend-builder
  ├── frontend-builder: UI 구현 → SendMessage → visual-qa(검증 요청)
  ├── visual-qa: 데스크탑/모바일 + 경계면 검증 → FAIL 시 빌더에 회신·재검증
  └── 결과 종합 + 팀 정리
```
단일 에이전트로 충분하면 `Agent` 도구 직접 호출(서브 모드). Phase별 특성이 다르면 하이브리드.

## Phase 3: 데이터 전달
- **태스크 기반**(TaskCreate/Update): 진행·의존 추적.
- **메시지 기반**(SendMessage): 데이터 shape 계약, 검증 요청, 실시간 조율.
- **파일 기반**: 큰 산출물·spec은 `_workspace/{phase}_{agent}_{artifact}.{ext}`. 최종물만 정식 경로, 중간물은 `_workspace/` 보존.

## Phase 4: 에러 핸들링
- 에이전트 실패 → 1회 재시도. 재실패 시 그 결과 없이 진행하고 **보고서에 누락 명시**(조용히 넘기지 않음).
- 상충 데이터는 삭제 말고 출처 병기.
- 외부 설정(Supabase 대시보드/Google/PayPal/도메인)은 에이전트가 못 함 → 사용자에게 단계 안내.
- **거짓 PASS 금지**: visual-qa가 검증 못 하면(세션 필요 등) 무엇이 막는지 보고.

## 끝내기 전 (게이트)
- UI/풀스택 변경은 **visual-qa PASS 없이 "완료" 금지**(빌드 성공 ≠ 동작). 메모리 [[feedback-visual-verify]] 참조.
- 비용 발생 항목은 **착수 전 사용자에 플래그**(zero-cost 단계). 메모리 [[zero-cost-build-phase]] 참조.
- 위험/되돌리기 어려운 작업(푸시·배포·DB 파괴·결제 라이브)은 사용자 확인 후.

## Phase 5: 진화
실행 후 "개선할 점 있나요?"를 한 번 묻는다(강요 X). 피드백 → 대상 수정(품질=스킬, 역할=에이전트, 순서/팀=이 오케스트레이터, 트리거누락=description) + CLAUDE.md 변경 이력 기록.

## 테스트 시나리오
- **정상**: "result 페이지에 X 섹션 추가" → 초기 실행 → frontend-builder 구현(mosim-frontend-conventions 준수) → visual-qa 데스크탑/모바일 PASS → 보고.
- **에러**: backend-engineer가 RLS 정책 적용 실패 → 1회 재시도 → 재실패 시 누락 명시하고 나머지 진행, 사용자에 수동 단계 안내.
- **후속**: "방금 그 섹션 카피만 다시" → Phase 0에서 부분 재실행 판별 → content-designer만 재호출 → frontend-builder 반영 → visual-qa.
