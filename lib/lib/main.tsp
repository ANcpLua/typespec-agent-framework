import "../dist/index.js";

using TypeSpec.Reflection;

namespace AgentFramework;

/**
 * Declares a namespace as a Microsoft Agent Framework prompt agent (dialect D1).
 * `tsp compile` emits a `kind: Prompt` agent YAML loadable through the real
 * `ChatClientPromptAgentFactory.CreateFromYamlAsync` (PRD Law §3: round-trip or
 * it doesn't ship).
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
 * cannot be a decorator identifier. The PRD §3 working name `@model` collides with
 * the language; `@useModel` is the closest legal spelling. [Δ: PRD-named `@model`]
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
 * D1 `model.options:` block. A pragmatic subset for the PR-1 vertical slice;
 * the full option surface expands in later PRs.
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
