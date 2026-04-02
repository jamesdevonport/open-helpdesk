<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Development workflow

Follow these steps in order when building features or making changes:

1. **Develop locally first.** Run `npm run dev` (Next.js via Turbo) and `npm run dev:convex` (Convex dev backend) and make all changes against the local environment.
2. **Test locally.** Verify the feature works end-to-end in the browser against the local dev server before moving on. Do not skip this step.
3. **Deploy Convex to production.** Run `npx convex deploy --yes` to push backend changes to the production Convex deployment.
4. **Commit and push to GitHub.** This triggers the frontend deploy. Do not push until steps 1–3 are complete.

Never deploy directly to production without testing locally first. Never push to GitHub before the Convex backend is deployed — the frontend deploy must not reference functions or schema that don't exist in production yet.
