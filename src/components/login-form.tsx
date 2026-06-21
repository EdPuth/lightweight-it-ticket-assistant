"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <div className="grid gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium tracking-wide text-muted"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="itsupport@outlook.com"
          aria-invalid={state.error ? true : undefined}
          className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-medium tracking-wide text-muted"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••"
          aria-invalid={state.error ? true : undefined}
          className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:border-ink/40 focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
          />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="ticket-card mt-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
