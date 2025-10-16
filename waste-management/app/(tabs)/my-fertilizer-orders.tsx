import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import {
  getUserFertilizerPurchases,
  FertilizerPurchaseData,
  updateFertilizerPurchase,
  deleteFertilizerPurchase,
} from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function MyFertilizerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<FertilizerPurchaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isUserAdmin(user.uid);
          if (adminStatus) {
            router.replace('(admin)/admin-recycle-schedules' as any);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const loadOrders = async () => {
    try {
      const orderList = await getUserFertilizerPurchases();
      orderList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as string);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as string);
        return dateB.getTime() - dateA.getTime();
      });
      setOrders(orderList);
    } catch (error) {
      console.error('Error loading orders:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  // ====== Update Order ======
  const handleEditOrder = (order: FertilizerPurchaseData) => {
    Alert.alert(
      'Update Order',
      'Do you want to mark this order as Delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await updateFertilizerPurchase(order.purchaseId, { status: 'delivered' });
              Alert.alert('Success', 'Order status updated.');
              loadOrders();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Could not update order.');
            }
          },
        },
      ]
    );
  };

  // ====== Delete Order ======
  const handleDeleteOrder = (order: FertilizerPurchaseData) => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFertilizerPurchase(order.purchaseId);
              Alert.alert('Deleted', 'Order removed.');
              loadOrders();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Could not delete order.');
            }
          },
        },
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: FertilizerPurchaseData }) => (
    <View
      style={{
        backgroundColor: 'white',
        margin: 10,
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.tint }}>
          Order #{item.purchaseId.slice(-8)}
        </Text>
        <View
          style={{
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>
        <MaterialIcons name="grass" size={16} color="#666" /> {item.fertilizerName}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        Quantity: {item.quantity} | Total: ${item.totalAmount.toFixed(2)}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
        <MaterialIcons name="location-on" size={14} color="#666" /> {item.deliveryAddress}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
        <MaterialIcons name="date-range" size={14} color="#666" /> {item.purchaseDate}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
        
        <TouchableOpacity onPress={() => handleDeleteOrder(item)}>
          <Text style={{ color: '#F44336' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>
          Loading Your Orders...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4CAF50', '#45a049']} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 50 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          My Fertilizer Orders
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
                No orders yet
              </Text>
              <Text
                style={{
                  color: 'white',
                  fontSize: 14,
                  marginTop: 5,
                  opacity: 0.8,
                }}
              >
                Browse our natural fertilizers to place your first order
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}
