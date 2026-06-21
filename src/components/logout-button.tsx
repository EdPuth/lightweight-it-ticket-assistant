"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
