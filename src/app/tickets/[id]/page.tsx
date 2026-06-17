import type { Metadata } from "next";
import Link from "next/link";
import { mockTickets } from "@/lib/mock-tickets";
import { getTicketById } from "@/lib/ticket-utils";
import { TicketDetail } from "@/components/ticket-detail";

// Next.js 16：App Router 的 params 是 Promise，必须 await。
type TicketPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TicketPageProps): Promise<Metadata> {
  const { id } = await params;
  const ticket = getTicketById(mockTickets, id);
  return {
    title: ticket
      ? `${ticket.title} · ${ticket.id}`
      : "未找到工单 · Ticket Assistant",
  };
}

export default async function TicketDetailPage({ params }: TicketPageProps) {
  const { id } = await params;
  const ticket = getTicketById(mockTickets, id);

  if (!ticket) {
    return <TicketNotFound id={id} />;
  }

  return <TicketDetail ticket={ticket} />;
}

// 无效 id 的友好提示，而不是直接落到默认 404。
function TicketNotFound({ id }: { id: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <span aria-hidden="true">←</span> 返回工单列表
      </Link>

      <div className="mt-10 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
        <p className="font-serif text-xl text-foreground">未找到这张工单</p>
        <p className="mt-2 text-sm text-muted">
          工单号{" "}
          <span className="font-mono text-foreground/80">{id}</span>{" "}
          不存在，可能已被删除或链接有误。
        </p>
        <Link
          href="/"
          className="ticket-card mt-6 inline-block rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-ink/20 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          回到 Dashboard
        </Link>
      </div>
    </main>
  );
}
