"use server";

import { signOut } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
