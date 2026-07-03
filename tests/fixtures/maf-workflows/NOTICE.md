# Vendored MAF workflow fixtures

`SetVariable.yaml`, `Goto.yaml`, and `LoopContinue.yaml` are copied verbatim from
**Microsoft Agent Framework** (`microsoft/agent-framework`), from
`dotnet/tests/Microsoft.Agents.AI.Workflows.Declarative.UnitTests/Workflows/`
(local SHA-pinned checkout `agent-framework-dotnet-rootsource @ 3a9f3480`, 2026-06-24).

They are MIT-licensed (© Microsoft) and vendored here **only as the equivalence oracle**:
`tools/workflow-equiv.mjs` parses each and deep-compares it (modulo key order /
formatting) against the YAML this repo's emitter produces from
TypeSpec sources. They are not part of the published library.

Upstream: https://github.com/microsoft/agent-framework (MIT License).
