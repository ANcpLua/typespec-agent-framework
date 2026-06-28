// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT

import {
    createRule,
    createTypeSpecLibrary,
    defineLinter,
    getDoc,
    paramMessage,
    resolvePath,
    setTypeSpecNamespace,
    type DecoratorContext,
    type EmitContext,
    type Namespace,
    type Operation,
    type Program,
    type Type,
} from "@typespec/compiler";
import { stringify as toYaml } from "yaml";

/**
 * `@ancplua/typespec-maf` — TypeSpec decorators and emitters that produce Microsoft
 * Agent Framework declarative YAML: prompt agents (D1 — `@agent` / `@instructions` /
 * `@useModel` / `@tool` → maf-agent-yaml) and workflows (D2 — `@workflow` →
 * maf-workflow-yaml). Every artifact is gated by a .NET round-trip through Microsoft's
 * own loaders (`ChatClientPromptAgentFactory.CreateFromYamlAsync`,
 * `DeclarativeWorkflowBuilder.Build`).
 */
export const $lib = createTypeSpecLibrary({
    name: "@ancplua/typespec-maf",
    diagnostics: {
        "agent-without-name": {
            severity: "error",
            messages: { default: "MAF-001: @agent requires a non-empty name" },
        },
        "duplicate-action-id": {
            severity: "error",
            messages: {
                default: paramMessage`MAF-002: workflow action id '${"id"}' is declared more than once; action ids must be unique`,
            },
        },
        "unknown-action-reference": {
            severity: "error",
            messages: {
                default: paramMessage`MAF-003: action '${"id"}' references unknown action id '${"ref"}' via '${"field"}'; no action with that id exists in the workflow`,
            },
        },
        "unknown-variable-reference": {
            severity: "error",
            messages: {
                default: paramMessage`MAF-004: PowerFx expression references undeclared variable '${"ref"}'; no action declares it in this workflow`,
            },
        },
    },
    state: {
        agent: { description: "Namespaces marked as MAF prompt agents (@agent)" },
        instructions: { description: "Agent system instructions (@instructions)" },
        model: { description: "Agent model configuration (@model)" },
        tool: { description: "Operations marked as function tools (@tool)" },
        workflow: { description: "Namespaces marked as MAF declarative workflows (@workflow)" },
    },
} as const);

export const { reportDiagnostic, stateKeys } = $lib;

interface AgentInfo {
    readonly name: string;
    readonly description?: string;
}

// ---------------------------------------------------------------------------
// Decorators
// ---------------------------------------------------------------------------

export function $agent(
    context: DecoratorContext,
    target: Namespace,
    name: string,
    description?: string,
): void {
    if (!name) {
        reportDiagnostic(context.program, { code: "agent-without-name", target });
        return;
    }
    context.program.stateMap(stateKeys.agent).set(target, { name, description } satisfies AgentInfo);
}

export function $instructions(context: DecoratorContext, target: Namespace, text: string): void {
    context.program.stateMap(stateKeys.instructions).set(target, text);
}

// `@useModel`, not `@model`: `model` is a reserved TypeSpec keyword (see lib/main.tsp).
export function $useModel(context: DecoratorContext, target: Namespace, config: unknown): void {
    context.program.stateMap(stateKeys.model).set(target, config);
}

export function $tool(context: DecoratorContext, target: Operation): void {
    context.program.stateMap(stateKeys.tool).set(target, true);
}

export function $workflow(context: DecoratorContext, target: Namespace, spec: unknown): void {
    context.program.stateMap(stateKeys.workflow).set(target, spec);
}

setTypeSpecNamespace("AgentFramework", $agent, $instructions, $useModel, $tool, $workflow);

// ---------------------------------------------------------------------------
// Emitter — dialect D1 (prompt-agent YAML)
// ---------------------------------------------------------------------------

/**
 * Emits one `kind: Prompt` YAML document per `@agent` namespace, in the exact
 * shape Microsoft's `ChatClientPromptAgentFactory.CreateFromYamlAsync` parses
 * (verified against `Microsoft.Agents.AI.Declarative` source). YAML key order is
 * fixed and `yaml.stringify` is deterministic, so output is byte-stable across
 * compiles (PR-1 determinism gate).
 */
