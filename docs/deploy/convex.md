# Convex Deployment

## Fresh install target

Open Helpdesk is designed to start from a blank Convex project.

You do not need to import seed data or run a bootstrap script before opening the app. The first workspace and owner are created through `/setup`.

## Create the project

1. Open [dashboard.convex.dev](https://dashboard.convex.dev).
2. Create a new project.
3. Convex will provision a production deployment and development deployments for that project.

## Generate the right key

For Cloudflare installs, use a `Production Deploy Key`.

1. Open the production deployment.
2. Go to `Deployment Settings` > `General`.
3. Click `Generate Production Deploy Key`.
4. Copy the key and store it as `CONVEX_DEPLOY_KEY`.

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
