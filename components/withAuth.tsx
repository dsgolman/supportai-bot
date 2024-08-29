import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/router';
import { createClient } from "@/utils/supabase/client"

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace('/login'); // Redirect to login page if not authenticated
        }
      };

      checkUser();
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  // Assign a display name for better debugging
  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
