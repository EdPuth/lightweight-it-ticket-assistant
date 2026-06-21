import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in — Ticket Assistant",
  description: "Sign in to the lightweight IT support ticket assistant.",
};

// The four status-dot hues are the product's only colour. Reusing them here as a
// small decorative motif ties the login screen to the app identity.
const STATUS_DOTS = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-gray-400",
  "bg-emerald-500",
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-16">
      {/* Atmosphere layers (decorative, non-interactive). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="login-aura absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="login-aura absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="login-grid absolute inset-0" />
      </div>

      <section className="rise relative w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface/80 px-7 py-9 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:px-9">
          {/* Brand */}
          <div className="flex items-center gap-2">
            {STATUS_DOTS.map((dot, index) => (
              <span
                key={dot}
                className={`login-dot h-2 w-2 rounded-full ${dot}`}
                style={{ animationDelay: `${index * 240}ms` }}
              />
            ))}
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            IT Support Console
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-foreground">
            Ticket Assistant
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sign in to view, triage, and resolve support tickets.
          </p>

          <LoginForm />
        </div>

        {/* Demo credentials hint — this is a practice project with one fixed account. */}
        <p className="mt-5 text-center text-xs leading-relaxed text-faint">
          Demo access · <span className="font-mono">itsupport@outlook.com</span>{" "}
          / <span className="font-mono">123456</span>
        </p>
      </section>
    </main>
  );
}
