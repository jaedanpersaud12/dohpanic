import { SignOutButton } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import { staffState } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";

/**
 * Middleware guarantees somebody is signed in; this layout decides whether
 * that somebody is actually staff.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await staffState();

  if (!staff.isStaff) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="t-pop-in t-frame t-frame-double w-full max-w-md rounded-2xl p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10">
            <ShieldAlert className="size-5 text-[var(--gold)]" />
          </span>

          <h1 className="t-gold mt-5 text-2xl">Not on the door list</h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            You&apos;re signed in
            {staff.email ? (
              <>
                {" "}
                as{" "}
                <span className="font-[family-name:var(--font-mono)] text-[var(--foreground)]">
                  {staff.email}
                </span>
              </>
            ) : null}
            , but that account hasn&apos;t been given staff access.
          </p>

          {!staff.configured && (
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-left text-xs leading-relaxed text-[var(--muted-foreground)]">
              No staff have been configured yet. Add this address to{" "}
              <span className="font-[family-name:var(--font-mono)] text-[var(--gold)]">
                STAFF_EMAILS
              </span>{" "}
              in <span className="font-[family-name:var(--font-mono)]">.env.local</span>{" "}
              (comma-separated) and restart the server.
            </p>
          )}

          <div className="mt-6">
            <SignOutButton>
              <Button variant="outline" className="w-full">
                Sign out
              </Button>
            </SignOutButton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh">
      <AdminNav />
      {children}
    </div>
  );
}
