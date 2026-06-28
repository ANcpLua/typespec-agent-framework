# TASK — typespec-agent-framework: build the flagship, run to Gold Pull Shark

## End goal

Build the `typespec-maf` flagship (TypeSpec → Microsoft Agent Framework declarative
surfaces + telemetry-at-birth + qyl conformance loop) by executing the PRD pipeline
**PR-0 → ~PR-8**, landing each as a merged PR. The campaign milestone: **cross 1,024
merged PRs = Gold Pull Shark** 🦈 (baseline 1,015 merged on 2026-06-28 → need 9). The
badge is a side effect of building the real flagship — the flagship is the point.

- **Spec (source of truth):** `docs/PRD.md` (336 lines, approved max scope, final).
- **Execution contract:** lowest unchecked PR; keep it that small; change nothing
  outside the task's file list; a task that requires violating a Law (PRD §4) is wrong —
  stop and surface it.
- **Merge gate:** local validation (`npm run lint` / `compile` + the .NET round-trip
  from PR-1) — GitHub Actions budget is frozen for private repos (`[skip ci]` discipline);
  reversal: repo public or budget refilled. Private repo → self/admin merge once green.

## Pins (versions.props + package.json)

TypeSpec `1.13.0` · TypeScript `6.0.3` · @types/node `25.9.1` · vitest `4.1.7` ·
MAF `Microsoft.Agents.AI.* 1.11.1` (nuget; local rootsource @ `3a9f3480`, 2026-06-24) ·
net10.0 · @ancplua/typespec-otel-semconv `1.41.0-2` (PR-5).

## Pipeline checklist (tick in the same PR that lands the work)

- [x] **PR-0 — Repo extraction & scaffold.** New repo + empty `@ancplua/typespec-maf`
      lib; `npm run build:emitters && npm run compile` green; README states vision §1
      in 5 sentences; repo private; `docs/PRD.md` committed; qyl copy → pointer stub.
- [ ] PR-1 — D1 agent YAML slice + `.NET` round-trip via `ChatClientPromptAgentFactory.CreateFromYamlAsync`.
- [ ] PR-2 — `maf-model-gen` reflection tool → `generated/maf-actions.gen.tsp`.
- [ ] PR-3 — D2 workflow YAML + reference ids + `powerfx<T>` v0 + `$onValidate` invariants.
- [ ] PR-4 — PowerFx reference validation (unknown-ref = compile error).
- [ ] PR-5 — `@telemetry` + `tcg-fragment` emitter (TCG wire shape) + semconv keys.
- [ ] PR-6 — D3 hosted manifests (`maf-hosted`).
- [ ] PR-7 — conformance loop closure (`qyl verify` CLI; uses `Qyl.Api.Contracts`).
- [ ] PR-8 — remediation proposals (drift → proposed TypeSpec diff; propose ≠ commit).
- [ ] (stretch) PR-9 bridge sample + upstream proposal · PR-10 release hardening.

## Progress log

- 2026-06-28 — Campaign opened. Goal set by PO ("Run to Gold"). PR-0 scaffold written
  (mirrors qyl-api-schema 1:1). Local gate GREEN: `build:emitters` exit 0, `compile`
  "completed successfully" (no-op emitter ran), `lint` warn-as-error clean, README
  vision = 5 sentences. Creating private repo `ANcpLua/typespec-agent-framework`,
  opening PR-0, merging once confirmed green. Next: qyl PRD → pointer stub, then PR-1.

## Branch / PR convention

Feature branch per PR (`claude/pr-N-<slug>`) off clean `main`; deliver via PR; never
commit feature work directly to `main`. Each merged PR ticks its box here in the same PR.
