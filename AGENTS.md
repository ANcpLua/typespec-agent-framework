# typespec-agent-framework — Agent Notes

TypeSpec emitters for the declarative surfaces of Microsoft Agent Framework
(agents, workflows, hosted manifests), with each emitted agent carrying its
Telemetry Control Graph declaration from birth. This is the qyl mission on
Microsoft's agent stack. Full spec: [`docs/PRD.md`](docs/PRD.md).

## Execution contract (from `docs/PRD.md` §6)

- Take the **lowest unchecked PR** in the pipeline; keep the PR exactly that
  small; change NOTHING outside the task's file list.
- A task that seems to require violating a Law (PRD §4) is wrong — stop and
  surface it.
- **Round-trip or it doesn't ship** (Law §3): an emitter PR is mergeable only
  with the Microsoft-loader round-trip test green against the pinned MAF version.
- **Version pins everywhere** (Law §5): MAF / .NET pins in `versions.props`,
  TypeSpec toolchain in `package.json`. No floating `latest`.
- Local validation is the merge gate while the GitHub Actions budget is frozen
  (`[skip ci]` discipline); reversal: repo public or budget refilled.

## Ground truth

MAF API shapes come from the local source checkout
`~/RiderProjects/qyl-workspace/agent-framework-dotnet-rootsource` (@ `3a9f3480`,
2026-06-24) — never Microsoft Learn, which lags the source by weeks. Pinned
package: `Microsoft.Agents.AI.*` `1.11.1` on nuget.org. Companion assets:
`@ancplua/qyl-api-schema` (TCG contracts), `qyl` (the `qyl.conformance` verifier).

## Layout (mirrors qyl-api-schema 1:1)

- `lib/` — `@ancplua/typespec-maf` library: `src/index.ts` (emitter `$onEmit` +
  `$lib`), `lib/main.tsp` (decorator declarations importing `../dist/index.js`).
- `main.tsp` — local smoke / sample spec.
- `tspconfig.yaml` — emit list + linter config.
- `versions.props` / `Directory.Build.props` — .NET pins + convention baseline.
