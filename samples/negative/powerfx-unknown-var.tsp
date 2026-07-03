import "@ancplua/typespec-maf";

using AgentFramework;

// NEGATIVE eval: a PowerFx expression references `Local.Undeclared`, which no
// action declares. In raw MAF this is a runtime/load failure; here it is a COMPILE
// error (MAF-004) via `$onValidate`. Compiling THIS file MUST fail — verified by
// tools/powerfx-eval.mjs. Not imported by main.tsp, so the main build stays green.
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "bad_var_workflow",
    actions: #[
      #{ kind: "SetVariable", id: "set_a", variable: "Local.A", value: "=Local.Undeclared + 1" },
      #{ kind: "EndConversation", id: "end_all" }
    ],
  },
})
namespace PowerFxUnknownVarWorkflow {}
