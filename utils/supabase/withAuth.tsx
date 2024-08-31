// withAuth.tsx
import React, { useEffect, useState, ComponentType } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P & { user: any }>) => {
  const WithAuthComponent = (props: Omit<P, 'user'>) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null); // Replace `any` with your user data type
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setAuthenticated(true);
        } else {
          router.replace('/login'); // Redirect to login page if not authenticated
        }
        setLoading(false);
      };

      checkUser();
    }, [router, supabase]);

    if (loading) {
      return <div>Loading...</div>; // Show loading state until authentication check is complete
    }

    if (!authenticated) {
      return null; // Render nothing or a different component if not authenticated
    }

    return <WrappedComponent {...(props as P)} user={user} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
