import { AdminNav } from "@/components/admin-nav";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The login page renders inside this layout too, so the nav is conditional
  // rather than a redirect — each page guards itself with requireAdmin().
  const signedIn = await isAdmin();
  return (
    <div className="min-h-dvh">
      {signedIn && <AdminNav />}
      {children}
    </div>
  );
}