export async function $onEmit(context: EmitContext): Promise<void> {
    if (context.program.compilerOptions.dryRun) return;

    const program = context.program;
    const agents = [...program.stateMap(stateKeys.agent)] as Array<[Namespace, AgentInfo]>;
    const workflows = [...program.stateMap(stateKeys.workflow)] as Array<[Namespace, unknown]>;
    if (agents.length === 0 && workflows.length === 0) return;

    await program.host.mkdirp(context.emitterOutputDir);

    for (const [ns, info] of agents) {
        const document = buildAgentDocument(program, ns, info);
        await program.host.writeFile(
            resolvePath(context.emitterOutputDir, `${kebab(info.name)}.agent.yaml`),
            ensureTrailingNewline(toYaml(document)),
        );
    }

    for (const [ns, spec] of workflows) {
        const document = buildWorkflowDocument(spec);
        if (!document) continue;
        await program.host.writeFile(
            resolvePath(context.emitterOutputDir, `${kebab(ns.name)}.workflow.yaml`),
            ensureTrailingNewline(toYaml(document)),
        );
    }
}

/**
 * Hard workflow invariants (PRD Law §2: a broken graph is never merely a warning).
 * Trigger-without-id is already a type error (TriggerSpec.id is required); here we
 * catch duplicate action ids and unresolved action references — the unknown-reference
 * defect class that MAF only fails on at load.
 */
export function $onValidate(program: Program): void {
    for (const [ns, spec] of program.stateMap(stateKeys.workflow) as Map<Namespace, unknown>) {
        const trigger = asRecord(asRecord(spec)?.trigger);
        if (!trigger) continue;

        const actions = collectActions(trigger.actions);
        const ids = new Set<string>();
        for (const action of actions) {
            const id = typeof action.id === "string" ? action.id : undefined;
            if (!id) continue;
            if (ids.has(id)) {
                reportDiagnostic(program, { code: "duplicate-action-id", target: ns, format: { id } });
            }
            ids.add(id);
        }

        // GotoAction.actionId must reference a declared action id within the workflow.
        for (const action of actions) {
            if (action.kind !== "GotoAction") continue;
            const ref = typeof action.actionId === "string" ? action.actionId : undefined;
            const id = typeof action.id === "string" ? action.id : "(unnamed)";
            if (ref && !ids.has(ref)) {
                reportDiagnostic(program, {
                    code: "unknown-action-reference",
                    target: ns,
                    format: { id, ref, field: "actionId" },
                });
            }
        }

        // PowerFx: every Local.*/Topic.* referenced in an expression must be declared
        // by some action in this workflow (MAF-004). Scopes we don't track declarations
        // for (System, Env, Global, …) are governed by the powerfx-scope lint rule, not here.
        const declared = collectDeclaredVariables(actions);
        for (const ref of collectVariableReferences(actions)) {
            const scope = ref.split(".", 1)[0];
            if ((scope === "Local" || scope === "Topic") && !declared.has(ref)) {
                reportDiagnostic(program, { code: "unknown-variable-reference", target: ns, format: { ref } });
            }
        }
    }
}

/** Variable paths an action declares: Set*Variable `variable:`, Foreach `index:`/`value:`. */
function collectDeclaredVariables(actions: Array<Record<string, unknown>>): Set<string> {
    const declared = new Set<string>();
    for (const action of actions) {
        if (action.kind === "SetVariable" || action.kind === "SetTextVariable" || action.kind === "ResetVariable") {
            if (typeof action.variable === "string") declared.add(action.variable);
        }
        if (action.kind === "Foreach") {
            if (typeof action.index === "string") declared.add(action.index);
            if (typeof action.value === "string") declared.add(action.value);
        }
    }
    return declared;
}

const POWERFX_REF = /\b([A-Z][A-Za-z0-9]*)\.([A-Za-z_][A-Za-z0-9_]*)/g;

/** Scope.Name references found inside PowerFx expressions (`=`-prefixed string values). */
function collectVariableReferences(actions: Array<Record<string, unknown>>): Set<string> {
    const refs = new Set<string>();
    for (const action of actions) {
        for (const value of Object.values(action)) {
            if (typeof value !== "string" || !value.startsWith("=")) continue;
            for (const [match] of value.matchAll(POWERFX_REF)) refs.add(match);
        }
    }
    return refs;
}

/**
 * Policy (configurable warning): a PowerFx expression should only reference variable
 * scopes the project allows. Tunable via the `allowedScopes` rule option.
 */
