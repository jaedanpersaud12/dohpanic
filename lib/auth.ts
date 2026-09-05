import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Being signed in is not the same as being staff.
 *
 * Clerk sign-up is open by default, so "has a Clerk account" would let anyone
 * on the internet approve payments and burn tickets. Access therefore needs an
 * explicit grant, by either:
 *
 *   - STAFF_EMAILS  — comma-separated allowlist in the environment, or
 *   - publicMetadata.role === "staff"  — set on the user in the Clerk dashboard
 *
 * With neither configured nobody is staff, which fails closed rather than open.
 * Turning sign-ups to invitation-only in Clerk is worth doing as well, but this
 * check is what actually holds the door.
 */

export type StaffState = {
  userId: string | null;
  email: string | null;
  isStaff: boolean;
  /** False when nobody has been granted access yet — worth saying out loud. */
  configured: boolean;
};

function allowlist(): string[] {
  return (process.env.STAFF_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function staffState(): Promise<StaffState> {
  const { userId } = await auth();
  const allowed = allowlist();

  if (!userId) {
    return { userId: null, email: null, isStaff: false, configured: allowed.length > 0 };
  }

  const user = await currentUser();
  const emails = (user?.emailAddresses ?? []).map((e) =>
    e.emailAddress.toLowerCase()
  );
  const primary =
    emails.find(
      (e) =>
        e ===
        user?.primaryEmailAddress?.emailAddress?.toLowerCase()
    ) ?? emails[0] ?? null;

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const isStaff =
    role === "staff" || emails.some((e) => allowed.includes(e));

  return {
    userId,
    email: primary,
    isStaff,
    configured: allowed.length > 0,
  };
}

export async function staffId(): Promise<string | null> {
  const s = await staffState();
  return s.isStaff ? s.userId : null;
}

export class NotStaffError extends Error {
  constructor() {
    super("Your account isn't on the staff list for this event.");
  }
}

/** Use at the top of every Server Action that changes anything. */
export async function requireStaff(): Promise<string> {
  const id = await staffId();
  if (!id) throw new NotStaffError();
  return id;
}
