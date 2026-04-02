# Contributing

## Development

1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Start Convex with `npm run dev:convex`.
4. Start the app with `npm run dev`.
5. Complete first-run setup at `/setup`.

## Before opening a pull request

1. Run `npm run check:setup`.
2. Run `npm run build:widget`.
3. Run `npm run build:dashboard`.
4. Include any docs updates needed for behavior or config changes.

## Scope

- Keep the default deployment path focused on Convex + Cloudflare Workers.
- Treat Postmark and Slack as optional integrations.
- Preserve the first-owner bootstrap flow for fresh installs.