export const powerfxScopeRule = createRule({
    name: "powerfx-scope",
    severity: "warning",
    description: "PowerFx expressions should only reference allowed variable scopes.",
    messages: {
        default: paramMessage`PowerFx expression references scope '${"scope"}' which is not in the allowed set (${"allowed"})`,
    },
    defaultOptions: {
        allowedScopes: ["Local", "Topic", "System", "Env", "Global", "Conversation"],
    },
    create(context) {
        return {
            root: () => {
                const options = context.options as { allowedScopes: readonly string[] };
                const allowed = new Set(options.allowedScopes);
                for (const [ns, spec] of context.program.stateMap(stateKeys.workflow) as Map<Namespace, unknown>) {
                    const trigger = asRecord(asRecord(spec)?.trigger);
                    if (!trigger) continue;
                    for (const ref of collectVariableReferences(collectActions(trigger.actions))) {
                        const scope = ref.split(".", 1)[0];
                        if (!allowed.has(scope)) {
                            context.reportDiagnostic({
                                format: { scope, allowed: options.allowedScopes.join(", ") },
                                target: ns,
                            });
                        }
                    }
                }
            },
        };
    },
});

export const $linter = defineLinter({
    rules: [powerfxScopeRule],
    ruleSets: {
        recommended: {
            enable: { [`@ancplua/typespec-maf/${powerfxScopeRule.name}`]: true },
        },
    },
});

/** Wraps the authored workflow spec into the `kind: Workflow` document. */
function buildWorkflowDocument(spec: unknown): Record<string, unknown> | undefined {
    const record = asRecord(spec);
    const trigger = asRecord(record?.trigger);
    if (!trigger) return undefined;
    return { kind: "Workflow", trigger };
}

/** Flattens a trigger's actions, recursing into nested `actions` (e.g. Foreach, ConditionGroup). */
function collectActions(value: unknown): Array<Record<string, unknown>> {
    const out: Array<Record<string, unknown>> = [];
    walk(value);
    return out;

    function walk(node: unknown): void {
        if (Array.isArray(node)) {
            for (const item of node) walk(item);
            return;
        }
        const record = asRecord(node);
        if (!record) return;
        if (typeof record.kind === "string" && typeof record.id !== "undefined") out.push(record);
        for (const [key, child] of Object.entries(record)) {
            if (key === "actions" || key === "elseActions" || key === "conditions") walk(child);
        }
    }
}

function buildAgentDocument(program: Program, ns: Namespace, info: AgentInfo): Record<string, unknown> {
    const document: Record<string, unknown> = { kind: "Prompt", name: info.name };

    if (info.description) document.description = info.description;

    const instructions = program.stateMap(stateKeys.instructions).get(ns) as string | undefined;
    if (instructions) document.instructions = instructions;

    const model = program.stateMap(stateKeys.model).get(ns);
    const modelBlock = buildModel(model);
    if (modelBlock) document.model = modelBlock;

    const tools = buildTools(program, ns);
    if (tools.length > 0) document.tools = tools;

    return document;
}

function buildModel(config: unknown): Record<string, unknown> | undefined {
    const record = asRecord(config);
    if (!record) return undefined;

    const model: Record<string, unknown> = {};
    if (record.id !== undefined) model.id = record.id;

    const options = asRecord(record.options);
    if (options) {
        const cleaned = stripUndefined(options);
        if (Object.keys(cleaned).length > 0) model.options = cleaned;
    }

    return Object.keys(model).length > 0 ? model : undefined;
}

function buildTools(program: Program, ns: Namespace): Array<Record<string, unknown>> {
    const tools: Array<Record<string, unknown>> = [];

    for (const op of ns.operations.values()) {
        if (program.stateMap(stateKeys.tool).get(op) !== true) continue;

        const parameters: Array<Record<string, unknown>> = [];
        for (const param of op.parameters.properties.values()) {
            const parameter: Record<string, unknown> = {
                name: param.name,
                type: toolParameterType(param.type),
            };
            const doc = getDoc(program, param);
            if (doc) parameter.description = doc;
            parameter.required = !param.optional;
            parameters.push(parameter);
        }

        const tool: Record<string, unknown> = { kind: "function", name: op.name };
        const doc = getDoc(program, op);
        if (doc) tool.description = doc;
        if (parameters.length > 0) tool.parameters = parameters;
        tools.push(tool);
    }

    return tools;
}

/** Maps a TypeSpec parameter type to a D1 function-tool parameter type string. */
function toolParameterType(type: Type): string {
    if (type.kind === "Scalar") {
        const name = type.name;
        if (name === "boolean") return "boolean";
        if (name.startsWith("int") || name === "integer" || name === "safeint") return "integer";
        if (name.startsWith("float") || name === "numeric" || name === "decimal" || name === "decimal128") return "number";
        return "string";
    }
    return "string";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function stripUndefined(record: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
        if (value !== undefined) out[key] = value;
    }
    return out;
}

function ensureTrailingNewline(content: string): string {
    return content.endsWith("\n") ? content : `${content}\n`;
}

/** `WeatherBot` -> `weather-bot`, `Agent Name` -> `agent-name`. Deterministic. */
function kebab(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
}
