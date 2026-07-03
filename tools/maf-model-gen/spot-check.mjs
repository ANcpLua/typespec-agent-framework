// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// Spot-check eval: pins the generated D2 action shapes against the action
// kinds exercised by Microsoft's OWN workflow tests
// (Microsoft.Agents.AI.Workflows.Declarative.UnitTests/Workflows/*.yaml @
// agent-framework-dotnet-rootsource 3a9f3480). Each oracle kind must appear as a
// `model <Kind> { kind: "<Kind>"; ... }` in generated/maf-actions.gen.tsp.
//
// Run: node tools/maf-model-gen/spot-check.mjs   (or npm run test:actions)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const GEN = resolve(process.argv[2] ?? "generated/maf-actions.gen.tsp");

// Action kinds that appear in the package's own Workflows/*.yaml fixtures AND are
// concrete DialogAction subtypes.
const ORACLE = [
    "SetVariable",
    "SetTextVariable",
    "ResetVariable",
    "GotoAction",
    "ContinueLoop",
    "BreakLoop",
    "Foreach",
    "ConditionGroup",
    "SendActivity",
    "AddConversationMessage",
    "CreateConversation",
    "EndConversation",
    "InvokeAzureAgent",
    "Question",
    "ParseValue",
];

const src = readFileSync(GEN, "utf8");
const modelCount = (src.match(/^model /gm) ?? []).length;

let failures = 0;
for (const kind of ORACLE) {
    const hasModel = new RegExp(`^model ${kind} \\{`, "m").test(src);
    const hasKind = new RegExp(`^  kind: "${kind}";`, "m").test(src);
    const ok = hasModel && hasKind;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${kind}`);
    if (!ok) failures++;
}

console.log(`\n  generated models: ${modelCount}`);
if (modelCount < 50) {
    console.log("  FAIL  expected the full action surface (>= 50 models)");
    failures++;
}

if (failures === 0) {
    console.log(`\nspot-check OK — ${ORACLE.length} MAF action shapes pinned, ${modelCount} models generated.`);
    process.exit(0);
}
console.error(`\n${failures} spot-check failure(s).`);
process.exit(1);
