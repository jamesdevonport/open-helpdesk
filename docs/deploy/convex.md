# Convex Deployment

## Fresh install target

Open Helpdesk is designed to start from a blank Convex project.

You do not need to import seed data or run a bootstrap script before opening the app. The first workspace and owner are created through `/setup`.

## Create the project

1. Open [dashboard.convex.dev](https://dashboard.convex.dev).
2. Create a new project.
3. Convex will provision a production deployment and development deployments for that project.

## Get the production URL

For Cloudflare deploy-button installs, the main value you need is the production deployment URL.

1. Open the production deployment.
2. Go to `Deployment Settings` > `URL and Deploy Key`.
3. Copy the deployment URL that looks like `https://your-project.convex.cloud`.
4. Use that value as `NEXT_PUBLIC_CONVEX_URL` in Cloudflare.

## Optional automation key

If you want CI or a local script to run `npx convex deploy` non-interactively, generate a `Production Deploy Key`.

1. On the same `URL and Deploy Key` page, click `Generate Production Deploy Key`.
2. Copy the key and store it as `CONVEX_DEPLOY_KEY`.

Convex documents this deploy-key flow in their hosting guides and CLI docs:

- `npx convex deploy` uses `CONVEX_DEPLOY_KEY` in CI and hosting environments
- `--cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL` lets the frontend build receive the correct production URL automatically

## Local development

The easiest local path is:

1. Run `npm install`.
2. Run `npm run dev:convex`.
3. Follow the Convex CLI prompt to log in and create or reconnect a development deployment.
4. Let Convex write the local deployment settings into `.env.local`.
5. Run `npm run dev`.

If you prefer to manage the file manually, `NEXT_PUBLIC_CONVEX_URL` is the only required local variable. `CONVEX_SITE_URL` can be derived automatically.

## Useful commands

- `npx convex deploy --yes`
- `npx convex env list`
- `npx convex env get NAME`
- `npx convex env set NAME value`
- `npm run check:setup`
