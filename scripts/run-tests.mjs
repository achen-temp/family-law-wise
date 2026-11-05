import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const output = mkdtempSync(path.join(tmpdir(), "family-law-wise-tests-"));
const tests = readdirSync("tests").filter((file) => file.endsWith(".test.ts"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc", ...tests.map((file) => `tests/${file}`),
    "--outDir", output, "--module", "commonjs", "--moduleResolution", "node",
    "--target", "es2020", "--jsx", "react-jsx", "--esModuleInterop", "--strict", "--skipLibCheck",
  ], { stdio: "inherit" });
  execFileSync(process.execPath, ["--test", ...tests.map((file) => path.join(output, "tests", file.replace(/\.ts$/, ".js")))], {
    stdio: "inherit", env: { ...process.env, NODE_PATH: path.join(root, "node_modules") },
  });
} finally {
  rmSync(output, { recursive: true, force: true });
}
