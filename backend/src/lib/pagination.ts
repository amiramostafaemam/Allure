import type { Request } from "express";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePagination(req: Request, defaultLimit = DEFAULT_LIMIT) {
  const rawLimit = Number(req.query.limit);
  const rawOffset = Number(req.query.offset);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : defaultLimit;

  const offset = Number.isFinite(rawOffset) && rawOffset >= 0
    ? Math.floor(rawOffset)
    : 0;

  return { limit, offset };
}
