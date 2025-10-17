import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { getAllPickups, PickupData, cancelPickupData, deletePickupData, adminUpdatePickupStatus } from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function AdminRecycleSchedulesScreen() {
  const router = useRouter();
  const [recycleSchedules, setRecycleSchedules] = useState<PickupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

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

  const loadRecycleSchedules = async () => {
    try {
      const pickups = await getAllPickups();
      
      // Sort by createdAt in descending order
      pickups.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });
      setRecycleSchedules(pickups);
    } catch (error) {
      console.error('Error loading recycle schedules:', error);
      Alert.alert('Error', 'Failed to load recycle schedules. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecycleSchedules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecycleSchedules();
  };

  const handleViewReceipt = (receiptUrl: string) => {
    setSelectedReceiptUrl(receiptUrl);
    setShowReceiptModal(true);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Format time to readable format
  const formatTime = (timeString: string) => {
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };

  const handleCancelPickup = async (pickupId: string) => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await adminUpdatePickupStatus(pickupId, 'cancelled');
              Alert.alert('Success', 'Pickup cancelled successfully');
              loadRecycleSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling pickup:', error);
              Alert.alert('Error', 'Failed to cancel pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmPickup = async (pickupId: string) => {
    Alert.alert(
      'Confirm Pickup',
      'Are you sure you want to mark this pickup as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await adminUpdatePickupStatus(pickupId, 'completed');
              Alert.alert('Success', 'Pickup confirmed successfully');
              loadRecycleSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error confirming pickup:', error);
              Alert.alert('Error', 'Failed to confirm pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeletePickup = async (pickupId: string) => {
    Alert.alert(
      'Delete Pickup',
      'Are you sure you want to permanently delete this pickup? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePickupData(pickupId);
              Alert.alert('Success', 'Pickup deleted successfully');
              loadRecycleSchedules(); // Refresh the list
            } catch (error) {
              console.error('Error deleting pickup:', error);
              Alert.alert('Error', 'Failed to delete pickup. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderScheduleItem = ({ item }: { item: PickupData }) => (
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
          Pickup #{item.pickupId}
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
        <MaterialIcons name="person" size={16} color="#666" /> {item.materials.join(', ')}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="location-on" size={14} color="#666" /> {item.pickupAddress}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="access-time" size={14} color="#666" /> {formatDate(item.pickupDate)} at {formatTime(item.pickupTime)}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="attach-money" size={14} color="#666" /> LKR {item.totalAmount}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 14, color: '#666', flex: 1 }}>
          <MaterialIcons name="payment" size={14} color="#666" /> Payment: {item.paymentMethod === 'cash' ? 'Cash' : item.paymentMethod === 'bank' ? 'Bank Transfer' : 'Paycheck'}
        </Text>
        {(item.paymentMethod === 'bank' || item.paymentMethod === 'paycheck') && (
          item.paymentReceiptUrl ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => handleViewReceipt(item.paymentReceiptUrl!)}
            >
              <MaterialIcons name="receipt" size={12} color="white" />
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>
                View Receipt
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                backgroundColor: '#FF9800',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="warning" size={12} color="white" />
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>
                No Receipt
              </Text>
            </View>
          )
        )}
      </View>

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
            onPress={() => handleConfirmPickup(item.pickupId)}
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
            onPress={() => handleCancelPickup(item.pickupId)}
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
            onPress={() => handleDeletePickup(item.pickupId)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>Loading Recycle Schedules...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 50 }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          All Recycle Schedules
        </Text>

        <FlatList
          data={recycleSchedules}
          keyExtractor={(item) => item.pickupId}
          renderItem={renderScheduleItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <MaterialIcons name="recycling" size={64} color="white" />
              <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
                No recycle schedules found
              </Text>
            </View>
          }
        />
      </View>

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: Dimensions.get('window').width * 0.9,
            height: Dimensions.get('window').height * 0.8,
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.text }}>
                Payment Receipt
              </Text>
              <TouchableOpacity
                onPress={() => setShowReceiptModal(false)}
                style={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedReceiptUrl && (
              <Image
                source={{ uri: selectedReceiptUrl }}
                style={{
                  flex: 1,
                  width: '100%',
                  borderRadius: 8,
                }}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}