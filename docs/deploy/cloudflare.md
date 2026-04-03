# Cloudflare Workers Deployment

Open Helpdesk targets Cloudflare Workers via OpenNext.

## Recommended install flow

Use a blank Convex project and paste its production deployment URL into the Cloudflare setup screen.

1. Create a Convex project in the Convex dashboard.
2. Open the production deployment for that project.
3. Go to `Deployment Settings` > `URL and Deploy Key`.
4. Copy the deployment URL that looks like `https://your-project.convex.cloud`.
5. Provide that value to Cloudflare as `NEXT_PUBLIC_CONVEX_URL`.

The Cloudflare deploy button stores that value as a Worker runtime binding. `npm run deploy:cloudflare` then builds the widget and Worker bundle and deploys the Worker with `wrangler deploy`.

## Deploy to Cloudflare button

The deploy button should prompt for:

- `NEXT_PUBLIC_CONVEX_URL`
- optional `SITE_URL`
- optional `HELP_CENTER_HOST`
- optional Postmark and Slack secrets

After the Worker is live, deploy the Convex backend once with `npx convex deploy --yes` against the same project. The deploy button does not push Convex functions to a blank project by itself.

## Local preview

1. Install dependencies with `npm install`.
2. Make sure `NEXT_PUBLIC_CONVEX_URL` is available locally, usually via `.env.local`.
3. Preview the Worker runtime with `npm run preview`.

This preview path uses the root `wrangler.jsonc`, so it exercises the same Worker config shape as production.

## Manual production deploy

If you already have a deployed Convex backend, use a direct URL:

1. Set `NEXT_PUBLIC_CONVEX_URL` in your environment.
2. Optionally set `CONVEX_SITE_URL`, `SITE_URL`, and `HELP_CENTER_HOST`.
3. Run `npm run deploy:cloudflare`.

If `CONVEX_DEPLOY_KEY` is also present in the shell environment, the deploy script will deploy Convex first and inject the URL during the build. This automation path is useful in GitHub Actions or local shell scripts, but it is not required for the Cloudflare deploy button flow.

## Notes

- The dashboard, public help center, and embed script are served from the same deployment.
- `SITE_URL` is optional. If you leave it blank, the app can run on the Cloudflare `workers.dev` hostname.
- The public widget snippet should use the deployed site origin as `siteUrl`.
