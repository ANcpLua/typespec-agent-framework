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
