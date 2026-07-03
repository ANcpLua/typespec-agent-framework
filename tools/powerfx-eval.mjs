// Copyright (c) 2026 ancplua
// SPDX-License-Identifier: MIT
//
// Eval matrix for PowerFx reference validation:
//   1. valid refs    -> main.tsp compiles clean (no MAF-004, no scope warning)
//   2. unknown ref   -> samples/negative/powerfx-unknown-var.tsp is a COMPILE error (MAF-004)
//   3. policy scope  -> samples/powerfx-policy.tsp emits a configurable WARNING (powerfx-scope)
//
// Run: node tools/powerfx-eval.mjs   (or npm run test:powerfx)

import { execSync } from "node:child_process";

function compile(file, extraArgs = "") {
    try {
        const stdout = execSync(`npx tsp compile ${file} --no-emit ${extraArgs}`, { encoding: "utf8", stdio: "pipe" });
        return { failed: false, output: stdout };
    } catch (err) {
        return { failed: true, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
    }
}

let failures = 0;
function check(ok, label) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) failures++;
}

// 1. Valid references — main.tsp must compile clean even under --warn-as-error.
const valid = compile("main.tsp", "--warn-as-error");
check(!valid.failed, "valid references compile clean (main.tsp, --warn-as-error)");

// 2. Unknown variable reference — must be a compile error MAF-004.
const unknown = compile("samples/negative/powerfx-unknown-var.tsp");
check(unknown.failed && /MAF-004|unknown-variable-reference/.test(unknown.output),
    "unknown variable reference is a compile error (MAF-004)");

// 3. Policy scope — a warning (not an error); compile succeeds, diagnostic present.
const policy = compile("samples/powerfx-policy.tsp");
check(!policy.failed && /powerfx-scope/.test(policy.output),
    "out-of-policy scope is a configurable warning (powerfx-scope)");

if (failures === 0) {
    console.log("\npowerfx-eval OK — valid passes, unknown ref errors, policy violation warns.");
    process.exit(0);
}
console.error(`\n${failures} powerfx-eval failure(s).`);
process.exit(1);
