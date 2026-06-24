import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canProcessTickets, getCurrentUserProfile } from "@/lib/auth";
import { getGuidelineById } from "@/lib/knowledge-base";
import { CATEGORY_LABELS } from "@/lib/ticket-utils";

type FaqPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

// Only allow returning to an internal ticket path (avoids open-redirect/injection
// from a crafted `from` value).
function safeTicketFrom(from: string | string[] | undefined): string | null {
  const value = Array.isArray(from) ? from[0] : from;
  return value && /^\/tickets\/[A-Za-z0-9-]+$/.test(value) ? value : null;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: FaqPageProps): Promise<Metadata> {
  const profile = await getCurrentUserProfile();
  const { id } = await params;
  const guideline = profile && canProcessTickets(profile)
    ? getGuidelineById(id)
    : null;
  return {
    title: guideline
      ? `${guideline.title} · Guidelines`
      : "Guideline not found · Ticket Assistant",
  };
}

export default async function GuidelineDetailPage({
  params,
  searchParams,
}: FaqPageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile || !canProcessTickets(profile)) notFound();

  const { id } = await params;
  const guideline = getGuidelineById(id);
  if (!guideline) notFound();

  // If we arrived from a ticket, send "back" to that ticket; otherwise to /faq.
  const from = safeTicketFrom((await searchParams).from);
  const backHref = from ?? "/faq";
  const backLabel = from ? "Back to ticket" : "Back to guidelines";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <span aria-hidden="true">←</span> {backLabel}
      </Link>

      <header className="mt-6">
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80">
          {CATEGORY_LABELS[guideline.category]}
        </span>
        <h1 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
          {guideline.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {guideline.summary}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-6">
        {guideline.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-sm font-medium text-foreground">
              {section.heading}
            </h2>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-foreground/90">
              {section.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
