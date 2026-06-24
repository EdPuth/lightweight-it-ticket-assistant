import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canProcessTickets, getCurrentUserProfile } from "@/lib/auth";
import { guidelines } from "@/lib/knowledge-base";
import { CATEGORY_LABELS } from "@/lib/ticket-utils";

export const metadata: Metadata = {
  title: "Guidelines · Ticket Assistant",
};

export const dynamic = "force-dynamic";

// Staff-only knowledge base index. Employees never see this page (or the nav
// link); guarded server-side, not just hidden in the UI.
export default async function FaqPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || !canProcessTickets(profile)) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <span aria-hidden="true">←</span> Back to tickets
      </Link>

      <header className="mt-6">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          Guidelines
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Internal IT support how-tos and known fixes. Staff only.
        </p>
      </header>

      <ul className="mt-8 flex flex-col gap-3">
        {guidelines.map((g, index) => (
          <li
            key={g.id}
            className="rise"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <Link
              href={`/faq/${g.id}`}
              className="ticket-card group block rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-ink/15 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[15px] font-medium text-foreground group-hover:text-ink">
                  {g.title}
                </h2>
                <span className="shrink-0 rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
                  {CATEGORY_LABELS[g.category]}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {g.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
