import "@ancplua/typespec-maf";

using AgentFramework;

// POLICY eval: a PowerFx expression references the `Bot` scope, which is not in
// the powerfx-scope rule's allowed set. This is a configurable WARNING (not an error):
// compiling succeeds, but the linter reports `@ancplua/typespec-maf/powerfx-scope`.
// Verified by tools/powerfx-eval.mjs. Not imported by main.tsp (which would fail
// `lint --warn-as-error`); kept standalone so the policy warning is demonstrable.
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "policy_workflow",
    actions: #[
      #{ kind: "SetVariable", id: "set_x", variable: "Local.X", value: "=Bot.Mood" },
      #{ kind: "EndConversation", id: "end_all" }
    ],
  },
})
namespace PowerFxPolicyWorkflow {}
