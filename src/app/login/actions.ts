"use server";

import { redirect } from "next/navigation";
import { getSupabaseAuth } from "@/lib/supabase/auth-server";

// `email` is echoed back so the form can keep it filled after a failed attempt
// (React resets uncontrolled fields after a form action; the email input reads
// this via defaultValue, while the password field intentionally clears).
export type LoginState = { error?: string; email?: string };

// Sign in with Supabase Auth. On success the auth client writes the session
// cookies; redirect to the dashboard. On failure, return an error for the form.
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Incorrect email or password.", email };
  }

  redirect("/");
}

// Clear the Supabase session and return to the login page.
export async function logoutAction() {
  const supabase = await getSupabaseAuth();
  await supabase.auth.signOut();
  redirect("/login");
}
