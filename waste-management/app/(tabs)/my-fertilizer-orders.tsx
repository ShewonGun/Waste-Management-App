import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
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

  // ====== Update Order Status ======
  const handleMarkDelivered = (order: FertilizerPurchaseData) => {
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

  // ====== Edit Order Details ======
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderData, setEditingOrderData] = useState({
    quantity: 0,
    deliveryAddress: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const handleEditOrder = (order: FertilizerPurchaseData) => {
    setEditingOrderId(order.purchaseId);
    setEditingOrderData({
      quantity: order.quantity,
      deliveryAddress: order.deliveryAddress,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
    });
  };

  const handleSaveEdit = async (purchaseId: string) => {
    try {
      await updateFertilizerPurchase(purchaseId, editingOrderData);
      setEditingOrderId(null);
      Alert.alert('Success', 'Order updated successfully.');
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order.');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditingOrderData({
      quantity: 0,
      deliveryAddress: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    });
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

      {editingOrderId === item.purchaseId ? (
        /* Editing Mode */
        <View style={{ marginBottom: 15 }}>
          {/* Quantity Input */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Quantity:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                backgroundColor: '#f9f9f9',
              }}
              value={editingOrderData.quantity.toString()}
              onChangeText={(text) => setEditingOrderData(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />
          </View>

          {/* Delivery Address Input */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Delivery Address:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                backgroundColor: '#f9f9f9',
                minHeight: 60,
              }}
              value={editingOrderData.deliveryAddress}
              onChangeText={(text) => setEditingOrderData(prev => ({ ...prev, deliveryAddress: text }))}
              placeholder="Enter delivery address"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Customer Name Input */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Customer Name:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                backgroundColor: '#f9f9f9',
              }}
              value={editingOrderData.customerName}
              onChangeText={(text) => setEditingOrderData(prev => ({ ...prev, customerName: text }))}
              placeholder="Enter customer name"
            />
          </View>

          {/* Customer Phone Input */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Customer Phone:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                backgroundColor: '#f9f9f9',
              }}
              value={editingOrderData.customerPhone}
              onChangeText={(text) => setEditingOrderData(prev => ({ ...prev, customerPhone: text }))}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          {/* Customer Email Input */}
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Customer Email:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                backgroundColor: '#f9f9f9',
              }}
              value={editingOrderData.customerEmail}
              onChangeText={(text) => setEditingOrderData(prev => ({ ...prev, customerEmail: text }))}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          {/* Edit Action Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <TouchableOpacity 
              onPress={handleCancelEdit}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ddd',
              }}
            >
              <MaterialIcons name="close" size={16} color="#666" style={{ marginRight: 4 }} />
              <Text style={{ color: '#666', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSaveEdit(item.purchaseId)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#4CAF50',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <MaterialIcons name="check" size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Display Mode */
        <View>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
            Quantity: {item.quantity} | Total: LKR {item.totalAmount.toFixed(2)}
          </Text>

          <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
            <MaterialIcons name="location-on" size={14} color="#666" /> {item.deliveryAddress}
          </Text>

          <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
            <MaterialIcons name="person" size={14} color="#666" /> {item.customerName}
          </Text>

          <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
            <MaterialIcons name="phone" size={14} color="#666" /> {item.customerPhone}
          </Text>

          {item.customerEmail && (
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              <MaterialIcons name="email" size={14} color="#666" /> {item.customerEmail}
            </Text>
          )}
        </View>
      )}

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
        <MaterialIcons name="date-range" size={14} color="#666" /> {item.purchaseDate}
      </Text>

      {/* Action Buttons - Only show for pending status */}
      {item.status === 'pending' && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
          <TouchableOpacity 
            onPress={() => handleEditOrder(item)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e3f2fd',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#bbdefb',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 1,
              },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <MaterialIcons name="edit" size={16} color="#1976d2" style={{ marginRight: 4 }} />
            <Text style={{ 
              color: '#1976d2', 
              fontSize: 14, 
              fontWeight: '500',
            }}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleDeleteOrder(item)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffebee',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#ffcdd2',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 1,
              },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <MaterialIcons name="delete-outline" size={16} color="#d32f2f" style={{ marginRight: 4 }} />
            <Text style={{ 
              color: '#d32f2f', 
              fontSize: 14, 
              fontWeight: '500',
            }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
