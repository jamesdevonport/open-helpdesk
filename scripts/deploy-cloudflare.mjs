#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const envFile = path.join(process.cwd(), ".env.local");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const raw = readFileSync(filePath, "utf8");
  const result = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }

  return result;
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const fileEnv = parseEnvFile(envFile);
const env = { ...fileEnv, ...process.env };

const deployKey = env.CONVEX_DEPLOY_KEY?.trim();
const convexUrl = env.NEXT_PUBLIC_CONVEX_URL?.trim();

if (deployKey) {
  console.log(
    "Using CONVEX_DEPLOY_KEY to build against and deploy the target Convex production deployment.\n",
  );

  run(
    "npx",
    [
      "convex",
      "deploy",
      "--cmd-url-env-var-name",
      "NEXT_PUBLIC_CONVEX_URL",
      "--cmd",
      "npm run build:cloudflare",
      "--yes",
    ],
    env,
  );
} else if (convexUrl) {
  console.log(
    "No CONVEX_DEPLOY_KEY found. Building against the existing NEXT_PUBLIC_CONVEX_URL without deploying Convex.\n",
  );
  run("npm", ["run", "build:cloudflare"], env);
} else {
  console.error("Missing Convex deployment configuration.\n");
  console.error(
    "For one-click Cloudflare installs, provide CONVEX_DEPLOY_KEY so the build can deploy Convex and inject NEXT_PUBLIC_CONVEX_URL.",
  );
  console.error(
    "For manual installs, set NEXT_PUBLIC_CONVEX_URL in your environment or .env.local before running this command.",
  );
  process.exit(1);
}

run("wrangler", ["deploy"], env);
