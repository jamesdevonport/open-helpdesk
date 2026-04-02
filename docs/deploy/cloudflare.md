# Cloudflare Workers Deployment

Open Helpdesk targets Cloudflare Workers via OpenNext.

## Before you deploy

1. Deploy Convex first.
2. Set `SITE_URL` to the final public hostname that will serve the dashboard and help center.
3. Make sure `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_SITE_URL` point at the live Convex deployment.
4. If you use the deploy button, Cloudflare will collect those core values from `wrangler.jsonc`. They stay commented in `.env.example` for local development so the setup page does not show duplicate prompts.

## Local preview

1. Install dependencies with `npm install`.
2. Build the widget with `npm run build:widget`.
3. Preview the Worker runtime with `npm run preview`.

## Production deploy

1. Authenticate Wrangler or provide `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
2. Run `npm run deploy:cloudflare`.
3. Point your custom domain at the Worker.
4. If you want a dedicated docs host, set `HELP_CENTER_HOST` to that hostname.

## Notes

- The dashboard, public help center, and embed script are served from the same deployment.
- The public widget snippet should use the deployed `SITE_URL` as `siteUrl`.
