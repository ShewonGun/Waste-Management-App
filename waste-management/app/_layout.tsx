import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { isUserAdmin } from '../utils/database';

export const unstable_settings = {
  // Remove anchor to allow dynamic routing based on user role
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const adminStatus = await isUserAdmin(currentUser.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading || isAdmin === null) return;

    // Define stack pages that should be accessible from both roles
    const stackPages = [
      'login', 'signup', 'recycle-form', 'payment', 'confirm', 'reschedule',
      'view-schedules', 'waste-schedules', 'waste-reschedule', 'waste-submission-success', 'modal', 'cart'
    ];

    // If current segment is a stack page, don't redirect
    if (stackPages.includes(segments[0])) return;

    if (user) {
      if (isAdmin) {
        // Admin user - redirect to admin section
        if (segments[0] !== '(admin)') {
          router.replace('(admin)/admin-recycle-schedules' as any);
        }
      } else {
        // Regular user - redirect to user section
        if (segments[0] !== '(tabs)') {
          router.replace('(tabs)/index' as any);
        }
      }
    } else {
      // No user - redirect to login
      if (segments[0] !== 'login' && segments[0] !== 'signup') {
        router.replace('/login');
      }
    }
  }, [user, isAdmin, loading, segments, router]);

  if (loading) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="recycle-form" options={{ headerShown: false }} />
        <Stack.Screen name="payment" options={{ headerShown: false }} />
        <Stack.Screen name="confirm" options={{ headerShown: false, title: 'Pickup Confirmation' }} />
        <Stack.Screen name="reschedule" options={{ headerShown: false, title: 'Reschedule Pickup' }} />
        <Stack.Screen name="view-schedules" options={{ headerShown: false, title: 'My Schedules' }} />
        <Stack.Screen name="waste-schedules" options={{ headerShown: false, title: 'Waste Schedules' }} />
        <Stack.Screen name="waste-reschedule" options={{ headerShown: false, title: 'Reschedule Waste Pickup' }} />
        <Stack.Screen name="waste-submission-success" options={{ headerShown: false, title: 'Submission Success' }} />
        <Stack.Screen name="cart" options={{ headerShown: false, title: 'My Cart' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
