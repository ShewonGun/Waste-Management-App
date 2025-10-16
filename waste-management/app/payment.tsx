import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { savePickupData } from '../utils/database';
import { auth, db } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MATERIALS = [
  { key: 'metals', label: 'Metals', icon: 'hardware', pricePerKg: 20 },
  { key: 'paper', label: 'Paper', icon: 'description', pricePerKg: 15 },
  { key: 'glass', label: 'Glass', icon: 'wine-bar', pricePerKg: 10 },
  { key: 'cardboard', label: 'Cardboard', icon: 'inventory', pricePerKg: 12 },
  { key: 'plastic', label: 'Plastic', icon: 'water-drop', pricePerKg: 18 },
  { key: 'electronic', label: 'Electronic', icon: 'memory', pricePerKg: 25 },
];

const PAYMENT_OPTIONS = [
  { key: 'cash', label: 'Cash Payment', icon: 'payments' },
  { key: 'bank', label: 'Bank Transfer', icon: 'account_balance_wallet' },
  { key: 'paycheck', label: 'Paycheck', icon: 'receipt' },
];

export default function PaymentPage() {
  const router = useRouter();
  const { materials, quantities, total } = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check authentication state
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthChecked(true);
      console.log('Payment page - Current user:', user);
      console.log('Payment page - Auth state:', auth);

      // If user is not authenticated, redirect to login
      if (!user) {
        console.log('User not authenticated, redirecting to login...');
        alert('Please log in to schedule a pickup');
        setTimeout(() => {
          router.replace('/login' as any);
        }, 500);
        return;
      }

      // Test Firebase connection
      const testFirebase = async () => {
        try {
          console.log('Testing Firebase connection...');
          // Simple test - try to get a collection reference
          const testCollection = collection(db, 'test');
          console.log('Firebase connection successful - collection reference created');

          // Test if we can access Firestore
          console.log('Firestore db instance:', db);
          console.log('Firebase app:', db.app);

          // Test a simple write operation to verify permissions
          try {
            console.log('Testing Firestore write permissions...');
            const testDoc = {
              test: 'data',
              timestamp: new Date(),
              userId: user?.uid || 'anonymous'
            };
            const testDocRef = await addDoc(collection(db, 'test_writes'), testDoc);
            console.log('Test write successful, document ID:', testDocRef.id);
          } catch (writeError) {
            console.error('Test write failed:', writeError);
            console.error('This indicates Firestore security rules are blocking writes');
          }

        } catch (error) {
          console.error('Firebase connection failed:', error);
        }
      };

      testFirebase();
    });

    return unsubscribe;
  }, []);

  const selectedMaterials = materials ? (Array.isArray(materials) ? materials : materials.split(',')) : [];
  const quantitiesObj = quantities ? JSON.parse(quantities as string) : {};
  const totalAmount = parseFloat(total as string) || 0;

  const calculateTotalWeight = () => {
    return selectedMaterials.reduce((total, key) => {
      return total + (parseFloat(quantitiesObj[key] || '0'));
    }, 0);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    if (event.type === 'set') {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setTime(currentTime);
    if (event.type === 'set') {
      setShowTimePicker(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSchedulePickup = async () => {
    if (selectedPayment && date && time && pickupAddress) {
      setIsLoading(true);
      console.log('Starting pickup scheduling...');

      // Check if user is authenticated
      if (!auth.currentUser) {
        console.error('User not authenticated');
        alert('Please log in to schedule a pickup');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Saving pickup data to Firebase...');

        // Save pickup data to Firebase
        const pickupId = await savePickupData({
          materials: selectedMaterials,
          quantities: quantitiesObj,
          totalAmount: totalAmount,
          paymentMethod: selectedPayment,
          pickupDate: date.toISOString(),
          pickupTime: time.toISOString(),
          pickupAddress: pickupAddress,
        });
        console.log('Pickup data saved successfully, pickupId:', pickupId);

        // Navigate to confirmation page with the generated pickup ID
        console.log('Navigating to confirmation page...');
        router.navigate({
          pathname: '/confirm',
          params: {
            materials: selectedMaterials.join(','),
            quantities: JSON.stringify(quantitiesObj),
            total: totalAmount.toString(),
            payment: selectedPayment,
            date: date.toISOString(),
            time: time.toISOString(),
            pickupId: pickupId,
            address: pickupAddress,
          },
        } as any);
        console.log('Navigation completed');
      } catch (error) {
        console.error('Error scheduling pickup:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to schedule pickup: ${errorMessage}`);
        setIsLoading(false); // Reset loading state on error
      }
    }
  };

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <Text style={{ color: Colors.light.text, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <LinearGradient
        colors={["#14532d", "#166534", "#22c55e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>EcoRecycle</Text>
        <Text style={styles.appSubtitle}>Payment Method</Text>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.header}>Select Payment Method</Text>

        {/* Payment Options */}
        <View style={styles.optionsContainer}>
          {PAYMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.optionCard, selectedPayment === option.key && styles.optionCardSelected]}
              onPress={() => setSelectedPayment(option.key)}
            >
              <MaterialIcons
                name={option.icon as any}
                size={32}
                color={selectedPayment === option.key ? Colors.light.button : Colors.light.icon}
              />
              <Text style={[styles.optionLabel, selectedPayment === option.key && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              {selectedPayment === option.key && (
                <MaterialIcons name="check-circle" size={24} color={Colors.light.button} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Pickup Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressTitle}>Pickup Address</Text>
          <View style={styles.addressInputContainer}>
            <MaterialIcons name="location-on" size={24} color={Colors.light.button} style={styles.addressIcon} />
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your pickup address"
              placeholderTextColor={Colors.light.icon}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Schedule Date & Time */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>Schedule Your Pickup</Text>
          
          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={styles.pickerCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerIconContainer}>
                <MaterialIcons name="calendar-today" size={28} color={Colors.light.button} />
              </View>
              <View style={styles.pickerContent}>
                <Text style={styles.pickerLabel}>Pickup Date</Text>
                <Text style={styles.pickerValue}>{formatDate(date)}</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.light.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCard}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerIconContainer}>
                <MaterialIcons name="schedule" size={28} color={Colors.light.button} />
              </View>
              <View style={styles.pickerContent}>
                <Text style={styles.pickerLabel}>Pickup Time</Text>
                <Text style={styles.pickerValue}>{formatTime(time)}</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={styles.inlinePickerContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={onDateChange}
                minimumDate={new Date(2000, 0, 1)}
              />
            </View>
          )}

          {showTimePicker && (
            <View style={styles.inlinePickerContainer}>
              <DateTimePicker
                value={time}
                mode="time"
                display="inline"
                onChange={onTimeChange}
              />
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Materials Selected:</Text>
            <Text style={styles.summaryValue}>{selectedMaterials.length}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Weight:</Text>
            <Text style={styles.summaryValue}>{calculateTotalWeight().toFixed(2)} kg</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(date)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup Time:</Text>
            <Text style={styles.summaryValue}>{formatTime(time)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pickup Address:</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {pickupAddress || 'Not specified'}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Earnings:</Text>
            <Text style={styles.totalValue}>LKR {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scheduleButton, { opacity: (selectedPayment && date && time && pickupAddress && !isLoading) ? 1 : 0.5 }]}
          onPress={handleSchedulePickup}
          disabled={!(selectedPayment && date && time && pickupAddress) || isLoading}
          activeOpacity={0.8}
        >
          <MaterialIcons name={isLoading ? "hourglass-empty" : "schedule"} size={24} color={Colors.light.buttonText} />
          <Text style={styles.scheduleText}>
            {isLoading ? 'Scheduling...' : 'Schedule Pickup'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    width: '100%',
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    minHeight: 180,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 72,
  },
  appTitle: {
    color: '#fff',
    fontSize: 32,
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.light.button,
    backgroundColor: Colors.light.inputBackground,
  },
  optionLabel: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  optionLabelSelected: {
    color: Colors.light.button,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  summaryTitle: {
    fontSize: 20,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.light.button,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 18,
    color: Colors.light.button,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: Colors.light.button,
    fontWeight: 'bold',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.button,
    borderRadius: 24,
    paddingVertical: 18,
    shadowColor: Colors.light.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 56,
  },
  scheduleText: {
    color: Colors.light.buttonText,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scheduleContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  scheduleTitle: {
    fontSize: 20,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerContent: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: Colors.light.text,
    opacity: 0.7,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pickerValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  inlinePickerContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    overflow: 'hidden',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addressContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  addressTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    padding: 12,
    minHeight: 80,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});