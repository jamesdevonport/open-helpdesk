import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup stale visitor presence",
  { hours: 1 },
  internal.visitorPresence.cleanup,
  {}
);

crons.interval(
  "auto-resolve stale chat conversations",
  { hours: 1 },
  internal.conversations.autoResolveStale,
  {}
);

export default crons;
