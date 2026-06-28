import "@ancplua/typespec-maf";

using AgentFramework;

// NEGATIVE eval (PR-3, PRD success-metric §8.1 "crash-class conversion"):
// GotoAction.actionId references an id that does not exist in the workflow. In raw
// MAF this fails only at LOAD time; here it is a COMPILE error (MAF-003) via
// `$onValidate`. Compiling THIS file MUST fail — verified by tools/negative-eval.mjs.
// It is intentionally NOT imported by main.tsp, so the main build stays green.
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "bad_workflow",
    actions: #[
      #{ kind: "GotoAction", id: "goto_nowhere", actionId: "does_not_exist" },
      #{ kind: "EndConversation", id: "end_all" }
    ],
  },
})
namespace UnknownReferenceWorkflow {}
