/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as PostmarkOTP from "../PostmarkOTP.js";
import type * as agents from "../agents.js";
import type * as articles from "../articles.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as collections from "../collections.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as emailEvents from "../emailEvents.js";
import type * as emailFallback from "../emailFallback.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as messages from "../messages.js";
import type * as organizations from "../organizations.js";
import type * as pageViews from "../pageViews.js";
import type * as productUpdates from "../productUpdates.js";
import type * as setup from "../setup.js";
import type * as slack from "../slack.js";
import type * as tags from "../tags.js";
import type * as typing from "../typing.js";
import type * as visitorPresence from "../visitorPresence.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  PostmarkOTP: typeof PostmarkOTP;
  agents: typeof agents;
  articles: typeof articles;
  auth: typeof auth;
  categories: typeof categories;
  collections: typeof collections;
  contacts: typeof contacts;
  conversations: typeof conversations;
  crons: typeof crons;
  email: typeof email;
  emailEvents: typeof emailEvents;
  emailFallback: typeof emailFallback;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  messages: typeof messages;
  organizations: typeof organizations;
  pageViews: typeof pageViews;
  productUpdates: typeof productUpdates;
  setup: typeof setup;
  slack: typeof slack;
  tags: typeof tags;
  typing: typeof typing;
  visitorPresence: typeof visitorPresence;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
