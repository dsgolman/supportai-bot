"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: session } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  const user = session.user;

  // Check if user has completed onboarding
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', user?.id)
    .single();

  if (profileError || !profile.is_onboarded) {
    redirect('/onboarding');
  }

  revalidatePath("/", "layout");
  redirect("/support");
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: session } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  const user = session.user;

  // Check if user has completed onboarding
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', user?.id)
    .single();

  if (profileError || !profile.is_onboarded) {
    redirect('/support');
  }

  // Redirect to the "Check Your Email" page
  redirect('/support');
}