"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { TicketCategory, TicketPriority } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
} from "@/lib/ticket-utils";
import { createTicketAction } from "@/app/actions";

// Shape of the form (category starts empty to force an explicit choice).
type FormState = {
  requesterName: string;
  requesterEmail: string;
  title: string;
  category: TicketCategory | "";
  priority: TicketPriority;
  description: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  requesterName: "",
  requesterEmail: "",
  title: "",
  category: "",
  priority: "medium",
  description: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.requesterName.trim()) errors.requesterName = "Requester name is required.";
  if (!form.requesterEmail.trim()) {
    errors.requesterEmail = "Email is required.";
  } else if (!EMAIL_RE.test(form.requesterEmail.trim())) {
    errors.requesterEmail = "Enter a valid email address.";
  }
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.category) errors.category = "Pick a category.";
  if (!form.description.trim()) errors.description = "Description is required.";
  return errors;
}

export default function NewTicketPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    // Persist to the database, then the action redirects to the new ticket.
    startTransition(() =>
      createTicketAction({
        requesterName: form.requesterName.trim(),
        requesterEmail: form.requesterEmail.trim(),
        title: form.title.trim(),
        category: form.category as TicketCategory,
        priority: form.priority,
        description: form.description.trim(),
      }),
    );
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
      >
        <span aria-hidden="true">←</span> Back to tickets
      </Link>

      <header className="mt-6">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          New ticket
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Log an IT support request. Fields marked * are required.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field label="Requester name" htmlFor="requesterName" error={errors.requesterName} required>
          <input
            id="requesterName"
            type="text"
            value={form.requesterName}
            onChange={(e) => update("requesterName", e.target.value)}
            aria-invalid={Boolean(errors.requesterName)}
            aria-describedby={errors.requesterName ? "requesterName-error" : undefined}
            className={inputClass(Boolean(errors.requesterName))}
            placeholder="e.g. Alice Chen"
          />
        </Field>

        <Field label="Email" htmlFor="requesterEmail" error={errors.requesterEmail} required>
          <input
            id="requesterEmail"
            type="email"
            value={form.requesterEmail}
            onChange={(e) => update("requesterEmail", e.target.value)}
            aria-invalid={Boolean(errors.requesterEmail)}
            aria-describedby={errors.requesterEmail ? "requesterEmail-error" : undefined}
            className={inputClass(Boolean(errors.requesterEmail))}
            placeholder="e.g. alice.chen@example.com"
          />
        </Field>

        <Field label="Title" htmlFor="title" error={errors.title} required>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass(Boolean(errors.title))}
            placeholder="Short summary of the issue"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category} required>
            <select
              id="category"
              value={form.category}
              onChange={(e) => update("category", e.target.value as TicketCategory)}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "category-error" : undefined}
              className={selectClass(Boolean(errors.category))}
            >
              <option value="" disabled>
                Select a category…
              </option>
              {CATEGORY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority" htmlFor="priority" required>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as TicketPriority)}
              className={selectClass(false)}
            >
              {PRIORITY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" htmlFor="description" error={errors.description} required>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            className={`${inputClass(Boolean(errors.description))} resize-y`}
            placeholder="Describe the problem, what you tried, and any error messages."
          />
        </Field>

        <div className="flex justify-end gap-3">
          <Link
            href="/"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="ticket-card rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </form>
    </main>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-faint shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:outline-none focus-visible:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus-visible:ring-red-400/20"
      : "border-border focus:border-ink/40 focus-visible:ring-ink/15"
  }`;
}

function selectClass(hasError: boolean) {
  return `w-full rounded-xl border bg-surface py-2.5 pl-3 pr-8 text-sm text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus:outline-none focus-visible:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus-visible:ring-red-400/20"
      : "border-border focus:border-ink/40 focus-visible:ring-ink/15"
  }`;
}

function Field({
  label,
  htmlFor,
  error,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
