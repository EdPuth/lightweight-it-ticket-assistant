"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SESSION_TOKEN,
  verifyCredentials,
} from "@/lib/auth";

export type LoginState = { error?: string };

// Verify the single allowed account, set an httpOnly session cookie, then go to
// the dashboard. On failure, return an error for the form to display.
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyCredentials(email, password)) {
    return { error: "Incorrect email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}

// Clear the session and return to the login page.
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
