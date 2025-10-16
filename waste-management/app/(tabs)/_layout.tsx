import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        tabBarScrollEnabled: true, // Enable scrolling for many tabs
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recycle',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="recycling" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="waste"
        options={{
          title: 'Waste',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="delete" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fertilizers"
        options={{
          title: 'Fertilizers',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="grass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-fertilizer-orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="shopping-cart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="feedback" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialIcons size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
