// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// Equivalence gate: each TypeSpec-emitted workflow YAML must be SEMANTICALLY
// equivalent (same parsed tree, modulo key order / whitespace / the hand-authored
// blank lines) to the corresponding Microsoft.Agents.AI.Workflows.Declarative test
// fixture. Byte-equivalence is relaxed to parsed-tree equivalence (YAML serializer
// freedom); action order IS significant and is compared positionally.
//
// Run: node tools/workflow-equiv.mjs   (or npm run test:workflows)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const PAIRS = [
    ["generated/maf/set-variable-workflow.workflow.yaml", "tests/fixtures/maf-workflows/SetVariable.yaml"],
    ["generated/maf/goto-workflow.workflow.yaml", "tests/fixtures/maf-workflows/Goto.yaml"],
    ["generated/maf/loop-continue-workflow.workflow.yaml", "tests/fixtures/maf-workflows/LoopContinue.yaml"],
];

function deepEqual(a, b, path = "$") {
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) return `${path}: array vs non-array`;
        if (a.length !== b.length) return `${path}: array length ${a.length} != ${b.length}`;
        for (let i = 0; i < a.length; i++) {
            const r = deepEqual(a[i], b[i], `${path}[${i}]`);
            if (r) return r;
        }
        return null;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
        const ka = Object.keys(a).sort();
        const kb = Object.keys(b).sort();
        if (ka.join(",") !== kb.join(",")) return `${path}: keys {${ka}} != {${kb}}`;
        for (const k of ka) {
            const r = deepEqual(a[k], b[k], `${path}.${k}`);
            if (r) return r;
        }
        return null;
    }
    return a === b ? null : `${path}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`;
}

let failures = 0;
for (const [emitted, fixture] of PAIRS) {
    const name = emitted.split("/").pop();
    const a = parse(readFileSync(resolve(emitted), "utf8"));
    const b = parse(readFileSync(resolve(fixture), "utf8"));
    const diff = deepEqual(a, b);
    if (diff) {
        console.log(`  FAIL  ${name} — ${diff}`);
        failures++;
    } else {
        console.log(`  PASS  ${name} ≡ ${fixture.split("/").pop()} (semantic)`);
    }
}

if (failures === 0) {
    console.log(`\nworkflow-equiv OK — ${PAIRS.length} emitted workflows match MAF's fixtures (parsed-tree).`);
    process.exit(0);
}
console.error(`\n${failures} workflow(s) not equivalent.`);
process.exit(1);
