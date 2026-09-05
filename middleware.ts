import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Everything under /admin is staff-only, and so is /v/... — the landing page a
 * QR points at, which forwards into the scanner. Buyers never sign in: they
 * reach their tickets through the unguessable token in their /o/... link.
 *
 * Middleware is the outer gate; every Server Action re-checks auth itself, so
 * a bypass here still cannot approve a payment or burn a ticket.
 */
const isStaffRoute = createRouteMatcher(["/admin(.*)", "/v(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isStaffRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless they appear in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
