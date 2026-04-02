#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }

  return result;
}

const fileEnv = parseEnvFile(envFile);
const env = { ...fileEnv, ...process.env };

const required = [
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_SITE_URL",
  "SITE_URL",
];

const optional = [
  "POSTMARK_SERVER_TOKEN",
  "POSTMARK_INBOUND_ADDRESS",
  "POSTMARK_WEBHOOK_SECRET",
  "DEFAULT_FROM_EMAIL",
  "SLACK_BOT_TOKEN",
  "SLACK_CHANNEL_ID",
  "SLACK_SIGNING_SECRET",
  "HELP_CENTER_HOST",
  "INBOUND_ORG_ID",
];

const missingRequired = required.filter((name) => !env[name]);

console.log("Open Helpdesk setup check\n");

if (existsSync(envFile)) {
  console.log(`Loaded root env file: ${envFile}`);
} else {
  console.log("No root .env.local found. Falling back to shell environment only.");
}

if (missingRequired.length > 0) {
  console.log("\nMissing required variables:");
  for (const name of missingRequired) {
    console.log(`- ${name}`);
  }
  console.log("\nNext step:");
  console.log("1. Copy .env.example to .env.local");
  console.log("2. Fill the required values");
  console.log("3. Re-run `npm run check:setup`");
  process.exit(1);
}

console.log("\nRequired variables:");
for (const name of required) {
  console.log(`- ${name}=configured`);
}

const configuredOptional = optional.filter((name) => env[name]);
if (configuredOptional.length > 0) {
  console.log("\nOptional integrations configured:");
  for (const name of configuredOptional) {
    console.log(`- ${name}`);
  }
}

console.log("\nBootstrap flow:");
console.log("- Run `npm run dev:convex` in one terminal");
console.log("- Run `npm run dev` in another terminal");
console.log("- Open `http://localhost:3000/setup`");
console.log("- Create the first owner account and workspace");
