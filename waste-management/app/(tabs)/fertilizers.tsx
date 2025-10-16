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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { getAllFertilizers, purchaseFertilizer, FertilizerData, addToCart, getUserCartItems } from '../../utils/database';
import { useRouter } from 'expo-router';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isUserAdmin } from '../../utils/database';

export default function FertilizerShopScreen() {
  const router = useRouter();
  const [fertilizers, setFertilizers] = useState<FertilizerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFertilizer, setSelectedFertilizer] = useState<FertilizerData | null>(null);
  const [purchaseData, setPurchaseData] = useState({
    quantity: '1',
    deliveryAddress: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [cartCount, setCartCount] = useState(0);

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

  const loadFertilizers = async () => {
    try {
      const fertilizerList = await getAllFertilizers();
      // Only show available fertilizers
      const availableFertilizers = fertilizerList.filter(f => f.available);
      setFertilizers(availableFertilizers);
    } catch (error) {
      console.error('Error loading fertilizers:', error);
      Alert.alert('Error', 'Failed to load fertilizers. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFertilizers();
    loadCartCount();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFertilizers();
  };

  const openPurchaseModal = (fertilizer: FertilizerData) => {
    setSelectedFertilizer(fertilizer);
    setPurchaseData({
      quantity: '1',
      deliveryAddress: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    });
    setModalVisible(true);
  };

  const handlePurchase = async () => {
    if (!selectedFertilizer || !purchaseData.quantity || !purchaseData.deliveryAddress || 
        !purchaseData.customerName || !purchaseData.customerPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(purchaseData.quantity);
    if (quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      const totalAmount = selectedFertilizer.price * quantity;
      const purchaseDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      await purchaseFertilizer({
        fertilizerId: selectedFertilizer.fertilizerId,
        fertilizerName: selectedFertilizer.name,
        quantity,
        totalAmount,
        purchaseDate,
        status: 'pending',
        deliveryAddress: purchaseData.deliveryAddress,
        customerName: purchaseData.customerName,
        customerPhone: purchaseData.customerPhone,
        customerEmail: purchaseData.customerEmail,
      });

      Alert.alert('Success', 'Purchase request submitted successfully! You will be notified once confirmed.');
      setModalVisible(false);
      setSelectedFertilizer(null);
      loadCartCount(); // Refresh cart count after purchase
    } catch (error) {
      console.error('Error purchasing fertilizer:', error);
      Alert.alert('Error', 'Failed to submit purchase request. Please try again.');
    }
  };

  const handleAddToCart = async (fertilizer: FertilizerData) => {
    try {
      await addToCart({
        fertilizerId: fertilizer.fertilizerId,
        fertilizerName: fertilizer.name,
        fertilzerPrice: fertilizer.price,
        fertilizerUnit: fertilizer.unit,
        quantity: 1,
        totalAmount: fertilizer.price,
      });

      Alert.alert('Success', `${fertilizer.name} added to cart!`);
      loadCartCount(); // Refresh cart count
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const loadCartCount = async () => {
    try {
      const cartItems = await getUserCartItems();
      setCartCount(cartItems.length);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const renderFertilizerItem = ({ item }: { item: FertilizerData }) => (
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.text }}>
          {item.name}
        </Text>
        <View style={{
          backgroundColor: '#4CAF50',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            AVAILABLE
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: Colors.light.icon, marginBottom: 15, lineHeight: 20 }}>
        {item.description}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>
          ${item.price} per {item.unit}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: Colors.light.inputBackground,
            borderColor: Colors.light.button,
            borderWidth: 1.5,
            padding: 15,
            borderRadius: 12,
            alignItems: 'center',
            flex: 1,
          }}
          onPress={() => handleAddToCart(item)}
          activeOpacity={0.8}
        >
          <Text style={{ color: Colors.light.button, fontWeight: 'bold', fontSize: 16 }}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: Colors.light.button,
            padding: 15,
            borderRadius: 12,
            alignItems: 'center',
            flex: 1,
          }}
          onPress={() => openPurchaseModal(item)}
          activeOpacity={0.8}
        >
          <Text style={{ color: Colors.light.buttonText, fontWeight: 'bold', fontSize: 16 }}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Gradient header */}
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          style={{
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
          }}
        >
          <View style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingLeft: 40,
            gap: 20,
          }}>
            <View style={{
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 38,
                fontWeight: 'bold',
                letterSpacing: 1.1,
                marginBottom: 6,
                textShadowColor: 'rgba(0,0,0,0.18)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}>
                Fertilizers
              </Text>
              <Text style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: '600',
                letterSpacing: 0.7,
                textShadowColor: 'rgba(0,0,0,0.13)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
              }}>
                Natural & Organic
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                }}
                onPress={() => router.push('/cart')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="shopping-cart" size={18} color="#fff" />
                {cartCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#ff4444',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}>
                      {cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
                onPress={() => router.push('/my-fertilizer-orders')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="receipt" size={18} color="#fff" />
                <Text style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: '600',
                  marginLeft: 4,
              }}>
                My Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </LinearGradient>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={Colors.light.button} />
          <Text style={{ color: Colors.light.text, marginTop: 16, fontSize: 16, fontWeight: '600' }}>
            Loading Fertilizers...
          </Text>
          <Text style={{ color: Colors.light.icon, marginTop: 8, fontSize: 14, textAlign: 'center' }}>
            Please wait while we fetch the latest fertilizer options
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        style={{
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
        }}
      >
        <View style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingLeft: 40,
          gap: 20,
        }}>
          <View style={{
            alignItems: 'center',
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 38,
              fontWeight: 'bold',
              letterSpacing: 1.1,
              marginBottom: 6,
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}>
              Fertilizers
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '600',
              letterSpacing: 0.7,
              textShadowColor: 'rgba(0,0,0,0.13)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
            }}>
              Natural & Organic
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                position: 'relative',
              }}
              onPress={() => router.push('/cart')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shopping-cart" size={18} color="#fff" />
              {cartCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#ff4444',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    {cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              onPress={() => router.push('/my-fertilizer-orders')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="receipt" size={18} color="#fff" />
              <Text style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: '600',
                marginLeft: 4,
              }}>
                My Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={fertilizers}
        keyExtractor={(item) => item.fertilizerId}
        renderItem={renderFertilizerItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 20 }}>
            <MaterialIcons name="grass" size={64} color={Colors.light.icon} />
            <Text style={{ color: Colors.light.text, fontSize: 18, marginTop: 10, fontWeight: '600' }}>
              No fertilizers available
            </Text>
            <Text style={{ color: Colors.light.icon, fontSize: 14, marginTop: 5, textAlign: 'center' }}>
              Check back later for natural fertilizer options
            </Text>
          </View>
        }
      />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: Colors.light.inputBackground, margin: 20, borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' }}>
              {selectedFertilizer && (
                <>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: Colors.light.text }}>
                    Purchase {selectedFertilizer.name}
                  </Text>

                  <Text style={{ fontSize: 16, marginBottom: 15, color: Colors.light.text }}>
                    Price: ${selectedFertilizer.price} per {selectedFertilizer.unit}
                  </Text>

                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.light.text,
                    marginBottom: 8,
                  }}>
                    Quantity *
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
                    placeholder="Enter quantity"
                    placeholderTextColor={Colors.light.icon}
                    value={purchaseData.quantity}
                    onChangeText={(text) => setPurchaseData({ ...purchaseData, quantity: text })}
                    keyboardType="numeric"
                  />

                  <Text style={{
                    fontSize: 14,
                    color: Colors.light.icon,
                    marginBottom: 15,
                  }}>
                    Total: ${selectedFertilizer ? (selectedFertilizer.price * parseFloat(purchaseData.quantity || '0')).toFixed(2) : '0.00'}
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
                    value={purchaseData.customerName}
                    onChangeText={(text) => setPurchaseData({ ...purchaseData, customerName: text })}
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
                    value={purchaseData.customerPhone}
                    onChangeText={(text) => setPurchaseData({ ...purchaseData, customerPhone: text })}
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
                    value={purchaseData.customerEmail}
                    onChangeText={(text) => setPurchaseData({ ...purchaseData, customerEmail: text })}
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
                    value={purchaseData.deliveryAddress}
                    onChangeText={(text) => setPurchaseData({ ...purchaseData, deliveryAddress: text })}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: Colors.light.icon,
                        padding: 15,
                        borderRadius: 12,
                        flex: 1,
                      }}
                      onPress={() => setModalVisible(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: Colors.light.inputBackground, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: Colors.light.button,
                        padding: 15,
                        borderRadius: 12,
                        flex: 1,
                      }}
                      onPress={handlePurchase}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: Colors.light.buttonText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Purchase</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }