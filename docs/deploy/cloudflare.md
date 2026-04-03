# Cloudflare Workers Deployment

Open Helpdesk targets Cloudflare Workers via OpenNext.

## Recommended install flow

Use a blank Convex project and a Convex Production Deploy Key.

1. Create a Convex project in the Convex dashboard.
2. Open the production deployment for that project.
3. Go to `Deployment Settings` > `General`.
4. Click `Generate Production Deploy Key`.
5. Copy the key and provide it to Cloudflare as `CONVEX_DEPLOY_KEY`.

When `CONVEX_DEPLOY_KEY` is present, `npm run deploy:cloudflare` will:

1. Run `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "npm run build:cloudflare" --yes`
2. Push the Convex backend to the production deployment behind that key
3. Build the app with the correct production Convex URL
4. Deploy the Worker with `wrangler deploy`

This is the intended one-click install path for a fresh project.

## Deploy to Cloudflare button

The deploy button should prompt for:

- `CONVEX_DEPLOY_KEY`
- optional `SITE_URL`
- optional `HELP_CENTER_HOST`
- optional Postmark and Slack secrets

You do not need to paste `NEXT_PUBLIC_CONVEX_URL` for the one-click flow.

## Local preview

1. Install dependencies with `npm install`.
2. Make sure `NEXT_PUBLIC_CONVEX_URL` is available locally, usually via `.env.local`.
3. Preview the Worker runtime with `npm run preview`.

This preview path uses the root `wrangler.jsonc`, so it exercises the same Worker config shape as production.

## Manual production deploy

If you already have a deployed Convex backend, you can skip the deploy key and use a direct URL instead:

1. Set `NEXT_PUBLIC_CONVEX_URL` in your environment.
2. Optionally set `CONVEX_SITE_URL`, `SITE_URL`, and `HELP_CENTER_HOST`.
3. Run `npm run deploy:cloudflare`.

Without `CONVEX_DEPLOY_KEY`, this command will only build the Worker and deploy Cloudflare.

## Notes

- The dashboard, public help center, and embed script are served from the same deployment.
- `SITE_URL` is optional. If you leave it blank, the app can run on the Cloudflare `workers.dev` hostname.
- The public widget snippet should use the deployed site origin as `siteUrl`.
