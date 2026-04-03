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
} else {
  if (convexUrl) {
    console.log(
      "No CONVEX_DEPLOY_KEY found. Building against the existing NEXT_PUBLIC_CONVEX_URL without deploying Convex.\n",
    );
  } else {
    console.log(
      "No build-time Convex configuration found. Building the Worker and relying on the Cloudflare runtime binding for NEXT_PUBLIC_CONVEX_URL.\n",
    );
    console.log(
      "If you are deploying from a local shell, set NEXT_PUBLIC_CONVEX_URL or CONVEX_DEPLOY_KEY to avoid shipping a Worker without Convex configured.\n",
    );
  }

  run("npm", ["run", "build:cloudflare"], env);

  if (!convexUrl) {
    console.log(
      "Skipping Convex backend deploy. If this points at a blank Convex project, run `npx convex deploy --yes` separately against the same production deployment after Cloudflare finishes.\n",
    );
  }
}

if (!deployKey && !convexUrl) {
  console.log(
    "Continuing with wrangler deploy only because the Cloudflare deploy-button flow supplies NEXT_PUBLIC_CONVEX_URL as a runtime Worker binding.\n",
  );
}

run("wrangler", ["deploy"], env);
