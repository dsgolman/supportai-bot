import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';
import AccountForm from "./account-form";

export default async function Account() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to the login page if the user is not authenticated
  if (!user) {
    redirect('/login'); // Server-side redirect
  }

  return <AccountForm user={user} />;
}
