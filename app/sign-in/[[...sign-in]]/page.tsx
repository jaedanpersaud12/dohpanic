import { SignIn } from "@clerk/nextjs";
import { EVENT } from "@/lib/config";

export default function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="t-gold t-fact text-lg font-semibold">{EVENT.theme}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Door staff sign-in
          </p>
        </div>
        <div className="t-pop-in flex justify-center">
          <SignIn />
        </div>
      </div>
    </main>
  );
}
