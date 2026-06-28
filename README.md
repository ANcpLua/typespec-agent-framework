# typespec-agent-framework

> `@ancplua/typespec-maf` — TypeSpec emitters for Microsoft Agent Framework.

## Vision

TypeSpec becomes the single typed source of truth for every declarative surface
of Microsoft Agent Framework — agents, workflows, hosted manifests — and every
emitted agent carries its telemetry declaration from birth. One `tsp compile`
produces the YAML that MAF executes, the Telemetry Control Graph entry that
declares what the agent emits, and the conformance plan a runtime verifier
proves. Declared agents, declared telemetry, verifier on top: this is the qyl
mission — a self-healing validation loop with 0% human-in-the-loop as its
asymptote — executed on Microsoft's agent stack. Microsoft demonstrably loves
this pattern (they built `@microsoft/typespec-m365-copilot` for exactly this
reason), yet MAF itself has no TypeSpec story and almost nobody outside
Microsoft ships production TypeSpec emitters. We do — four of them, in
production, with lint infrastructure and a Weaver→TypeSpec generation pipeline —
and that asymmetry is the moat.

## Status

**PR-0 — scaffold.** The repository, toolchain, and an empty `@ancplua/typespec-maf`
library are in place; `npm run compile` is green on an empty spec. No emitter
logic exists yet — the first real dialect (D1, agent YAML) lands in PR-1 with
its Microsoft-loader round-trip gate. The complete maximum-scope plan, the
evidence that the gap is real, the laws, and the PR-0…PR-10 pipeline live in
[`docs/PRD.md`](docs/PRD.md).

## Develop

```bash
npm install
npm run build:emitters   # compile the @ancplua/typespec-maf library (tsc)
npm run compile          # build:emitters + tsp compile main.tsp
npm run lint             # compile with --warn-as-error
```

## Layout

| Path | Purpose |
|------|---------|
| `lib/` | `@ancplua/typespec-maf` — authoring surface + emitters (`src/index.ts` emit logic, `lib/main.tsp` decorator declarations) |
| `main.tsp` | local smoke / sample spec |
| `tspconfig.yaml` | emitter + linter configuration |
| `versions.props` | single version-pin source (MAF / .NET); TypeSpec toolchain pinned in `package.json` |
| `docs/PRD.md` | the maximum-scope product spec |

## License

MIT © ancplua
