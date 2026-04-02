# Convex Deployment

## Required values

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_SITE_URL`
- `SITE_URL`

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill in the three core variables.
3. Install dependencies with `npm install`.
4. Start the backend with `npm run dev:convex`.
5. Start the app with `npm run dev`.
6. Open `http://localhost:3000/setup` and create the first owner account.

## Production deployment

1. Create a Convex project and deployment.
2. Set the same core variables in your deployment environment.
3. If you want email support, add the optional Postmark variables.
4. Run `npx convex deploy --yes`.

## Useful commands

- `npx convex env list`
- `npx convex env set NAME value`
- `npx convex deploy --yes`
- `npm run check:setup`
