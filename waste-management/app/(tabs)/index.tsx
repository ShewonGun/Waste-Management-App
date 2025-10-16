import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

const MATERIALS = [
  { key: 'metals', label: 'Metals', icon: 'hardware', pricePerKg: 20 },
  { key: 'paper', label: 'Paper', icon: 'description', pricePerKg: 15 },
  { key: 'glass', label: 'Glass', icon: 'wine-bar', pricePerKg: 10 },
  { key: 'cardboard', label: 'Cardboard', icon: 'inventory', pricePerKg: 12 },
  { key: 'plastic', label: 'Plastic', icon: 'water-drop', pricePerKg: 18 },
  { key: 'electronic', label: 'Electronic', icon: 'memory', pricePerKg: 25 },
];

export default function RecycleHome() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthChecked(true);
      if (!user) {
        console.log('User not authenticated, redirecting to login...');
        // Add a longer delay to ensure navigation is ready
        setTimeout(() => {
          router.replace('/login' as any);
        }, 500);
      } else {
        // Check if user is admin and redirect to admin section
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (adminStatus) {
            console.log('Admin user detected, redirecting to admin section...');
            setTimeout(() => {
              router.replace('(admin)/admin-recycle-schedules' as any);
            }, 500);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const toggleMaterial = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      router.push({
        pathname: '/recycle-form',
        params: { materials: selected.join(',') },
      } as any);
    }
  };

  const handleViewSchedules = () => {
    router.push('/view-schedules' as any);
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.light.text, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.appTitle}>Recycle</Text>
            <Text style={styles.appSubtitle}>Make Waste Useful</Text>
          </View>
          <TouchableOpacity
            style={styles.schedulesButton}
            onPress={handleViewSchedules}
          >
            <MaterialIcons name="schedule" size={24} color="#fff" />
            <Text style={styles.schedulesButtonText}>My Schedules</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Advice Box */}
      <View style={styles.adviceBox}>
        <Text style={styles.adviceTitle}>Tip:</Text>
        <Text style={styles.adviceContent}>
          Select the materials you want to recycle and continue to fill the form.
        </Text>
      </View>

      {/* Materials grid */}
      <FlatList
        data={MATERIALS}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.key);
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggleMaterial(item.key)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={40}
                color={isSelected ? Colors.light.button : Colors.light.text}
              />
              <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Footer buttons */}
      <View style={styles.footerButtonsRow}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setSelected([])}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={selected.length === 0}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // 👈 White background
    paddingTop: 0,
  },
  adviceBox: {
    backgroundColor: '#e0f7ef',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    marginTop: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d',
    marginBottom: 6,
  },
  adviceContent: {
    fontSize: 15,
    color: '#166534',
    lineHeight: 21,
  },
  gradientHeader: {
    width: '100%',
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    minHeight: 180,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  schedulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  schedulesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  appTitle: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 1.1,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  appSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.7,
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginBottom: 12,
    width: '45%',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: Colors.light.button,
    backgroundColor: Colors.light.inputBackground,
  },
  cardLabel: {
    marginTop: 12,
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
  },
  footerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f7ef',
    borderRadius: 24,
    paddingVertical: 18,
    marginRight: 6,
    minHeight: 56,
  },
  resetText: {
    color: Colors.light.button,
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.button,
    borderRadius: 24,
    paddingVertical: 18,
    marginLeft: 6,
    minHeight: 56,
  },
  continueText: {
    color: Colors.light.buttonText,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

