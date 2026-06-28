// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// D2 round-trip gate (PRD Law §3): each TypeSpec-emitted workflow YAML must build
// through Microsoft's DeclarativeWorkflowBuilder.Build. Run from the repo root
// after `npm run compile`:
//   dotnet run --project tests/MafWorkflowRoundTrip

using Microsoft.Agents.AI.Workflows;             // Workflow
using Microsoft.Agents.AI.Workflows.Declarative; // DeclarativeWorkflowBuilder, DeclarativeWorkflowOptions

string[] yamls = args.Length > 0
    ? args
    : [
        "generated/maf/set-variable-workflow.workflow.yaml",
        "generated/maf/goto-workflow.workflow.yaml",
        "generated/maf/loop-continue-workflow.workflow.yaml",
    ];

var options = new DeclarativeWorkflowOptions(new StubResponseAgentProvider());

int failures = 0;
foreach (string rel in yamls)
{
    string path = Path.GetFullPath(rel);
    string name = Path.GetFileName(path);

    if (!File.Exists(path))
    {
        Console.Error.WriteLine($"  FAIL  {name} — not found (run `npm run compile` first)");
        failures++;
        continue;
    }

    try
    {
        using var reader = new StreamReader(path);
        Workflow workflow = DeclarativeWorkflowBuilder.Build<string>(reader, options);
        bool ok = workflow is not null;
        Console.WriteLine($"  {(ok ? "PASS" : "FAIL")}  {name} builds via DeclarativeWorkflowBuilder");
        if (!ok) failures++;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"  FAIL  {name} — {ex.GetType().Name}: {ex.Message}");
        failures++;
    }
}

Console.WriteLine();
if (failures == 0)
{
    Console.WriteLine("D2 round-trip OK — emitted workflows build via Microsoft's DeclarativeWorkflowBuilder.");
    return 0;
}

Console.Error.WriteLine($"{failures} workflow(s) failed to build.");
return 1;
