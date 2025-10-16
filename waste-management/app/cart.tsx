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
  TextInput,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { 
  getUserCartItems, 
  CartItem, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart,
  purchaseCartItems 
} from '../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const loadCartItems = async () => {
    try {
      const items = await getUserCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCartItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCartItems();
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }

    try {
      await updateCartItemQuantity(cartItemId, newQuantity);
      loadCartItems(); // Refresh the list
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(cartItemId);
              loadCartItems(); // Refresh the list
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
              loadCartItems(); // Refresh the list
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('Error', 'Failed to clear cart. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openCheckoutModal = () => {
    setCustomerInfo({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
    });
    setCheckoutModalVisible(true);
  };

  const handleCheckout = async () => {
    if (!customerInfo.customerName || !customerInfo.customerPhone || !customerInfo.deliveryAddress) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const purchaseIds = await purchaseCartItems(customerInfo);
      Alert.alert(
        'Success',
        `Order placed successfully! ${purchaseIds.length} item(s) ordered. You will be notified once confirmed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCheckoutModalVisible(false);
              loadCartItems(); // Refresh the list (cart should be empty now)
              router.push('/my-fertilizer-orders');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error during checkout:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.totalAmount, 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={{
      backgroundColor: Colors.light.inputBackground,
      marginBottom: 15,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: Colors.light.inputBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 5 }}>
            {item.fertilizerName}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.light.icon }}>
            ${item.fertilzerPrice} per {item.fertilizerUnit}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleRemoveItem(item.cartItemId)}
          style={{ padding: 5 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
            style={{
              backgroundColor: Colors.light.inputBorder,
              borderRadius: 8,
              padding: 8,
              minWidth: 35,
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="remove" size={16} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.text, minWidth: 30, textAlign: 'center' }}>
            {item.quantity}
          </Text>
          
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
            style={{
              backgroundColor: Colors.light.button,
              borderRadius: 8,
              padding: 8,
              minWidth: 35,
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={16} color={Colors.light.buttonText} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>
          ${item.totalAmount.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          style={{
            width: '100%',
            paddingTop: 20,
            paddingBottom: 30,
            alignItems: 'center',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 24,
          }}
        >
          <View style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}>
              My Cart
            </Text>
            
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={Colors.light.button} />
          <Text style={{ color: Colors.light.text, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
            Loading Cart...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        style={{
          width: '100%',
          paddingTop: 20,
          paddingBottom: 30,
          alignItems: 'center',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          marginBottom: 24,
        }}
      >
        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 'bold',
            letterSpacing: 0.5,
          }}>
            My Cart ({cartItems.length})
          </Text>
          
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={handleClearCart} activeOpacity={0.7}>
              <MaterialIcons name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {cartItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <MaterialIcons name="shopping-cart" size={80} color={Colors.light.icon} />
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: Colors.light.text, 
            marginTop: 20,
            textAlign: 'center' 
          }}>
            Your cart is empty
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: Colors.light.icon, 
            marginTop: 10,
            textAlign: 'center' 
          }}>
            Add some fertilizers to get started!
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.light.button,
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 25,
              marginTop: 30,
            }}
            onPress={() => router.push('/(tabs)/fertilizers')}
            activeOpacity={0.8}
          >
            <Text style={{
              color: Colors.light.buttonText,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Browse Fertilizers
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.cartItemId}
            renderItem={renderCartItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          />

          {/* Bottom Total and Checkout Section */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.light.inputBackground,
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: Colors.light.inputBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.text }}>
                Total: ${getTotalAmount().toFixed(2)}
              </Text>
              <Text style={{ fontSize: 14, color: Colors.light.icon }}>
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: Colors.light.button,
                padding: 18,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={openCheckoutModal}
              activeOpacity={0.8}
            >
              <Text style={{
                color: Colors.light.buttonText,
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={checkoutModalVisible}
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ 
            backgroundColor: Colors.light.inputBackground, 
            margin: 20, 
            borderRadius: 16, 
            padding: 24, 
            width: '90%', 
            maxHeight: '80%' 
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              marginBottom: 20, 
              textAlign: 'center', 
              color: Colors.light.text 
            }}>
              Checkout Information
            </Text>

            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8,
            }}>
              Customer Name *
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
                marginBottom: 15,
              }}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.light.icon}
              value={customerInfo.customerName}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, customerName: text })}
            />

            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8,
            }}>
              Phone Number *
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
                marginBottom: 15,
              }}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.light.icon}
              value={customerInfo.customerPhone}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, customerPhone: text })}
              keyboardType="phone-pad"
            />

            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8,
            }}>
              Email (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
                marginBottom: 15,
              }}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.light.icon}
              value={customerInfo.customerEmail}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, customerEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8,
            }}>
              Delivery Address *
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.light.inputBackground,
                borderRadius: 12,
                padding: 15,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.inputBorder,
                marginBottom: 20,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Enter delivery address"
              placeholderTextColor={Colors.light.icon}
              value={customerInfo.deliveryAddress}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, deliveryAddress: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.light.text,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Total: ${getTotalAmount().toFixed(2)}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.light.icon,
                  padding: 15,
                  borderRadius: 12,
                  flex: 1,
                }}
                onPress={() => setCheckoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={{ 
                  color: Colors.light.inputBackground, 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  fontSize: 16 
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.light.button,
                  padding: 15,
                  borderRadius: 12,
                  flex: 1,
                }}
                onPress={handleCheckout}
                activeOpacity={0.8}
              >
                <Text style={{ 
                  color: Colors.light.buttonText, 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  fontSize: 16 
                }}>
                  Place Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}