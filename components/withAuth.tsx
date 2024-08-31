// withAuth.tsx
import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/router';
import { createClient } from "@/utils/supabase/client";

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = React.useState<any>(null); // Adjust the type according to your user data structure

    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace('/login'); // Redirect to login page if not authenticated
        } else {
          setUser(session.user);
        }
      };

      checkUser();

      // Subscribe to authentication state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          router.replace('/login');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [router, supabase]);

    return user ? <WrappedComponent {...props} user={user} /> : null;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
