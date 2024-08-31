// app/group/[id]/page.tsx
import { createClient } from '@/utils/supabase/server'; // Adjust the import path if needed
import { GroupChat } from '@/components/GroupChat';
import { redirect } from 'next/navigation';

interface Props {
  params: {
    id: string;
  };
}

export default async function GroupPage({ params }: Props) {
  const { id } = params;
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // Redirect to login page if not authenticated
    redirect('/login');
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Group Chat for {id}</h1>
      <GroupChat groupId={id} userId={data.user.id} />
    </div>
  );
}
