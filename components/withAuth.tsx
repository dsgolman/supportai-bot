import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    useEffect(() => {
      const checkUser = async () => {
        const user = supabase.auth.user();
        if (!user) {
          router.replace('/login'); // Redirect to login page if not authenticated
        }
      };

      checkUser();
    }, [router]);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
