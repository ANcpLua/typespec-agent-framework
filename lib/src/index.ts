// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT

import {
    createTypeSpecLibrary,
    getDoc,
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
 * `@ancplua/typespec-maf` — TypeSpec authoring surface and emitters for the
 * declarative surfaces of Microsoft Agent Framework. PR-1 ships dialect D1
 * (prompt-agent YAML): the `@agent` / `@instructions` / `@model` / `@tool`
 * decorators and the `maf-agent-yaml` emitter, gated by a .NET round-trip
 * through the real `ChatClientPromptAgentFactory.CreateFromYamlAsync`.
 */
export const $lib = createTypeSpecLibrary({
    name: "@ancplua/typespec-maf",
    diagnostics: {
        "agent-without-name": {
            severity: "error",
            messages: { default: "MAF-001: @agent requires a non-empty name" },
        },
    },
    state: {
        agent: { description: "Namespaces marked as MAF prompt agents (@agent)" },
        instructions: { description: "Agent system instructions (@instructions)" },
        model: { description: "Agent model configuration (@model)" },
        tool: { description: "Operations marked as function tools (@tool)" },
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

setTypeSpecNamespace("AgentFramework", $agent, $instructions, $useModel, $tool);

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
    if (agents.length === 0) return;

    await program.host.mkdirp(context.emitterOutputDir);

    for (const [ns, info] of agents) {
        const document = buildAgentDocument(program, ns, info);
        const fileName = `${kebab(info.name)}.agent.yaml`;
        await program.host.writeFile(
            resolvePath(context.emitterOutputDir, fileName),
            ensureTrailingNewline(toYaml(document)),
        );
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
