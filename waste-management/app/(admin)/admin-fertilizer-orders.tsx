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
import { getAllFertilizerPurchases, updateFertilizerPurchaseStatus, FertilizerPurchaseData } from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function AdminFertilizerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<FertilizerPurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (!adminStatus) {
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

  const loadOrders = async () => {
    try {
      const orderList = await getAllFertilizerPurchases();
      // Sort by createdAt in descending order
      orderList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });
      setOrders(orderList);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: FertilizerPurchaseData['status']) => {
    try {
      await updateFertilizerPurchaseStatus(orderId, newStatus);
      Alert.alert('Success', `Order status updated to ${newStatus}`);
      loadOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#2196F3';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const renderOrderItem = ({ item }: { item: FertilizerPurchaseData }) => (
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
          Order #{item.purchaseId.slice(-8)}
        </Text>
        <View style={{
          backgroundColor: getStatusColor(item.status),
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
        <MaterialIcons name="grass" size={16} color="#666" /> {item.fertilizerName}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        Quantity: {item.quantity} | Total: LKR {item.totalAmount.toFixed(2)}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="location-on" size={14} color="#666" /> {item.deliveryAddress}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
        <MaterialIcons name="date-range" size={14} color="#666" /> {item.purchaseDate}
      </Text>

      {item.status === 'pending' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              padding: 10,
              borderRadius: 5,
              flex: 1,
              marginRight: 5,
            }}
            onPress={() => handleStatusUpdate(item.purchaseId, 'confirmed')}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#F44336',
              padding: 10,
              borderRadius: 5,
              flex: 1,
              marginLeft: 5,
            }}
            onPress={() => handleStatusUpdate(item.purchaseId, 'cancelled')}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'confirmed' && (
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={() => handleStatusUpdate(item.purchaseId, 'delivered')}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Mark Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>Loading Orders...</Text>
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
          Fertilizer Orders
        </Text>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.purchaseId}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <MaterialIcons name="shopping-cart" size={64} color="white" />
              <Text style={{ color: 'white', fontSize: 18, marginTop: 10 }}>
                No orders found
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}