// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT

import { createTypeSpecLibrary, type EmitContext } from "@typespec/compiler";

/**
 * `@ancplua/typespec-maf` — TypeSpec authoring surface and emitters for the
 * declarative surfaces of Microsoft Agent Framework (agents, workflows, hosted
 * manifests), with each emitted agent carrying its Telemetry Control Graph
 * declaration from birth.
 *
 * PR-0 scaffold: the library loads and the emitter is a deliberate no-op. The
 * authoring decorators (`@agent` / `@instructions` / `@model` / `@tool` /
 * `@workflow` / `@trigger` / `@telemetry`) and the first real emitter
 * (`maf-agent-yaml`, dialect D1) arrive in PR-1 with the .NET round-trip gate.
 * See `docs/PRD.md` §3 and §6.
 */
export const $lib = createTypeSpecLibrary({
    name: "@ancplua/typespec-maf",
    diagnostics: {},
});

/**
 * Emitter entry point. PR-0 intentionally emits nothing — it exists so
 * `tsp compile` exercises the full toolchain (library load + emitter run) end
 * to end on an empty spec. Real emit logic lands per-dialect in PR-1+ (Law §3:
 * round-trip or it doesn't ship).
 */
export async function $onEmit(context: EmitContext): Promise<void> {
    void context;
}
