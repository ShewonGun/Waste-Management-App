import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../utils/firebase';

export default function IndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)'); // User is logged in, go to main app
      } else {
        router.replace('/login'); // Not logged in, go to login
      }
    });
    return unsubscribe;
  }, [router]);

  return null;
}
