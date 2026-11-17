import { NextResponse } from "next/server";

/**
 * Refuses a request that a browser sent from a page on another site.
 *
 * `request.json()` parses any body, so without this a page elsewhere could
 * POST to this API from its visitors' browsers (a `text/plain` POST needs no
 * CORS preflight) and spend this app's credits from thousands of real
 * addresses. Browsers mark every request with Sec-Fetch-Site, which pages
 * cannot set. Requests without it (curl, scripts, tests, browsers on plain
 * HTTP origins, which do not send it) are let through: this is not a defence
 * against scripts, the rate limits are.
 */
export function rejectCrossSite(request: Request): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  if (site === null || site === "same-origin" || site === "none") return null;
  return NextResponse.json(
    { error: "Requests from other sites are not allowed." },
    { status: 403 }
  );
}
