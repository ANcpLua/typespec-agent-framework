import "@ancplua/typespec-maf";

using AgentFramework;

/**
 * Sample D1 prompt agent. `npm run compile` emits
 * `generated/maf/weather-bot.agent.yaml`, which the .NET round-trip harness
 * (`tests/MafRoundTrip`) loads through Microsoft's real
 * `ChatClientPromptAgentFactory.CreateFromYamlAsync` (PRD Law §3).
 */
@agent("WeatherBot", "Answers weather questions for a given location.")
@instructions("You are a helpful weather assistant. Be concise.")
@useModel(#{ id: "gpt-4o", options: #{ temperature: 0.7, maxOutputTokens: 1024 } })
namespace WeatherBot {
  @tool
  @doc("Get the current weather for a given location.")
  op getWeather(
    @doc("The city and state, e.g. San Francisco, CA")
    location: string,

    @doc("The unit of temperature: celsius or fahrenheit.")
    unit: string,
  ): string;
}

// ---------------------------------------------------------------------------
// D2 sample workflows (PR-3). Each reproduces a Microsoft.Agents.AI.Workflows.
// Declarative.UnitTests/Workflows/*.yaml fixture from TypeSpec; `npm run compile`
// emits generated/maf/<name>.workflow.yaml, semantically equivalent to the MAF
// fixture and loadable via DeclarativeWorkflowBuilder.Build (tests/MafWorkflowRoundTrip).
// ---------------------------------------------------------------------------

/** Reproduces Workflows/SetVariable.yaml. */
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "my_workflow",
    actions: #[
      #{ kind: "SetVariable", id: "set_var", variable: "Local.TestVar", value: "=3" }
    ],
  },
})
namespace SetVariableWorkflow {}

/** Reproduces Workflows/Goto.yaml. */
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "my_workflow",
    actions: #[
      #{ kind: "GotoAction", id: "goto_end", actionId: "end_all" },
      #{ kind: "SendActivity", id: "send_activity_1", activity: "NEVER 1!" },
      #{ kind: "SendActivity", id: "send_activity_2", activity: "NEVER 2!" },
      #{ kind: "SendActivity", id: "send_activity_3", activity: "NEVER 3!" },
      #{ kind: "EndConversation", id: "end_all" }
    ],
  },
})
namespace GotoWorkflow {}

/** Reproduces Workflows/LoopContinue.yaml (nested Foreach actions). */
@workflow(#{
  trigger: #{
    kind: "OnConversationStart",
    id: "my_workflow",
    actions: #[
      #{
        kind: "Foreach",
        id: "foreach_loop",
        items: "=[\"a\", \"b\", \"c\", \"d\", \"e\", \"f\"]",
        index: "Local.LoopIndex",
        value: "Local.LoopValue",
        actions: #[
          #{ kind: "ContinueLoop", id: "continue_loop_now" },
          #{ kind: "SetVariable", id: "set_variable_inner", variable: "Local.Count", value: "=Local.Count + 1" },
          #{ kind: "SendActivity", id: "send_activity_inner", activity: "x{Local.Count} - {Local.LoopIndex}:{Local.LoopValue}" }
        ],
      },
      #{ kind: "EndConversation", id: "end_all" }
    ],
  },
})
namespace LoopContinueWorkflow {}
