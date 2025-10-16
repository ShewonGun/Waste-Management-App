import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { getAllWaste, WasteData, cancelWasteData, deleteWasteData, adminUpdateWasteStatus } from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function AdminWasteSchedulesScreen() {
  const router = useRouter();
  const [wasteSchedules, setWasteSchedules] = useState<WasteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (!adminStatus) {
            // Not an admin, redirect to user section
            router.replace('(tabs)/index' as any);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.replace('(tabs)/index' as any);
        }
      } else {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const loadWasteSchedules = async () => {
    try {
      const waste = await getAllWaste();
      // Sort by createdAt in descending order
      waste.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });
      setWasteSchedules(waste);
    } catch (error) {
      console.error('Error loading waste schedules:', error);
      Alert.alert('Error', 'Failed to load waste schedules. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWasteSchedules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWasteSchedules();
  };

  const handleCancelWaste = async (wasteId: string) => {
    Alert.alert(
      'Cancel Waste Pickup',
      'Are you sure you want to cancel this waste pickup?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await adminUpdateWasteStatus(wasteId, 'cancelled');
              Alert.alert('Success', 'Waste pickup cancelled successfully');
              loadWasteSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling waste pickup:', error);
              Alert.alert('Error', 'Failed to cancel waste pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmWaste = async (wasteId: string) => {
    Alert.alert(
      'Confirm Waste Pickup',
      'Are you sure you want to mark this waste pickup as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await adminUpdateWasteStatus(wasteId, 'completed');
              Alert.alert('Success', 'Waste pickup confirmed successfully');
              loadWasteSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error confirming waste pickup:', error);
              Alert.alert('Error', 'Failed to confirm waste pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteWaste = async (wasteId: string) => {
    Alert.alert(
      'Delete Waste Pickup',
      'Are you sure you want to permanently delete this waste pickup? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWasteData(wasteId);
              Alert.alert('Success', 'Waste pickup deleted successfully');
              loadWasteSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error deleting waste pickup:', error);
              Alert.alert('Error', 'Failed to delete waste pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderScheduleItem = ({ item }: { item: WasteData }) => (
    <View style={{
      backgroundColor: 'white',
      margin: 10,
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.tint }}>
          Waste #{item.wasteId}
        </Text>
        <View style={{
          backgroundColor: item.status === 'scheduled' ? '#4CAF50' : item.status === 'completed' ? '#2196F3' : '#F44336',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>
        <MaterialIcons name="delete" size={16} color="#666" /> {item.wasteType}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="location-on" size={14} color="#666" /> {item.quantity}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="access-time" size={14} color="#666" /> {item.pickupDate} at {item.timeSlot}
      </Text>

      {item.specialInstructions && (
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
          <MaterialIcons name="notes" size={14} color="#666" /> {item.specialInstructions}
        </Text>
      )}

      {item.status === 'scheduled' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              padding: 8,
              borderRadius: 5,
              flex: 1,
              marginRight: 5,
            }}
            onPress={() => handleConfirmWaste(item.wasteId)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF9800',
              padding: 8,
              borderRadius: 5,
              flex: 1,
              marginRight: 5,
            }}
            onPress={() => handleCancelWaste(item.wasteId)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#F44336',
              padding: 8,
              borderRadius: 5,
              flex: 1,
              marginLeft: 5,
            }}
            onPress={() => handleDeleteWaste(item.wasteId)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#FF5722', '#E64A19']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>Loading Waste Schedules...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FF5722', '#E64A19']} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 50 }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          All Waste Schedules
        </Text>

        <FlatList
          data={wasteSchedules}
          keyExtractor={(item) => item.wasteId}
          renderItem={renderScheduleItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <MaterialIcons name="delete" size={64} color="white" />
              <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
                No waste schedules found
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}