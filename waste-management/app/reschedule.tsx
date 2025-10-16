import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { updatePickup } from '../utils/database';

const MATERIALS = [
  { key: 'metals', label: 'Metals', icon: 'hardware', pricePerKg: 20 },
  { key: 'paper', label: 'Paper', icon: 'description', pricePerKg: 15 },
  { key: 'glass', label: 'Glass', icon: 'wine-bar', pricePerKg: 10 },
  { key: 'cardboard', label: 'Cardboard', icon: 'inventory', pricePerKg: 12 },
  { key: 'plastic', label: 'Plastic', icon: 'water-drop', pricePerKg: 18 },
  { key: 'electronic', label: 'Electronic', icon: 'memory', pricePerKg: 25 },
];

const PAYMENT_OPTIONS = [
  { key: 'cash', label: 'Cash Payment' },
  { key: 'bank', label: 'Bank Transfer' },
  { key: 'paycheck', label: 'Paycheck' },
];

interface Quantities {
  [key: string]: number;
}

export default function RescheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse parameters
  const pickupId = params.pickupId as string;
  const materials = (params.materials as string)?.split(',') || [];
  const quantitiesObj: Quantities = JSON.parse(params.quantities as string || '{}');
  const total = parseFloat(params.total as string || '0');
  const selectedPayment = params.payment as string;
  const pickupDate = params.date as string;
  const pickupTime = params.time as string;
  const pickupAddress = params.address as string;

  // Form state - initialize with existing data
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(materials);
  const [quantities, setQuantities] = useState<Quantities>(quantitiesObj);
  const [paymentMethod, setPaymentMethod] = useState(selectedPayment);

  // Safely parse dates
  const parseDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  };

  const [date, setDate] = useState(parseDate(pickupDate));
  const [time, setTime] = useState(parseDate(pickupTime));
  const [address, setAddress] = useState(pickupAddress);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotal = () => {
    return selectedMaterials.reduce((total, materialKey) => {
      const materialData = MATERIALS.find(m => m.key === materialKey);
      const quantity = quantities[materialKey] || 0;
      return total + (materialData?.pricePerKg || 0) * quantity;
    }, 0);
  };

  const handleMaterialToggle = (materialKey: string) => {
    if (selectedMaterials.includes(materialKey)) {
      setSelectedMaterials(selectedMaterials.filter(m => m !== materialKey));
      const newQuantities = { ...quantities };
      delete newQuantities[materialKey];
      setQuantities(newQuantities);
    } else {
      setSelectedMaterials([...selectedMaterials, materialKey]);
    }
  };

  const handleQuantityChange = (materialKey: string, quantity: string) => {
    const qty = parseFloat(quantity) || 0;
    setQuantities({
      ...quantities,
      [materialKey]: qty,
    });
  };

  const handleUpdatePickup = async () => {
    // Validation
    if (selectedMaterials.length === 0) {
      Alert.alert('Error', 'Please select at least one material');
      return;
    }

    if (selectedMaterials.some(material => !quantities[material] || quantities[material] <= 0)) {
      Alert.alert('Error', 'Please enter valid quantities for all selected materials');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a pickup address');
      return;
    }

    setIsLoading(true);

    try {
      const updatedData = {
        materials: selectedMaterials,
        quantities,
        totalAmount: calculateTotal(),
        paymentMethod,
        pickupDate: date.toISOString(),
        pickupTime: time.toISOString(),
        pickupAddress: address,
        updatedAt: new Date().toISOString(),
      };

      await updatePickup(pickupId, updatedData);

      Alert.alert(
        'Success',
        'Pickup updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/view-schedules' as any),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating pickup:', error);
      Alert.alert('Error', 'Failed to update pickup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.tint, Colors.light.button]}
        style={{
          width: '100%',
          paddingTop: 60,
          paddingBottom: 20,
          alignItems: 'center',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          marginBottom: 20,
          minHeight: 120,
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: Colors.light.buttonText,
            textShadowColor: 'rgba(0,0,0,0.13)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          Reschedule Pickup
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Materials Section */}
        <View style={{
          backgroundColor: Colors.light.inputBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors.light.inputBorder,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 16,
          }}>
            Materials
          </Text>

          {MATERIALS.map((material) => (
            <View key={material.key} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                }}
                onPress={() => handleMaterialToggle(material.key)}
              >
                <MaterialIcons
                  name={selectedMaterials.includes(material.key) ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={selectedMaterials.includes(material.key) ? Colors.light.button : Colors.light.icon}
                />
                <Text style={{
                  fontSize: 16,
                  color: Colors.light.text,
                  marginLeft: 8,
                  flex: 1,
                }}>
                  {material.label} - LKR {material.pricePerKg}/kg
                </Text>
              </TouchableOpacity>

              {selectedMaterials.includes(material.key) && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 32,
                  marginTop: 8,
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: Colors.light.text,
                    marginRight: 8,
                  }}>
                    Quantity (kg):
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: Colors.light.inputBorder,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: Colors.light.background,
                      fontSize: 16,
                    }}
                    keyboardType="numeric"
                    value={quantities[material.key]?.toString() || ''}
                    onChangeText={(value) => handleQuantityChange(material.key, value)}
                    placeholder="Enter quantity"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={{
          backgroundColor: Colors.light.inputBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors.light.inputBorder,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 16,
          }}>
            Payment Method
          </Text>

          {PAYMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.light.inputBorder,
              }}
              onPress={() => setPaymentMethod(option.key)}
            >
              <MaterialIcons
                name={paymentMethod === option.key ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color={paymentMethod === option.key ? Colors.light.button : Colors.light.icon}
              />
              <Text style={{
                fontSize: 16,
                color: Colors.light.text,
                marginLeft: 8,
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date & Time */}
        <View style={{
          backgroundColor: Colors.light.inputBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors.light.inputBorder,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 16,
          }}>
            Schedule
          </Text>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: Colors.light.inputBorder,
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={24} color={Colors.light.icon} />
            <Text style={{
              fontSize: 16,
              color: Colors.light.text,
              marginLeft: 12,
              flex: 1,
            }}>
              {date.toDateString()}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.light.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
            onPress={() => setShowTimePicker(true)}
          >
            <MaterialIcons name="access-time" size={24} color={Colors.light.icon} />
            <Text style={{
              fontSize: 16,
              color: Colors.light.text,
              marginLeft: 12,
              flex: 1,
            }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.light.icon} />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={{
          backgroundColor: Colors.light.inputBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors.light.inputBorder,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 16,
          }}>
            Pickup Address
          </Text>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: Colors.light.inputBorder,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: Colors.light.background,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            multiline
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your pickup address"
          />

        {/* Total */}
        <View style={{
          backgroundColor: Colors.light.inputBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: Colors.light.button,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 8,
          }}>
            Total Amount
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: Colors.light.button,
          }}>
            LKR {calculateTotal().toFixed(2)}
          </Text>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={{
            backgroundColor: Colors.light.button,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: Colors.light.button,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 3,
          }}
          onPress={handleUpdatePickup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.light.buttonText} />
          ) : (
            <>
              <MaterialIcons name="update" size={24} color={Colors.light.buttonText} />
              <Text style={{
                color: Colors.light.buttonText,
                fontSize: 18,
                fontWeight: '600',
                marginLeft: 8,
              }}>
                Update Pickup
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: unknown, selectedDate?: Date | undefined) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(event: unknown, selectedTime?: Date | undefined) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setTime(selectedTime);
            }
          }}
        />
      )}
    </View>
    </ScrollView>
  );
}