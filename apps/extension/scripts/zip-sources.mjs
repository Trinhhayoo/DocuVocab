// Packs the source code AMO reviewers need to rebuild the Firefox add-on.
// `wxt zip` only includes apps/extension, but the extension also imports packages/shared.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import process from "node:process";

const SOURCE_PATHS = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "apps/extension",
  "packages/shared",
];

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", cwd: new URL("../../..", import.meta.url) }).trim();

// The archive comes from the last commit, so uncommitted changes would make it differ from the build.
if (git("status", "--porcelain", "--", ...SOURCE_PATHS)) {
  console.error("Commit or stash changes in the extension sources before zipping them.");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const outputDir = new URL("../.output/", import.meta.url);
mkdirSync(outputDir, { recursive: true });
const output = new URL(`docuvocabextension-${version}-sources-full.zip`, outputDir);

git("archive", "--format=zip", "-o", output.pathname, "HEAD", "--", ...SOURCE_PATHS);
console.log(`Sources zipped to ${output.pathname}`);
