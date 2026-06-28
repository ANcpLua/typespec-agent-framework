// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// D1 round-trip gate (PRD Law §3): the TypeSpec-emitted agent YAML must load
// through Microsoft's ChatClientPromptAgentFactory.CreateFromYamlAsync.
// Run from the repo root after `npm run compile`:
//   dotnet run --project tests/MafRoundTrip -- generated/maf/weather-bot.agent.yaml

using Microsoft.Agents.AI;

string yamlPath = Path.GetFullPath(
    args.Length > 0 ? args[0] : Path.Combine("generated", "maf", "weather-bot.agent.yaml"));

if (!File.Exists(yamlPath))
{
    Console.Error.WriteLine($"FAIL: emitted YAML not found at {yamlPath}. Run `npm run compile` first.");
    return 1;
}

string yaml = await File.ReadAllTextAsync(yamlPath);
Console.WriteLine($"Loading: {yamlPath}\n");

var factory = new ChatClientPromptAgentFactory(new StubChatClient());
AIAgent agent = await factory.CreateFromYamlAsync(yaml);

int failures = 0;
void Check(bool ok, string label, object? got = null)
{
    Console.WriteLine($"  {(ok ? "PASS" : "FAIL")}  {label}{(ok ? "" : $" — got '{got}'")}");
    if (!ok) failures++;
}

// CreateFromYamlAsync parses the full document — kind/name/description/instructions
// AND the model: + tools: blocks. A malformed model or function-tool shape throws
// during load, so reaching this point already validates the emitted model/tool YAML.
Check(agent is ChatClientAgent, "loads as ChatClientAgent via Microsoft's CreateFromYamlAsync", agent.GetType().Name);
var cca = agent as ChatClientAgent;
Check(cca?.Name == "WeatherBot", "name round-trips", cca?.Name);
Check(cca?.Description == "Answers weather questions for a given location.", "description round-trips", cca?.Description);
Check(cca?.Instructions == "You are a helpful weather assistant. Be concise.", "instructions round-trip", cca?.Instructions);

Console.WriteLine();
if (failures == 0)
{
    Console.WriteLine("D1 round-trip OK — TypeSpec-emitted YAML loaded by Microsoft's loader.");
    return 0;
}

Console.Error.WriteLine($"{failures} assertion(s) failed.");
return 1;
