import "../dist/index.js";

using TypeSpec.Reflection;

namespace AgentFramework;

/**
 * Declares a namespace as a Microsoft Agent Framework prompt agent (dialect D1).
 * `tsp compile` emits a `kind: Prompt` agent YAML loadable through Microsoft's
 * `ChatClientPromptAgentFactory.CreateFromYamlAsync`.
 *
 * @param name The agent name (D1 `name:`).
 * @param description Optional agent description (D1 `description:`).
 */
extern dec agent(target: Namespace, name: valueof string, description?: valueof string);

/**
 * System instructions for the agent (D1 `instructions:`).
 */
extern dec instructions(target: Namespace, text: valueof string);

/**
 * Model configuration for the agent (D1 `model:`).
 *
 * Named `@useModel` (not `@model`): `model` is a reserved TypeSpec keyword, so it
 * cannot be a decorator identifier.
 */
extern dec useModel(target: Namespace, config: valueof ModelConfig);

/**
 * Marks an operation as a function tool exposed to the agent
 * (D1 `tools[]` entry with `kind: function`). Parameters and `@doc` strings on
 * the operation and its parameters become the tool's typed parameter list.
 */
extern dec tool(target: Operation);

/**
 * D1 `model:` block.
 */
model ModelConfig {
  /** Model id, e.g. `gpt-4o` (D1 `model.id`). */
  id: string;

  /** Inference options (D1 `model.options`). */
  options?: ModelOptions;
}

/**
 * D1 `model.options:` block. A pragmatic subset of MAF's inference-option surface.
 */
model ModelOptions {
  temperature?: float32;
  maxOutputTokens?: int32;
  topP?: float32;
  topK?: int32;
  frequencyPenalty?: float32;
  presencePenalty?: float32;
  seed?: int64;
}

/**
 * Declares a namespace as a Microsoft Agent Framework declarative workflow
 * (dialect D2). `tsp compile` emits a `kind: Workflow` YAML loadable through
 * Microsoft's `DeclarativeWorkflowBuilder.Build`. Action shapes are the
 * generated `AgentFramework.Actions.*` models; `$onValidate` enforces the
 * hard invariants (unique ids, references resolve).
 */
extern dec workflow(target: Namespace, spec: valueof WorkflowSpec);

/** D2 workflow root (`kind: Workflow`). */
model WorkflowSpec {
  trigger: TriggerSpec;
}

/** D2 `trigger:` block. A missing `id` is a compile error (the BadId defect class). */
model TriggerSpec {
  kind: string;
  id: string;
  actions: ActionSpec[];
}

/**
 * A workflow action. Open model: `kind` + `id` are required; action-specific fields
 * (`variable`, `value`, `actionId`, `activity`, `items`, nested `actions`, …) follow
 * the generated `AgentFramework.Actions.*` shapes and are emitted as authored. The
 * emitter and `$onValidate` check ids and references.
 */
model ActionSpec {
  kind: string;
  id: string;
  ...Record<unknown>;
}
