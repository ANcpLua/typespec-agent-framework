// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// PR-3 negative eval: a workflow with an unresolved action reference must be a
// COMPILE error (MAF-003), where raw MAF only fails at load. Asserts that compiling
// samples/negative/unknown-reference.tsp FAILS with the expected diagnostic.
//
// Run: node tools/negative-eval.mjs   (or npm run test:negative)

import { execSync } from "node:child_process";

const FILE = "samples/negative/unknown-reference.tsp";

let output = "";
let failedToCompile = false;
try {
    output = execSync(`npx tsp compile ${FILE} --no-emit`, { encoding: "utf8", stdio: "pipe" });
} catch (err) {
    failedToCompile = true;
    output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
}

const hasDiagnostic = /MAF-003|unknown-action-reference/.test(output);

if (failedToCompile && hasDiagnostic) {
    console.log("  PASS  unknown action reference is a compile error (MAF-003)");
    console.log("\nnegative-eval OK — the BadId/unknown-reference defect class fails at compile, not load.");
    process.exit(0);
}

console.error(`  FAIL  expected a compile failure with MAF-003 (failedToCompile=${failedToCompile}, hasDiagnostic=${hasDiagnostic})`);
console.error(output);
process.exit(1);
